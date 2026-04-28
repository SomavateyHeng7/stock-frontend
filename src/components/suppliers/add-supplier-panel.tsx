"use client";

import { FormEvent, useState } from "react";
import * as XLSX from "xlsx";
import { useToast } from "@/components/ui/toast-provider";
import { SupplierReliability } from "@/lib/smartstock-data";

export type LeadTimeHistoryEntry = {
  from: number;
  to: number;
  changedAt: string;
};

export type SupplierRow = {
  id: number;
  name: string;
  leadTimeDays: number;
  phone: string;
  nextDelivery: string;
  reliability: SupplierReliability;
  contactVerified: boolean;
  leadTimeHistory: LeadTimeHistoryEntry[];
};

type SupplierImportRow = {
  name: string;
  phone: string;
  leadTimeDays: number;
  nextDelivery: string;
  reliability: SupplierReliability;
  contactVerified: boolean;
};

type SupplierImportError = {
  rowNumber: number;
  reason: string;
};

type AddSupplierPanelProps = {
  setSuppliers: React.Dispatch<React.SetStateAction<SupplierRow[]>>;
  initialMode?: "choose" | "manual" | "bulk";
  initialFormOpen?: boolean;
};

const allowedReliability = new Set<SupplierReliability>(["High", "Medium", "Low"]);

