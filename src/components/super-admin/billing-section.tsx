"use client";

import { AlertTriangle, ArrowDownRight, CreditCard, DollarSign, TrendingUp } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { StatCard } from "./stat-card";
import { TransactionBadge } from "./badges";
import { TRANSACTIONS } from "./data";

export function BillingSection() {
  const { showToast } = useToast();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Billing & Revenue</h2>
        <p className="text-sm text-muted-foreground">Platform-wide revenue overview and transaction history</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={DollarSign} label="MRR" value="$1,653" trend="+8.2%" trendUp sub="Apr 2026" />
        <StatCard icon={TrendingUp} label="ARR Run-rate" value="$19,836" trend="+8.2%" trendUp />
        <StatCard icon={CreditCard} label="Avg Revenue / Tenant" value="$207" sub="per active tenant" />
        <StatCard icon={ArrowDownRight} label="Churn Rate" value="1.2%" sub="net revenue churn" />
      </div>

      {/* Transactions */}
      <div className="rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
          <button
            type="button"
            onClick={() => showToast({ title: "CSV exported", description: "Transaction history download starting.", severity: "success", persistToCenter: false })}
            className="text-xs font-medium text-primary hover:underline"
          >
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/70 bg-muted/30">
                {["Invoice", "Tenant", "Plan", "Amount", "Date", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {TRANSACTIONS.map((tx) => (
                <tr key={tx.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tx.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{tx.tenant}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{tx.plan}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">
                    {tx.amount === 0 ? <span className="text-muted-foreground">—</span> : `$${tx.amount}`}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{tx.date}</td>
                  <td className="px-4 py-3"><TransactionBadge status={tx.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment failure alert */}
      <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-medium text-foreground">1 payment failure requires action</p>
          <p className="text-xs text-muted-foreground">Crestline MFG — invoice #inv_006 failed on Mar 22. Tenant has been notified.</p>
        </div>
        <button
          type="button"
          onClick={() => showToast({ title: "Payment retry queued", description: "Retrying invoice #inv_006 for Crestline MFG.", severity: "info", persistToCenter: false })}
          className="ml-auto shrink-0 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
