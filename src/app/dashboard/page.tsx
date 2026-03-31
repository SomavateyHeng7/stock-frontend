"use client";

import { useEffect, useState } from "react";
import { SmartStockShell } from "@/components/smartstock-shell";
import { EmptyState, ErrorState, HelpHint, LoadingState } from "@/components/ui/data-state";
import { useToast } from "@/components/ui/toast-provider";
import { getEnrichedProducts, getStatusClass, getWeeklyTotals } from "@/lib/smartstock-data";
import {
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  BarChart3,
  Zap,
  Bell,
} from "lucide-react";

export default function DashboardPage() {
  const [expanded, setExpanded] = useState(false);
  const [orderedIds, setOrderedIds] = useState<number[]>([]);
  const [enrichedProducts, setEnrichedProducts] = useState<ReturnType<typeof getEnrichedProducts>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { showToast } = useToast();

  const getUnitPrice = (item: unknown) => {
    if (
      item &&
      typeof item === "object" &&
      "unitPrice" in item &&
      typeof (item as { unitPrice: unknown }).unitPrice === "number"
    ) {
      return (item as { unitPrice: number }).unitPrice;
    }
    return 0;
  };

  const loadDashboard = () => {
    setIsLoading(true);
    try {
      setEnrichedProducts(getEnrichedProducts());
      setLoadError(null);
    } catch {
      setLoadError("Failed to load dashboard inventory metrics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const lowStockItems = enrichedProducts.filter((item) => item.status === "Low Stock");
  const stockoutItems = enrichedProducts.filter((item) => item.status === "Out of Stock");
  const goodStockItems = enrichedProducts.filter((item) => item.status === "In Stock");
  const reorderItems = enrichedProducts.filter(
    (item) => (item.status === "Low Stock" || item.status === "Out of Stock") && item.reorderQty > 0,
  );
  const weeklyTotals = getWeeklyTotals();
  const salesThisWeek = weeklyTotals.reduce((sum, value) => sum + value, 0);

  // Calculate total inventory value
  const totalInventoryValue = enrichedProducts.reduce(
    (sum, item) => sum + item.currentStock * getUnitPrice(item),
    0,
  );

  // Calculate reorder value
  const reorderValue = reorderItems.reduce(
    (sum, item) => sum + item.reorderQty * getUnitPrice(item),
    0,
  );

  const urgentItems = enrichedProducts.filter(
    (item) => item.status === "Low Stock" || item.status === "Out of Stock" || item.status === "Overstocked",
  );
  const visibleItems = expanded ? urgentItems : urgentItems.slice(0, 5);

  const markOrdered = (productId: number, productName: string, reorderQty: number) => {
    if (orderedIds.includes(productId)) return;
    setOrderedIds((current) => [...current, productId]);
    showToast({
      title: "Reorder confirmed",
      description: `${productName}: ${reorderQty} units marked as ordered.`,
    });
  };

  // Top selling products this week (mock - would come from sales data)
  const topProducts = [...enrichedProducts]
    .sort((a, b) => (b.currentStock - a.currentStock))
    .slice(0, 3);

  if (isLoading) {
    return (
      <SmartStockShell
        title="Dashboard"
        subtitle="Real-time inventory insights and actionable alerts for smarter stock decisions."
      >
        <section className="space-y-4" aria-label="Dashboard loading">
          <LoadingState
            title="Loading dashboard"
            description="Crunching inventory metrics and alerts."
            rows={5}
          />
        </section>
      </SmartStockShell>
    );
  }

  if (loadError) {
    return (
      <SmartStockShell
        title="Dashboard"
        subtitle="Real-time inventory insights and actionable alerts for smarter stock decisions."
      >
        <section className="space-y-4" aria-label="Dashboard error">
          <ErrorState
            description={loadError}
            onRetry={loadDashboard}
            retryLabel="Retry dashboard"
            hint="If this persists, confirm inventory data exists and reload the app."
          />
        </section>
      </SmartStockShell>
    );
  }

  if (enrichedProducts.length === 0) {
    return (
      <SmartStockShell
        title="Dashboard"
        subtitle="Real-time inventory insights and actionable alerts for smarter stock decisions."
      >
        <section className="space-y-4" aria-label="Dashboard empty">
          <EmptyState
            title="No inventory data yet"
            description="Add your first products to unlock alerts, reorder insights, and sales trends."
            actionLabel="Go to inventory"
            onAction={() => {
              window.location.href = "/inventory";
            }}
            hint="Use Import CSV in Inventory for faster setup."
          />
        </section>
      </SmartStockShell>
    );
  }

  return (
    <SmartStockShell 
      title="Dashboard" 
      subtitle="Real-time inventory insights and actionable alerts for smarter stock decisions."
    >
      <section className="space-y-6" aria-label="Dashboard">
        {/* Quick Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Products */}
          <article className="group relative overflow-hidden rounded-2xl border border-border/70 bg-linear-to-br from-card to-card/50 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{enrichedProducts.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {goodStockItems.length} in good stock
                </p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </article>

          {/* Low Stock */}
          <article className="group relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-linear-to-br from-yellow-500/5 to-yellow-500/0 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
                <p className="mt-2 text-3xl font-bold text-yellow-600">{lowStockItems.length}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3 w-3" />
                  Requires attention
                </p>
              </div>
              <div className="rounded-lg bg-yellow-500/10 p-3">
                <TrendingDown className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </article>

          {/* Stockout */}
          <article className="group relative overflow-hidden rounded-2xl border border-red-500/20 bg-linear-to-br from-red-500/5 to-red-500/0 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                <p className="mt-2 text-3xl font-bold text-red-600">{stockoutItems.length}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <XCircle className="h-3 w-3" />
                  Lost sales risk
                </p>
              </div>
              <div className="rounded-lg bg-red-500/10 p-3">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </article>

          {/* Sales This Week */}
          <article className="group relative overflow-hidden rounded-2xl border border-green-500/20 bg-linear-to-br from-green-500/5 to-green-500/0 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Sales This Week</p>
                <p className="mt-2 text-3xl font-bold text-green-600">{salesThisWeek}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  Units sold
                </p>
              </div>
              <div className="rounded-lg bg-green-500/10 p-3">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </article>
        </div>

        {/* Financial Summary */}
        <div className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-3">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inventory Value</p>
                <p className="text-2xl font-bold text-foreground">${totalInventoryValue.toFixed(0)}</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-3">
                <ShoppingCart className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reorder Queue</p>
                <p className="text-2xl font-bold text-foreground">{reorderItems.length} items</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-500/10 p-3">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reorder Value</p>
                <p className="text-2xl font-bold text-foreground">${reorderValue.toFixed(0)}</p>
              </div>
            </div>
          </article>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Action Items - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            {/* Urgent Actions */}
            <article className="rounded-2xl border border-border/70 bg-card shadow-sm">
              <div className="border-b border-border/70 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-red-500/10 p-2">
                      <Zap className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Action Required</h2>
                      <p className="text-sm text-muted-foreground">
                        {urgentItems.length} items need immediate attention
                      </p>
                    </div>
                  </div>
                  {urgentItems.length > 5 && (
                    <button
                      type="button"
                      className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                      onClick={() => setExpanded((prev) => !prev)}
                    >
                      {expanded ? "Show less" : `View all ${urgentItems.length}`}
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4">
                {visibleItems.length === 0 ? (
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-12 text-center">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
                    <p className="mt-3 font-medium text-foreground">All clear!</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      No urgent stock issues at the moment
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {visibleItems.map((item) => (
                      <li
                        key={item.id}
                        className="group rounded-xl border border-border/70 bg-muted/20 p-4 transition-all hover:border-primary/50 hover:bg-muted/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground">{item.name}</p>
                              <span
                                className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusClass(item.status)}`}
                              >
                                {item.status}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{item.reason}</p>
                            
                            {item.reorderQty > 0 && (
                              <div className="mt-3 flex items-center gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Current: </span>
                                  <span className="font-semibold text-foreground">{item.currentStock}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Reorder: </span>
                                  <span className="font-semibold text-primary">{item.reorderQty} units</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Cost: </span>
                                  <span className="font-semibold text-foreground">
                                    ${(item.reorderQty * getUnitPrice(item)).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {item.reorderQty > 0 && (
                          <button
                            type="button"
                            disabled={orderedIds.includes(item.id)}
                            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                              orderedIds.includes(item.id)
                                ? "border border-green-500/20 bg-green-500/10 text-green-700"
                                : "bg-primary text-primary-foreground hover:opacity-90"
                            }`}
                            onClick={() => markOrdered(item.id, item.name, item.reorderQty)}
                          >
                            {orderedIds.includes(item.id) ? (
                              <>
                                <CheckCircle2 className="h-4 w-4" />
                                Marked as Ordered
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="h-4 w-4" />
                                Reorder {item.reorderQty} units
                              </>
                            )}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>

            {/* Weekly Sales Chart */}
            <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Sales This Week</h3>
                  <p className="text-sm text-muted-foreground">Daily unit sales breakdown</p>
                </div>
              </div>

              <div className="mt-6 flex items-end justify-between gap-2">
                {weeklyTotals.map((value, index) => {
                  const maxValue = Math.max(...weeklyTotals);
                  const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;
                  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

                  return (
                    <div key={index} className="flex flex-1 flex-col items-center gap-2">
                      <div className="relative w-full">
                        <div
                          className="w-full rounded-t-lg bg-primary/20 transition-all hover:bg-primary/30"
                          style={{ height: `${Math.max(heightPercent, 5)}px` }}
                        >
                          <div
                            className="w-full rounded-t-lg bg-primary transition-all"
                            style={{ height: `${Math.max(heightPercent * 0.7, 3)}px` }}
                          />
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-foreground">{value}</p>
                      <p className="text-xs text-muted-foreground">{days[index]}</p>
                    </div>
                  );
                })}
              </div>
            </article>
          </div>

          {/* Sidebar - Takes 1 column */}
          <div className="space-y-4">
            {/* Top Products */}
            <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-500/10 p-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Top Stock Items</h3>
                  <p className="text-sm text-muted-foreground">Highest inventory</p>
                </div>
              </div>

              <ul className="mt-4 space-y-3">
                {topProducts.map((item, index) => (
                  <li key={item.id} className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/20 p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.currentStock} units</p>
                    </div>
                  </li>
                ))}
              </ul>
            </article>

            {/* Quick Actions */}
            <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-500/10 p-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Quick Actions</h3>
                  <p className="text-sm text-muted-foreground">Common tasks</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <button className="flex w-full items-center justify-between rounded-lg border border-border bg-background p-3 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                  <span>View All Products</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button className="flex w-full items-center justify-between rounded-lg border border-border bg-background p-3 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                  <span>Add New Product</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button className="flex w-full items-center justify-between rounded-lg border border-border bg-background p-3 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                  <span>Adjust Stock Levels</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button className="flex w-full items-center justify-between rounded-lg border border-border bg-background p-3 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                  <span>View Reports</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </article>

            {/* Alerts Summary */}
            <article className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-500/10 p-2">
                  <Bell className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Alert Summary</h3>
                  <p className="text-sm text-muted-foreground">Last 24 hours</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border/70 bg-background p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-sm text-foreground">Critical</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{stockoutItems.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/70 bg-background p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span className="text-sm text-foreground">Warning</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{lowStockItems.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/70 bg-background p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm text-foreground">Normal</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{goodStockItems.length}</span>
                </div>
              </div>
            </article>
          </div>
        </div>

        <HelpHint description="Prioritize 'Out of Stock' items first, then clear low-stock items with highest reorder value to protect weekly sales." />
      </section>
    </SmartStockShell>
  );
}