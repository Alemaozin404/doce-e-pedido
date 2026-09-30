"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "gold";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
  external?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-chocolate text-cream hover:bg-chocolate-dark active:bg-chocolate-deepest shadow-soft",
  secondary:
    "bg-rose text-chocolate-dark hover:bg-rose-dark hover:text-white active:bg-rose-deep shadow-soft",
  outline:
    "border border-chocolate/30 text-chocolate hover:bg-chocolate hover:text-cream active:bg-chocolate-dark",
  ghost: "text-chocolate hover:bg-chocolate/5 active:bg-chocolate/10",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
  gold: "bg-gold text-chocolate-deepest hover:bg-gold-dark hover:text-white shadow-soft",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm sm:text-base",
  lg: "px-7 py-3.5 text-base sm:text-lg",
};

export default function Button({
  variant = "primary",
  size = "md",
  href,
  external,
  fullWidth,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chocolate focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`;

  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
