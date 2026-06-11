export default function SectionHeader({ title, description, action, compact = false }) {
  return (
    <div className={`flex flex-wrap items-end justify-between ${compact ? "gap-2" : "gap-3"}`}>
      <div>
        <h2 className={`${compact ? "text-base sm:text-lg" : "text-lg"} font-bold tracking-tight`}>{title}</h2>
        {description ? (
          <p className={`${compact ? "mt-0.5 text-xs sm:text-sm" : "mt-1 text-sm"} text-[var(--color-muted)]`}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
