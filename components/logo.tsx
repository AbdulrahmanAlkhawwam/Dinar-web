/** The three stacked layers of the Dinar mark, in the brand triad. */
export function Logo({ className = 'size-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <path d="M8 26 20 20l12 6-12 6z" fill="var(--color-tertiary)" />
      <path d="M8 20 20 14l12 6-12 6z" fill="var(--color-secondary)" />
      <path d="M8 14 20 8l12 6-12 6z" fill="var(--color-primary)" />
    </svg>
  );
}
