"use client";

import { authClient } from "@/lib/auth-client";
import { LoaderCircleIcon, LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";

const LogoutButton = () => {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  return (
    <button
      onClick={async () => {
        setLoading(true);
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
        } finally {
          setLoading(false);
        }
      }}
      className="cursor-pointer"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-6 h-6 flex items-center justify-center p-1 rounded-full bg-primary hover:bg-primary-600 border-none outline-none">
            {loading ? (
              <LoaderCircleIcon className="size-3 animate-spin text-white" />
            ) : (
              <LogOutIcon className="text-white size-3" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm text-white">Logout</p>
        </TooltipContent>
      </Tooltip>
    </button>
  );
};

export default LogoutButton;
