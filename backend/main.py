import base64 # Used for encoding/decoding binary data (like audio) to/from text.
from typing import List
import uuid # Generates unique IDs, useful for unique filenames.
import modal
import os # Helps interact with the operating system, like creating folders or deleting files.
import boto3

from pydantic import BaseModel # Used to define data structures for API requests/responses.
import requests

from prompts import LYRICS_GENERATOR_PROMPT, PROMPT_GENERATOR_PROMPT # Used to make HTTP requests, like calling our cloud endpoint.

# --------------------------------------------- Modal App Setup ---------------------------------------------

# We create our "app" blueprint, giving it a name for Modal.
# This is like setting up the project for our cloud tasks.
app = modal.App("music-generator")

# --------------------------------------------- Cloud Environment (Docker Image) Setup ---------------------------------------------

# We're building a custom virtual computer image for our code.
# It starts with a basic, lightweight Linux (Debian) OS.
image = (
    modal.Image.debian_slim()
    .apt_install("git") 
    # Install 'git' on our virtual computer. Needed to download code
    
    .pip_install_from_requirements("requirements.txt")
     # Install all Python libraries listed in the 'requirements.txt' file.
    # These are the tools the Python code needs to run.
    
    .run_commands(["git clone https://github.com/ace-step/ACE-Step.git /tmp/ACE-Step", "cd /tmp/ACE-Step && pip install ."]) 
    # Run commands *inside* the virtual computer during setup:
    # 1. Download the ACE-Step AI code from GitHub into a temporary folder.
    # 2. Go into that folder and install its specific Python requirements.
    
    .env({"HF_HOME": "/.cache/huggingFace"})
    # Set an environment variable. This tells Hugging Face (a common AI library)
    # to store downloaded models in a specific cache location.
    # This helps avoid re-downloading large models every time.
    
    .add_local_python_source("prompts")
    # Copy your local 'prompts' folder into the cloud environment.
    # Your AI will use these prompts to guide music generation.
)

# --------------------------------------------- Persistent Storage (Volumes) ---------------------------------------------

model_volume = modal.Volume.from_name("ace-step-models", create_if_missing=True)
# Create a storage area named "ace-step-models".
# This is where big AI models like the music generator will be saved permanently.
# 'create_if_missing=True' means it will make it if it doesn't exist yet.

hf_volume = modal.Volume.from_name("qwen-hf-cache", create_if_missing=True)
# Create another storage area for Hugging Face's cache.
# This prevents re-downloading of models used by the LLM.

# --------------------------------------------- Secure Information (Secrets) ---------------------------------------------

music_gen_secrets = modal.Secret.from_name("music-gen-secret")
# Get a "secret" named "music-gen-secret" from Modal dashboard.
# Secrets store sensitive info (like API keys) securely, so they aren't exposed directly in your code.

# --------------------------------------------- Music Generation Server Class (Runs in Cloud) ---------------------------------------------

# Base configuration options for audio generation.
class AudioGenerationBase(BaseModel):
    audio_duration: float = 180.0
    seed: int = -1
    guidance_scale: float = 15.0
    infer_step: int = 60
    instrumental: bool = False
    
# Request model for generating music from a user-provided song description.
class GenerateFromDescriptionRequest(AudioGenerationBase):
    full_described_song: str # generates lyrics from the given song description by user
    
# Request model for generating music with custom lyrics provided directly by the user.
class GenerateWithCustomLyricsRequest(AudioGenerationBase):
    prompt: str
    lyrics: str # passed lyrics by the user
    
# Request model for generating music with user-defined style and LLM-generated lyrics.
class GenerateWithDescribedLyricsRequest(AudioGenerationBase):
    prompt: str
    described_lyrics: str # lyrics coming from LLM
    




# Defines the expected structure of the response when music generation is integrated with S3 for storage.
class GenerateMusicResponseS3(BaseModel):
    s3_key: str # The key (path) to the generated audio file in the S3 bucket.
    cover_image_s3_key: str # The key (path) to the generated cover image in the S3 bucket.
    categories: List[str] # A list of categories/tags describing the generated music.

