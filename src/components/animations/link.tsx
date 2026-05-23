// oxlint-disable jsdoc/require-returns, jsdoc/require-param, react/forbid-component-props
import { Link } from "@tanstack/react-router";
import { Link2Icon } from "lucide-react";
import React from "react";
import { cn } from "../../utils/browser-styles";

// Source : https://skiper-ui.com/v1/skiper40

type LinkProps = React.ComponentProps<typeof Link>;

type AnimatedLinkProps = Omit<LinkProps, "children"> & {
  children: React.ReactNode;
};

/** Underline slides in from right on hover */
export const AnimatedLink = ({ children, className, ...props }: AnimatedLinkProps) => (
  <Link
    className={cn(
      "group relative block w-fit items-center truncate pr-5",
      "before:pointer-events-none before:absolute before:bottom-0 before:left-0 before:h-[0.05em] before:w-full before:bg-current before:content-['']",
      "before:origin-right before:scale-x-0 before:transition-transform before:duration-300 before:ease-in-out",
      "hover:text-accent hover:before:origin-left hover:before:scale-x-100",
      className,
    )}
    {...props}
  >
    {children}
    <Link2Icon width={12} className="absolute -top-0.5 right-0 text-accent" />
  </Link>
);
