/**
 * Tailwind classes for a card's close button: 1rem from the top and 1rem from
 * the trailing edge, which is the right in LTR and the left in RTL.
 *
 * The card must be a positioned ancestor, e.g. `relative`.
 */
export function closeButtonClasses(): string {
  return "absolute top-4 inset-e-4";
}
