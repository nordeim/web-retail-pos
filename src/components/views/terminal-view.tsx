"use client";

// ---------------------------------------------------------------------------
// Terminal (/POS) — the checkout surface. No open shift → the reference's
// empty state ("Ve a Cajas…"). Open shift → the product grid (search filters
// name + barcode) and the right-hand TICKET panel; COBRAR opens the payment
// dialog (método + cliente + efectivo change) and posts the guarded
// checkout transaction. All math routes through src/lib/cart.ts.
// ---------------------------------------------------------------------------

import * as React from "react";
import { Banknote, CreditCard, Landmark, Minus, Monitor, Plus, ShoppingBag, ShoppingCart, Trash2, X } from "lucide-react";

import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, SuccessButton } from "@/components/views/shared";
import { addToCart, cartTotals, changeCents, removeLine, setLineQuantity, type CartLine } from "@/lib/cart";
import { useCollection, posApi, type Product, type Shift } from "@/lib/data";
import { formatMoney, parseMoneyToCents } from "@/lib/money";
import { cn } from "@/lib/utils";

const PAYMENT_METHODS = [
  { id: "cash", label: "Efectivo", icon: Banknote },
  { id: "card", label: "Tarjeta", icon: CreditCard },
  { id: "transfer", label: "Transferencia", icon: Landmark },
] as const;

type CompletedSale = {
  ticketNumber: string;
  totalCents: number;
  paymentMethod: string;
};

