import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "../components/JsonLd";
import { buildPageMetadata, toAbsoluteUrl } from "@/lib/seo";
import { MarketingShell } from "@/components/ui/MarketingShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";
import "./media.css";

export const metadata: Metadata = buildPageMetadata({
  title: "Media - GigSettle Show",
  description:
    "The GigSettle Show is interviewing venue and promoter operators. Get in touch to be featured. Articles, podcasts, and livestreams on settlements and closeouts.",
  path: "/media",
});

const collectionPageSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "GigSettle Media",
  description:
    "The GigSettle Show interviews venue and promoter operators. Get in touch to be featured. Articles, podcasts, and livestreams on settlements and closeouts.",
  url: toAbsoluteUrl("/media"),
  isPartOf: {
    "@type": "WebSite",
    name: "GigSettle",
    url: toAbsoluteUrl("/"),
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: toAbsoluteUrl("/") },
    { "@type": "ListItem", position: 2, name: "Media", item: toAbsoluteUrl("/media") },
  ],
};

export default function MediaPage() {
  return (
    <>
      <JsonLd data={collectionPageSchema} />
      <JsonLd data={breadcrumbSchema} />
      <MarketingShell>
        <main className="media-page" role="main">
          <PageHeader
            title="Media"
            description="Articles, podcast episodes, and livestreams from the GigSettle show. Resources for venues and promoters."
            className="media-header"
          />

          <section className="media-callout-wrap" aria-labelledby="media-callout-heading">
            <Card className="media-callout" variant="elevated" padding="lg">
              <h2 id="media-callout-heading" className="media-callout-title">
                We&apos;re interviewing operators for our new show
              </h2>
              <p className="media-callout-desc">
                Venue and promoter stories, settlement workflows, and how you close out shows. Get in touch to be featured.
              </p>
              <Button
                as="a"
                href="mailto:abattisti@proton.me?subject=GigSettle%20Show%20%E2%80%94%20feature%20request"
                variant="primary"
                size="md"
                className="media-callout-cta"
              >
                Get in touch to be featured
              </Button>
            </Card>
          </section>

          {/* Articles — uncomment when we have real content
          <section className="media-section" aria-labelledby="media-articles-heading">
            <h2 id="media-articles-heading" className="media-section-title">
              Articles
            </h2>
            <div className="media-grid">
              <Card className="media-card" variant="bordered" padding="md">
                <div className="media-card-meta">
                  <Badge variant="default" className="media-type-badge">
                    Article
                  </Badge>
                </div>
                <h3 className="media-card-title">
                  <span>How to close out a show in under 15 minutes</span>
                </h3>
                <p className="media-card-desc">
                  A step-by-step workflow for venues and promoters to run settlements without the usual back-and-forth.
                </p>
                <Button as="a" href="#" variant="ghost" size="sm" className="media-card-cta">
                  Read article
                </Button>
              </Card>
              <Card className="media-card" variant="bordered" padding="md">
                <div className="media-card-meta">
                  <Badge variant="default" className="media-type-badge">
                    Article
                  </Badge>
                </div>
                <h3 className="media-card-title">
                  <span>Deal terms that prevent disputes</span>
                </h3>
                <p className="media-card-desc">
                  Common settlement clauses and how to document them so artists and promoters stay aligned.
                </p>
                <Button as="a" href="#" variant="ghost" size="sm" className="media-card-cta">
                  Read article
                </Button>
              </Card>
            </div>
          </section>
          */}

          {/* Podcast episodes — uncomment when we have real content
          <section className="media-section" aria-labelledby="media-podcast-heading">
            <h2 id="media-podcast-heading" className="media-section-title">
              Podcast episodes
            </h2>
            <div className="media-grid">
              <Card className="media-card" variant="bordered" padding="md">
                <div className="media-card-meta">
                  <Badge variant="accent" className="media-type-badge">
                    Podcast
                  </Badge>
                </div>
                <h3 className="media-card-title">
                  <span>Settlements 101 with indie promoters</span>
                </h3>
                <p className="media-card-desc">
                  Real stories from promoters on how they run settlements and what they wish they&apos;d known earlier.
                </p>
                <Button
                  as="a"
                  href="#"
                  variant="ghost"
                  size="sm"
                  className="media-card-cta"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Listen
                </Button>
              </Card>
              <Card className="media-card" variant="bordered" padding="md">
                <div className="media-card-meta">
                  <Badge variant="accent" className="media-type-badge">
                    Podcast
                  </Badge>
                </div>
                <h3 className="media-card-title">
                  <span>Venue ops: from load-in to settlement</span>
                </h3>
                <p className="media-card-desc">
                  How venue operators combine ticketing, door, and bar numbers into one defensible settlement packet.
                </p>
                <Button
                  as="a"
                  href="#"
                  variant="ghost"
                  size="sm"
                  className="media-card-cta"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Listen
                </Button>
              </Card>
            </div>
          </section>
          */}

          {/* Livestreams — uncomment when we have real content
          <section className="media-section" aria-labelledby="media-livestream-heading">
            <h2 id="media-livestream-heading" className="media-section-title">
              Livestreams
            </h2>
            <div className="media-grid">
              <Card className="media-card" variant="bordered" padding="md">
                <div className="media-card-meta">
                  <Badge variant="default" className="media-type-badge">
                    Livestream
                  </Badge>
                </div>
                <h3 className="media-card-title">
                  <span>Live settlement walkthrough</span>
                </h3>
                <p className="media-card-desc">
                  Watch a full settlement from raw numbers to PDF and share link. Q&amp;A in the chat.
                </p>
                <Button
                  as="a"
                  href="#"
                  variant="primary"
                  size="sm"
                  className="media-card-cta"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Watch
                </Button>
              </Card>
            </div>
          </section>
          */}
        </main>
      </MarketingShell>
    </>
  );
}
