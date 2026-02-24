import React from "react";
import "./Icon.css";

export type IconName = "chevron";

export type IconDirection = "up" | "down" | "left" | "right";

export interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  name: IconName;
  size?: number;
  direction?: IconDirection;
}

const paths: Record<IconName, string> = {
  chevron: "M6 9l6 6 6-6",
};

const rotations: Record<IconDirection, number> = {
  down: 0,
  up: 180,
  left: 90,
  right: -90,
};

/**
 * Design-system icon. Currently supports chevron with directional rotation.
 * Add more icon names + paths as needed.
 */
export function Icon({
  name,
  size = 16,
  direction = "down",
  className,
  style,
  ...rest
}: IconProps) {
  const rotation = rotations[direction];

  return (
    <svg
      className={["ds-icon", className].filter(Boolean).join(" ")}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        ...style,
        ...(rotation ? { transform: `rotate(${rotation}deg)` } : {}),
      }}
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  );
}
