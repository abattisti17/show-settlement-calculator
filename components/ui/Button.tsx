import React from "react";
import "./Button.css";

interface ButtonSharedProps {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

type ButtonAsButtonProps = ButtonSharedProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    as?: "button";
    href?: never;
  };

type ButtonAsAnchorProps = ButtonSharedProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as: "a";
    href: string;
  };

export type ButtonProps = ButtonAsButtonProps | ButtonAsAnchorProps;

function Spinner() {
  return <span className="ds-btn-spinner" aria-hidden="true" />;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  as = "button",
  href,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const classes = [
    "ds-btn",
    `ds-btn-${variant}`,
    `ds-btn-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (as === "a") {
    const anchorProps = rest as React.AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a
        href={href}
        className={classes}
        aria-disabled={disabled || loading ? true : undefined}
        onClick={
          disabled || loading
            ? (event) => {
                event.preventDefault();
              }
            : anchorProps.onClick
        }
        {...anchorProps}
      >
        {loading && <Spinner />}
        {children}
      </a>
    );
  }

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
