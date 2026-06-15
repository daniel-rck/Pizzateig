import type { RecipeDraft } from "../state/recipeDraft.ts";
import { buildShareUrl } from "./share.ts";

export type ShareOutcome = "shared" | "copied" | "unavailable";

/**
 * Share a draft via the Web Share API, falling back to copying the link to the
 * clipboard (spec §5). Returns what actually happened so the UI can confirm.
 */
export async function shareDraft(draft: RecipeDraft): Promise<ShareOutcome> {
  if (typeof window === "undefined") return "unavailable";
  const url = buildShareUrl(draft, window.location.href);
  const title = draft.name.trim() || "Pizzateig-Rezept";

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text: title, url });
      return "shared";
    } catch (err) {
      // User cancelled the share sheet — not an error worth surfacing.
      if (err instanceof DOMException && err.name === "AbortError") return "shared";
      // Otherwise fall through to the clipboard path.
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return "copied";
    } catch {
      return "unavailable";
    }
  }

  return "unavailable";
}
