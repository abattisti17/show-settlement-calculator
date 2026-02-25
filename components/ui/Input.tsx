import React from "react";
import "./Input.css";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  hint?: string;
  size?: "sm" | "md" | "lg";
}

export function Input({
  label,
  error,
  hint,
  size = "md",
  className,
  id,
  type,
  onWheel,
  ...rest
}: InputProps) {
  const generatedId = React.useId();
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : `input-${generatedId}`);

  return (
    <div
      className={[
        "ds-input-wrapper",
        error ? "ds-input-error" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label && (
        <label htmlFor={inputId} className="ds-input-label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={`ds-input ds-input-${size}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error
            ? `${inputId}-error`
            : hint
            ? `${inputId}-hint`
            : undefined
        }
        onWheel={(event) => {
          onWheel?.(event);
          if (type === "number") {
            event.currentTarget.blur();
          }
        }}
        {...rest}
      />
      {error && (
        <p id={`${inputId}-error`} className="ds-input-error-msg" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="ds-input-hint">
          {hint}
        </p>
      )}
    </div>
  );
}
