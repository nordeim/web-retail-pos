"use client";

// ---------------------------------------------------------------------------
// Cajeros (/Cashiers) — the cashier CRUD the reference leaves EMPTY (0
// usuarios, no create affordance wired to data). Superset: real cards with
// create/edit/delete + the Turnos Recientes history table (reference
// columns: CAJERO, CAJA, INICIO, FIN, VENTAS, ESTADO).
// ---------------------------------------------------------------------------

import * as React from "react";
import { Pencil, Trash2, UserPlus, Users } from "lucide-react";

import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge, EmptyState, GradientButton, IconButton, PageHeader } from "@/components/views/shared";
import { posApi, useCollection, type Cashier, type CashRegister, type Sale, type Shift } from "@/lib/data";
import { formatDateTimeShort, formatMoney } from "@/lib/money";

type FormState = { name: string; email: string; phone: string; pin: string; active: boolean };
const EMPTY_FORM: FormState = { name: "", email: "", phone: "", pin: "", active: true };

export function CashiersView() {
  const toast = useToast();
  const cashiers = useCollection<Cashier[]>("/api/cashiers");
  const registers = useCollection<CashRegister[]>("/api/registers");
  const shifts = useCollection<Shift[]>("/api/shifts");
  const sales = useCollection<Sale[]>("/api/sales");

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Cashier | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Cashier | null>(null);

  const registerName = React.useCallback(
    (id: string) => (registers ?? []).find((r) => r.id === id)?.name ?? "—",
    [registers],
  );

  const salesTotalFor = React.useCallback(
    (shiftId: string) =>
      (sales ?? [])
        .filter((s) => s.shiftId === shiftId && s.status === "completed")
        .reduce((sum, s) => sum + s.totalCents, 0),
    [sales],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (cashier: Cashier) => {
    setEditing(cashier);
    setForm({
      name: cashier.name,
      email: cashier.email,
      phone: cashier.phone,
      pin: "",
      active: cashier.active,
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    if (saving) return;
    if (form.name.trim() === "") {
      toast.toast.error("El nombre es obligatorio.");
      return;
    }
    if (form.pin !== "" && !/^\d{4,6}$/.test(form.pin.trim())) {
      toast.toast.error("El PIN debe tener entre 4 y 6 dígitos.");
      return;
    }
    setSaving(true);
    const body = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      ...(form.pin.trim() === "" ? {} : { pin: form.pin.trim() }),
      active: form.active,
    };
    try {
      if (editing) {
        await posApi.cashiers.update(editing.id, body);
        toast.toast.success("Cajero actualizado");
      } else {
        await posApi.cashiers.create(body);
        toast.toast.success("Cajero creado");
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      toast.toast.error(err instanceof Error ? err.message : "No se pudo guardar el cajero.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await posApi.cashiers.remove(deleting.id);
      toast.toast.success("Cajero eliminado");
    } catch (err: unknown) {
      toast.toast.error(err instanceof Error ? err.message : "No se pudo eliminar.");
    } finally {
      setDeleting(null);
    }
  };

  const recentShifts = (shifts ?? []).slice(0, 10);

  return (
    <div className="p-4 pt-6 lg:p-8" data-testid="cashiers-view">
      <PageHeader
        title="Cajeros"
        subtitle={`${(cashiers ?? []).length} usuarios registrados`}
        action={
          <GradientButton onClick={openCreate} data-testid="new-cashier">
            <UserPlus className="h-4.5 w-4.5" />
            Nuevo Cajero
          </GradientButton>
        }
      />

      {(cashiers ?? []).length === 0 ? (
        <EmptyState
          icon={Users}
          title="No hay usuarios registrados"
          description="Crea cajeros para abrir turnos y vender en la Terminal."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" data-testid="cashiers-grid">
          {(cashiers ?? []).map((cashier) => {
            const activeShift = (shifts ?? []).find((s) => s.cashierId === cashier.id && s.status === "open");
            return (
              <div key={cashier.id} className="pos-card p-5" data-testid={`cashier-card-${cashier.name}`}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full pos-gradient text-base font-bold text-white"
                    >
                      {cashier.name.trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold text-slate-200">{cashier.name}</h2>
                      {cashier.email && <p className="truncate text-xs text-slate-400">{cashier.email}</p>}
                      {activeShift && (
                        <p className="mt-0.5 text-xs text-emerald-400">
                          En turno — {registerName(activeShift.registerId)}
                        </p>
                      )}
                    </div>
                  </div>
                  {cashier.active ? <Badge tone="success">Activo</Badge> : <Badge tone="neutral">Inactivo</Badge>}
                </div>
                <div className="flex justify-end gap-1">
                  <IconButton label={`Editar ${cashier.name}`} icon={Pencil} onClick={() => openEdit(cashier)} />
                  <IconButton
                    label={`Eliminar ${cashier.name}`}
                    icon={Trash2}
                    tone="danger"
                    onClick={() => setDeleting(cashier)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Turnos Recientes */}
      <div className="pos-card mt-6 overflow-hidden p-6" data-testid="recent-shifts">
        <h2 className="mb-4 text-lg font-bold text-slate-300">Turnos Recientes</h2>
        {recentShifts.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Sin turnos registrados todavía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#1e2235] text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th scope="col" className="py-3 pr-4">Cajero</th>
                  <th scope="col" className="px-4 py-3">Caja</th>
                  <th scope="col" className="px-4 py-3">Inicio</th>
                  <th scope="col" className="px-4 py-3">Fin</th>
                  <th scope="col" className="px-4 py-3">Ventas</th>
                  <th scope="col" className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentShifts.map((shift) => {
                  const cashier = (cashiers ?? []).find((c) => c.id === shift.cashierId);
                  return (
                    <tr key={shift.id} className="border-b border-[#161a2b] last:border-0">
                      <td className="py-3 pr-4 font-semibold text-slate-300">{cashier?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-300">{registerName(shift.registerId)}</td>
                      <td className="px-4 py-3 text-slate-400">{formatDateTimeShort(shift.openedAt)}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {shift.closedAt ? formatDateTimeShort(shift.closedAt) : "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-400">
                        {formatMoney(salesTotalFor(shift.id))}
                      </td>
                      <td className="px-4 py-3">
                        {shift.status === "open" ? (
                          <Badge tone="success">Abierto</Badge>
                        ) : (
                          <Badge tone="neutral">Cerrado</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* create/edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent className="max-w-md border-[#1e2235] bg-[#0e111f]" data-testid="cashier-dialog">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              {editing ? "Editar Cajero" : "Nuevo Cajero"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="c-name" className="mb-1.5 block text-sm text-slate-300">
                Nombre <span className="text-red-400">*</span>
              </label>
              <input
                id="c-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="h-10 w-full rounded-lg border border-[#1e2235] bg-[#141828] px-3 text-sm text-slate-200 outline-none focus:border-sf-primary/60"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="c-email" className="mb-1.5 block text-sm text-slate-300">
                  Email
                </label>
                <input
                  id="c-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="cajero@tienda.mx"
                  className="h-10 w-full rounded-lg border border-[#1e2235] bg-[#141828] px-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-sf-primary/60"
                />
              </div>
              <div>
                <label htmlFor="c-phone" className="mb-1.5 block text-sm text-slate-300">
                  Teléfono
                </label>
                <input
                  id="c-phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-[#1e2235] bg-[#141828] px-3 text-sm text-slate-200 outline-none focus:border-sf-primary/60"
                />
              </div>
            </div>
            <div>
              <label htmlFor="c-pin" className="mb-1.5 block text-sm text-slate-300">
                PIN {editing ? "(dejar vacío para conservar)" : "(4–6 dígitos, opcional)"}
              </label>
              <input
                id="c-pin"
                inputMode="numeric"
                value={form.pin}
                onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))}
                placeholder="••••"
                className="h-10 w-full rounded-lg border border-[#1e2235] bg-[#141828] px-3 text-sm text-slate-200 outline-none focus:border-sf-primary/60"
              />
            </div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-sf-primary/40 ${
                  form.active ? "bg-sf-primary" : "bg-[#1e2235]"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                    form.active ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </span>
              <span className="text-sm text-slate-300">Cajero activo</span>
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="h-10 rounded-lg border border-[#1e2235] bg-[#141828] px-4 text-sm font-semibold text-slate-300 hover:bg-[#1a1f33]"
              >
                Cancelar
              </button>
              <GradientButton type="submit" disabled={saving} data-testid="cashier-save">
                {saving ? "Guardando…" : "Guardar"}
              </GradientButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* delete confirm */}
      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="max-w-sm border-[#1e2235] bg-[#0e111f]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Eliminar cajero</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-300">
            ¿Eliminar a <span className="font-semibold text-white">{deleting?.name}</span>? Sus turnos y
            ventas se conservan en el historial.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleting(null)}
              className="h-10 rounded-lg border border-[#1e2235] bg-[#141828] px-4 text-sm font-semibold text-slate-300 hover:bg-[#1a1f33]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="h-10 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-500"
            >
              Eliminar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