# Defines the expected structure of the response when audio data is returned directly (base64 encoded).
class GenerateMusicResponse(BaseModel):
    audio_data: str # The generated audio, encoded as a base64 string.





# This sets up a "server class" where our AI models will run.
# `@app.cls` means it's a class that Modal manages in the cloud.
@app.cls(
    image=image, # Use the custom virtual computer docker image we just built.
    gpu="L40S", # Request a powerful GPU (L40S) for fast AI processing.
    volumes={"/models": model_volume, "/.cache/huggingFace": hf_volume},
    # Connect our storage volumes:
    # - '/models' in the cloud points to our 'ace-step-models' volume.
    # - '/.cache/huggingFace' points to our 'qwen-hf-cache' volume.
    secrets=[music_gen_secrets], # Attach our secrets to this cloud server.
    scaledown_window=15 # If unused for 15 seconds, this server will shut down to save costs.
)
class MusicGenServer:
    # This method runs *once* when a new cloud server (container) starts up.
    # It's perfect for loading big AI models into memory.
    @modal.enter()
    def load_model(self):
        # Import the necessary AI pipeline and model loaders.
        from acestep.pipeline_ace_step import ACEStepPipeline
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from diffusers import AutoPipelineForText2Image # For generating images from text.
        import torch # PyTorch library, essential for deep learning.
        
        # Load the main music generation AI model.
        self.music_model = ACEStepPipeline(
            checkpoint_dir="/models", # Tells the model where to find its saved files.
            dtype="bfloat16",         # Data type for calculations (faster, less memory).
            torch_compile=False,      # Don't use Torch compilation (optional optimization).
            cpu_offload=False,        # Don't move parts of model to CPU (keep on GPU).
            overlapped_decode=False   # Specific optimization for decoding.
        )
        
        # Load the Large Language Model (LLM) for understanding text prompts.
        model_id="Qwen/Qwen2-7B-Instruct" # Specify which LLM to use.
        self.tokenizer = AutoTokenizer.from_pretrained(model_id) # Load its text-to-token converter.
        
        self.llm_model = AutoModelForCausalLM.from_pretrained(
            model_id,
            torch_dtype="auto", # Automatically select best data type for PyTorch.
            device_map="auto",  # Automatically distribute model across available devices (e.g., GPU).
            cache_dir="/.cache/huggingFace" # Use our persistent cache for this model.
        )
        
       # Load a Stable Diffusion model to generate images from text (for thumbnails).
        self.image_pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sdxl-turbo", torch_dtype=torch.float16, variant="fp16", cache_dir="/.cache/huggingFace")
        self.image_pipe.to("cuda") # Move the image model to the GPU for faster processing.
        
    # ------------------------------------------------ Helper Functions ------------------------------------------------
     
    # Helper method to interact with the Qwen LLM.
    def prompt_qwen(self, question:str):
        # Format the user's question into a chat-like format for the LLM
        messages = [
            {"role": "user", "content": question}
        ]
        text = self.tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )
        # Prepare the input for the LLM and send it to the GPU.
        model_inputs = self.tokenizer([text], return_tensors="pt").to(self.llm_model.device)

        # Generate a response from the LLM.
        generated_ids = self.llm_model.generate(
            model_inputs.input_ids,
            max_new_tokens=512
        )
        
        # Extract the generated response part from the full output.
        generated_ids = [
            output_ids[len(input_ids):] for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
        ]

        # Decode the generated IDs back into human-readable text.
        response = self.tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0]
        
        return response
        
    # Generates music tags/attributes using the LLM based on a song description.
    def generate_prompt(self, description:str):
        # Format the description into the prompt template for tag generation.
        full_prompt = PROMPT_GENERATOR_PROMPT.format(user_prompt=description)
        
        # Run the LLM to get the comma-separated tags.
        return self.prompt_qwen(full_prompt)
    
    # Generates song lyrics using the LLM based on a song description.
    def generate_lyrics(self, description:str):
       # Format the description into the prompt template for lyrics generation
        full_prompt = LYRICS_GENERATOR_PROMPT.format(description=description)
        
        # Run the LLM to get the generated lyrics.
        return self.prompt_qwen(full_prompt)
    
    # Generates categories based on music description
    def generate_categories(self, description:str) -> List[str]:
        prompt = f"Based on the following music description, list 3-5 relevant genres or categories as a comma-separated list. For example: Pop, Electronic, Sad, 80s. Description: '{description}'"
        
        response_text = self.prompt_qwen(prompt)
        categories = [cat.strip() for cat in response_text.split(",") if cat.strip()]
        
        return categories
    
    def generate_and_upload_to_s3(
        self,
        prompt: str,
        lyrics: str,
        instrumental: bool,
        audio_duration: float,
        infer_step: int,
        guidance_scale: float,
        seed: int,
        description_for_categorization: str
    ) -> GenerateMusicResponseS3:
        final_lyrics = "[instrumental]" if instrumental else lyrics
        print(f"song description: {description_for_categorization}")
        print(f"user prompt: {prompt}")
        print(f"generated lyrics: {final_lyrics}")
        
        s3_client = boto3.client("s3") # connect with aws using boto3
        bucket_name = os.environ["S3_BUCKET_NAME"] # from modal secrets 
        
        # ? CREATE AUDIO AND STORE IT IN S3
        
        # create where the audio will be stored in os
        output_dir = "/tmp/outputs" 
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"{uuid.uuid4()}.wav")

        # let the AceStep instance model generate audio based on prompt, lyrics, and settings
        self.music_model(
            prompt = prompt, 
            lyrics = final_lyrics,
            audio_duration = audio_duration, # audio duration to be generated, 3 mins by default
            infer_step = infer_step, # the quality of the audio
            guidance_scale = guidance_scale, # the creativity of the audio
            save_path=output_path, # location where the output will be stored
            manual_seeds = str(seed) # make the output different each run even input is the same cause seed is equal to -1 based on props
        )
        
        # ? AUDIO CREATED
        
        # create the name of generated audio
        audio_s3_key = f"{uuid.uuid4()}.wav"
        # store it in s3
        s3_client.upload_file(output_path, bucket_name, audio_s3_key) # what we want to upload, where to upload, name of uploaded file
        
        # remove it in os
        os.remove(output_path)
        
        # ? AUDIO SAVED TO S3
        
        
        
        # ? CREATE IMAGE FROM PROMPT AND SAVE TO S3
        
        # * THUMBNAIL GENERATION
        thumbnail_prompt = f"{prompt}, album cover art" # create the prompt
        
        # image_pipi is instance of stabilityai/sdxl-turbo (our text to image generator model)
        image = self.image_pipe(prompt=thumbnail_prompt, num_inference_step=2, guidance_scale=0.0).images[0]
        
        # ? IMAGE GENERATED
        
        # save image generated to modal container in the cloud's os first 
        image_output_path = os.path.join(output_dir, f"{uuid.uuid4()}.png")
        image.save(image_output_path)
        
        # ? SAVED TO MODAL OS
        
        # save the generate image to s3 bucket
        image_s3_key = f"{uuid.uuid4()}.png"
        s3_client.upload_file(image_output_path, bucket_name, image_s3_key)
        os.remove(image_output_path)
        
        # ? IMAGE SAVED TO S3
        
        
        
        # ? CREATE CATEGORIES BASED ON SONG DESCRIPTION PROVIDED
        
        # * CATEGORY GENERATION -> hip-hop, rap, etc.
        description_for_categorization: str
        categories = self.generate_categories(description=description_for_categorization)
        
        # ? CATEGORIES GENERATED
        
        return GenerateMusicResponseS3(
            s3_key=audio_s3_key,
            cover_image_s3_key=image_s3_key,
            categories=categories
        )
        
        
    # ------------------------------------------------ End Points ------------------------------------------------

    # This makes the 'generate' method callable as an API endpoint (HTTP POST request).
    @modal.fastapi_endpoint(method="POST", requires_proxy_auth=True) # ? -> this is just used for testing
    def generate(self) -> GenerateMusicResponse: # will return a str format of audio
        output_dir = "/tmp/outputs" # Temporary directory to save the generated audio.
        os.makedirs(output_dir, exist_ok=True) # Create the output directory if it doesn't exist.
        output_path = os.path.join(output_dir, f"{uuid.uuid4()}.wav") # Create a unique path for the audio file.

        
        # Run the music generation model instance of ACEStepPipeline with specified prompt, lyrics, and settings.
        self.music_model(
            prompt="electronic rap", # High-level description of the music style.
            lyrics="[verse]\nWaves on the bass, pulsing in the speakers,\nTurn the dial up, we chasing six-figure features,\nGrinding on the beats, codes in the creases,\nDigital hustler, midnight in sneakers.\n\n[chorus]\nElectro vibes, hearts beat with the hum,\nUrban legends ride, we ain't ever numb,\nCircuits sparking live, tapping on the drum,\nLiving on the edge, never succumb.\n\n[verse]\nSynthesizers blaze, city lights a glow,\nRhythm in the haze, moving with the flow,\nSwagger on stage, energy to blow,\nFrom the blocks to the booth, you already know.\n\n[bridge]\nNight's electric, streets full of dreams,\nBass hits collective, bursting at seams,\nHustle perspective, all in the schemes,\nRise and reflective, ain't no in-betweens.\n\n[verse]\nVibin' with the crew, sync in the wire,\nGot the dance moves, fire in the attire,\nRhythm and blues, soul's our supplier,\nRun the digital zoo, higher and higher.\n\n[chorus]\nElectro vibes, hearts beat with the hum,\nUrban legends ride, we ain't ever numb,\nCircuits sparking live, tapping on the drum,\nLiving on the edge, never succumb.",
            audio_duration=180, # Desired length of the generated audio in seconds (180s = 3 minutes).
            infer_step=60,      # Number of inference steps for quality - the higher the more quality and resources consumed.
            guidance_scale=15,  # How closely the generation follows the prompt - the higher the more creative.
            save_path=output_path # Where to save the generated audio file.
            # manual_seed="" -> uncomment this if you want to receive the same audio if the same props were passed
        )
        
        # Read the generated audio file into memory.
        with open(output_path, "rb") as f:
            audio_bytes = f.read()
            
        # Encode the audio bytes into a base64 string, so it can be sent over an API.
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
        
        os.remove(output_path) # Delete the temporary audio file to clean up.
        
        # Return the base64 encoded audio in the defined response format (str format).
        return GenerateMusicResponse(audio_data=audio_b64)
    
    # ? -> This endpoint generates music by taking a song description (from the user)
    # ? -> and then uses the LLM to generate both the music prompt (tags) and lyrics.
    # ? -> Gamitin kung and user ay meron nang description ng song an gagamitin for creation ng prompt at lyrics
    @modal.fastapi_endpoint(method="POST", requires_proxy_auth=True) 
    def generate_from_description(self, request: GenerateFromDescriptionRequest) -> GenerateMusicResponseS3:
        # Generates a comma-separated list of music tags (genre, mood, tempo, etc.) from the user's description.
        prompt = self.generate_prompt(request.full_described_song)
        
        # Generates lyrics using the LLM based on the user's full song description.
        lyrics = ""
        if not request.instrumental:
            lyrics = self.generate_lyrics(request.full_described_song)
            
        return self.generate_and_upload_to_s3(
            prompt=prompt, # (e.g. value: melodic techno, male vocal, electronic, emotional, minor key, 124 bpm, synthesizer, driving, atmospheric)
            lyrics=lyrics, # (e.g. value: the lyrics generated by qwen based on song description provided by user)
            description_for_categorization=request.full_described_song, # (e.g. value: the song description itself provided by user)
            **request.model_dump(exclude={"full_described_song"}) # kinuha lahat ng props ng parent class, excluding its own property
        )
        
        
    
    # ? -> This endpoint is designed for generating music when the user provides custom lyrics directly.
    # ? -> gamitin kung ang user ay may provided na prompt at lyrics na agad
    @modal.fastapi_endpoint(method="POST", requires_proxy_auth=True)
    def generate_with_lyrics(self, request: GenerateWithCustomLyricsRequest) -> GenerateMusicResponseS3:
        return self.generate_and_upload_to_s3(
            prompt=request.prompt, # dapat ang prompt input from user is comma separated na
            lyrics=request.lyrics, # ginawa na din ni user yung lyrics
            description_for_categorization=request.prompt, # same dito, comma separated na yung prompt na ibibigay ni user
            **request.model_dump(exclude={"prompt", "lyrics"}) # kinuha lahat ng props ng parent class
        )
    
    
    
    # ? -> this is for mode where audio is generated from user's defined song description and LLM generated lyrics
    # ? -> Gamitin kung an user ay may provided na lyrics description to be passed to the LLM to generate lyrics
    @modal.fastapi_endpoint(method="POST", requires_proxy_auth=True)
    def generate_with_described_lyrics(self, request: GenerateWithDescribedLyricsRequest) -> GenerateMusicResponseS3:
        # Generates lyrics using the LLM based on the user's full song description.
        lyrics = ""
        if not request.instrumental:
            lyrics = self.generate_lyrics(request.described_lyrics) # yung lyrics description will be used to let LLM create a lyrics
            
        return self.generate_and_upload_to_s3(
            prompt=request.prompt,  # prompt na ibibigay ni user dito is comma separated na
            lyrics=lyrics, # AI generated lyrics
            description_for_categorization=request.prompt, # comma separated prompt
            **request.model_dump(exclude={"described_lyrics", "prompt"})
        )

    
