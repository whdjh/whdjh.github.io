"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export function CollapsibleSection({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            {icon}
            <span>{label}</span>
            <ChevronRight
              className="ml-auto size-4 transition-transform duration-200"
              style={{ transform: open ? "rotate(90deg)" : undefined }}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>{children}</CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
