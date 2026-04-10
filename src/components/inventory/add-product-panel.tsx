"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useToast } from "@/components/ui/toast-provider";
import { formatDateTime } from "@/lib/user-preferences";
import { products as baseProducts } from "@/lib/smartstock-data";

export type InventoryProduct = (typeof baseProducts)[number] & {
  imageUrl?: string;
  quality?: string;
};

type ImportProductRow = {
  sourceRowNumber: number;
  name: string;
  currentStock: number;
  quality: string;
  imageUrl: string;
};

type ImportRowError = {
  rowNumber: number;
  reason: string;
};

type ImportSummary = {
  importedCount: number;
  skippedCount: number;
  duplicateSkippedCount: number;
  createdAt: string;
};

type ManualSummary = {
  name: string;
  quantity: number;
  createdAt: string;
};

type AddProductPanelProps = {
  products: InventoryProduct[];
  setProducts: React.Dispatch<React.SetStateAction<InventoryProduct[]>>;
  setSelectedProductId: (id: number) => void;
  onProductsAdded?: (products: InventoryProduct[]) => void;
};

export function AddProductPanel({ products, setProducts, setSelectedProductId, onProductsAdded }: AddProductPanelProps) {
  const { showToast } = useToast();
  const preferences = useUserPreferences();

  const [entryMode, setEntryMode] = useState<"choose" | "manual" | "bulk">("choose");
  const [showManualForm, setShowManualForm] = useState(false);

  const [newName, setNewName] = useState("");
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [newQuality, setNewQuality] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [manualTouched, setManualTouched] = useState({
    name: false,
    quantity: false,
  });

  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<ImportProductRow[]>([]);
  const [previewErrors, setPreviewErrors] = useState<ImportRowError[]>([]);
  const [lastImportSummary, setLastImportSummary] = useState<ImportSummary | null>(null);
  const [lastManualSummary, setLastManualSummary] = useState<ManualSummary | null>(null);

  const productNameIndex = useMemo(
    () => new Set(products.map((item) => item.name.trim().toLowerCase())),
    [products],
  );

  const duplicateManualName = useMemo(() => {
    const normalized = newName.trim().toLowerCase();
    if (!normalized) return null;
    return products.find((item) => item.name.trim().toLowerCase() === normalized) ?? null;
  }, [newName, products]);

  const manualNameError = manualTouched.name && newName.trim().length === 0
    ? "Product name is required."
    : null;

  const manualQuantityError = manualTouched.quantity && (!Number.isFinite(newQuantity) || newQuantity < 0)
    ? "Quantity must be a number >= 0."
    : null;

  const manualDuplicateError = duplicateManualName
    ? `A product named \"${duplicateManualName.name}\" already exists.`
    : null;

  const canAddProduct =
    newName.trim().length > 0 &&
    Number.isFinite(newQuantity) &&
    newQuantity >= 0 &&
    !manualDuplicateError;

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setNewImageUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const addProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setManualTouched({ name: true, quantity: true });

    if (!canAddProduct) {
      showToast({
        title: "Fix validation errors",
        description: "Please resolve highlighted fields before saving.",
      });
      return;
    }

    let createdId = 0;
    const safeQuantity = Math.max(0, newQuantity);
    const productName = newName.trim();

    let createdProduct: InventoryProduct | null = null;

    setProducts((current) => {
      const nextId = current.length === 0 ? 1 : Math.max(...current.map((item) => item.id)) + 1;
      createdId = nextId;

      const nextProduct: InventoryProduct = {
        id: nextId,
        name: productName,
        currentStock: safeQuantity,
        reorderPoint: Math.max(5, Math.ceil(Math.max(1, safeQuantity) * 0.3)),
        overstockPoint: Math.max(20, Math.ceil(Math.max(1, safeQuantity) * 2)),
        todaySales: 0,
        weeklySales: [0, 0, 0, 0, 0, 0, 0],
        supplierId: 1,
        quality: newQuality.trim(),
        imageUrl: newImageUrl.trim() || undefined,
      };

      createdProduct = nextProduct;
      return [...current, nextProduct];
    });

    if (createdId > 0) {
      setSelectedProductId(createdId);
    }

    if (createdProduct) {
      onProductsAdded?.([createdProduct]);
    }

    setLastManualSummary({
      name: productName,
      quantity: safeQuantity,
      createdAt: new Date().toISOString(),
    });

    setNewName("");
    setNewQuantity(0);
    setNewQuality("");
    setNewImageUrl("");
    setManualTouched({ name: false, quantity: false });

    showToast({
      title: "Product added",
      description: `${productName} created with ${safeQuantity} units.`,
    });
  };

  const downloadCsvTemplate = () => {
    const lines = [
      "name,currentStock,quality,imageUrl",
      "Rice 50kg,20,Premium,https://example.com/rice.jpg",
      "Fish Sauce 750ml,35,Grade A,https://example.com/fish-sauce.jpg",
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "smartstock-product-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcelTemplate = () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["name", "currentStock", "quality", "imageUrl"],
      ["Rice 50kg", 20, "Premium", "https://example.com/rice.jpg"],
      ["Fish Sauce 750ml", 35, "Grade A", "https://example.com/fish-sauce.jpg"],
    ]);

    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    XLSX.writeFile(workbook, "smartstock-product-template.xlsx");
  };

  const previewProductsFromFile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!bulkFile) {
      showToast({
        title: "No file selected",
        description: "Choose a CSV or Excel file first.",
      });
      return;
    }

    try {
      const arrayBuffer = await bulkFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });

      const parsedRows: ImportProductRow[] = [];
      const errors: ImportRowError[] = [];
      const importNameIndex = new Set<string>();

      rows.forEach((row, index) => {
        const rowNumber = index + 2;
        const name = String(row.name ?? "").trim();
        const normalizedName = name.toLowerCase();
        const quantityRaw = row.currentStock ?? row.quantity ?? row.stock ?? 0;
        const currentStock = Number(quantityRaw);

        if (!name) {
          errors.push({
            rowNumber,
            reason: "Missing product name",
          });
          return;
        }

        if (!Number.isFinite(currentStock) || currentStock < 0) {
          errors.push({
            rowNumber,
            reason: "Invalid currentStock (must be a number >= 0)",
          });
          return;
        }

        if (productNameIndex.has(normalizedName)) {
          errors.push({
            rowNumber,
            reason: "Duplicate of existing product",
          });
          return;
        }

        if (importNameIndex.has(normalizedName)) {
          errors.push({
            rowNumber,
            reason: "Duplicate product inside import file",
          });
          return;
        }

        importNameIndex.add(normalizedName);
        parsedRows.push({
          sourceRowNumber: rowNumber,
          name,
          currentStock: Math.max(0, currentStock),
          quality: String(row.quality ?? "").trim(),
          imageUrl: String(row.imageUrl ?? row.image ?? "").trim(),
        });
      });

      if (parsedRows.length === 0) {
        showToast({
          title: "No valid rows",
          description: "Use template columns and remove duplicates before import.",
        });
        setPreviewRows([]);
        setPreviewErrors(errors);
        return;
      }

      setPreviewRows(parsedRows);
      setPreviewErrors(errors);
      showToast({
        title: "Preview ready",
        description: `${parsedRows.length} valid row${parsedRows.length > 1 ? "s" : ""}, ${errors.length} skipped.`,
      });
    } catch {
      showToast({
        title: "Preview failed",
        description: "Please upload a valid CSV or Excel file using the template.",
      });
      setPreviewRows([]);
      setPreviewErrors([]);
    }
  };

  const importPreviewRows = () => {
    if (previewRows.length === 0) {
      showToast({
        title: "No preview rows",
        description: "Preview a file first before importing.",
      });
      return;
    }

    let firstImportedId = 0;
    let additions: InventoryProduct[] = [];

    setProducts((current) => {
      const nextId = current.length === 0 ? 1 : Math.max(...current.map((item) => item.id)) + 1;

      additions = previewRows.map((row, index) => {
        const createdId = nextId + index;
        if (index === 0) {
          firstImportedId = createdId;
        }

        return {
          id: createdId,
          name: row.name,
          currentStock: row.currentStock,
          reorderPoint: Math.max(5, Math.ceil(Math.max(1, row.currentStock) * 0.3)),
          overstockPoint: Math.max(20, Math.ceil(Math.max(1, row.currentStock) * 2)),
          todaySales: 0,
          weeklySales: [0, 0, 0, 0, 0, 0, 0],
          supplierId: 1,
          quality: row.quality,
          imageUrl: row.imageUrl || undefined,
        } as InventoryProduct;
      });

      return [...current, ...additions];
    });

    if (additions.length > 0) {
      onProductsAdded?.(additions);
    }

    if (firstImportedId > 0) {
      setSelectedProductId(firstImportedId);
    }

    const duplicateSkippedCount = previewErrors.filter((error) => error.reason.toLowerCase().includes("duplicate")).length;

    setLastImportSummary({
      importedCount: previewRows.length,
      skippedCount: previewErrors.length,
      duplicateSkippedCount,
      createdAt: new Date().toISOString(),
    });

    setBulkFile(null);
    setPreviewRows([]);
    setPreviewErrors([]);

    showToast({
      title: "Import successful",
      description: `${additions.length} product${additions.length > 1 ? "s" : ""} imported.`,
    });
  };

  return (
    <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Add products</h2>
        <p className="text-sm text-muted-foreground">
          Start by choosing one method: upload your stock file, or add products manually one by one.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEntryMode("bulk")}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              entryMode === "bulk"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground"
            }`}
          >
            Upload CSV/Excel
          </button>
          <button
            type="button"
            onClick={() => setEntryMode("manual")}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              entryMode === "manual"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground"
            }`}
          >
            Add manually
          </button>
        </div>
      </div>

      {entryMode === "manual" && (
        <div className="mt-4 rounded-xl border border-border/70 bg-muted/20 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">Manual product entry</h3>
            <button
              type="button"
              onClick={() => setShowManualForm((current) => !current)}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
            >
              {showManualForm ? "Hide form" : "Add product"}
            </button>
          </div>

          {showManualForm && (
            <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={addProduct}>
              <label className="grid gap-1 text-sm text-muted-foreground">
                Product name
                <input
                  value={newName}
                  onBlur={() => setManualTouched((current) => ({ ...current, name: true }))}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="Product name"
                  className={`h-11 rounded-lg border bg-background px-3 text-foreground ${
                    manualNameError || manualDuplicateError ? "border-red-500" : "border-border"
                  }`}
                />
                {manualNameError && <span className="text-xs text-red-600">{manualNameError}</span>}
                {!manualNameError && manualDuplicateError && (
                  <span className="text-xs text-amber-700">{manualDuplicateError}</span>
                )}
              </label>

              <label className="grid gap-1 text-sm text-muted-foreground">
                Quantity
                <input
                  type="number"
                  min={0}
                  value={newQuantity}
                  onBlur={() => setManualTouched((current) => ({ ...current, quantity: true }))}
                  onChange={(event) => setNewQuantity(Number(event.target.value))}
                  placeholder="Quantity"
                  className={`h-11 rounded-lg border bg-background px-3 text-foreground ${
                    manualQuantityError ? "border-red-500" : "border-border"
                  }`}
                />
                {manualQuantityError && <span className="text-xs text-red-600">{manualQuantityError}</span>}
              </label>

              <label className="grid gap-1 text-sm text-muted-foreground">
                Quality
                <input
                  value={newQuality}
                  onChange={(event) => setNewQuality(event.target.value)}
                  placeholder="Quality (e.g. Premium, Grade A)"
                  className="h-11 rounded-lg border border-border bg-background px-3 text-foreground"
                />
              </label>

              <label className="grid gap-1 text-sm text-muted-foreground">
                Image URL
                <input
                  value={newImageUrl}
                  onChange={(event) => setNewImageUrl(event.target.value)}
                  placeholder="Image URL"
                  className="h-11 rounded-lg border border-border bg-background px-3 text-foreground"
                />
              </label>

              <label className="grid gap-1 text-sm text-muted-foreground sm:col-span-2">
                Upload image (optional)
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>

              <div className="sm:col-span-2 rounded-lg border border-border/70 bg-background p-2 text-xs">
                {canAddProduct ? (
                  <p className="text-green-700">Validation passed: ready to create product.</p>
                ) : (
                  <p className="text-muted-foreground">Resolve required fields and duplicates to continue.</p>
                )}
              </div>

              <div className="flex items-center sm:col-span-2">
                <button
                  type="submit"
                  disabled={!canAddProduct}
                  className="h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save product
                </button>
              </div>
            </form>
          )}

          {lastManualSummary && (
            <div className="mt-3 rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-xs text-foreground">
              <p className="font-semibold">Last manual create succeeded</p>
              <p className="mt-1 text-muted-foreground">
                {lastManualSummary.name} with {lastManualSummary.quantity} units at {formatDateTime(lastManualSummary.createdAt, preferences)}
              </p>
            </div>
          )}
        </div>
      )}

      {entryMode === "bulk" && (
        <div className="mt-4 rounded-xl border border-border/70 bg-muted/20 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">Bulk import (CSV or Excel)</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadCsvTemplate}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground"
              >
                Download CSV template
              </button>
              <button
                type="button"
                onClick={downloadExcelTemplate}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground"
              >
                Download Excel template
              </button>
            </div>
          </div>

          <form className="mt-3 flex flex-wrap items-center gap-2" onSubmit={previewProductsFromFile}>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(event) => {
                setBulkFile(event.target.files?.[0] ?? null);
                setPreviewRows([]);
                setPreviewErrors([]);
              }}
              className="h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
            <button
              type="submit"
              disabled={!bulkFile}
              className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Preview file
            </button>
            <button
              type="button"
              disabled={previewRows.length === 0}
              onClick={importPreviewRows}
              className="h-10 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Import previewed rows
            </button>
          </form>

          {bulkFile && (
            <p className="mt-2 text-xs text-muted-foreground">
              Selected file: <span className="font-medium text-foreground">{bulkFile.name}</span>
            </p>
          )}

          <p className="mt-2 text-xs text-muted-foreground">
            Required columns: <span className="font-medium">name, currentStock, quality, imageUrl</span>
          </p>

          {previewRows.length > 0 && (
            <div className="mt-3 overflow-x-auto rounded-lg border border-border/70 bg-background p-2">
              <p className="mb-2 text-xs font-medium text-foreground">Import preview ({previewRows.length} rows)</p>
              <table className="min-w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/70 text-left text-muted-foreground">
                    <th className="px-2 py-1 font-medium">Row</th>
                    <th className="px-2 py-1 font-medium">Name</th>
                    <th className="px-2 py-1 font-medium">Current Stock</th>
                    <th className="px-2 py-1 font-medium">Quality</th>
                    <th className="px-2 py-1 font-medium">Image URL</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.slice(0, 8).map((row, index) => (
                    <tr key={`${row.name}-${index}`} className="border-b border-border/40 text-foreground">
                      <td className="px-2 py-1">{row.sourceRowNumber}</td>
                      <td className="px-2 py-1">{row.name}</td>
                      <td className="px-2 py-1">{row.currentStock}</td>
                      <td className="px-2 py-1">{row.quality || "-"}</td>
                      <td className="px-2 py-1">{row.imageUrl || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewRows.length > 8 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Showing first 8 rows. All {previewRows.length} rows will be imported.
                </p>
              )}
            </div>
          )}

          {previewErrors.length > 0 && (
            <div className="mt-3 overflow-x-auto rounded-lg border border-amber-500/20 bg-amber-500/5 p-2">
              <p className="mb-2 text-xs font-medium text-foreground">Skipped rows ({previewErrors.length})</p>
              <table className="min-w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/70 text-left text-muted-foreground">
                    <th className="px-2 py-1 font-medium">Row</th>
                    <th className="px-2 py-1 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {previewErrors.slice(0, 8).map((error) => (
                    <tr key={`error-${error.rowNumber}-${error.reason}`} className="border-b border-border/40 text-foreground">
                      <td className="px-2 py-1">{error.rowNumber}</td>
                      <td className="px-2 py-1">{error.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewErrors.length > 8 && (
                <p className="mt-2 text-xs text-muted-foreground">Showing first 8 skipped rows.</p>
              )}
            </div>
          )}

          {lastImportSummary && (
            <div className="mt-3 rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-xs text-foreground">
              <p className="font-semibold">Last bulk import summary</p>
              <p className="mt-1 text-muted-foreground">
                Imported: {lastImportSummary.importedCount} | Skipped: {lastImportSummary.skippedCount} | Duplicate skips: {lastImportSummary.duplicateSkippedCount}
              </p>
              <p className="mt-0.5 text-muted-foreground">Completed at {formatDateTime(lastImportSummary.createdAt, preferences)}</p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
