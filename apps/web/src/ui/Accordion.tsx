import * as RadixAccordion from "@radix-ui/react-accordion";
import type { ReactNode } from "react";

export interface AccordionItem {
  value: string;

  label: string;

  lead?: ReactNode;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
}

export function Accordion({ items }: AccordionProps): React.ReactElement {
  return (
    <RadixAccordion.Root type="multiple" className="flex flex-col gap-2">
      {items.map((item) => (
        <RadixAccordion.Item
          key={item.value}
          value={item.value}
          className="rounded-card border border-border bg-surface-raised"
        >
          <RadixAccordion.Header className="m-0">

            <RadixAccordion.Trigger className="group tap-target text-body flex w-full items-center justify-between gap-3 border-0 bg-transparent px-4 text-left font-semibold text-ink">
              {item.lead !== undefined && (
                <span aria-hidden="true" className="shrink-0">
                  {item.lead}
                </span>
              )}

              <span className="flex-1">{item.label}</span>

              <Chevron />
            </RadixAccordion.Trigger>
          </RadixAccordion.Header>

          <RadixAccordion.Content className="text-body px-4 pb-4 text-ink-muted">
            {item.content}
          </RadixAccordion.Content>
        </RadixAccordion.Item>
      ))}
    </RadixAccordion.Root>
  );
}

function Chevron(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      className="size-5 shrink-0 motion-safe:transition-transform motion-safe:duration-normal group-data-[state=open]:rotate-180"
    >
      <path d="M6 9l6 6 6-6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
