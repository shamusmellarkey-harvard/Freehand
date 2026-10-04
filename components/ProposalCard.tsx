import { formatCents } from "@/lib/materials";
import type { ContactInfo, Proposal } from "@/lib/types";
import { ImageGallery } from "./ImageGallery";
import { ProposalBadge } from "./StatusBadge";
import { formatDate, formatInches } from "./ui";

/**
 * Full proposal view used on the review page and the artist dashboard.
 * `contact` is only ever passed when the viewer is allowed to see it.
 */
export function ProposalCard({
  proposal,
  contact,
  footer,
  heading,
}: {
  proposal: Proposal;
  contact?: ContactInfo | null;
  footer?: React.ReactNode;
  heading?: React.ReactNode;
}) {
  return (
    <article className="card overflow-hidden">
      <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <ImageGallery fileIds={proposal.imageFileIds} altPrefix={`${proposal.title} by ${proposal.artistName}`} />
        <div className="flex min-w-0 flex-col gap-3">
          {heading}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-xl font-semibold">{proposal.title}</h3>
              <p className="text-sm text-muted">
                by {proposal.artistName} · {formatInches(proposal.widthIn, proposal.heightIn)} · {formatDate(proposal.createdAt)}
              </p>
            </div>
            <ProposalBadge status={proposal.status} />
          </div>
          <p className="prose-wrap text-sm leading-relaxed">{proposal.description}</p>

          <div className="rounded-xl border border-line bg-cream/60 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Materials estimate</p>
            <table className="w-full text-sm">
              <tbody>
                {proposal.materials.map((m, i) => (
                  <tr key={i} className="border-t border-line/70 first:border-t-0">
                    <td className="py-1 pr-2">{m.name}</td>
                    <td className="py-1 pr-2 text-right tabular-nums text-muted">
                      {m.quantity} × {formatCents(m.unitCostCents)}
                    </td>
                    <td className="py-1 text-right tabular-nums">{formatCents(Math.round(m.quantity * m.unitCostCents))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-ink/20">
                  <td className="pt-2 font-medium" colSpan={2}>
                    Total materials
                  </td>
                  <td className="pt-2 text-right font-display text-lg font-semibold tabular-nums">
                    {formatCents(proposal.materialsTotalCents)}
                  </td>
                </tr>
              </tfoot>
            </table>
            <p className="mt-1 text-xs text-muted">Reimbursed by the business, off-platform. Freehand never handles money.</p>
          </div>

          {proposal.status === "DECLINED" && proposal.declineReason && (
            <div className="rounded-xl bg-rose-soft/70 p-3 text-sm text-rose-ink">
              <span className="font-medium">Reason:</span> {proposal.declineReason}
            </div>
          )}

          {contact && (
            <div className="rounded-xl border border-sage/30 bg-sage-soft p-3 text-sm">
              <p className="mb-1 font-semibold text-sage">Accepted! Here is how to get in touch:</p>
              {contact.businessName && (
                <p>
                  <span className="text-muted">Business:</span> {contact.businessName}
                </p>
              )}
              {contact.businessAddress && (
                <p>
                  <span className="text-muted">Address:</span> {contact.businessAddress}
                </p>
              )}
              {contact.businessEmail && (
                <p>
                  <span className="text-muted">Email:</span>{" "}
                  <a className="underline" href={`mailto:${contact.businessEmail}`}>
                    {contact.businessEmail}
                  </a>
                </p>
              )}
              {contact.artistName && (
                <p>
                  <span className="text-muted">Artist:</span> {contact.artistName}
                </p>
              )}
              {contact.artistEmail && (
                <p>
                  <span className="text-muted">Email:</span>{" "}
                  <a className="underline" href={`mailto:${contact.artistEmail}`}>
                    {contact.artistEmail}
                  </a>
                </p>
              )}
              <p className="mt-1 text-xs text-muted">Arrange materials reimbursement and delivery directly with each other.</p>
            </div>
          )}

          {footer}
        </div>
      </div>
    </article>
  );
}
