"use client";

// ---------------------------------------------------------------------------
// Ventas (/Sales) — the reference's history table: TICKET (violet mono),
// FECHA (dd/yy hh:mm), CAJERO, MÉTODO (chip + banknote icon), TOTAL (green),
// ESTADO (Completada green badge), row actions (view detail / mail). The
// detail dialog reproduces the reference's ticket: header grid, line items,
// Subtotal/IVA/Total block. Superset: a CSV export button.
// ---------------------------------------------------------------------------

import * as React from "react";
import { Banknote, Eye, FileDown, Mail, Receipt, Search } from "lucide-react";

import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Badge, EmptyState, GradientButton, IconButton, PageHeader } from "@/components/views/shared";
import { useCollection, type Cashier, type CashRegister, type Sale } from "@/lib/data";
import { formatMoney, formatTicketDate, formatDateTimeShort } from "@/lib/money";

const METHOD_LABEL: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
};

/** Minimal CSV escape: quote-wrap + double the inner quotes. */
function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function SalesView() {
  const toast = useToast();
  const sales = useCollection<Sale[]>("/api/sales");
  const cashiers = useCollection<Cashier[]>("/api/cashiers");
  const registers = useCollection<CashRegister[]>("/api/registers");

  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<Sale | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sales ?? [];
    return (sales ?? []).filter(
      (s) =>
        s.ticketNumber.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        (cashiers ?? []).some((c) => c.id === s.cashierId && c.name.toLowerCase().includes(q)),
    );
  }, [sales, query, cashiers]);

  const cashierName = React.useCallback(
    (id: string | null) => (cashiers ?? []).find((c) => c.id === id)?.name ?? "—",
    [cashiers],
  );
  const registerName = React.useCallback(
    (id: string | null) => (registers ?? []).find((r) => r.id === id)?.name ?? "—",
    [registers],
  );

  const exportCsv = () => {
    const header = ["TICKET", "FECHA", "CAJERO", "METODO", "CLIENTE", "SUBTOTAL", "IVA", "TOTAL", "ESTADO"];
    const rows = (sales ?? []).map((s) =>
      [
        s.ticketNumber,
        formatDateTimeShort(s.createdAt),
        cashierName(s.cashierId),
        METHOD_LABEL[s.paymentMethod] ?? s.paymentMethod,
        s.customerName || "Público general",
        (s.subtotalCents / 100).toFixed(2),
        (s.taxCents / 100).toFixed(2),
        (s.totalCents / 100).toFixed(2),
        s.status === "completed" ? "Completada" : "Reembolsada",
      ]
        .map(csvCell)
        .join(","),
    );
    const blob = new Blob(["\uFEFF" + [header.join(","), ...rows].join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ventas.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.toast.success("ventas.csv descargado");
  };

  return (
    <div className="p-4 pt-6 lg:p-8" data-testid="sales-view">
      <PageHeader
        title="Historial de Ventas"
        subtitle={`${(sales ?? []).length} ventas registradas`}
        action={
          <GradientButton onClick={exportCsv} data-testid="sales-export">
            <FileDown className="h-4.5 w-4.5" />
            Exportar CSV
          </GradientButton>
        }
      />

      <div className="relative mb-5 max-w-md">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por ticket, cliente o cajero..."
          aria-label="Buscar ventas"
          data-testid="sales-search"
          className="h-11 w-full rounded-xl border border-[#1e2235] bg-[#141828] pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-sf-primary/60 focus-visible:ring-2 focus-visible:ring-sf-primary/40"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={sales?.length ? "Sin resultados" : "No hay ventas todavía"}
          description={
            sales?.length
              ? "Ajusta la búsqueda."
              : "Completa tu primera venta en la Terminal y aparecerá aquí."
          }
        />
      ) : (
        <div className="pos-card overflow-hidden" data-testid="sales-table">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#1e2235] text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th scope="col" className="px-5 py-4">Ticket</th>
                  <th scope="col" className="px-4 py-4">Fecha</th>
                  <th scope="col" className="px-4 py-4">Cajero</th>
                  <th scope="col" className="px-4 py-4">Método</th>
                  <th scope="col" className="px-4 py-4">Total</th>
                  <th scope="col" className="px-4 py-4">Estado</th>
                  <th scope="col" className="px-4 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sale) => (
                  <tr
                    key={sale.id}
                    data-testid={`sales-row-${sale.ticketNumber}`}
                    className="border-b border-[#161a2b] last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-violet-300">{sale.ticketNumber}</td>
                    <td className="px-4 py-3.5 text-slate-400">{formatDateTimeShort(sale.createdAt)}</td>
                    <td className="px-4 py-3.5 text-slate-300">{cashierName(sale.cashierId)}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#1e2235] px-2.5 py-1 text-xs font-semibold text-slate-200">
                        <Banknote aria-hidden className="h-3.5 w-3.5" />
                        {METHOD_LABEL[sale.paymentMethod] ?? sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-emerald-400">{formatMoney(sale.totalCents)}</td>
                    <td className="px-4 py-3.5">
                      {sale.status === "completed" ? (
                        <Badge tone="success">Completada</Badge>
                      ) : (
                        <Badge tone="neutral">Reembolsada</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1">
                        <IconButton
                          label={`Ver ticket ${sale.ticketNumber}`}
                          icon={Eye}
                          onClick={() => setSelected(sale)}
                        />
                        <IconButton
                          label={`Enviar ${sale.ticketNumber} por correo`}
                          icon={Mail}
                          onClick={() =>
                            toast.toast.info(
                              "El envío por correo se configura en Ajustes (proveedor de pagos/correo).",
                            )
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ticket detail */}
      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md border-[#1e2235] bg-[#0e111f]" data-testid="sale-detail-dialog">
          <div className="mb-4 flex items-center gap-2.5">
            <Receipt aria-hidden className="h-5 w-5 text-violet-400" />
            <h2 className="text-lg font-bold text-white" data-testid="sale-detail-title">
              Ticket {selected?.ticketNumber}
            </h2>
          </div>
          {selected && (
            <>
              <dl className="mb-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-slate-400">Fecha:</dt>
                  <dd className="font-semibold text-slate-200">{formatTicketDate(selected.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Cajero:</dt>
                  <dd className="font-semibold text-slate-200">{cashierName(selected.cashierId)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Método:</dt>
                  <dd className="font-semibold text-slate-200">
                    {METHOD_LABEL[selected.paymentMethod] ?? selected.paymentMethod}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Caja:</dt>
                  <dd className="font-semibold text-slate-200">{registerName(selected.registerId)}</dd>
                </div>
              </dl>
              <ul className="divide-y divide-[#1e2235] border-y border-[#1e2235]">
                {(selected.items ?? []).map((item) => (
                  <li key={item.id} className="flex justify-between py-2.5 text-sm">
                    <span className="text-slate-300">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-semibold text-slate-200">
                      {formatMoney(item.lineTotalCents)}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-400">
                  <dt>Subtotal</dt>
                  <dd>{formatMoney(selected.subtotalCents)}</dd>
                </div>
                <div className="flex justify-between text-slate-400">
                  <dt>IVA</dt>
                  <dd>{formatMoney(selected.taxCents)}</dd>
                </div>
                <div className="flex justify-between pt-1 text-lg font-bold">
                  <dt className="text-slate-300">Total</dt>
                  <dd className="text-violet-300">{formatMoney(selected.totalCents)}</dd>
                </div>
              </dl>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
