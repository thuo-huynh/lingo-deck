"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** iOS-style sheet from the bottom: spring motion, drag down to close, grab handle (spec #2). */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  hideTitle,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Keep the title for screen readers only. */
  hideTitle?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={cn(
          "mx-auto max-w-md rounded-t-[20px] border-border bg-card px-4 pb-[max(16px,env(safe-area-inset-bottom))] data-[vaul-drawer-direction=bottom]:max-h-[92dvh]",
          className
        )}
      >
        <div className={cn("px-2 pt-3 pb-2 text-left", hideTitle && "sr-only")}>
          <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
          {description && <DrawerDescription className="mt-1 text-[15px] leading-6 text-body">{description}</DrawerDescription>}
        </div>
        {hideTitle && description === undefined && <DrawerDescription className="sr-only">{title}</DrawerDescription>}
        {children}
      </DrawerContent>
    </Drawer>
  );
}

const rowClass =
  "flex min-h-14 w-full items-center gap-3 rounded-btn px-3 text-left text-base font-medium outline-none active:bg-muted focus-visible:bg-muted [&_svg]:size-5 [&_svg]:text-muted-foreground";

/** One row in an action sheet: a link, or a button when `onClick` is given. */
export function SheetAction({
  href,
  onClick,
  icon,
  children,
  destructive,
}: {
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  destructive?: boolean;
}) {
  const cls = cn(rowClass, destructive && "text-destructive [&_svg]:text-destructive");
  return href ? (
    <Link href={href} className={cls}>
      {icon}
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {icon}
      {children}
    </button>
  );
}

/** Confirmation as a bottom sheet; the confirm button shows a spinner and locks while the action runs. */
export function ConfirmSheet({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  onConfirm,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => Promise<unknown> | void;
  children?: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <BottomSheet open={open} onOpenChange={(o) => !busy && onOpenChange(o)} title={title} description={description}>
      {children && <div className="px-2 pb-2">{children}</div>}
      <div className="flex flex-col gap-2 px-2 pt-2">
        <Button
          size="xl"
          variant={destructive ? "destructive" : "default"}
          className={cn(destructive && "bg-destructive text-white hover:bg-destructive/90")}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
              onOpenChange(false);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy && <Loader2 className="animate-spin" />}
          {confirmLabel}
        </Button>
        <Button size="xl" variant="ghost" className="font-medium" disabled={busy} onClick={() => onOpenChange(false)}>
          Huỷ
        </Button>
      </div>
    </BottomSheet>
  );
}