# ------------------------------------------------Local Entrypoint (How we start the app) ---------------------------------------------

# This function runs locally on your computer when you use `modal run main.py`.
# It's the starting point that tells Modal what to do.
@app.local_entrypoint()
def main():
    server = MusicGenServer() # Create an instance of our cloud server class (locally for setup).
    endpoint_url = server.generate_from_description.get_web_url() # Get the public URL for our cloud API endpoint.
    
    request_data = GenerateFromDescriptionRequest(
        full_described_song="My emotion is sad. My girlfriend and i broke up because she is always farting in every occation. I need a music that is sad, emotional, a chinese man vocal."
    )
    
    # wk-NcsCq4eFVBqOzfG3SrRiJG
    # ws-L7KzytyTtsDI4tpVlYCimN
    
    headers = {
        "Modal-Key": "wk-NcsCq4eFVBqOzfG3SrRiJG",
        "Modal-Secret": "ws-L7KzytyTtsDI4tpVlYCimN"
    }
    
    payload = request_data.model_dump() # model.dump() means fetch all properties (full_described_song, etc.)

    response = requests.post(endpoint_url, json=payload, headers=headers) # Send an HTTP POST request to our cloud endpoint.
    response.raise_for_status() # Check if the request was successful; raise error if not.
    result = GenerateMusicResponseS3(**response.json()) # Parse the JSON response into our Pydantic model.
    
    print(f"Success: {result.s3_key} {result.cover_image_s3_key} {result.categories}")
    
    
    # -------------------------------------------------- DEPLOYED END-POINTS --------------------------------------------------
    # - generate_with_described_lyrics = https://jcmisa--music-generator-musicgenserver-generate-with-des-09fd99.modal.run
    # - generate_with_lyrics = https://jcmisa--music-generator-musicgenserver-generate-with-lyrics.modal.run
    # - generate_from_description = https://jcmisa--music-generator-musicgenserver-generate-from-des-450ed4.modal.run
    # - generate (for testing only) = https://jcmisa--music-generator-musicgenserver-generate.modal.run
    # -------------------------------------------------- DEPLOYED END-POINTS --------------------------------------------------
    
    # -------------------------------------------------- FOR TESTING PURPOSE ONLY --------------------------------------------------
    # audio_bytes = base64.b64decode(result.audio_data) # Decode the base64 audio string back into bytes.
    # # result.audio_data contains the str format of the audio generated by the generate fastapi endpoint
    # # where we configure the ACEStepPipeline's instance props
    
    # output_filename = "generated.wav" # Name for the saved audio file.
    # with open(output_filename, "wb") as f: # Open a file to write the audio.
    #     f.write(audio_bytes) # Write the decoded audio bytes to the file.