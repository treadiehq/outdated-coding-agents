/**
 * Tailwind classes for a close button absolutely positioned 1rem from the top
 * and 1rem from the trailing edge of its card. `inset-e-4` compiles to
 * `inset-inline-end: 1rem`, so it sits on the right in LTR and the left in RTL.
 * The card needs a positioned ancestor (e.g. `relative`).
 */
export function closeButtonClasses(): string {
  return "absolute top-4 inset-e-4";
}
