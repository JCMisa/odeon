import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import CreateSong from "./_components/CreateSong";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  return (
    <div>
      <CreateSong />
    </div>
  );
}
