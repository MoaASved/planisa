import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card/95 group-[.toaster]:backdrop-blur-sm group-[.toaster]:text-foreground group-[.toaster]:text-sm group-[.toaster]:border-border/50 group-[.toaster]:shadow-sm group-[.toaster]:rounded-xl group-[.toaster]:py-2.5 group-[.toaster]:px-3",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs",
          actionButton: "group-[.toast]:bg-foreground group-[.toast]:text-background group-[.toast]:rounded-lg group-[.toast]:text-xs group-[.toast]:font-medium group-[.toast]:py-1 group-[.toast]:px-2.5",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg group-[.toast]:text-xs",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
