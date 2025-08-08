"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon } from "lucide-react";
import SidebarMenuItems from "./SidebarMenuItems";
import Image from "next/image";

export function AppSidebar() {
  const { open } = useSidebar();
  return (
    <Sidebar side="left" collapsible="icon" variant="floating">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  {open && (
                    <div className="flex items-center">
                      <Image
                        src={"/logo.svg"}
                        alt="logo"
                        width={20}
                        height={20}
                      />
                      <span className="text-lg font-bold bg-gradient-to-r from-[#fb7185] via-[#f43f5e] to-[#fda4af] bg-clip-text text-transparent">
                        deon
                      </span>
                    </div>
                  )}
                  <ChevronDownIcon className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side={open ? "bottom" : "left"}
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem>
                  <span>Acme Inc</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Acme Corp.</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItems />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
