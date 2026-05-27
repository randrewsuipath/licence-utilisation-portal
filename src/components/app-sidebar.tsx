import React from "react";
import { Home, Users, FileText, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-blue-600 to-blue-700" />
          <span className="text-sm font-medium">Licence Utilisation Portal</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === '/'}>
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
                  <Home /> <span>Dashboard</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname.startsWith('/accounts')}>
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/accounts'); }}>
                  <Users /> <span>Accounts</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === '/imports'}>
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/imports'); }}>
                  <FileText /> <span>Imports</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === '/admin/metric-mappings'}>
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/admin/metric-mappings'); }}>
                  <Settings /> <span>Metric Mapping Admin</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 text-xs text-muted-foreground">Licence Utilisation Portal v1.0</div>
      </SidebarFooter>
    </Sidebar>
  );
}