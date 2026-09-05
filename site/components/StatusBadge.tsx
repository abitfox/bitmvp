import type { ModuleStatus } from "@/lib/products";
import { STATUS_LABEL } from "@/lib/products";

const STATUS_STYLE: Record<ModuleStatus, string> = {
  live: "border-down/40 bg-down/10 text-down",
  building: "border-warning/40 bg-warning/10 text-warning",
  planned: "border-border bg-elevated text-muted",
};

const DOT_STYLE: Record<ModuleStatus, string> = {
  live: "bg-down",
  building: "bg-warning",
  planned: "bg-faint",
};

export function StatusBadge({
  status,
  text,
}: {
  status: ModuleStatus;
  text?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-xs font-medium ${STATUS_STYLE[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_STYLE[status]}`} />
      {text ?? STATUS_LABEL[status]}
    </span>
  );
}
