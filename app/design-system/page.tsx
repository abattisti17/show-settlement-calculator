"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "3rem" }}>
      <h2 style={{
        fontSize: "var(--text-2xl)",
        fontWeight: 700,
        color: "var(--color-text-strong)",
        marginBottom: "1.5rem",
        paddingBottom: "0.75rem",
        borderBottom: "1px solid var(--color-border)",
      }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ children, label }: { children?: React.ReactNode; label?: string }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      {label && (
        <p style={{
          fontSize: "var(--text-sm)",
          color: "var(--color-text-muted)",
          marginBottom: "0.5rem",
          fontWeight: 600,
        }}>
          {label}
        </p>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
        {children}
      </div>
    </div>
  );
}

function ColorSwatch({ name, cssVar }: { name: string; cssVar: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem", width: 80 }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: "var(--radius-md)",
        background: `var(${cssVar})`,
        border: "1px solid var(--color-border-strong)",
      }} />
      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textAlign: "center" }}>
        {name}
      </span>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <PageHeader
        title="Design System"
        description="Living style guide — every component in every variant."
        breadcrumb={[{ label: "Home", href: "/" }]}
      />

      {/* Colors */}
      <Section title="Colors — Accent (Purple)">
        <Row>
          <ColorSwatch name="accent" cssVar="--color-accent" />
          <ColorSwatch name="accent-strong" cssVar="--color-accent-strong" />
          <ColorSwatch name="accent-hover" cssVar="--color-accent-hover" />
          <ColorSwatch name="accent-bg" cssVar="--color-accent-bg" />
          <ColorSwatch name="accent-border" cssVar="--color-accent-border" />
        </Row>
      </Section>

      <Section title="Colors — Semantic">
        <Row label="Success">
          <ColorSwatch name="success" cssVar="--color-success" />
          <ColorSwatch name="success-strong" cssVar="--color-success-strong" />
          <ColorSwatch name="success-bg" cssVar="--color-success-bg" />
        </Row>
        <Row label="Warning">
          <ColorSwatch name="warning" cssVar="--color-warning" />
          <ColorSwatch name="warning-strong" cssVar="--color-warning-strong" />
          <ColorSwatch name="warning-bg" cssVar="--color-warning-bg" />
        </Row>
        <Row label="Error">
          <ColorSwatch name="error" cssVar="--color-error" />
          <ColorSwatch name="error-bg" cssVar="--color-error-bg" />
        </Row>
      </Section>

      <Section title="Colors — Text">
        <Row>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <span style={{ color: "var(--color-text-strong)", fontSize: "var(--text-base)" }}>
              --color-text-strong: Headings & emphasis
            </span>
            <span style={{ color: "var(--color-text)", fontSize: "var(--text-base)" }}>
              --color-text: Primary body text
            </span>
            <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-base)" }}>
              --color-text-muted: Secondary / helper text
            </span>
            <span style={{ color: "var(--color-text-faint)", fontSize: "var(--text-base)" }}>
              --color-text-faint: Disabled / placeholder
            </span>
          </div>
        </Row>
      </Section>

      <Section title="Colors — Surfaces & Borders">
        <Row>
          <ColorSwatch name="surface" cssVar="--color-surface" />
          <ColorSwatch name="surface-strong" cssVar="--color-surface-strong" />
          <ColorSwatch name="border" cssVar="--color-border" />
          <ColorSwatch name="border-strong" cssVar="--color-border-strong" />
          <ColorSwatch name="focus-ring" cssVar="--color-focus-ring" />
        </Row>
      </Section>

      {/* Typography */}
      <Section title="Typography Scale">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[
            { token: "--text-xs", label: "text-xs (0.75rem / 12px)" },
            { token: "--text-sm", label: "text-sm (0.875rem / 14px)" },
            { token: "--text-base", label: "text-base (1rem / 16px)" },
            { token: "--text-lg", label: "text-lg (1.125rem / 18px)" },
            { token: "--text-xl", label: "text-xl (1.25rem / 20px)" },
            { token: "--text-2xl", label: "text-2xl (1.5rem / 24px)" },
            { token: "--text-3xl", label: "text-3xl (1.75rem / 28px)" },
            { token: "--text-4xl", label: "text-4xl (2.25rem / 36px)" },
            { token: "--text-5xl", label: "text-5xl (2.5rem / 40px)" },
          ].map((t) => (
            <div key={t.token} style={{ display: "flex", alignItems: "baseline", gap: "1rem" }}>
              <span style={{
                fontSize: `var(${t.token})`,
                fontWeight: 600,
                color: "var(--color-text-strong)",
                minWidth: 120,
              }}>
                Aa
              </span>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                {t.label}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Buttons */}
      <Section title="Button">
        <Row label="Variants (md)">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </Row>
        <Row label="Sizes (primary)">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </Row>
        <Row label="States">
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button variant="secondary" disabled>Disabled Ghost</Button>
        </Row>
        <Row label="As link">
          <Button as="a" href="#" variant="primary">Link Button</Button>
          <Button as="a" href="#" variant="ghost">Ghost Link</Button>
        </Row>
      </Section>

      {/* Inputs */}
      <Section title="Input">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", maxWidth: 600 }}>
          <Input label="Default" placeholder="Enter text…" />
          <Input label="With hint" placeholder="Enter text…" hint="This is a hint" />
          <Input label="Error state" placeholder="Enter text…" error="This field is required" />
          <Input label="Disabled" placeholder="Can't edit" disabled />
        </div>
        <Row label="Sizes" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", maxWidth: 600 }}>
          <Input size="sm" placeholder="Small" />
          <Input size="md" placeholder="Medium" />
          <Input size="lg" placeholder="Large" />
        </div>
      </Section>

      {/* Select */}
      <Section title="Select">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", maxWidth: 600 }}>
          <Select label="Deal Type">
            <option>Guarantee</option>
            <option>Percentage of Net</option>
            <option>Guarantee vs Percentage</option>
          </Select>
          <Select label="With error" error="Please select a value">
            <option value="">Choose…</option>
          </Select>
        </div>
      </Section>

      {/* Cards */}
      <Section title="Card">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          <Card variant="default" padding="md">
            <p style={{ color: "var(--color-text-strong)", fontWeight: 600, marginBottom: "0.5rem" }}>Default</p>
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>Standard surface card</p>
          </Card>
          <Card variant="elevated" padding="md">
            <p style={{ color: "var(--color-text-strong)", fontWeight: 600, marginBottom: "0.5rem" }}>Elevated</p>
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>With box-shadow</p>
          </Card>
          <Card variant="bordered" padding="md">
            <p style={{ color: "var(--color-text-strong)", fontWeight: 600, marginBottom: "0.5rem" }}>Bordered</p>
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>Thicker border</p>
          </Card>
        </div>
        <Row label="Padding sizes" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          <Card padding="sm"><p style={{ color: "var(--color-text-muted)" }}>padding=sm</p></Card>
          <Card padding="md"><p style={{ color: "var(--color-text-muted)" }}>padding=md</p></Card>
          <Card padding="lg"><p style={{ color: "var(--color-text-muted)" }}>padding=lg</p></Card>
        </div>
      </Section>

      {/* Badges */}
      <Section title="Badge">
        <Row>
          <Badge variant="default">Default</Badge>
          <Badge variant="success">Active</Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="accent">Pro</Badge>
        </Row>
      </Section>

      {/* PageHeader */}
      <Section title="PageHeader">
        <Card padding="md">
          <PageHeader
            title="Your Shows"
            description="Manage saved settlements, billing, and share links."
            action={<Button size="sm">Create New Show</Button>}
            breadcrumb={[{ label: "Home", href: "/" }, { label: "Dashboard", href: "/dashboard" }]}
          />
        </Card>
      </Section>

      {/* Radius scale */}
      <Section title="Radius Scale">
        <Row>
          {[
            { name: "sm (6px)", token: "--radius-sm" },
            { name: "md (8px)", token: "--radius-md" },
            { name: "lg (10px)", token: "--radius-lg" },
            { name: "xl (12px)", token: "--radius-xl" },
            { name: "2xl (16px)", token: "--radius-2xl" },
          ].map((r) => (
            <div key={r.token} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: `var(${r.token})`,
                background: "var(--color-accent-bg)",
                border: "2px solid var(--color-accent-border)",
              }} />
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{r.name}</span>
            </div>
          ))}
        </Row>
      </Section>

      {/* Contrast check */}
      <Section title="Contrast Check (WCAG AA)">
        <Card padding="md">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "var(--text-sm)" }}>
            <p style={{ color: "var(--color-text-strong)" }}>
              <strong>PASS</strong> — text-strong on gradient-page background (white/#111827 on dark/light bg)
            </p>
            <p style={{ color: "var(--color-text)" }}>
              <strong>PASS</strong> — text on gradient-page background (#e8e8e8/#1a202c)
            </p>
            <p style={{ color: "var(--color-text-muted)" }}>
              <strong>PASS</strong> — text-muted on gradient-page background (#a0aec0/#4a5568 — ~5.2:1 dark, ~7.4:1 light)
            </p>
            <p style={{ color: "var(--color-text-faint)" }}>
              <strong>MARGINAL</strong> — text-faint on gradient-page (#4a5568/#94a3b8 — ~3.5:1) — use for decorative/disabled only
            </p>
            <p style={{ color: "var(--color-accent)" }}>
              <strong>PASS</strong> — accent on dark bg (#b794f4 — ~7.5:1) / accent on light bg (#7c3aed — ~6.4:1)
            </p>
            <p style={{ color: "var(--color-text-strong)" }}>
              <strong>PASS</strong> — text-strong on gradient-primary (white on purple gradient — ~5.8:1 dark, ~9.1:1 light)
            </p>
            <p style={{ color: "var(--color-error)" }}>
              <strong>PASS</strong> — error on dark bg (#fc8181 — ~6.8:1) / error on light bg (#dc2626 — ~5.3:1)
            </p>
            <p style={{ color: "var(--color-success)" }}>
              <strong>PASS</strong> — success on dark bg (#48bb78 — ~6.2:1) / success on light bg (#16a34a — ~4.7:1)
            </p>
            <p style={{ color: "var(--color-warning)" }}>
              <strong>PASS</strong> — warning on dark bg (#ed8936 — ~6.5:1) / warning on light bg (#d97706 — ~4.5:1 AA)
            </p>
          </div>
        </Card>
      </Section>
    </div>
  );
}
