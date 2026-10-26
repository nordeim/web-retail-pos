"use client";

// ---------------------------------------------------------------------------
// Inventario (/Inventory) — the reference's product table: search (nombre o
// código), category chips, the striped table with per-row edit/delete, the
// "+ Nuevo Producto" gradient button opening the create/edit sheet with the
// reference's own field set (nombre, código, categoría, precio, costo,
// stock, mínimo, IVA, unidad, imagen, activo).
// ---------------------------------------------------------------------------

import * as React from "react";
import { Package, PackagePlus, Pencil, Search, Trash2 } from "lucide-react";

import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge, Chip, EmptyState, GradientButton, IconButton, PageHeader } from "@/components/views/shared";
import { posApi, useCollection, type Category, type Product } from "@/lib/data";
import { formatMoney, parseMoneyToCents } from "@/lib/money";
import { cn } from "@/lib/utils";

const UNITS = ["Pieza", "Kilogramo", "Litro", "Paquete"] as const;

type FormState = {
  name: string;
  barcode: string;
  categoryId: string;
  price: string;
  cost: string;
  stock: string;
  minStock: string;
  taxRate: string;
  unit: string;
  active: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  barcode: "",
  categoryId: "",
  price: "",
  cost: "",
  stock: "0",
  minStock: "5",
  taxRate: "16",
  unit: "Pieza",
  active: true,
};

