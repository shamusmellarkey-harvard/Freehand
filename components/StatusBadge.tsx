import type { ListingStatus, ProposalStatus, Role } from "@/lib/types";

const proposalStyles: Record<ProposalStatus, { label: string; className: string }> = {
  SUBMITTED: { label: "Submitted", className: "bg-sun-soft text-ink" },
  ACCEPTED: { label: "Accepted", className: "bg-sage-soft text-sage" },
  DECLINED: { label: "Declined", className: "bg-rose-soft text-rose-ink" },
};

const listingStyles: Record<ListingStatus, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-sage-soft text-sage" },
  FILLED: { label: "Filled", className: "bg-terracotta-soft text-terracotta-dark" },
  CLOSED: { label: "Closed", className: "bg-line text-muted" },
};

export function ProposalBadge({ status }: { status: ProposalStatus }) {
  const s = proposalStyles[status];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}>{s.label}</span>;
}

export function ListingBadge({ status }: { status: ListingStatus }) {
  const s = listingStyles[status];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}>{s.label}</span>;
}

export function RoleChip({ role }: { role: Role }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        role === "BUSINESS" ? "bg-terracotta-soft text-terracotta-dark" : "bg-sage-soft text-sage"
      }`}
    >
      {role === "BUSINESS" ? "Business" : "Artist"}
    </span>
  );
}
