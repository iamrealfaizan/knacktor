"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";

function Sheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />;
}

type Side = "left" | "right" | "bottom";

const SIDE_CLASS: Record<Side, string> = {
  right:
    "inset-y-0 right-0 h-full w-full max-w-md border-l data-closed:translate-x-full",
  left:
    "inset-y-0 left-0 h-full w-full max-w-md border-r data-closed:-translate-x-full",
  bottom:
    "inset-x-0 bottom-0 max-h-[85vh] w-full border-t rounded-t-2xl data-closed:translate-y-full",
};

function SheetContent({
  className,
  side = "right",
  children,
  ...props
}: DialogPrimitive.Popup.Props & { side?: Side }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] transition-opacity duration-200 data-closed:opacity-0 data-open:opacity-100" />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col gap-3 bg-kn-surface-0 border-kn-border-0 p-5 shadow-xl transition-transform duration-300 ease-out cs-scroll overflow-y-auto",
          SIDE_CLASS[side],
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn("font-mono text-sm font-bold tracking-wide text-kn-ink-0", className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-xs text-kn-ink-2", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetDescription,
};
