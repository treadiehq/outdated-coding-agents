/**
 * Tailwind classes for an absolutely positioned close button placed 1rem from
 * the top and 1rem from the trailing edge of its card. `inset-e-4` compiles to
 * `inset-inline-end: 1rem`, so it flips to the left in right-to-left layouts.
 * The card needs a positioned ancestor (e.g. `relative`).
 */
export function closeButtonClasses(): string {
  return "absolute top-4 inset-e-4";
}