export function InventoryView() {
  const toast = useToast();
  const products = useCollection<Product[]>("/api/products");
  const categories = useCollection<Category[]>("/api/categories");

  const [query, setQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Product | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products ?? []).filter((p) => {
      if (categoryFilter !== "all") {
        if (p.categoryId !== categoryFilter) return false;
      }
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q);
    });
  }, [products, query, categoryFilter]);

  const categoryName = React.useCallback(
    (id: string | null) =>
      id ? (categories ?? []).find((c) => c.id === id)?.name ?? "Sin categoría" : "Sin categoría",
    [categories],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      barcode: product.barcode,
      categoryId: product.categoryId ?? "",
      price: (product.priceCents / 100).toFixed(2),
      cost: product.costCents !== null ? (product.costCents / 100).toFixed(2) : "",
      stock: String(product.stock),
      minStock: String(product.minStock),
      taxRate: String(product.taxRate / 100),
      unit: product.unit,
      active: product.active,
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    if (saving) return;
    const priceCents = parseMoneyToCents(form.price);
    if (form.name.trim() === "" || form.barcode.trim() === "" || priceCents === null) {
      toast.toast.error("Completa nombre, código y precio de venta.");
      return;
    }
    const costCents = form.cost.trim() === "" ? null : parseMoneyToCents(form.cost);
    if (form.cost.trim() !== "" && costCents === null) {
      toast.toast.error("El costo no es válido.");
      return;
    }
    const body = {
      name: form.name.trim(),
      barcode: form.barcode.trim(),
      categoryId: form.categoryId === "" ? null : form.categoryId,
      priceCents,
      costCents,
      stock: Math.max(0, Math.floor(Number(form.stock) || 0)),
      minStock: Math.max(0, Math.floor(Number(form.minStock) || 0)),
      taxRate: Math.round((Number(form.taxRate) || 0) * 100),
      unit: form.unit,
      active: form.active,
    };
    setSaving(true);
    try {
      if (editing) {
        await posApi.products.update(editing.id, body);
        toast.toast.success("Producto actualizado");
      } else {
        await posApi.products.create(body);
        toast.toast.success("Producto creado");
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      toast.toast.error(err instanceof Error ? err.message : "No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await posApi.products.remove(deleting.id);
      toast.toast.success("Producto eliminado");
    } catch (err: unknown) {
      toast.toast.error(err instanceof Error ? err.message : "No se pudo eliminar.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-4 pt-6 lg:p-8" data-testid="inventory-view">
      <PageHeader
        title="Inventario"
        subtitle={`${(products ?? []).length} productos registrados`}
        action={
          <GradientButton onClick={openCreate} data-testid="new-product">
            <PackagePlus className="h-4.5 w-4.5" />
            Nuevo Producto
          </GradientButton>
        }
      />

      {/* search + category chips */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o código..."
            aria-label="Buscar productos"
            data-testid="inventory-search"
            className="h-11 w-full rounded-xl border border-[#1e2235] bg-[#141828] pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-sf-primary/60 focus-visible:ring-2 focus-visible:ring-sf-primary/40"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
          <Chip active={categoryFilter === "all"} onClick={() => setCategoryFilter("all")}>
            Todos
          </Chip>
          {(categories ?? []).map((c) => (
            <Chip
              key={c.id}
              active={categoryFilter === c.id}
              onClick={() => setCategoryFilter(c.id)}
            >
              {c.name}
            </Chip>
          ))}
        </div>
      </div>

      {/* table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={products?.length ? "Sin resultados" : "No hay productos"}
          description={
            products?.length
              ? "Ajusta la búsqueda o el filtro de categoría."
              : "Agrega tu primer producto con el botón Nuevo Producto."
          }
        />
      ) : (
        <div className="pos-card overflow-hidden" data-testid="inventory-table">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#1e2235] text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th scope="col" className="px-5 py-4">Producto</th>
                  <th scope="col" className="px-4 py-4">Código</th>
                  <th scope="col" className="px-4 py-4">Precio</th>
                  <th scope="col" className="px-4 py-4">Stock</th>
                  <th scope="col" className="px-4 py-4">Categoría</th>
                  <th scope="col" className="px-4 py-4">Estado</th>
                  <th scope="col" className="px-4 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product, index) => (
                  <tr
                    key={product.id}
                    data-testid={`inventory-row-${product.barcode}`}
                    className={cn(
                      "border-b border-[#161a2b] last:border-0 hover:bg-white/[0.02]",
                      index % 2 === 1 && "bg-white/[0.015]",
                    )}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500"
                        >
                          <Package className="h-5 w-5" strokeWidth={2} />
                        </span>
                        <span className="font-semibold text-slate-200">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-400">{product.barcode}</td>
                    <td className="px-4 py-3.5 font-bold text-emerald-400">{formatMoney(product.priceCents)}</td>
                    <td className={cn("px-4 py-3.5 font-semibold", product.stock <= product.minStock ? "text-amber-400" : "text-slate-300")}>
                      {product.stock}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex rounded-md bg-[#1e2235] px-2.5 py-1 text-xs font-medium text-slate-300">
                        {categoryName(product.categoryId)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {product.active ? <Badge tone="success">Activo</Badge> : <Badge tone="neutral">Inactivo</Badge>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1">
                        <IconButton
                          label={`Editar ${product.name}`}
                          icon={Pencil}
                          onClick={() => openEdit(product)}
                        />
                        <IconButton
                          label={`Eliminar ${product.name}`}
                          icon={Trash2}
                          tone="danger"
                          onClick={() => setDeleting(product)}
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

      {/* create/edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent className="max-h-[92dvh] max-w-lg overflow-y-auto border-[#1e2235] bg-[#0e111f]" data-testid="product-dialog">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              {editing ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <label htmlFor="p-name" className="mb-1.5 block text-sm text-slate-300">
                Nombre <span className="text-red-400">*</span>
              </label>
              <input
                id="p-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="h-10 w-full rounded-lg border border-[#1e2235] bg-[#141828] px-3 text-sm text-slate-200 outline-none focus:border-sf-primary/60"
              />
            </div>
            <div>
              <label htmlFor="p-barcode" className="mb-1.5 block text-sm text-slate-300">
                Código de barras <span className="text-red-400">*</span>
              </label>
              <input
                id="p-barcode"
                value={form.barcode}
                onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                required
                className="h-10 w-full rounded-lg border border-[#1e2235] bg-[#141828] px-3 font-mono text-sm text-slate-200 outline-none focus:border-sf-primary/60"
              />
            </div>
            <div>
              <label htmlFor="p-category" className="mb-1.5 block text-sm text-slate-300">
                Categoría
              </label>
              <select
                id="p-category"
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="h-10 w-full rounded-lg border border-[#1e2235] bg-[#141828] px-3 text-sm text-slate-200 outline-none focus:border-sf-primary/60"
              >
                <option value="">Sin categoría</option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="p-price" className="mb-1.5 block text-sm text-slate-300">
                Precio de venta <span className="text-red-400">*</span>
              </label>
              <input
                id="p-price"
                inputMode="decimal"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="0.00"
                required
                className="h-10 w-full rounded-lg border border-[#1e2235] bg-[#141828] px-3 text-sm text-slate-200 outline-none focus:border-sf-primary/60"
              />
            </div>
            <div>
              <label htmlFor="p-cost" className="mb-1.5 block text-sm text-slate-300">
                Costo
              </label>
              <input
                id="p-cost"
                inputMode="decimal"
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                placeholder="0.00"
                className="h-10 w-full rounded-lg border border-[#1e2235] bg-[#141828] px-3 text-sm text-slate-200 outline-none focus:border-sf-primary/60"
              />
            </div>
            <div>
              <label htmlFor="p-stock" className="mb-1.5 block text-sm text-slate-300">
                Stock actual
              </label>
              <input
                id="p-stock"
                inputMode="numeric"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                className="h-10 w-full rounded-lg border border-[#1e2235] bg-[#141828] px-3 text-sm text-slate-200 outline-none focus:border-sf-primary/60"
              />
            </div>
            <div>
              <label htmlFor="p-minstock" className="mb-1.5 block text-sm text-slate-300">
                Stock mínimo
              </label>
              <input
                id="p-minstock"
                inputMode="numeric"
                value={form.minStock}
                onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))}
                className="h-10 w-full rounded-lg border border-[#1e2235] bg-[#141828] px-3 text-sm text-slate-200 outline-none focus:border-sf-primary/60"
              />
            </div>
            <div>
              <label htmlFor="p-tax" className="mb-1.5 block text-sm text-slate-300">
                IVA (%)
              </label>
              <input
                id="p-tax"
                inputMode="decimal"
                value={form.taxRate}
                onChange={(e) => setForm((f) => ({ ...f, taxRate: e.target.value }))}
                className="h-10 w-full rounded-lg border border-[#1e2235] bg-[#141828] px-3 text-sm text-slate-200 outline-none focus:border-sf-primary/60"
              />
            </div>
            <div>
              <label htmlFor="p-unit" className="mb-1.5 block text-sm text-slate-300">
                Unidad
              </label>
              <select
                id="p-unit"
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                className="h-10 w-full rounded-lg border border-[#1e2235] bg-[#141828] px-3 text-sm text-slate-200 outline-none focus:border-sf-primary/60"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-3 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-sf-primary/40",
                  form.active ? "bg-sf-primary" : "bg-[#1e2235]",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
                    form.active ? "left-[22px]" : "left-0.5",
                  )}
                />
              </span>
              <span className="text-sm text-slate-300">Producto activo</span>
            </label>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="h-10 rounded-lg border border-[#1e2235] bg-[#141828] px-4 text-sm font-semibold text-slate-300 hover:bg-[#1a1f33]"
              >
                Cancelar
              </button>
              <GradientButton type="submit" disabled={saving} data-testid="product-save">
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
            <DialogTitle className="text-lg font-bold text-white">Eliminar producto</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-300">
            ¿Eliminar <span className="font-semibold text-white">{deleting?.name}</span>? El historial
            de ventas conserva el nombre registrado.
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
              data-testid="product-delete-confirm"
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