export function TerminalView() {
  const toast = useToast();
  const shiftLoad = useCollection<Shift[]>("/api/shifts");
  const products = useCollection<Product[]>("/api/products");

  const [query, setQuery] = React.useState("");
  const [cart, setCart] = React.useState<CartLine[]>([]);
  const [payOpen, setPayOpen] = React.useState(false);
  const [method, setMethod] = React.useState<string>("cash");
  const [customer, setCustomer] = React.useState("");
  const [received, setReceived] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [completed, setCompleted] = React.useState<CompletedSale | null>(null);

  const activeShift = React.useMemo(
    () => shiftLoad?.find((s) => s.status === "open"),
    [shiftLoad],
  );

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (products ?? []).filter((p) => p.active);
    if (!q) return list;
    return list.filter(
      (p) => p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q),
    );
  }, [products, query]);

  const totals = cartTotals(cart);

  const add = React.useCallback((product: Product) => {
    setCart((current) => addToCart(current, product, product.stock));
  }, []);

  const submitSale = async () => {
    if (!cart.length || submitting) return;
    setSubmitting(true);
    try {
      const sale = await posApi.sales.checkout({
        items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        paymentMethod: method,
        customerName: customer.trim(),
      });
      setCompleted({
        ticketNumber: sale.ticketNumber,
        totalCents: sale.totalCents,
        paymentMethod: method,
      });
      setCart([]);
      setPayOpen(false);
      setCustomer("");
      setReceived("");
      setMethod("cash");
      toast.toast.success(`Venta ${sale.ticketNumber} registrada`);
    } catch (err: unknown) {
      toast.toast.error(err instanceof Error ? err.message : "No se pudo registrar la venta.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeShift) {
    return (
      <div className="p-4 pt-6 lg:p-8" data-testid="terminal-no-shift">
        <EmptyState
          icon={Monitor}
          title="No hay turno activo"
          description={
            <>
              Ve a <a href="/Registers" className="font-bold text-violet-300 hover:underline">Cajas</a> para abrir un turno antes de realizar ventas.
            </>
          }
          className="mx-auto mt-10 max-w-xl"
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col lg:h-dvh lg:flex-row" data-testid="terminal-active">
      {/* ---- left: search + product grid ---- */}
      <div className="flex min-w-0 flex-1 flex-col p-4 pt-6 lg:p-8">
        <div className="relative mb-4">
          <ShoppingCart
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-500"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o código de barras…"
            aria-label="Buscar productos"
            data-testid="terminal-search"
            className="h-11 w-full rounded-xl border border-[#1e2235] bg-[#141828] pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-sf-primary/60 focus-visible:ring-2 focus-visible:ring-sf-primary/40"
          />
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-slate-400">
              {products?.length ? "Sin resultados para tu búsqueda." : "Agrega productos en Inventario para empezar a vender."}
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-2 gap-3 overflow-y-auto pb-6 sm:grid-cols-3 xl:grid-cols-4"
            data-testid="terminal-grid"
          >
            {visible.map((product) => {
              const out = product.stock <= 0;
              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={out}
                  onClick={() => add(product)}
                  data-testid={`terminal-product-${product.barcode}`}
                  className={cn(
                    "pos-card group flex flex-col items-start gap-2 p-4 text-left transition-colors hover:border-sf-primary/50",
                    out && "opacity-40",
                  )}
                >
                  <span
                    aria-hidden
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500"
                  >
                    <ShoppingBag className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <span className="line-clamp-2 min-h-10 text-sm font-semibold text-slate-200">
                    {product.name}
                  </span>
                  <span className="mt-auto flex w-full items-center justify-between">
                    <span className="text-base font-bold text-emerald-400">
                      {formatMoney(product.priceCents)}
                    </span>
                    <span className={cn("text-xs", out ? "text-red-400" : "text-slate-500")}>
                      {product.stock} en stock
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- right: the TICKET panel ---- */}
      <aside
        data-testid="terminal-ticket"
        className="flex w-full shrink-0 flex-col border-[#1e2235] bg-[#0d0f1a] lg:h-dvh lg:w-[360px] lg:border-l"
      >
        <h2 className="border-b border-[#1e2235] px-5 py-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
          Ticket
        </h2>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <ShoppingCart aria-hidden className="h-14 w-14 text-slate-600" strokeWidth={1.5} />
            <p className="text-sm text-slate-500">Escanea o selecciona productos</p>
          </div>
        ) : (
          <ul className="flex-1 divide-y divide-[#1e2235] overflow-y-auto px-5" data-testid="terminal-cart">
            {cart.map((line) => (
              <li key={line.productId} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-200">{line.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatMoney(line.unitPriceCents)} c/u
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Quitar una unidad de ${line.name}`}
                    onClick={() =>
                      setCart((c) => setLineQuantity(c, line.productId, line.quantity - 1))
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1e2235] text-slate-300 hover:bg-[#2a2f4a]"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-7 text-center text-sm font-bold text-slate-200">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label={`Agregar una unidad de ${line.name}`}
                    onClick={() => setCart((c) => setLineQuantity(c, line.productId, line.quantity + 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1e2235] text-slate-300 hover:bg-[#2a2f4a]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="w-16 text-right text-sm font-bold text-slate-200">
                  {formatMoney(line.unitPriceCents * line.quantity)}
                </span>
                <button
                  type="button"
                  aria-label={`Eliminar ${line.name} del ticket`}
                  onClick={() => setCart((c) => removeLine(c, line.productId))}
                  className="text-slate-500 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-1.5 border-t border-[#1e2235] px-5 py-4 text-sm">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal</span>
            <span data-testid="terminal-subtotal">{formatMoney(totals.subtotalCents)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>IVA</span>
            <span data-testid="terminal-tax">{formatMoney(totals.taxCents)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-white">
            <span>Total</span>
            <span data-testid="terminal-total">{formatMoney(totals.totalCents)}</span>
          </div>
          <SuccessButton
            onClick={() => setPayOpen(true)}
            disabled={cart.length === 0}
            data-testid="terminal-charge"
            className="mt-2 w-full rounded-2xl px-6 py-4 text-lg font-black tracking-wide"
          >
            COBRAR {formatMoney(totals.totalCents)}
          </SuccessButton>
        </div>
      </aside>

      {/* ---- payment dialog ---- */}
      <Dialog open={payOpen} onOpenChange={(open) => !open && setPayOpen(false)}>
        <DialogContent className="max-w-md border-[#1e2235] bg-[#0e111f]" data-testid="payment-dialog">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Cobrar venta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Método de pago</p>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={method === m.id}
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-semibold outline-none transition-colors",
                      method === m.id
                        ? "border-sf-primary bg-violet-600/20 text-violet-200"
                        : "border-[#1e2235] bg-[#141828] text-slate-300 hover:border-[#2a2f4a]",
                    )}
                  >
                    <m.icon className="h-5 w-5" />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="pay-customer" className="mb-1.5 block text-sm text-slate-300">
                Cliente (opcional)
              </label>
              <input
                id="pay-customer"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Público general"
                className="h-10 w-full rounded-lg border border-[#1e2235] bg-[#141828] px-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-sf-primary/60"
              />
            </div>
            {method === "cash" && (
              <div>
                <label htmlFor="pay-received" className="mb-1.5 block text-sm text-slate-300">
                  Efectivo recibido
                </label>
                <input
                  id="pay-received"
                  inputMode="decimal"
                  value={received}
                  onChange={(e) => setReceived(e.target.value)}
                  placeholder="0.00"
                  className="h-10 w-full rounded-lg border border-[#1e2235] bg-[#141828] px-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-sf-primary/60"
                />
                {(() => {
                  const cents = parseMoneyToCents(received);
                  if (cents === null) return null;
                  const change = changeCents(totals.totalCents, cents);
                  return (
                    <p className={cn("mt-1.5 text-sm font-semibold", change === null ? "text-red-400" : "text-emerald-400")} data-testid="payment-change">
                      {change === null
                        ? "Falta efectivo para cubrir el total."
                        : `Cambio: ${formatMoney(change)}`}
                    </p>
                  );
                })()}
              </div>
            )}
            <div className="flex items-center justify-between border-t border-[#1e2235] pt-4">
              <span className="text-sm text-slate-400">Total</span>
              <span className="text-2xl font-bold text-emerald-400">{formatMoney(totals.totalCents)}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPayOpen(false)}
                className="h-11 flex-1 rounded-lg border border-[#1e2235] bg-[#141828] text-sm font-semibold text-slate-300 hover:bg-[#1a1f33]"
              >
                Cancelar
              </button>
              <SuccessButton
                onClick={submitSale}
                disabled={submitting}
                data-testid="payment-confirm"
                className="h-11 flex-1"
              >
                {submitting ? "Procesando…" : "Confirmar venta"}
              </SuccessButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---- sale-completed dialog ---- */}
      <Dialog open={completed !== null} onOpenChange={(open) => !open && setCompleted(null)}>
        <DialogContent className="max-w-sm border-[#1e2235] bg-[#0e111f] text-center" data-testid="sale-completed-dialog">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setCompleted(null)}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-violet-500/50 text-violet-300 hover:bg-violet-600/20"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex flex-col items-center gap-3 py-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <ShoppingBag className="h-7 w-7" />
            </span>
            <h2 className="text-lg font-bold text-white">¡Venta registrada!</h2>
            {completed && (
              <>
                <p className="font-mono text-sm text-violet-300" data-testid="completed-ticket">
                  {completed.ticketNumber}
                </p>
                <p className="text-2xl font-bold text-emerald-400">{formatMoney(completed.totalCents)}</p>
                <p className="text-sm text-slate-400">
                  {PAYMENT_METHODS.find((m) => m.id === completed.paymentMethod)?.label ?? "Efectivo"}
                </p>
              </>
            )}
            <SuccessButton onClick={() => setCompleted(null)} className="mt-2 w-full">
              Nueva venta
            </SuccessButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
