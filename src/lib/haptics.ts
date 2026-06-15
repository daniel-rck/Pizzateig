/**
 * Tiny haptic feedback helper (spec §4.2, nice-to-have). No-op where the
 * Vibration API is unavailable (most desktops, iOS Safari).
 */
export function tick(durationMs = 8): void {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(durationMs);
  } catch {
    // ignore — vibration is best-effort feedback
  }
}
