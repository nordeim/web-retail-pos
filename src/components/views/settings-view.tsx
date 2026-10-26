"use client";

// ---------------------------------------------------------------------------
// The Ajustes view (/StoreSettings): Información del Negocio,
// Personalización (the two color pickers write the runtime accent vars —
// the theme IS the store settings), Ticket/Recibo footer, Proveedor de
// Pagos, Categorías de Producto, Guardar Cambios.
// ---------------------------------------------------------------------------

import * as React from "react";
import { Store, Palette, ReceiptText, CreditCard, Tags, Plus, X, Upload } from "lucide-react";

import { PageHeading, SectionCard } from "@/components/pos/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiSend, ApiError } from "@/lib/api";
import { usePosStore } from "@/lib/store";
import { CARD_PROVIDERS, CURRENCIES } from "@/lib/validation";

const DEFAULTS = {
  name: "",
  address: "",
  phone: "",
  email: "",
  fiscalId: "",
  currency: "MXN - Peso Mexicano",
  primaryColor: "#6366f1",
  secondaryColor: "#8b5cf6",
  ticketFooter: "",
  cardProvider: "Ninguno",
};

export function SettingsView() {
  const settings = usePosStore((s) => s.settings);
  const loadCollections = usePosStore((s) => s.loadCollections);

  React.useEffect(() => {
    void loadCollections(["settings", "categories"]);
  }, [loadCollections]);

  // The form mounts ONCE per store-load state (key-remount — no
  // effect-driven state writes; the react-hooks/set-state-in-effect rule).
  // The key is the loaded/defaults STATE, not the snapshot identity: a save
  // refreshes the store without remounting, so the "saved" status survives.
  // The store pre-warms settings before the shell flips ready, so the
  // loaded branch is the ordinary path; the default branch is the
  // cold-store fallback only.
  if (!settings) {
    return <SettingsForm key="defaults" initial={DEFAULTS} />;
  }
  return <SettingsForm key="loaded" initial={settings} />;
}

