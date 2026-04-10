import { formatDateTime, readUserPreferences } from "@/lib/user-preferences";

type ExportRow = {
  name: string;
  status: string;
  currentStock: number;
  reorderQty: number;
  coverageDays: number;
  ageHours: number;
  slaBreached: boolean;
  supplierName?: string;
};

function escapeCsv(value: string | number | boolean) {
  const text = String(value);
  if (text.includes(",") || text.includes("\n") || text.includes('"')) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function exportLowStockCsv(rows: ExportRow[]) {
  const headers = [
    "Product",
    "Status",
    "Current Stock",
    "Recommended Reorder Qty",
    "Coverage Days",
    "Age (Hours)",
    "SLA Breached",
    "Supplier",
  ];

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.name,
        row.status,
        row.currentStock,
        row.reorderQty,
        row.coverageDays,
        row.ageHours,
        row.slaBreached ? "Yes" : "No",
        row.supplierName ?? "Unassigned",
      ]
        .map(escapeCsv)
        .join(","),
    ),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `smartstock-low-stock-report-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportLowStockPdf(rows: ExportRow[], slaHours: number) {
  const generatedAt = formatDateTime(new Date().toISOString(), readUserPreferences());

  const tableRows = rows
    .map(
      (row) => `
      <tr>
        <td>${row.name}</td>
        <td>${row.status}</td>
        <td>${row.currentStock}</td>
        <td>${row.reorderQty}</td>
        <td>${row.coverageDays}</td>
        <td>${row.ageHours}</td>
        <td>${row.slaBreached ? "Breached" : "Within SLA"}</td>
        <td>${row.supplierName ?? "Unassigned"}</td>
      </tr>
    `,
    )
    .join("");

  const html = `
    <html>
      <head>
        <title>SmartStock Low-Stock Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #2f2a24; }
          h1 { margin: 0 0 6px; }
          p { margin: 0 0 8px; color: #5d554a; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #d8d0c5; padding: 8px; font-size: 12px; text-align: left; }
          th { background: #f1ece4; }
          tr:nth-child(even) td { background: #faf7f2; }
        </style>
      </head>
      <body>
        <h1>SmartStock Low-Stock SLA Report</h1>
        <p>Generated at: ${generatedAt}</p>
        <p>SLA threshold: ${slaHours} hours</p>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Status</th>
              <th>Current Stock</th>
              <th>Reorder Qty</th>
              <th>Coverage (days)</th>
              <th>Age (hours)</th>
              <th>SLA Status</th>
              <th>Supplier</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1100,height=800");
  if (!printWindow) return;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
