import Link from "next/link";
import { ShieldCheck, User } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/sidebar-nav";
import { getPostsByCategory, type Category } from "@/lib/posts";

export function AppSidebar() {
  const postsByCategory = getPostsByCategory();

  const navData = Object.fromEntries(
    Object.entries(postsByCategory).map(([cat, posts]) => [
      cat,
      posts.map(({ slug, title }) => ({ slug, title })),
    ])
  ) as Record<Category, { slug: string; title: string }[]>;

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="text-lg font-bold text-sidebar-primary">
          이주훈
        </Link>
        <p className="text-xs text-sidebar-foreground/70">Frontend Engineer</p>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/">
                    <User className="size-4" />
                    <span>이력서</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarNav postsByCategory={navData} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/privacy">
                <ShieldCheck className="size-4" />
                <span>YepBuddy 개인정보처리방침</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
