import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card/95 group-[.toaster]:backdrop-blur-sm group-[.toaster]:text-foreground group-[.toaster]:text-xs group-[.toaster]:border-border/50 group-[.toaster]:shadow-sm group-[.toaster]:rounded-lg group-[.toaster]:py-2 group-[.toaster]:px-3 group-[.toaster]:w-auto group-[.toaster]:min-w-0",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-[10px]",
          actionButton: "group-[.toast]:bg-foreground group-[.toast]:text-background group-[.toast]:rounded-md group-[.toast]:text-[10px] group-[.toast]:font-medium group-[.toast]:py-0.5 group-[.toast]:px-2",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md group-[.toast]:text-[10px]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
