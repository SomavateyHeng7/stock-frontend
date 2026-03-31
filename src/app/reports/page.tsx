"use client";

import { useEffect, useState } from "react";
import { SmartStockShell } from "@/components/smartstock-shell";
import { EmptyState, ErrorState, HelpHint, LoadingState } from "@/components/ui/data-state";
import { useToast } from "@/components/ui/toast-provider";
import { exportLowStockCsv, exportLowStockPdf } from "@/lib/report-export";
import { readNotificationSettings } from "@/lib/notification-settings";
import { getLowStockSlaRows } from "@/lib/smartstock-data";

export default function ReportsPage() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [settings, setSettings] = useState(() => readNotificationSettings());
  const [rows, setRows] = useState(() => getLowStockSlaRows(readNotificationSettings().slaHours));

  const loadReports = () => {
    setIsLoading(true);
    try {
      const nextSettings = readNotificationSettings();
      const nextRows = getLowStockSlaRows(nextSettings.slaHours);
      setSettings(nextSettings);
      setRows(nextRows);
      setLoadError(null);
    } catch {
      setLoadError("Unable to load reporting data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleCsvExport = () => {
    try {
      exportLowStockCsv(rows);
      showToast({ title: "CSV export started", description: "Your low-stock report is downloading." });
    } catch {
      showToast({ title: "CSV export failed", description: "Please retry export." });
    }
  };

  const handlePdfExport = () => {
    try {
      exportLowStockPdf(rows, settings.slaHours);
      showToast({ title: "PDF export opened", description: "Use your print dialog to save the report." });
    } catch {
      showToast({ title: "PDF export failed", description: "Please retry export." });
    }
  };

  const breachedCount = rows.filter((item) => item.slaBreached).length;
  const reorderTotal = rows.reduce((sum, row) => sum + row.reorderQty, 0);

  if (isLoading) {
    return (
      <SmartStockShell
        title="Reporting and export"
        subtitle="Export low-stock SLA reports as CSV or PDF."
      >
        <section className="space-y-4" aria-label="Reports loading">
          <LoadingState
            title="Loading reports"
            description="Preparing SLA metrics and export rows."
            rows={3}
          />
        </section>
      </SmartStockShell>
    );
  }

  if (loadError) {
    return (
      <SmartStockShell
        title="Reporting and export"
        subtitle="Export low-stock SLA reports as CSV or PDF."
      >
        <section className="space-y-4" aria-label="Reports error">
          <ErrorState
            description={loadError}
            onRetry={loadReports}
            retryLabel="Retry reports"
            hint="Confirm notification settings are available, then retry."
          />
        </section>
      </SmartStockShell>
    );
  }

  return (
    <SmartStockShell
      title="Reporting and export"
      subtitle="Export low-stock SLA reports as CSV or PDF."
    >
      <section className="space-y-4" aria-label="Reports">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Low/Out Items</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{rows.length}</p>
          </article>
          <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">SLA Breaches</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{breachedCount}</p>
          </article>
          <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Reorder Qty</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{reorderTotal}</p>
          </article>
          <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">SLA Threshold</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{settings.slaHours}h</p>
          </article>
        </div>

        <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-foreground">Low-stock SLA report</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCsvExport}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={handlePdfExport}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
              >
                Export PDF
              </button>
            </div>
          </div>

          {rows.length === 0 ? (
            <EmptyState
              className="mt-3"
              title="No low-stock SLA rows"
              description="All tracked products are currently within healthy stock levels."
              actionLabel="Refresh report"
              onAction={loadReports}
              hint="Rows appear automatically once products fall below threshold."
            />
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border/70 text-left text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Product</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Stock</th>
                    <th className="px-2 py-2 font-medium">Reorder</th>
                    <th className="px-2 py-2 font-medium">Age (h)</th>
                    <th className="px-2 py-2 font-medium">SLA</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-border/40 text-foreground">
                      <td className="px-2 py-2">{row.name}</td>
                      <td className="px-2 py-2">{row.status}</td>
                      <td className="px-2 py-2">{row.currentStock}</td>
                      <td className="px-2 py-2">{row.reorderQty}</td>
                      <td className="px-2 py-2">{row.ageHours}</td>
                      <td className="px-2 py-2">
                        <span className="inline-flex rounded-full border border-border bg-muted px-2 py-0.5 text-xs">
                          {row.slaBreached ? "Breached" : "OK"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <HelpHint description="Use CSV for spreadsheet analysis and PDF for supplier review calls and compliance snapshots." />
      </section>
    </SmartStockShell>
  );
}