export function AddSupplierPanel({ setSuppliers, initialMode = "choose", initialFormOpen = false }: AddSupplierPanelProps) {
  const { showToast } = useToast();

  const [entryMode, setEntryMode] = useState<"choose" | "manual" | "bulk">(initialMode);
  const [showManualForm, setShowManualForm] = useState(initialFormOpen);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState<number>(3);
  const [nextDelivery, setNextDelivery] = useState("Pending");
  const [reliability, setReliability] = useState<SupplierReliability>("Medium");

  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<SupplierImportRow[]>([]);
  const [previewErrors, setPreviewErrors] = useState<SupplierImportError[]>([]);

  const canSaveSupplier =
    name.trim().length > 0 && phone.trim().length > 0 && Number.isFinite(leadTimeDays) && leadTimeDays > 0;

  const addSupplier = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSaveSupplier) return;

    const supplierName = name.trim();

    setSuppliers((current) => [
      ...current,
      {
        id: current.length === 0 ? 1 : Math.max(...current.map((item) => item.id)) + 1,
        name: supplierName,
        phone: phone.trim(),
        leadTimeDays: Math.max(1, leadTimeDays),
        nextDelivery: nextDelivery.trim() || "Pending",
        reliability,
        contactVerified: false,
        leadTimeHistory: [],
      },
    ]);

    showToast({
      title: "Supplier added",
      description: `${supplierName} created. Verify contact before ordering.`,
    });

    setName("");
    setPhone("");
    setLeadTimeDays(3);
    setNextDelivery("Pending");
    setReliability("Medium");
  };

  const downloadCsvTemplate = () => {
    const lines = [
      "name,phone,leadTimeDays,nextDelivery,reliability,contactVerified",
      "Golden Rice Trading,+855 12 111 222,3,Mar 25,High,true",
      "Kampot Food Wholesale,+855 12 333 444,2,Mar 24,Medium,false",
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "smartstock-supplier-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcelTemplate = () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["name", "phone", "leadTimeDays", "nextDelivery", "reliability", "contactVerified"],
      ["Golden Rice Trading", "+855 12 111 222", 3, "Mar 25", "High", true],
      ["Kampot Food Wholesale", "+855 12 333 444", 2, "Mar 24", "Medium", false],
    ]);

    XLSX.utils.book_append_sheet(workbook, worksheet, "Suppliers");
    XLSX.writeFile(workbook, "smartstock-supplier-template.xlsx");
  };

  const previewSuppliersFromFile = async (event: FormEvent<HTMLFormElement>) => {
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

      const parsedRows: SupplierImportRow[] = [];
      const errors: SupplierImportError[] = [];

      rows.forEach((row, index) => {
        const rowNumber = index + 2;
        const rowName = String(row.name ?? "").trim();
        const rowPhone = String(row.phone ?? "").trim();
        const leadTimeRaw = row.leadTimeDays ?? row.leadTime ?? 0;
        const rowLeadTime = Number(leadTimeRaw);
        const nextDeliveryValue = String(row.nextDelivery ?? "Pending").trim() || "Pending";

        const reliabilityRaw = String(row.reliability ?? "Medium").trim();
        const normalizedReliability =
          reliabilityRaw.charAt(0).toUpperCase() + reliabilityRaw.slice(1).toLowerCase();

        const contactVerifiedRaw = String(row.contactVerified ?? "false").trim().toLowerCase();
        const contactVerified = ["true", "1", "yes", "y"].includes(contactVerifiedRaw);

        if (!rowName) {
          errors.push({ rowNumber, reason: "Missing supplier name" });
          return;
        }

        if (!rowPhone) {
          errors.push({ rowNumber, reason: "Missing supplier phone" });
          return;
        }

        if (!Number.isFinite(rowLeadTime) || rowLeadTime <= 0) {
          errors.push({ rowNumber, reason: "Invalid leadTimeDays (must be > 0)" });
          return;
        }

        if (!allowedReliability.has(normalizedReliability as SupplierReliability)) {
          errors.push({ rowNumber, reason: "Reliability must be High, Medium, or Low" });
          return;
        }

        parsedRows.push({
          name: rowName,
          phone: rowPhone,
          leadTimeDays: Math.max(1, Math.round(rowLeadTime)),
          nextDelivery: nextDeliveryValue,
          reliability: normalizedReliability as SupplierReliability,
          contactVerified,
        });
      });

      if (parsedRows.length === 0) {
        showToast({
          title: "No valid rows",
          description:
            "Use template columns: name, phone, leadTimeDays, nextDelivery, reliability, contactVerified.",
        });
        setPreviewRows([]);
        setPreviewErrors(errors);
        return;
      }

      setPreviewRows(parsedRows);
      setPreviewErrors(errors);
      showToast({
        title: "Preview ready",
        description: `${parsedRows.length} valid row${parsedRows.length > 1 ? "s" : ""}${errors.length > 0 ? `, ${errors.length} skipped` : ""}.`,
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

    setSuppliers((current) => {
      const nextId = current.length === 0 ? 1 : Math.max(...current.map((item) => item.id)) + 1;
      const additions: SupplierRow[] = previewRows.map((row, index) => ({
        id: nextId + index,
        name: row.name,
        phone: row.phone,
        leadTimeDays: row.leadTimeDays,
        nextDelivery: row.nextDelivery,
        reliability: row.reliability,
        contactVerified: row.contactVerified,
        leadTimeHistory: [],
      }));

      return [...current, ...additions];
    });

    setBulkFile(null);
    setPreviewRows([]);
    setPreviewErrors([]);
    showToast({
      title: "Import successful",
      description: `${previewRows.length} supplier${previewRows.length > 1 ? "s" : ""} imported.`,
    });
  };

  return (
    <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Supplier input mode</p>
        <p className="text-sm text-muted-foreground">
          Choose one method first: upload supplier file, or add suppliers manually one by one.
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
            <h3 className="text-sm font-semibold text-foreground">Manual supplier entry</h3>
            <button
              type="button"
              onClick={() => setShowManualForm((current) => !current)}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
            >
              {showManualForm ? "Hide form" : "Add supplier"}
            </button>
          </div>

          {showManualForm && (
            <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={addSupplier}>
              <label className="grid gap-1 text-sm text-muted-foreground">
                Supplier name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Supplier name"
                  className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                />
              </label>
              <label className="grid gap-1 text-sm text-muted-foreground">
                Phone
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Phone"
                  className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                />
              </label>
              <label className="grid gap-1 text-sm text-muted-foreground">
                Lead time (days)
                <input
                  type="number"
                  min={1}
                  value={leadTimeDays}
                  onChange={(event) => setLeadTimeDays(Number(event.target.value))}
                  className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                />
              </label>
              <label className="grid gap-1 text-sm text-muted-foreground">
                Next delivery
                <input
                  value={nextDelivery}
                  onChange={(event) => setNextDelivery(event.target.value)}
                  placeholder="e.g. Mar 30"
                  className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                />
              </label>
              <label className="grid gap-1 text-sm text-muted-foreground">
                Reliability
                <select
                  value={reliability}
                  onChange={(event) => setReliability(event.target.value as SupplierReliability)}
                  className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </label>
              <div className="flex items-end sm:col-span-2">
                <button
                  type="submit"
                  disabled={!canSaveSupplier}
                  className="h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save supplier
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {entryMode === "bulk" && (
        <div className="mt-4 rounded-xl border border-border/70 bg-muted/20 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">Bulk import suppliers (CSV or Excel)</h3>
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

          <form className="mt-3 flex flex-wrap items-center gap-2" onSubmit={previewSuppliersFromFile}>
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

          <p className="mt-2 text-xs text-muted-foreground">
            Required columns: <span className="font-medium">name, phone, leadTimeDays, nextDelivery, reliability, contactVerified</span>
          </p>

          {previewRows.length > 0 && (
            <div className="mt-3 overflow-x-auto rounded-lg border border-border/70 bg-background p-2">
              <p className="mb-2 text-xs font-medium text-foreground">Import preview ({previewRows.length} rows)</p>
              <table className="min-w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/70 text-left text-muted-foreground">
                    <th className="px-2 py-1 font-medium">Name</th>
                    <th className="px-2 py-1 font-medium">Phone</th>
                    <th className="px-2 py-1 font-medium">Lead Time</th>
                    <th className="px-2 py-1 font-medium">Reliability</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.slice(0, 8).map((row, index) => (
                    <tr key={`${row.name}-${index}`} className="border-b border-border/40 text-foreground">
                      <td className="px-2 py-1">{row.name}</td>
                      <td className="px-2 py-1">{row.phone}</td>
                      <td className="px-2 py-1">{row.leadTimeDays}</td>
                      <td className="px-2 py-1">{row.reliability}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {previewErrors.length > 0 && (
            <div className="mt-3 overflow-x-auto rounded-lg border border-border/70 bg-background p-2">
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
            </div>
          )}
        </div>
      )}
    </article>
  );
}
