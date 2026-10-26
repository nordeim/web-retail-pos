"use client";

// ---------------------------------------------------------------------------
// The Terminal view (the app's root): LEFT = the product grid (search +
// category chips + product cards), RIGHT = the TICKET panel.
//
// Reference-verified anatomy:
//   · No active shift → the left pane renders the "No hay turno activo"
//     empty card ("Ve a Cajas para abrir un turno antes de realizar
//     ventas.") and the ticket panel shows "Escanea o selecciona
//     productos" with a disabled COBRAR button.
//   · With a shift open (the superset: the reference cannot open one —
//     it has no cashier to assign) the grid sells: cards add to the
//     ticket, qty +/- adjust, COBRAR opens the payment dialog, the sale
//     persists and stock decrements.
// ---------------------------------------------------------------------------

import * as React from "react";
import {
  Monitor,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  Banknote,
  CreditCard,
  Search,
} from "lucide-react";

import { MethodPill } from "@/components/pos/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiSend, ApiError } from "@/lib/api";
import { changeDue, formatMoney, isCashSufficient, lineTotalCents, parseMoneyToCents } from "@/lib/money";
import { computeTicketTotals, useAppStore, usePosStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function TerminalView() {
  const products = usePosStore((s) => s.products);
  const categories = usePosStore((s) => s.categories);
  const activeShift = usePosStore((s) => s.activeShift);
  const ticket = usePosStore((s) => s.ticket);
  const ticketAdd = usePosStore((s) => s.ticketAdd);
  const ticketSetQty = usePosStore((s) => s.ticketSetQty);
  const ticketRemove = usePosStore((s) => s.ticketRemove);
  const ticketClear = usePosStore((s) => s.ticketClear);
  const loadCollections = usePosStore((s) => s.loadCollections);
  const setActiveShiftFrom = usePosStore((s) => s.setActiveShiftFrom);
  const navigate = useAppStore((s) => s.navigate);

  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<string>("Todos");
  const [payOpen, setPayOpen] = React.useState(false);

  const totals = computeTicketTotals(ticket);

  const visible = products.filter((p) => {
    if (!p.active) return false;
    if (category !== "Todos" && p.categoryName !== category) return false;
    const q = query.trim().toLowerCase();
    if (q.length === 0) return true;
    return p.name.toLowerCase().includes(q) || p.barcode.includes(q);
  });

  const sellable = Boolean(activeShift);

  const onSaleCreated = React.useCallback(() => {
    void loadCollections(["products", "sales", "shifts"]).then(() => {
      const shifts = usePosStore.getState().shifts;
      setActiveShiftFrom(shifts);
    });
  }, [loadCollections, setActiveShiftFrom]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* LEFT: scan/grid area */}
      <div>
        {!sellable ? (
          <div className="vx-card flex min-h-[320px] flex-col items-center justify-center gap-3 p-10 text-center">
            <Monitor className="h-12 w-12 text-violet-400" strokeWidth={1.6} />
            <h2 className="text-xl font-bold text-slate-100">No hay turno activo</h2>
            <p className="max-w-sm text-sm text-slate-400">
              Ve a{" "}
              <button
                type="button"
                data-testid="go-to-registers"
                onClick={() => navigate("cajas")}
                className="font-bold text-slate-100 underline decoration-slate-500 underline-offset-2"
              >
                Cajas
              </button>{" "}
              para abrir un turno antes de realizar ventas.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar producto o escanear código..."
                  aria-label="Buscar producto"
                  data-testid="terminal-search"
                  className="bg-[#12141f] pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2" data-testid="terminal-categories">
                {["Todos", ...categories.map((c) => c.name)].map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setCategory(name)}
                    className={cn(
                      "vx-focus rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                      category === name
                        ? "vx-gradient text-white"
                        : "border border-[#262a36] bg-[#12141f] text-slate-300 hover:bg-white/5",
                    )}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="vx-card p-10 text-center text-sm text-slate-400">
                Sin productos que coincidan.
              </div>
            ) : (
              <ul
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4"
                data-testid="terminal-grid"
              >
                {visible.map((product) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      disabled={product.stock <= 0}
                      onClick={() => ticketAdd(product)}
                      data-testid={`terminal-product-${product.id}`}
                      className={cn(
                        "vx-card vx-focus flex h-full w-full flex-col items-start gap-1 p-3 text-left transition-colors",
                        product.stock > 0
                          ? "hover:border-violet-500/60 hover:bg-white/[0.03]"
                          : "cursor-not-allowed opacity-50",
                      )}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#12141f] text-violet-300">
                        <ShoppingCart className="h-4.5 w-4.5" strokeWidth={2} />
                      </span>
                      <span className="line-clamp-2 text-sm font-semibold text-slate-100">
                        {product.name}
                      </span>
                      <span className="text-sm font-bold text-violet-300">
                        {formatMoney(product.price)}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {product.stock} en stock
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* RIGHT: the TICKET panel */}
      <aside
        className="vx-card flex h-fit flex-col p-4 lg:sticky lg:top-8"
        data-testid="ticket-panel"
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Agregado</p>
        <h2 className="mb-3 text-lg font-bold text-slate-100">TICKET</h2>

        {ticket.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <ShoppingCart className="h-12 w-12 text-slate-600" strokeWidth={1.5} />
            <p className="text-sm text-slate-400">Escanea o selecciona productos</p>
          </div>
        ) : (
          <ul className="vx-scroll mb-4 max-h-[46vh] space-y-3 overflow-y-auto pr-1" data-testid="ticket-lines">
            {ticket.map((line) => (
              <li key={line.product.id} className="rounded-xl bg-[#12141f] p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 text-sm font-semibold text-slate-100">
                    {line.product.name}
                  </p>
                  <button
                    type="button"
                    aria-label={`Quitar ${line.product.name}`}
                    onClick={() => ticketRemove(line.product.id)}
                    className="vx-focus rounded-md p-1 text-slate-500 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Quitar uno"
                      onClick={() => ticketSetQty(line.product.id, line.qty - 1)}
                      className="vx-focus flex h-7 w-7 items-center justify-center rounded-md bg-[#1e2235] text-slate-200 hover:bg-white/10"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold" data-testid="ticket-qty">
                      {line.qty}
                    </span>
                    <button
                      type="button"
                      aria-label="Agregar uno"
                      disabled={line.qty >= line.product.stock}
                      onClick={() => ticketSetQty(line.product.id, line.qty + 1)}
                      className="vx-focus flex h-7 w-7 items-center justify-center rounded-md bg-[#1e2235] text-slate-200 hover:bg-white/10 disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-slate-100">
                    {/* The tested seam — the same single-final-round formula
                        the server persists (V2 M3: the inline per-unit-round
                        formula diverged by 1¢ on some qty × price pairs). */}
                    {formatMoney(
                      lineTotalCents(line.product.price, line.qty, line.product.ivaRate),
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mb-3 space-y-1 border-t border-[#1e2235] pt-3 text-sm">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal</span>
            <span>{formatMoney(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>IVA</span>
            <span>{formatMoney(totals.tax)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-slate-100">
            <span>Total</span>
            <span data-testid="ticket-total">{formatMoney(totals.total)}</span>
          </div>
        </div>

        {ticket.length > 0 ? (
          <Button
            data-testid="cobrar-button"
            className="h-12 w-full bg-emerald-500 text-base font-bold text-white hover:bg-emerald-500/90"
            onClick={() => setPayOpen(true)}
          >
            <Banknote className="h-5 w-5" />
            COBRAR {formatMoney(totals.total)}
          </Button>
        ) : (
          <Button
            disabled
            data-testid="cobrar-button"
            className="h-12 w-full bg-emerald-800/60 text-base font-bold text-emerald-200/60"
          >
            <Banknote className="h-5 w-5" />
            COBRAR {formatMoney(0)}
          </Button>
        )}
      </aside>

      {payOpen ? (
        <PaymentDialog
          onOpenChange={setPayOpen}
          totalCents={totals.total}
          onCompleted={() => {
            ticketClear();
            setPayOpen(false);
            onSaleCreated();
          }}
        />
      ) : null}
    </div>
  );
}

// ---- the payment dialog --------------------------------------------------------

function PaymentDialog({
  onOpenChange,
  totalCents,
  onCompleted,
}: {
  onOpenChange: (open: boolean) => void;
  totalCents: number;
  onCompleted: () => void;
}) {
  const activeShift = usePosStore((s) => s.activeShift);
  const registers = usePosStore((s) => s.registers);
  const [method, setMethod] = React.useState<"efectivo" | "tarjeta">("efectivo");
  const [cashInput, setCashInput] = React.useState("");
  const [clientName, setClientName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  const cashCents = parseMoneyToCents(cashInput) ?? 0;
  const change = changeDue(totalCents, cashCents);
  const cashShort = method === "efectivo" && cashInput.trim() !== "" && !isCashSufficient(totalCents, cashCents);

  const registerId =
    activeShift?.registerId ??
    registers.find((r) => r.status === "open")?.id ??
    registers[0]?.id ??
    "";

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const products = usePosStore.getState().products;
      const lines = usePosStore.getState().ticket.map((line) => ({
        productId: line.product.id,
        qty: line.qty,
      }));
      // Re-validate stock against the freshest product rows before sending.
      for (const line of lines) {
        const product = products.find((p) => p.id === line.productId);
        if (!product || product.stock < line.qty) {
          throw new ApiError(422, "Stock insuficiente para completar la venta.");
        }
      }
      // The API recomputes prices; the ticket lines drive the payload.
      await apiSend("POST", "/api/sales", {
        registerId,
        items: lines,
        method,
        clientName,
        ...(method === "efectivo" && cashCents > 0 ? { cashReceived: cashCents / 100 } : {}),
      });
      onCompleted();
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo registrar la venta. Intenta de nuevo.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-[#262a36] bg-[#12141f] text-slate-100">
        <DialogHeader>
          <DialogTitle>Cobrar venta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl bg-[#0d0f1a] p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-slate-500">Total a cobrar</p>
            <p className="text-3xl font-bold" data-testid="pay-total">
              {formatMoney(totalCents)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Método de pago">
            <button
              type="button"
              role="radio"
              aria-checked={method === "efectivo"}
              data-testid="method-efectivo"
              onClick={() => setMethod("efectivo")}
              className={cn(
                "vx-focus flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold",
                method === "efectivo"
                  ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                  : "border-[#262a36] text-slate-300 hover:bg-white/5",
              )}
            >
              <Banknote className="h-4 w-4" /> Efectivo
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={method === "tarjeta"}
              data-testid="method-tarjeta"
              onClick={() => setMethod("tarjeta")}
              className={cn(
                "vx-focus flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold",
                method === "tarjeta"
                  ? "border-violet-500 bg-violet-500/15 text-violet-300"
                  : "border-[#262a36] text-slate-300 hover:bg-white/5",
              )}
            >
              <CreditCard className="h-4 w-4" /> Tarjeta
            </button>
          </div>

          {method === "efectivo" ? (
            <div>
              <label htmlFor="pay-cash" className="mb-1.5 block text-sm text-slate-300">
                Efectivo recibido
              </label>
              <Input
                id="pay-cash"
                inputMode="decimal"
                value={cashInput}
                onChange={(event) => setCashInput(event.target.value)}
                placeholder="0.00"
                data-testid="pay-cash"
                className="bg-[#0d0f1a]"
              />
              {cashShort ? (
                <p className="mt-1 text-xs text-red-400">El efectivo no cubre el total.</p>
              ) : (
                cashInput.trim() !== "" && (
                  <p className="mt-1 text-sm text-emerald-400" data-testid="pay-change">
                    Cambio: {formatMoney(change)}
                  </p>
                )
              )}
            </div>
          ) : null}

          <div>
            <label htmlFor="pay-client" className="mb-1.5 block text-sm text-slate-300">
              Cliente (opcional)
            </label>
            <Input
              id="pay-client"
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              placeholder="Nombre del cliente"
              className="bg-[#0d0f1a]"
            />
          </div>

          {error ? (
            <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <MethodPill method={method} />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-[#262a36] bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                data-testid="confirm-payment"
                disabled={
                  submitting ||
                  (method === "efectivo" && (cashShort || cashInput.trim() === ""))
                }
                onClick={() => void submit()}
                className="vx-gradient border-0 text-white"
              >
                {submitting ? "Procesando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
