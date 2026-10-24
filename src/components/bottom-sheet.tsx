"use client";

import Link from "next/link";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { AsyncButton } from "@/components/async-button";
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
        // No description element when there is none, rather than one that repeats the title.
        {...(description ? {} : { "aria-describedby": undefined })}
        className={cn(
          "mx-auto max-w-md rounded-t-[20px] border-border bg-card px-4 pb-[max(16px,env(safe-area-inset-bottom))] data-[vaul-drawer-direction=bottom]:max-h-[92dvh]",
          className
        )}
      >
        <div className={cn("px-2 pt-3 pb-2 text-left", hideTitle && "sr-only")}>
          <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
          {description && <DrawerDescription className="mt-1 text-[15px] leading-6 text-body">{description}</DrawerDescription>}
        </div>
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
  download,
}: {
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  destructive?: boolean;
  /** Plain download link (API file), not a client-side navigation. */
  download?: boolean;
}) {
  const cls = cn(rowClass, destructive && "text-destructive [&_svg]:text-destructive");
  if (href && download) {
    return (
      <a href={href} download className={cls}>
        {icon}
        {children}
      </a>
    );
  }
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

/** Confirmation as a bottom sheet; the confirm button locks with a spinner while the action runs. */
export function ConfirmSheet({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Huỷ",
  destructive,
  onConfirm,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => Promise<unknown> | void;
  children?: React.ReactNode;
}) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={title} description={description}>
      {children && <div className="px-2 pb-2">{children}</div>}
      <div className="flex flex-col gap-2 px-2 pt-2">
        <AsyncButton
          size="xl"
          variant={destructive ? "destructive" : "default"}
          className={cn(destructive && "bg-destructive text-white hover:bg-destructive/90")}
          onClick={async () => {
            await onConfirm();
            onOpenChange(false);
          }}
        >
          {confirmLabel}
        </AsyncButton>
        <Button size="xl" variant="ghost" className="font-medium" onClick={() => onOpenChange(false)}>
          {cancelLabel}
        </Button>
      </div>
    </BottomSheet>
  );
}
