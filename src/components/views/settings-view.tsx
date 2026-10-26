"use client";

// ---------------------------------------------------------------------------
// Ajustes (/StoreSettings) — the reference's sections: Información del
// Negocio (nombre, logo, dirección, teléfono, email, RFC, moneda),
// Personalización (colores primario/secundario — applied live as the --pos-*
// runtime vars), Ticket/Recibo (pie del ticket), Proveedor de Pagos con
// Tarjeta, and Categorías de Producto (chips + delete). Guardar Cambios
// PATCHes /api/settings/store.
// ---------------------------------------------------------------------------

import * as React from "react";
import { CreditCard, Palette, Plus, Receipt, Save, Store, Tag, Trash2, Upload, X } from "lucide-react";

import { useToast } from "@/components/ui/toast";
import { GradientButton, PageHeader } from "@/components/views/shared";
import { posApi, useCollection, type Category, type StoreSettings } from "@/lib/data";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const CURRENCIES = ["MXN", "USD", "EUR"] as const;
const CARD_PROVIDERS = [
  { id: "none", label: "Ninguno" },
  { id: "terminal", label: "Terminal en tienda" },
  { id: "link", label: "Link de pago" },
] as const;

function hexToTriplet(hex: string): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = Number.parseInt(full, 16);
  if (!Number.isFinite(num) || full.length !== 6) return "";
  return `${(num >> 16) & 255} ${(num >> 8) & 255} ${num & 255}`;
}

type Form = {
  storeName: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  currency: string;
  primaryColor: string;
  secondaryColor: string;
  ticketFooter: string;
  cardProvider: string;
};

