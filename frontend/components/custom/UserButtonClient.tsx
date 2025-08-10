"use client";

import { UserButton } from "@daveyplate/better-auth-ui";
import { useSidebar } from "../ui/sidebar";
import { UserIcon } from "lucide-react";

const UserButtonClient = () => {
  const { open } = useSidebar();
  return (
    <UserButton
      size={open ? "default" : "icon"}
      additionalLinks={[
        {
          label: "Customer Portal",
          href: "/customer-portal",
          icon: <UserIcon />,
        },
      ]}
    />
  );
};

export default UserButtonClient;
