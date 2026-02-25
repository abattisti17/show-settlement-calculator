import React from "react";
import "./Textarea.css";

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  label?: string;
  error?: string;
  hint?: string;
  size?: "sm" | "md" | "lg";
}

export function Textarea({
  label,
  error,
  hint,
  size = "md",
  className,
  id,
  ...rest
}: TextareaProps) {
  const generatedId = React.useId();
  const textareaId =
    id || (label ? label.toLowerCase().replace(/\s+/g, "-") : `textarea-${generatedId}`);

  return (
    <div
      className={[
        "ds-textarea-wrapper",
        error ? "ds-textarea-error" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label && (
        <label htmlFor={textareaId} className="ds-textarea-label">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`ds-textarea ds-textarea-${size}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error
            ? `${textareaId}-error`
            : hint
            ? `${textareaId}-hint`
            : undefined
        }
        {...rest}
      />
      {error && (
        <p id={`${textareaId}-error`} className="ds-textarea-error-msg" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${textareaId}-hint`} className="ds-textarea-hint">
          {hint}
        </p>
      )}
    </div>
  );
}
