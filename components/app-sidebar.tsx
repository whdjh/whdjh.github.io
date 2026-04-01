import Link from "next/link";
import { User, Rocket, Book, FlaskConical, Wrench, Atom, Blocks } from "lucide-react";
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
import { CollapsibleSection } from "@/components/collapsible-section";
import { getPostsByCategory, type Category, type Post } from "@/lib/posts";

const categories: { key: Category; label: string; icon: typeof Rocket }[] = [
  { key: "yepbuddy", label: "YepBuddy", icon: Rocket },
  { key: "tamsul-dictionary", label: "탐슬도감", icon: Book },
  { key: "poc", label: "PoC", icon: FlaskConical },
  { key: "others", label: "기술", icon: Wrench },
  { key: "react", label: "리액트", icon: Atom },
  { key: "designPattern", label: "디자인패턴", icon: Blocks },
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
                    <span>이력서</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {categories.map(({ key, label, icon: Icon }) => (
            <SidebarGroup key={key}>
              <SidebarMenu>
                <CollapsibleSection label={label} icon={<Icon className="size-4" />}>
                  <SidebarMenuSub>
                    {postsByCategory[key].map((post: Post) => (
                      <SidebarMenuSubItem key={post.slug}>
                        <SidebarMenuSubButton asChild>
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
        </div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
