#!/bin/bash

# S3 CORS Configuration Script
# This script helps set up CORS for your S3 bucket to allow audio playback

echo "Setting up S3 CORS configuration..."

# Create CORS configuration file
cat > cors.json << EOF
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "HEAD",
            "PUT",
            "POST",
            "DELETE"
        ],
        "AllowedOrigins": [
            "http://localhost:3000",
            "https://yourdomain.com",
            "*"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-meta-custom-header"
        ],
        "MaxAgeSeconds": 3000
    }
]
EOF

echo "CORS configuration file created: cors.json"
echo ""
echo "To apply this configuration:"
echo "1. Replace 'yourdomain.com' with your actual domain"
echo "2. Run: aws s3api put-bucket-cors --bucket YOUR-BUCKET-NAME --cors-configuration file://cors.json"
echo ""
echo "For development, you can use:"
echo "aws s3api put-bucket-cors --bucket music-generation-jcmisa --cors-configuration file://cors.json"
