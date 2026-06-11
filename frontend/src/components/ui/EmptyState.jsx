import Button from "./Button";

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) {
  return (
    <div className="kr-card grid place-items-center p-8 text-center">
      <div className="max-w-sm">
        {icon ? (
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            {icon}
          </div>
        ) : null}
        <h3 className="text-lg font-bold">{title}</h3>
        {description ? <p className="mt-2 text-sm text-[var(--color-muted)]">{description}</p> : null}
        {actionLabel ? (
          <div className="mt-5">
            <Button onClick={onAction}>{actionLabel}</Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
