import * as RadixTabs from "@radix-ui/react-tabs";
import type { ReactNode } from "react";

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;

  label: string;
}

const TAB_BASE =
  "tap-target text-body border-transparent bg-transparent px-3 font-semibold text-ink-muted transition-colors duration-quick";

const TAB_ACTIVO = "border-b-2 border-b-primary text-primary";

export function tabLinkClasses(active: boolean): string {
  return [
    TAB_BASE,
    "inline-flex items-center no-underline",
    active ? TAB_ACTIVO : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function Tabs({ items, value, onValueChange, label }: TabsProps): React.ReactElement {
  return (
    <RadixTabs.Root value={value} onValueChange={onValueChange}>
      <RadixTabs.List
        aria-label={label}
        className="flex gap-1 border-b border-border"
      >
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            className={`${TAB_BASE} data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:text-primary`}
          >
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>

      {items.map((item) => (
        <RadixTabs.Content key={item.value} value={item.value} className="pt-3">
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
