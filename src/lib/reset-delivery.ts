// ---------------------------------------------------------------------------
// The in-app reset-delivery decision (V2 C1). Pure — unit-pinned by
// tests/hardening.test.ts. The forgot-password route consults this seam:
// in-app delivery (the reset URL rides the API response) is the no-SMTP
// development/demo posture; a default PRODUCTION boot never carries the
// token — a raw 200-shape leak turned any known email into an account
// takeover. Recovery without a mail channel: re-seed the owner or run the
// reset through a trusted admin shell.
// ---------------------------------------------------------------------------

export function inAppResetDeliveryEnabled(
  nodeEnv: string | undefined,
  flag: string | undefined,
): boolean {
  if (flag === "1") return true;
  if (flag === "0") return false;
  return nodeEnv !== "production";
}
