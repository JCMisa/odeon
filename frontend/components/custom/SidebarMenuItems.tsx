"use client";

import { usePathname } from "next/navigation";
import { HomeIcon, MusicIcon } from "lucide-react";
import { SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";

// Menu items.
let items = [
  {
    title: "Home",
    url: "/",
    icon: HomeIcon,
    active: false,
  },
  {
    title: "Create",
    url: "/create",
    icon: MusicIcon,
    active: false,
  },
];

const SidebarMenuItems = () => {
  const path = usePathname();

  items = items.map((item) => ({
    ...item,
    active: path === item.url,
  }));

  return (
    <>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={item.active}>
            <a href={item.url}>
              <item.icon />
              <span>{item.title}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </>
  );
};

export default SidebarMenuItems;
