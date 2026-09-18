import { Card } from '@/components/ui/card';

/** Holds a nav slot until its screen lands, so the link never 404s. */
export function NotBuilt({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <h1 className="text-3xl font-bold">{title}</h1>
      <Card>
        <p className="text-sm text-on-surface-variant">
          This screen is part of {phase} and has not been built yet.
        </p>
      </Card>
    </div>
  );
}
