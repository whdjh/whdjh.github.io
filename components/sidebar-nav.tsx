"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Rocket, Book, FlaskConical, Wrench, Atom, Blocks } from "lucide-react";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { CollapsibleSection } from "@/components/collapsible-section";
import type { Category } from "@/lib/posts";

type PostItem = { slug: string; title: string };

const categories: { key: Category; label: string; icon: typeof Rocket }[] = [
  { key: "yepbuddy", label: "YepBuddy", icon: Rocket },
  { key: "tamsul-dictionary", label: "탐슬도감", icon: Book },
  { key: "poc", label: "PoC", icon: FlaskConical },
  { key: "react", label: "리액트", icon: Atom },
  { key: "designPattern", label: "디자인패턴", icon: Blocks },
  { key: "others", label: "기술", icon: Wrench },
];

function isPostActive(pathname: string, slug: string) {
  return pathname === `/dev/${slug}` || pathname === `/dev/${slug}/`;
}

export function SidebarNav({
  postsByCategory,
}: {
  postsByCategory: Record<Category, PostItem[]>;
}) {
  const pathname = usePathname();

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      {categories.map(({ key, label, icon: Icon }) => {
        const hasActive = postsByCategory[key].some((p) =>
          isPostActive(pathname, p.slug)
        );

        return (
          <SidebarGroup key={key}>
            <SidebarMenu>
              <CollapsibleSection
                label={label}
                icon={<Icon className="size-4" />}
                defaultOpen={hasActive}
              >
                <SidebarMenuSub>
                  {postsByCategory[key].map((post) => (
                    <SidebarMenuSubItem key={post.slug}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={isPostActive(pathname, post.slug)}
                      >
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
        );
      })}
    </div>
  );
}
