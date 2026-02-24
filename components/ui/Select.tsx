import React from "react";
import "./Select.css";

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  error?: string;
  hint?: string;
  size?: "sm" | "md" | "lg";
}

export function Select({
  label,
  error,
  hint,
  size = "md",
  className,
  id,
  children,
  ...rest
}: SelectProps) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div
      className={[
        "ds-select-wrapper",
        error ? "ds-select-error" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label && (
        <label htmlFor={selectId} className="ds-select-label">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`ds-select ds-select-${size}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error
            ? `${selectId}-error`
            : hint
            ? `${selectId}-hint`
            : undefined
        }
        {...rest}
      >
        {children}
      </select>
      {error && (
        <p id={`${selectId}-error`} className="ds-select-error-msg" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${selectId}-hint`} className="ds-select-hint">
          {hint}
        </p>
      )}
    </div>
  );
}
