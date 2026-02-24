import type { Metadata } from "next";

export const SITE_NAME = "GigSettle";
export const SITE_URL = "https://show-settlement-calculator.vercel.app";
export const DEFAULT_OG_IMAGE = "/og.png";

export function toAbsoluteUrl(path: string = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, SITE_URL).toString();
}

export function canonicalPath(path: string): string {
  if (!path || path === "/") {
    return "/";
  }

  return path.endsWith("/") ? path.slice(0, -1) : path;
}

interface BuildMetadataOptions {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  noIndex?: boolean;
}

export function buildPageMetadata({
  title,
  description,
  path,
  ogImage = DEFAULT_OG_IMAGE,
  noIndex = false,
}: BuildMetadataOptions): Metadata {
  const canonical = canonicalPath(path);
  const absoluteUrl = toAbsoluteUrl(canonical);
  const absoluteOgImage = toAbsoluteUrl(ogImage);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: absoluteUrl,
      images: [
        {
          url: absoluteOgImage,
          alt: SITE_NAME,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteOgImage],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
  };
}
