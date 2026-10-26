"use client";

// ---------------------------------------------------------------------------
// Cajas (/Registers) — the register cards (white top border, slate-50 icon
// chip, Cerrada/Abierta badge, Abrir/Cerrar Turno) + Nueva Caja. Opening a
// shift needs a cashier — the exact flow the reference leaves broken (its
// dropdown renders zero options); here the select lists real cashiers and
// sends the guarded POST.
// ---------------------------------------------------------------------------

import * as React from "react";
import { LogIn, LogOut, Monitor, Plus, Trash2 } from "lucide-react";

import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge, EmptyState, GradientButton, IconButton, PageHeader, SuccessButton } from "@/components/views/shared";
import { posApi, useCollection, type CashRegister, type Cashier, type Sale, type Shift } from "@/lib/data";
import { formatMoney, parseMoneyToCents } from "@/lib/money";
import { openShiftForRegister } from "@/lib/shifts";
import { cn } from "@/lib/utils";

export function RegistersView() {
  const toast = useToast();
  const registers = useCollection<CashRegister[]>("/api/registers");
  const cashiers = useCollection<Cashier[]>("/api/cashiers");
  const shifts = useCollection<Shift[]>("/api/shifts");
  const sales = useCollection<Sale[]>("/api/sales");

  const [openFor, setOpenFor] = React.useState<CashRegister | null>(null);
  const [cashierId, setCashierId] = React.useState("");
  const [float, setFloat] = React.useState("");
  const [starting, setStarting] = React.useState(false);

  const [closeFor, setCloseFor] = React.useState<Shift | null>(null);
  const [counted, setCounted] = React.useState("");
  const [closing, setClosing] = React.useState(false);

  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newLocation, setNewLocation] = React.useState("");
  const [savingRegister, setSavingRegister] = React.useState(false);
  const [deleting, setDeleting] = React.useState<CashRegister | null>(null);

  const cashSalesFor = React.useCallback(
    (shiftId: string) =>
      (sales ?? [])
        .filter((s) => s.shiftId === shiftId && s.status === "completed" && s.paymentMethod === "cash")
        .reduce((sum, s) => sum + s.totalCents, 0),
    [sales],
  );

  const totalFor = React.useCallback(
    (shiftId: string) =>
      (sales ?? [])
        .filter((s) => s.shiftId === shiftId && s.status === "completed")
        .reduce((sum, s) => sum + s.totalCents, 0),
    [sales],
  );

  const startShift = async () => {
    if (!openFor || starting) return;
    if (cashierId === "") {
      toast.toast.error("Selecciona un cajero.");
      return;
    }
    const floatCents = float.trim() === "" ? 0 : parseMoneyToCents(float);
    if (floatCents === null) {
      toast.toast.error("El fondo de caja no es válido.");
      return;
    }
    setStarting(true);
    try {
      await posApi.shifts.open({
        registerId: openFor.id,
        cashierId,
        openingFloatCents: floatCents,
      });
      toast.toast.success(`Turno iniciado en ${openFor.name}`);
      setOpenFor(null);
      setCashierId("");
      setFloat("");
    } catch (err: unknown) {
      toast.toast.error(err instanceof Error ? err.message : "No se pudo iniciar el turno.");
    } finally {
      setStarting(false);
    }
  };

  const confirmClose = async () => {
    if (!closeFor || closing) return;
    const countedCents = parseMoneyToCents(counted);
    if (countedCents === null) {
      toast.toast.error("Ingresa el conteo final.");
      return;
    }
    setClosing(true);
    try {
      const updated = await posApi.shifts.close(closeFor.id, {
        closingAmountCents: countedCents,
      });
      const diff = updated.differenceCents ?? 0;
      toast.toast.success(
        diff === 0
          ? "Turno cerrado sin diferencias."
          : `Turno cerrado. Diferencia: ${formatMoney(diff)}`,
      );
      setCloseFor(null);
      setCounted("");
    } catch (err: unknown) {
      toast.toast.error(err instanceof Error ? err.message : "No se pudo cerrar el turno.");
    } finally {
      setClosing(false);
    }
  };

  const createRegister = async () => {
    if (savingRegister) return;
    if (newName.trim() === "") {
      toast.toast.error("El nombre es obligatorio.");
      return;
    }
    setSavingRegister(true);
    try {
      await posApi.registers.create({ name: newName.trim(), location: newLocation.trim() });
      toast.toast.success("Caja creada");
      setCreating(false);
      setNewName("");
      setNewLocation("");
    } catch (err: unknown) {
      toast.toast.error(err instanceof Error ? err.message : "No se pudo crear la caja.");
    } finally {
      setSavingRegister(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await posApi.registers.remove(deleting.id);
      toast.toast.success("Caja eliminada");
    } catch (err: unknown) {
      toast.toast.error(err instanceof Error ? err.message : "No se pudo eliminar.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-4 pt-6 lg:p-8" data-testid="registers-view">
      <PageHeader
        title="Cajas Registradoras"
        subtitle={`${(registers ?? []).length} cajas configuradas`}
        action={
          <GradientButton onClick={() => setCreating(true)} data-testid="new-register">
            <Plus className="h-4.5 w-4.5" />
            Nueva Caja
          </GradientButton>
        }
      />

      {(registers ?? []).length === 0 ? (
        <EmptyState
          icon={Monitor}
          title="No hay cajas configuradas"
          description="Crea tu primera caja con el botón Nueva Caja."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" data-testid="registers-grid">
          {(registers ?? []).map((register) => {
            const shift = openShiftForRegister(shifts ?? [], register.id);
            const shiftCashier = shift
              ? (cashiers ?? []).find((c) => c.id === shift.cashierId)
              : undefined;
            return (
              <div key={register.id} className="pos-card-register p-5" data-testid={`register-card-${register.name}`}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-700"
                    >
                      <Monitor className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <div>
                      <h2 className="text-base font-bold text-slate-200">{register.name}</h2>
                      <p className="text-sm text-slate-400">{register.location || "Sin ubicación"}</p>
                      {shift && shiftCashier && (
                        <p className="mt-0.5 text-xs text-emerald-400">Turno: {shiftCashier.name}</p>
                      )}
                      {shift && (
                        <p className="text-xs text-slate-500">
                          Ventas del turno: {formatMoney(totalFor(shift.id))}
                        </p>
                      )}
                    </div>
                  </div>
                  {shift ? <Badge tone="success">Abierta</Badge> : <Badge tone="neutral">Cerrada</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  {shift ? (
                    <SuccessButton
                      onClick={() => setCloseFor(shift)}
                      data-testid={`close-shift-card-${register.name.toLowerCase().replace(/\s+/g, "-")}`}
                      className="h-10 flex-1"
                    >
                      <LogOut className="h-4.5 w-4.5" />
                      Cerrar Turno
                    </SuccessButton>
                  ) : (
                    <SuccessButton
                      onClick={() => {
                        setOpenFor(register);
                        setCashierId("");
                        setFloat("");
                      }}
                      data-testid={`open-shift-card-${register.name.toLowerCase().replace(/\s+/g, "-")}`}
                      className="h-10 flex-1"
                    >
                      <LogIn className="h-4.5 w-4.5" />
                      Abrir Turno
                    </SuccessButton>
                  )}
                  <IconButton
                    label={`Eliminar ${register.name}`}
                    icon={Trash2}
                    tone="danger"
                    onClick={() => setDeleting(register)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Abrir Turno */}
      <Dialog open={openFor !== null} onOpenChange={(open) => !open && setOpenFor(null)}>
        <DialogContent className="max-w-md border-[#1e2235] bg-[#0e111f]" data-testid="open-shift-dialog">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              Abrir Turno — {openFor?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="shift-cashier" className="mb-1.5 block text-sm text-slate-300">
                Cajero/a <span className="text-red-400">*</span>
              </label>
              <select
                id="shift-cashier"
                value={cashierId}
                onChange={(e) => setCashierId(e.target.value)}
                data-testid="shift-cashier-select"
                className="h-11 w-full rounded-lg border border-[#1e2235] bg-[#141828] px-3 text-sm text-slate-200 outline-none focus:border-sf-primary/60"
              >
                <option value="">Seleccionar cajero</option>
                {(cashiers ?? [])
                  .filter((c) => c.active)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
              {(cashiers ?? []).filter((c) => c.active).length === 0 && (
                <p className="mt-1.5 text-xs text-amber-400">
                  No hay cajeros activos — crea uno en la vista Cajeros.
                </p>
              )}
            </div>
            <div>
              <label htmlFor="shift-float" className="mb-1.5 block text-sm text-slate-300">
                Fondo de caja inicial
              </label>
              <input
                id="shift-float"
                inputMode="decimal"
                value={float}
                onChange={(e) => setFloat(e.target.value)}
                placeholder="0.00"
                data-testid="shift-float-input"
                className="h-11 w-full rounded-lg border border-[#1e2235] bg-[#141828] px-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-sf-primary/60"
              />
            </div>
            <SuccessButton
              onClick={startShift}
              disabled={cashierId === "" || starting}
              data-testid="shift-start"
              className="h-11 w-full"
            >
              <LogIn className="h-4.5 w-4.5" />
              {starting ? "Iniciando…" : "Iniciar Turno"}
            </SuccessButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cerrar Turno */}
      <Dialog open={closeFor !== null} onOpenChange={(open) => !open && setCloseFor(null)}>
        <DialogContent className="max-w-md border-[#1e2235] bg-[#0e111f]" data-testid="close-shift-dialog">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Cerrar Turno</DialogTitle>
          </DialogHeader>
          {closeFor && (
            <div className="space-y-4">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-[#1e2235] bg-[#141828] p-3">
                  <dt className="text-xs text-slate-400">Fondo inicial</dt>
                  <dd className="mt-1 font-bold text-slate-200">{formatMoney(closeFor.openingFloatCents)}</dd>
                </div>
                <div className="rounded-lg border border-[#1e2235] bg-[#141828] p-3">
                  <dt className="text-xs text-slate-400">Ventas en efectivo</dt>
                  <dd className="mt-1 font-bold text-slate-200">{formatMoney(cashSalesFor(closeFor.id))}</dd>
                </div>
                <div className="col-span-2 rounded-lg border border-[#1e2235] bg-[#141828] p-3">
                  <dt className="text-xs text-slate-400">Esperado en caja</dt>
                  <dd className="mt-1 font-bold text-emerald-400">
                    {formatMoney(closeFor.openingFloatCents + cashSalesFor(closeFor.id))}
                  </dd>
                </div>
              </dl>
              <div>
                <label htmlFor="shift-counted" className="mb-1.5 block text-sm text-slate-300">
                  Conteo final
                </label>
                <input
                  id="shift-counted"
                  inputMode="decimal"
                  value={counted}
                  onChange={(e) => setCounted(e.target.value)}
                  placeholder="0.00"
                  data-testid="shift-counted-input"
                  className="h-11 w-full rounded-lg border border-[#1e2235] bg-[#141828] px-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-sf-primary/60"
                />
              </div>
              <SuccessButton
                onClick={confirmClose}
                disabled={closing}
                data-testid="shift-close-confirm"
                className="h-11 w-full"
              >
                <LogOut className="h-4.5 w-4.5" />
                {closing ? "Cerrando…" : "Cerrar Turno"}
              </SuccessButton>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Nueva Caja */}
      <Dialog open={creating} onOpenChange={(open) => !open && setCreating(false)}>
        <DialogContent className="max-w-md border-[#1e2235] bg-[#0e111f]" data-testid="new-register-dialog">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Nueva Caja</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="reg-name" className="mb-1.5 block text-sm text-slate-300">
                Nombre <span className="text-red-400">*</span>
              </label>
              <input
                id="reg-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Caja 3"
                className="h-10 w-full rounded-lg border border-[#1e2235] bg-[#141828] px-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-sf-primary/60"
              />
            </div>
            <div>
              <label htmlFor="reg-location" className="mb-1.5 block text-sm text-slate-300">
                Ubicación
              </label>
              <input
                id="reg-location"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Entrada principal"
                className="h-10 w-full rounded-lg border border-[#1e2235] bg-[#141828] px-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-sf-primary/60"
              />
            </div>
            <GradientButton onClick={createRegister} disabled={savingRegister} className="h-10 w-full">
              {savingRegister ? "Guardando…" : "Crear caja"}
            </GradientButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* delete confirm */}
      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="max-w-sm border-[#1e2235] bg-[#0e111f]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Eliminar caja</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-300">
            ¿Eliminar <span className="font-semibold text-white">{deleting?.name}</span>? Sus turnos y
            ventas se conservan en el historial.
          </p>
          <div className={cn("flex justify-end gap-2 pt-2")}>
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
