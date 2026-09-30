/** Estados vazios elegantes e reutilizáveis. */
import type { ReactNode } from "react";

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ emoji = "🧁", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-chocolate/20 bg-white/60 px-6 py-14 text-center">
      <span aria-hidden="true" className="text-4xl">
        {emoji}
      </span>
      <h3 className="heading-display text-xl">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-chocolate-light">{description}</p> : null}
      {action}
    </div>
  );
}
