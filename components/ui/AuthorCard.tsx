import React from "react";
import Image from "next/image";
import { Card } from "./Card";
import "./AuthorCard.css";

export interface AuthorCardProps {
  imageSrc: string;
  imageAlt: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Avatar + bio text card used for founder/team bios.
 * Renders inside a Card with overlay background.
 */
export function AuthorCard({
  imageSrc,
  imageAlt,
  children,
  className,
}: AuthorCardProps) {
  return (
    <Card
      className={["ds-author-card", className].filter(Boolean).join(" ")}
      variant="default"
      padding="md"
    >
      <div className="ds-author-card-inner">
        <Image
          src={imageSrc}
          alt={imageAlt}
          className="ds-author-card-avatar"
          width={240}
          height={240}
          loading="lazy"
        />
        <div className="ds-author-card-body">
          {children}
        </div>
      </div>
    </Card>
  );
}
