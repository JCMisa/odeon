"use client";

import { authClient } from "@/lib/auth-client";
import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";

const LogoutButton = () => {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        try {
          // sign the user out.
          await authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                router.push("/auth/sign-in");
              },
            },
          });
        } catch (error) {
          console.log("Sign-out failed:", error);
        }
      }}
      className="cursor-pointer"
    >
      <LogOutIcon className="text-primary size-5" />
    </button>
  );
};

export default LogoutButton;
