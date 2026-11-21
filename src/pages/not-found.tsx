export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-card-border bg-card/70 p-6 text-center">
        <div className="font-mono text-4xl font-bold tracking-tight text-primary">
          404
        </div>
        <h1 className="mt-2 text-base font-semibold text-foreground">
          Page not found
        </h1>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
          That route doesn&rsquo;t exist. Head back to the dyno to keep tuning.
        </p>
        <a
          href="./"
          className="mt-4 inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Back to the dyno
        </a>
      </div>
    </div>
  );
}