function SettingsForm({ initial }: { initial: typeof DEFAULTS }) {
  const categories = usePosStore((s) => s.categories);
  const loadCollections = usePosStore((s) => s.loadCollections);
  const [form, setForm] = React.useState(initial);
  const [newCategory, setNewCategory] = React.useState("");
  const [logoName, setLogoName] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = React.useState("");

  const set = <K extends keyof typeof DEFAULTS>(key: K, value: (typeof DEFAULTS)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setStatus("saving");
    setError("");
    try {
      await apiSend("PATCH", "/api/settings", form);
      await loadCollections(["settings"]);
      setStatus("saved");
      window.setTimeout(() => setStatus("idle"), 2500);
    } catch (err: unknown) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : "No se pudo guardar.");
    }
  };

  const addCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    try {
      await apiSend("POST", "/api/categories", { name });
      setNewCategory("");
      await loadCollections(["categories"]);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "No se pudo agregar la categoría.");
    }
  };

  const removeCategory = async (id: string) => {
    try {
      await apiSend("DELETE", `/api/categories/${id}`);
      await loadCollections(["categories"]);
    } catch (err: unknown) {
      void err;
    }
  };

  return (
    <div>
      <PageHeading title="Ajustes de la Tienda" subtitle="Personaliza tu negocio" />

      <div className="max-w-3xl space-y-6">
        <SectionCard
          title="Información del Negocio"
          icon={<Store className="h-4.5 w-4.5 text-violet-400" />}
          testId="settings-business-card"
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="settings-name" className="text-slate-200">Nombre de la tienda *</Label>
              <Input
                id="settings-name"
                value={form.name}
                onChange={(event) => set("name", event.target.value)}
                data-testid="settings-name-input"
                className="mt-1.5 bg-[#0d0f1a]"
              />
            </div>
            <div>
              <Label htmlFor="settings-logo" className="text-slate-200">Logotipo</Label>
              {/* The reference renders a styled "Subir logo" button, never the
                  raw browser file input (V2 V5). The input stays functionally
                  wired — hidden, labelled, driven by the button. */}
              <div className="mt-1.5 flex items-center gap-3">
                <label
                  htmlFor="settings-logo"
                  className="vx-focus inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#262a36] bg-[#12141f] px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5"
                >
                  <Upload className="h-4 w-4" />
                  Subir logo
                </label>
                <span className="text-xs text-slate-500" data-testid="settings-logo-file">
                  {logoName ?? "Sin archivo"}
                </span>
              </div>
              <input
                id="settings-logo"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => setLogoName(event.target.files?.[0]?.name ?? null)}
              />
            </div>
            <div>
              <Label htmlFor="settings-address" className="text-slate-200">Dirección</Label>
              <Input
                id="settings-address"
                value={form.address}
                onChange={(event) => set("address", event.target.value)}
                className="mt-1.5 bg-[#0d0f1a]"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="settings-phone" className="text-slate-200">Teléfono</Label>
                <Input
                  id="settings-phone"
                  value={form.phone}
                  onChange={(event) => set("phone", event.target.value)}
                  className="mt-1.5 bg-[#0d0f1a]"
                />
              </div>
              <div>
                <Label htmlFor="settings-email" className="text-slate-200">Email</Label>
                <Input
                  id="settings-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => set("email", event.target.value)}
                  className="mt-1.5 bg-[#0d0f1a]"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="settings-fiscal" className="text-slate-200">RFC / ID Fiscal</Label>
                <Input
                  id="settings-fiscal"
                  value={form.fiscalId}
                  onChange={(event) => set("fiscalId", event.target.value)}
                  className="mt-1.5 bg-[#0d0f1a]"
                />
              </div>
              <div>
                <Label className="text-slate-200">Moneda</Label>
                <Select value={form.currency} onValueChange={(value) => set("currency", value)}>
                  <SelectTrigger className="mt-1.5 w-full bg-[#0d0f1a]" data-testid="settings-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#262a36] bg-[#12141f] text-slate-100">
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Personalización"
          icon={<Palette className="h-4.5 w-4.5 text-violet-400" />}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="settings-primary" className="text-slate-200">Color primario</Label>
              <div className="mt-1.5 flex items-center gap-3">
                <input
                  id="settings-primary"
                  type="color"
                  value={form.primaryColor}
                  onChange={(event) => set("primaryColor", event.target.value)}
                  data-testid="settings-primary-color"
                  className="h-10 w-14 cursor-pointer rounded-lg border border-[#262a36] bg-transparent"
                />
                <span className="text-sm text-slate-400">{form.primaryColor}</span>
              </div>
            </div>
            <div>
              <Label htmlFor="settings-secondary" className="text-slate-200">Color secundario</Label>
              <div className="mt-1.5 flex items-center gap-3">
                <input
                  id="settings-secondary"
                  type="color"
                  value={form.secondaryColor}
                  onChange={(event) => set("secondaryColor", event.target.value)}
                  data-testid="settings-secondary-color"
                  className="h-10 w-14 cursor-pointer rounded-lg border border-[#262a36] bg-transparent"
                />
                <span className="text-sm text-slate-400">{form.secondaryColor}</span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Los colores tiñen la barra lateral y los botones principales al guardar.
          </p>
        </SectionCard>

        <SectionCard
          title="Ticket / Recibo"
          icon={<ReceiptText className="h-4.5 w-4.5 text-violet-400" />}
        >
          <div>
            <Label htmlFor="settings-footer" className="text-slate-200">Pie del ticket</Label>
            <textarea
              id="settings-footer"
              value={form.ticketFooter}
              onChange={(event) => set("ticketFooter", event.target.value)}
              rows={3}
              className="mt-1.5 w-full rounded-xl border border-[#262a36] bg-[#0d0f1a] px-3 py-2.5 text-sm text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/45"
              placeholder="¡Gracias por su compra!"
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Proveedor de Pagos con Tarjeta"
          icon={<CreditCard className="h-4.5 w-4.5 text-violet-400" />}
        >
          <div>
            <Label className="text-slate-200">Proveedor</Label>
            <Select value={form.cardProvider} onValueChange={(value) => set("cardProvider", value)}>
              <SelectTrigger className="mt-1.5 w-full max-w-xs bg-[#0d0f1a]" data-testid="settings-card-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-[#262a36] bg-[#12141f] text-slate-100">
                {CARD_PROVIDERS.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SectionCard>

        <SectionCard
          title="Categorías de Producto"
          icon={<Tags className="h-4.5 w-4.5 text-violet-400" />}
          testId="settings-categories-card"
        >
          <div className="mb-4 flex gap-2">
            <Input
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void addCategory();
                }
              }}
              placeholder="Nueva categoría"
              data-testid="settings-new-category"
              className="max-w-xs bg-[#0d0f1a]"
            />
            <Button
              variant="outline"
              onClick={() => void addCategory()}
              disabled={newCategory.trim().length === 0}
              data-testid="settings-add-category"
              className="border-[#262a36] bg-transparent text-slate-200 hover:bg-white/5 hover:text-white"
            >
              <Plus className="h-4 w-4" /> Agregar
            </Button>
          </div>
          <ul className="flex flex-wrap gap-2" data-testid="settings-category-chips">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex items-center gap-1.5 rounded-full border border-[#262a36] bg-[#12141f] px-3 py-1.5 text-xs font-semibold text-slate-200"
              >
                {category.name}
                <button
                  type="button"
                  aria-label={`Eliminar categoría ${category.name}`}
                  onClick={() => void removeCategory(category.id)}
                  className="vx-focus rounded-full p-0.5 text-slate-500 hover:text-red-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>

        {error ? (
          <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <Button
            data-testid="settings-save"
            disabled={form.name.trim().length === 0 || status === "saving"}
            onClick={() => void save()}
            className="vx-gradient border-0 px-6 text-white"
          >
            {status === "saving" ? "Guardando…" : "Guardar Cambios"}
          </Button>
          {status === "saved" ? (
            <p role="status" data-testid="settings-saved" className="text-sm text-emerald-400">
              Cambios guardados.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
