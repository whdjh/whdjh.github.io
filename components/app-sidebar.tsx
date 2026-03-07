import Link from "next/link";
import { User, Rocket, BookOpen, Atom, Wrench } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CollapsibleSection } from "@/components/collapsible-section";
import { getPostsByCategory, type Category, type Post } from "@/lib/posts";

const categories: { key: Category; label: string; icon: typeof Rocket }[] = [
  { key: "sideProjects", label: "사이드프로젝트", icon: Rocket },
  { key: "retrospect", label: "회고", icon: BookOpen },
  { key: "react", label: "리액트", icon: Atom },
  { key: "skills", label: "기술", icon: Wrench },
];

export function AppSidebar() {
  const postsByCategory = getPostsByCategory();

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
                    <span>About</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <ScrollArea className="flex-1">
          {categories.map(({ key, label, icon: Icon }) => (
            <SidebarGroup key={key}>
              <SidebarMenu>
                <CollapsibleSection label={label} icon={<Icon className="size-4" />}>
                  <SidebarMenuSub>
                    {postsByCategory[key].map((post: Post) => (
                      <SidebarMenuSubItem key={post.slug}>
                        <SidebarMenuSubButton asChild className="max-w-full">
                          <Link href={`/dev/${post.slug}`} title={post.title}>
                            <span className="truncate">{post.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleSection>
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </ScrollArea>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
