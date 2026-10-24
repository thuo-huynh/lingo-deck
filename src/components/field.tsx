export const inputClass =
  "h-[52px] w-full rounded-field border border-border-strong bg-card px-4 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 aria-invalid:border-destructive";

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] leading-[18px] font-medium text-body">{label}</span>
      {children}
      {hint && <span className="text-[13px] leading-[18px] text-muted-foreground">{hint}</span>}
    </label>
  );
}
