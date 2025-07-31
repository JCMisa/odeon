import ModeToggle from "@/components/custom/ModeToggle";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  return (
    <div>
      <Button>Click Me</Button>
      <ModeToggle />
    </div>
  );
}
