import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        pastel: {
          coral: { DEFAULT: "hsl(var(--pastel-coral))", accent: "hsl(var(--pastel-coral-accent))" },
          peach: { DEFAULT: "hsl(var(--pastel-peach))", accent: "hsl(var(--pastel-peach-accent))" },
          amber: { DEFAULT: "hsl(var(--pastel-amber))", accent: "hsl(var(--pastel-amber-accent))" },
          yellow: { DEFAULT: "hsl(var(--pastel-yellow))", accent: "hsl(var(--pastel-yellow-accent))" },
          mint: { DEFAULT: "hsl(var(--pastel-mint))", accent: "hsl(var(--pastel-mint-accent))" },
          teal: { DEFAULT: "hsl(var(--pastel-teal))", accent: "hsl(var(--pastel-teal-accent))" },
          sky: { DEFAULT: "hsl(var(--pastel-sky))", accent: "hsl(var(--pastel-sky-accent))" },
          lavender: { DEFAULT: "hsl(var(--pastel-lavender))", accent: "hsl(var(--pastel-lavender-accent))" },
          rose: { DEFAULT: "hsl(var(--pastel-rose))", accent: "hsl(var(--pastel-rose-accent))" },
          gray: { DEFAULT: "hsl(var(--pastel-gray))", accent: "hsl(var(--pastel-gray-accent))" },
          stone: { DEFAULT: "hsl(var(--pastel-stone))", accent: "hsl(var(--pastel-stone-accent))" },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        card: "var(--shadow-card)",
        elevated: "var(--shadow-elevated)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(100%)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "view-slide-left": {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "view-slide-right": {
          from: { opacity: "0", transform: "translateX(-16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "view-zoom-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "task-highlight": {
          "0%": { boxShadow: "0 0 0 3px hsl(var(--primary) / 0.28), 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)" },
          "100%": { boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.4s ease-out forwards",
        "fade-in": "fade-in 0.25s ease-out forwards",
        "scale-in": "scale-in 0.25s ease-out forwards",
        "slide-up": "slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "view-slide-left": "view-slide-left 0.3s ease-out forwards",
        "view-slide-right": "view-slide-right 0.3s ease-out forwards",
        "view-zoom-in": "view-zoom-in 0.25s ease-out forwards",
        "task-highlight": "task-highlight 1.5s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;