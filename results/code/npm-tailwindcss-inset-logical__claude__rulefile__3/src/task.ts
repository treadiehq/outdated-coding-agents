/**
 * Tailwind classes for a close button pinned 1rem from the top and 1rem from
 * the trailing edge of its card. `inset-e-4` maps to `inset-inline-end`, so it
 * sits on the right in LTR and flips to the left in RTL. The card must be
 * positioned (e.g. `relative`).
 */
export function closeButtonClasses(): string {
  return "absolute top-4 inset-e-4";
}
