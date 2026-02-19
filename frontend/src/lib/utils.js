/**
 * Simple className merger — replaces tailwind-merge + clsx
 * Joins class names and filters out falsy values.
 */
export function cn(...inputs) {
  return inputs
    .flat(Infinity)
    .filter((x) => typeof x === "string" && x.length > 0)
    .join(" ");
}
