"use client";

import { Button } from "@/components/ui/Button";

export function SharePagePrintButton() {
  return (
    <Button type="button" variant="secondary" size="sm" onClick={() => window.print()}>
      Print
    </Button>
  );
}
