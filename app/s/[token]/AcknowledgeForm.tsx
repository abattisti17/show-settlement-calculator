"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { acknowledgeSettlement } from "./actions";

interface Ack {
  name: string;
  email: string;
  timestamp: string;
}

export function AcknowledgeForm({
  token,
  initialAcknowledgments,
}: {
  token: string;
  initialAcknowledgments: Ack[];
}) {
  const [acks, setAcks] = useState<Ack[]>(initialAcknowledgments);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await acknowledgeSettlement(token, name, email);
      if (result.success) {
        setAcks((prev) => [
          ...prev,
          { name: name.trim(), email: email.trim(), timestamp: new Date().toISOString() },
        ]);
        setName("");
        setEmail("");
        setMessage({ type: "success", text: "Settlement acknowledged. Thank you." });
      } else {
        setMessage({ type: "error", text: result.error || "Something went wrong." });
      }
    });
  }

  return (
    <section className="settlement-section settlement-ack-section">
      <h2 className="ds-section-title">Acknowledgment</h2>

      {acks.length > 0 && (
        <div className="settlement-ack-list">
          {acks.map((ack, i) => (
            <p key={i} className="settlement-ack-entry">
              Acknowledged by <strong>{ack.name}</strong>
              {ack.email ? ` (${ack.email})` : ""} on{" "}
              {new Date(ack.timestamp).toLocaleString()}
            </p>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="settlement-ack-form">
        <p className="settlement-ack-prompt">
          By acknowledging, you confirm you have reviewed this settlement report.
        </p>
        <div className="settlement-ack-fields">
          <Input
            label="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Jane Doe"
            required
          />
          <Input
            label="Email (optional)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g., jane@example.com"
          />
        </div>
        {message && (
          <p className={`settlement-ack-msg ${message.type}`}>{message.text}</p>
        )}
        <Button type="submit" variant="primary" size="sm" disabled={!name.trim() || isPending} loading={isPending}>
          Acknowledge Settlement
        </Button>
      </form>
    </section>
  );
}
