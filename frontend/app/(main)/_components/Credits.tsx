import { Button } from "@/components/ui/button";
import { db } from "@/config/db";
import { user } from "@/config/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { SparklesIcon } from "lucide-react";
import { headers } from "next/headers";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";

const Credits = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  const [userData] = await db
    .select()
    .from(user)
    .where(eq(user.id, session.user.id));

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button className="flex items-center gap-2" variant={"outline"}>
          <SparklesIcon className="size-4 text-primary" />
          <p className="font-semibold">{userData.credits}</p>
          <p className="text-muted-foreground">Credits</p>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <Link href={"/upgrade"} className="cursor-pointer text-white">
          Upgrade
        </Link>
      </TooltipContent>
    </Tooltip>
  );
};

export default Credits;
