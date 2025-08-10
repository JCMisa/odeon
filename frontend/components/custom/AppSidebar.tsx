import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
} from "@/components/ui/sidebar";
import SidebarMenuItems from "./SidebarMenuItems";
import SidebarHeaderComponent from "./SidebarHeaderComponent";
import SidebarFooterComponent from "./SidebarFooterComponent";

export function AppSidebar() {
  return (
    <Sidebar side="left" collapsible="icon" variant="floating">
      <SidebarHeaderComponent />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItems />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooterComponent />
    </Sidebar>
  );
}