export function SettingsView() {
  const toast = useToast();
  const settings = useCollection<StoreSettings>("/api/settings/store");
  const categories = useCollection<Category[]>("/api/categories");
  const setStoreColors = useAppStore((s) => s.setStoreColors);
  const setStoreColorsStore = useAppStore.setState;

  const [form, setForm] = React.useState<Form | null>(null);
  const [hydratedFrom, setHydratedFrom] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [newCategory, setNewCategory] = React.useState("");
  const [addingCategory, setAddingCategory] = React.useState(false);

  // Render-time adjustment (the React-recommended effect alternative): the
  // first loaded settings snapshot seeds the editable form; later refetches
  // (same id) do NOT clobber in-progress edits.
  if (settings && settings.id !== hydratedFrom) {
    setHydratedFrom(settings.id);
    setForm({
      storeName: settings.storeName,
      logoUrl: settings.logoUrl ?? "",
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      taxId: settings.taxId,
      currency: settings.currency,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      ticketFooter: settings.ticketFooter,
      cardProvider: settings.cardProvider,
    });
  }

  const update = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => (f === null ? f : { ...f, [key]: value }));

  const onLogoFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 1_100_000) {
      toast.toast.error("El logo excede ≈1 MB. Usa una imagen más ligera.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update("logoUrl", typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  };

  const applyColors = (primary: string, secondary: string) => {
    setStoreColors(primary, secondary);
    const root = document.documentElement;
    const p = hexToTriplet(primary);
    const s = hexToTriplet(secondary);
    if (p) root.style.setProperty("--pos-primary", p);
    if (s) root.style.setProperty("--pos-gradient-to", s);
  };

  const save = async () => {
    if (!form || saving) return;
    if (form.storeName.trim() === "") {
      toast.toast.error("El nombre de la tienda es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      const saved = await posApi.settings.save({
        storeName: form.storeName.trim(),
        logoUrl: form.logoUrl,
        address: form.address.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        taxId: form.taxId.trim(),
        currency: form.currency,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        ticketFooter: form.ticketFooter,
        cardProvider: form.cardProvider,
      });
      applyColors(saved.primaryColor, saved.secondaryColor);
      setStoreColorsStore({ user: useAppStore.getState().user });
      toast.toast.success("Cambios guardados");
    } catch (err: unknown) {
      toast.toast.error(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const addCategory = async () => {
    const name = newCategory.trim();
    if (name === "" || addingCategory) return;
    setAddingCategory(true);
    try {
      await posApi.categories.create({ name });
      setNewCategory("");
      toast.toast.success("Categoría agregada");
    } catch (err: unknown) {
      toast.toast.error(err instanceof Error ? err.message : "No se pudo agregar la categoría.");
    } finally {
      setAddingCategory(false);
    }
  };

  const removeCategory = async (category: Category) => {
    try {
      await posApi.categories.remove(category.id);
      toast.toast.success(`Categoría "${category.name}" eliminada`);
    } catch (err: unknown) {
      toast.toast.error(err instanceof Error ? err.message : "No se pudo eliminar la categoría.");
    }
  };

  const inputClass =
    "h-10 w-full rounded-lg border border-[#1e2235] bg-[#141828] px-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-sf-primary/60";

  return (
    <div className="mx-auto max-w-3xl p-4 pt-6 lg:p-8" data-testid="settings-view">
      <PageHeader title="Ajustes de la Tienda" subtitle="Personaliza tu negocio" />

      {form === null ? (
        <p className="py-16 text-center text-sm text-slate-500">Cargando ajustes…</p>
      ) : (
        <div className="space-y-5">
          {/* Información del Negocio */}
          <section className="pos-card p-6" aria-labelledby="settings-store">
            <h2 id="settings-store" className="mb-5 flex items-center gap-2 text-lg font-bold text-violet-300">
              <Store className="h-5 w-5" />
              Información del Negocio
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="s-name" className="mb-1.5 block text-sm text-slate-300">
                  Nombre de la tienda <span className="text-red-400">*</span>
                </label>
                <input
                  id="s-name"
                  value={form.storeName}
                  onChange={(e) => update("storeName", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <span className="mb-1.5 block text-sm text-slate-300">Logotipo</span>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#1e2235] bg-[#141828] px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-[#1a1f33]">
                  <Upload className="h-4 w-4" />
                  Subir logo
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => onLogoFile(e.target.files?.[0])}
                  />
                </label>
                {form.logoUrl && (
                  <span className="ml-3 inline-flex items-center gap-2 align-middle">
                    <img src={form.logoUrl} alt="Logotipo de la tienda" className="h-9 w-9 rounded-lg object-cover" />
                    <button
                      type="button"
                      aria-label="Quitar logotipo"
                      onClick={() => update("logoUrl", "")}
                      className="text-slate-500 hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                )}
              </div>
              <div>
                <label htmlFor="s-address" className="mb-1.5 block text-sm text-slate-300">
                  Dirección
                </label>
                <input
                  id="s-address"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="s-phone" className="mb-1.5 block text-sm text-slate-300">
                    Teléfono
                  </label>
                  <input id="s-phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="s-email" className="mb-1.5 block text-sm text-slate-300">
                    Email
                  </label>
                  <input id="s-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="s-taxid" className="mb-1.5 block text-sm text-slate-300">
                    RFC / ID Fiscal
                  </label>
                  <input id="s-taxid" value={form.taxId} onChange={(e) => update("taxId", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="s-currency" className="mb-1.5 block text-sm text-slate-300">
                    Moneda
                  </label>
                  <select
                    id="s-currency"
                    value={form.currency}
                    onChange={(e) => update("currency", e.target.value)}
                    className={inputClass}
                  >
                    <option value="MXN">MXN - Peso Mexicano</option>
                    <option value="USD">USD - Dólar</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Personalización */}
          <section className="pos-card p-6" aria-labelledby="settings-branding">
            <h2 id="settings-branding" className="mb-5 flex items-center gap-2 text-lg font-bold text-violet-300">
              <Palette className="h-5 w-5" />
              Personalización
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="s-primary" className="mb-1.5 block text-sm text-slate-300">
                  Color primario
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="s-primary"
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) => {
                      update("primaryColor", e.target.value);
                      applyColors(e.target.value, form.secondaryColor);
                    }}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-[#1e2235] bg-[#141828] p-1"
                  />
                  <input
                    value={form.primaryColor}
                    onChange={(e) => update("primaryColor", e.target.value)}
                    className={cn(inputClass, "font-mono")}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="s-secondary" className="mb-1.5 block text-sm text-slate-300">
                  Color secundario
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="s-secondary"
                    type="color"
                    value={form.secondaryColor}
                    onChange={(e) => {
                      update("secondaryColor", e.target.value);
                      applyColors(form.primaryColor, e.target.value);
                    }}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-[#1e2235] bg-[#141828] p-1"
                  />
                  <input
                    value={form.secondaryColor}
                    onChange={(e) => update("secondaryColor", e.target.value)}
                    className={cn(inputClass, "font-mono")}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Ticket / Recibo */}
          <section className="pos-card p-6" aria-labelledby="settings-ticket">
            <h2 id="settings-ticket" className="mb-5 flex items-center gap-2 text-lg font-bold text-emerald-400">
              <Receipt className="h-5 w-5" />
              Ticket / Recibo
            </h2>
            <div>
              <label htmlFor="s-footer" className="mb-1.5 block text-sm text-slate-300">
                Pie del ticket
              </label>
              <textarea
                id="s-footer"
                value={form.ticketFooter}
                onChange={(e) => update("ticketFooter", e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[#1e2235] bg-[#141828] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-sf-primary/60"
              />
            </div>
          </section>

          {/* Proveedor de Pagos con Tarjeta */}
          <section className="pos-card p-6" aria-labelledby="settings-card">
            <h2 id="settings-card" className="mb-5 flex items-center gap-2 text-lg font-bold text-blue-400">
              <CreditCard className="h-5 w-5" />
              Proveedor de Pagos con Tarjeta
            </h2>
            <div>
              <label htmlFor="s-provider" className="mb-1.5 block text-sm text-slate-300">
                Proveedor
              </label>
              <select
                id="s-provider"
                value={form.cardProvider}
                onChange={(e) => update("cardProvider", e.target.value)}
                className={cn(inputClass, "sm:max-w-xs")}
              >
                {CARD_PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Categorías de Producto */}
          <section className="pos-card p-6" aria-labelledby="settings-categories">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 id="settings-categories" className="flex items-center gap-2 text-lg font-bold text-amber-400">
                <Tag className="h-5 w-5" />
                Categorías de Producto
              </h2>
            </div>
            <div className="mb-4 flex gap-2">
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void addCategory();
                  }
                }}
                placeholder="Nueva categoría"
                aria-label="Nueva categoría"
                className={cn(inputClass, "sm:max-w-xs")}
              />
              <button
                type="button"
                onClick={addCategory}
                disabled={addingCategory}
                data-testid="category-add"
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-[#1e2235] bg-[#141828] px-4 text-sm font-semibold text-slate-200 hover:bg-[#1a1f33]"
              >
                <Plus className="h-4 w-4" />
                Agregar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(categories ?? []).map((category) => (
                <span
                  key={category.id}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#1e2235] bg-[#141828] px-3 py-2 text-sm text-slate-200"
                >
                  {category.name}
                  <button
                    type="button"
                    aria-label={`Eliminar categoría ${category.name}`}
                    onClick={() => void removeCategory(category)}
                    data-testid={`category-delete-${category.name}`}
                    className="text-slate-500 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </section>

          <div className="flex justify-end pb-4">
            <GradientButton onClick={save} disabled={saving} data-testid="settings-save" className="px-6 py-3">
              <Save className="h-4.5 w-4.5" />
              {saving ? "Guardando…" : "Guardar Cambios"}
            </GradientButton>
          </div>
        </div>
      )}
    </div>
  );
}
