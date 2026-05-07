// oxlint-disable jsdoc/require-returns, jsdoc/require-param, react/forbid-component-props
import { Link } from "@tanstack/react-router";
import React from "react";
import { cn } from "../utils/browser-styles";

// Source : https://skiper-ui.com/v1/skiper40

type LinkProps = React.ComponentProps<typeof Link>;

/** Underline slides in from right on hover */
const Link000 = ({ children, className, ...props }: LinkProps) => (
  <Link
    className={cn(
      "group relative block w-fit items-center truncate text-primary",
      "before:pointer-events-none before:absolute before:bottom-0 before:left-0 before:h-[0.05em] before:w-full before:bg-current before:content-['']",
      "before:origin-right before:scale-x-0 before:transition-transform before:duration-300 before:ease-in-out",
      "hover:before:origin-left hover:before:scale-x-100",
      className,
    )}
    {...props}
  >
    {children}
  </Link>
);

export { Link000 };
