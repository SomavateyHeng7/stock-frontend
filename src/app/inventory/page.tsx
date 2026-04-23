"use client";

import { useEffect, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { AddProductPanel, type InventoryProduct } from "../../components/inventory/add-product-panel";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { SmartStockShell } from "@/components/smartstock-shell";
import { EmptyState, ErrorState, HelpHint, LoadingState } from "@/components/ui/data-state";
import { useToast } from "@/components/ui/toast-provider";
import { formatCurrencyAmount, formatDateTime } from "@/lib/user-preferences";
import {
  getStatusClass,
  getStockStatus,
  getThirtyDayForecast,
  readSmartStockState,
  writeSmartStockProducts,
} from "@/lib/smartstock-data";
import {
  appendMovements,
  ensureProductsInLedger,
  getInventoryLedgerState,
  getOnHandQty,
  saveInventoryLedgerState,
} from "@/lib/inventory-ledger";
import {
  Archive,
  ArrowUpDown,
  BarChart3,
  Check,
  Download,
  History,
  MapPin,
  Minus,
  Package,
  Plus,
  Search,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

type ViewMode = "grid" | "table";
type TabView = "overview" | "adjust" | "movements";

type StockFilter = "all" | "low" | "good" | "out";

type SavedInventoryView = {
  id: string;
  name: string;
  branchId: string;
  searchQuery: string;
  stockFilter: StockFilter;
};

const SAVED_VIEWS_KEY = "smartstock.inventory.saved-views.v1";
const ARCHIVED_PRODUCTS_KEY = "smartstock.inventory.archived-product-ids.v1";

export default function InventoryPage() {
  const { showToast } = useToast();
  const preferences = useUserPreferences();
  const [products, setProducts] = useState<InventoryProduct[]>(() =>
    readSmartStockState().products as InventoryProduct[],
  );
  const [supplierDirectory, setSupplierDirectory] = useState(() => readSmartStockState().suppliers);
  const [ledgerState, setLedgerState] = useState(() => getInventoryLedgerState());
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(ledgerState.branches[0]?.id ?? "");
  const [selectedProductId, setSelectedProductId] = useState<number>(() => products[0]?.id ?? 1);
  const [adjustment, setAdjustment] = useState<number>(0);
  const [actor, setActor] = useState("Store manager");
  const [reason, setReason] = useState("Manual stock correction");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activeTab, setActiveTab] = useState<TabView>("overview");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

  const [savedViews, setSavedViews] = useState<SavedInventoryView[]>([]);
  const [newViewName, setNewViewName] = useState("");

  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [bulkAdjustment, setBulkAdjustment] = useState<number>(0);
  const [bulkTag, setBulkTag] = useState("");
  const [archivedProductIds, setArchivedProductIds] = useState<number[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  const [detailProductId, setDetailProductId] = useState<number | null>(null);
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<number | null>(null);

  useEffect(() => {
    if (!detailProductId) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDetailProductId(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [detailProductId]);

  const getUnitPrice = (item: InventoryProduct) => {
    if ("unitPrice" in item && typeof item.unitPrice === "number") {
      return item.unitPrice;
    }
    return 0;
  };

  const bootstrapInventory = () => {
    setIsBootstrapping(true);
    try {
      const latestLedger = getInventoryLedgerState();
      const latestState = readSmartStockState();
      setSupplierDirectory(latestState.suppliers);
      const normalizedLedger = ensureProductsInLedger(
        latestLedger,
        products.map((item) => item.id),
      );
      setLedgerState(normalizedLedger);
      if (!selectedBranchId && normalizedLedger.branches[0]) {
        setSelectedBranchId(normalizedLedger.branches[0].id);
      }
      setBootstrapError(null);
    } catch {
      setBootstrapError("Inventory data could not be loaded.");
    } finally {
      setIsBootstrapping(false);
    }
  };

  useEffect(() => {
    bootstrapInventory();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedViewRaw = window.localStorage.getItem(SAVED_VIEWS_KEY);
      if (savedViewRaw) {
        const parsed = JSON.parse(savedViewRaw) as SavedInventoryView[];
        if (Array.isArray(parsed)) {
          setSavedViews(parsed);
        }
      }

      const archivedRaw = window.localStorage.getItem(ARCHIVED_PRODUCTS_KEY);
      if (archivedRaw) {
        const parsedArchived = JSON.parse(archivedRaw) as number[];
        if (Array.isArray(parsedArchived)) {
          setArchivedProductIds(parsedArchived.filter((id) => Number.isInteger(id)));
        }
      }
    } catch {
      showToast({
        title: "Settings reset",
        description: "Saved views could not be loaded and were reset.",
      });
    }
  }, [showToast]);

  useEffect(() => {
    setLedgerState((current) =>
      ensureProductsInLedger(
        current,
        products.map((item) => item.id),
      ),
    );
  }, [products]);

  useEffect(() => {
    writeSmartStockProducts(products);
  }, [products]);

  useEffect(() => {
    saveInventoryLedgerState(ledgerState);
  }, [ledgerState]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(savedViews));
  }, [savedViews]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ARCHIVED_PRODUCTS_KEY, JSON.stringify(archivedProductIds));
  }, [archivedProductIds]);

  const selectedProduct = useMemo(
    () => products.find((item) => item.id === selectedProductId) ?? products[0],
    [products, selectedProductId],
  );

  const detailProduct = useMemo(
    () => (detailProductId ? products.find((item) => item.id === detailProductId) ?? null : null),
    [products, detailProductId],
  );

  const selectedOnHand = selectedProduct ? getOnHandQty(ledgerState, selectedBranchId, selectedProduct.id) : 0;

  const filteredProducts = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    let filtered = products;

    if (!showArchived) {
      filtered = filtered.filter((item) => !archivedProductIds.includes(item.id));
    }

    if (keyword) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(keyword) ||
          (item.quality ?? "").toLowerCase().includes(keyword),
      );
    }

    if (stockFilter !== "all") {
      filtered = filtered.filter((item) => {
        const scopedQty = getOnHandQty(ledgerState, selectedBranchId, item.id);
        const status = getStockStatus({ ...item, currentStock: scopedQty });

        if (stockFilter === "low") return status === "Low Stock";
        if (stockFilter === "good") return status === "In Stock";
        if (stockFilter === "out") return status === "Out of Stock";
        return true;
      });
    }

    return filtered;
  }, [products, searchQuery, stockFilter, ledgerState, selectedBranchId, archivedProductIds, showArchived]);

  const inventoryStats = useMemo(() => {
    const stats = {
      totalProducts: products.length,
      totalValue: 0,
      lowStock: 0,
      outOfStock: 0,
    };

    products.forEach((item) => {
      const scopedQty = getOnHandQty(ledgerState, selectedBranchId, item.id);
      const status = getStockStatus({ ...item, currentStock: scopedQty });

      stats.totalValue += scopedQty * getUnitPrice(item);
      if (status === "Low Stock") stats.lowStock++;
      if (status === "Out of Stock") stats.outOfStock++;
    });

    return stats;
  }, [products, ledgerState, selectedBranchId]);

  const movementRows = useMemo(
    () =>
      ledgerState.movements
        .filter((item) => item.branchId === selectedBranchId)
        .filter((item) => (selectedProduct ? item.productId === selectedProduct.id : true))
        .slice(0, 20),
    [ledgerState.movements, selectedBranchId, selectedProduct],
  );

  const detailMovementRows = useMemo(() => {
    if (!detailProduct) return [];
    return ledgerState.movements
      .filter((item) => item.productId === detailProduct.id)
      .slice(0, 6);
  }, [detailProduct, ledgerState.movements]);

  const detailForecast = useMemo(() => {
    if (!detailProduct) return [];
    return getThirtyDayForecast(detailProduct).slice(0, 7);
  }, [detailProduct]);

  const branchById = useMemo(
    () => Object.fromEntries(ledgerState.branches.map((branch) => [branch.id, branch.name])),
    [ledgerState.branches],
  );

  const visibleProductIds = useMemo(() => filteredProducts.map((item) => item.id), [filteredProducts]);

  const allVisibleSelected =
    visibleProductIds.length > 0 && visibleProductIds.every((productId) => selectedProductIds.includes(productId));

  const bulkSelectedCount = selectedProductIds.length;

  const applyAdjustment = () => {
    if (!selectedProduct) return;

    if (adjustment === 0) {
      showToast({
        title: "No adjustment saved",
        description: "Enter a non-zero adjustment value.",
      });
      return;
    }

    const nextLedger = appendMovements(ledgerState, {
      branchId: selectedBranchId,
      actor,
      reason,
      entries: [
        {
          productId: selectedProduct.id,
          type: "manual_adjustment",
          quantity: Math.abs(adjustment),
          stockDelta: adjustment,
          reference: `inventory-adjustment:${selectedProduct.id}`,
        },
      ],
    });

    setLedgerState(nextLedger);
    setAdjustment(0);
    showToast({
      title: "Stock updated",
      description: `${selectedProduct.name} adjusted by ${adjustment > 0 ? `+${adjustment}` : adjustment} at ${ledgerState.branches.find((item) => item.id === selectedBranchId)?.name ?? "location"}.`,
    });
  };

  const onProductsAdded = (addedProducts: InventoryProduct[]) => {
    if (addedProducts.length === 0) return;

    const seededLedger = appendMovements(
      ensureProductsInLedger(
        ledgerState,
        addedProducts.map((item) => item.id),
      ),
      {
        branchId: selectedBranchId,
        actor,
        reason: "Initial product stock setup",
        entries: addedProducts.map((item) => ({
          productId: item.id,
          type: "manual_adjustment" as const,
          quantity: Math.max(0, item.currentStock),
          stockDelta: Math.max(0, item.currentStock),
          reference: `product-create:${item.id}`,
        })),
      },
    );

    setLedgerState(seededLedger);
  };

  const toggleProductSelection = (productId: number) => {
    setSelectedProductIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedProductIds((current) => current.filter((id) => !visibleProductIds.includes(id)));
      return;
    }

    setSelectedProductIds((current) => {
      const merged = new Set([...current, ...visibleProductIds]);
      return Array.from(merged);
    });
  };

  const clearBulkSelection = () => {
    setSelectedProductIds([]);
  };

  const applyBulkAdjustment = () => {
    if (bulkSelectedCount === 0) {
      showToast({
        title: "No products selected",
        description: "Select at least one product for bulk adjustment.",
      });
      return;
    }

    if (bulkAdjustment === 0) {
      showToast({
        title: "No adjustment applied",
        description: "Enter a non-zero bulk adjustment value.",
      });
      return;
    }

    const nextLedger = appendMovements(ledgerState, {
      branchId: selectedBranchId,
      actor,
      reason: reason.trim() || "Bulk inventory adjustment",
      entries: selectedProductIds.map((productId) => ({
        productId,
        type: "manual_adjustment" as const,
        quantity: Math.abs(bulkAdjustment),
        stockDelta: bulkAdjustment,
        reference: `inventory-bulk-adjustment:${productId}`,
      })),
    });

    setLedgerState(nextLedger);
    setBulkAdjustment(0);
    showToast({
      title: "Bulk adjustment applied",
      description: `${selectedProductIds.length} products adjusted by ${bulkAdjustment > 0 ? `+${bulkAdjustment}` : bulkAdjustment}.`,
    });
  };

  const applyBulkTag = () => {
    if (bulkSelectedCount === 0) {
      showToast({
        title: "No products selected",
        description: "Select products before applying a tag.",
      });
      return;
    }

    if (bulkTag.trim().length === 0) {
      showToast({
        title: "Tag required",
        description: "Enter a tag/quality label to apply.",
      });
      return;
    }

    const normalizedTag = bulkTag.trim();
    setProducts((current) =>
      current.map((item) =>
        selectedProductIds.includes(item.id)
          ? {
              ...item,
              quality: normalizedTag,
            }
          : item,
      ),
    );

    setBulkTag("");
    showToast({
      title: "Bulk tag applied",
      description: `${selectedProductIds.length} products tagged as ${normalizedTag}.`,
    });
  };

  const exportSelectedProducts = () => {
    if (bulkSelectedCount === 0) {
      showToast({
        title: "No products selected",
        description: "Select products before export.",
      });
      return;
    }

    const selectedRows = products.filter((item) => selectedProductIds.includes(item.id));
    const lines = [
      ["id", "name", "quality", "onHand", "status", "branch", "value"].join(","),
      ...selectedRows.map((item) => {
        const onHand = getOnHandQty(ledgerState, selectedBranchId, item.id);
        const status = getStockStatus({ ...item, currentStock: onHand });
        const value = (onHand * getUnitPrice(item)).toFixed(2);
        return [
          item.id,
          `"${item.name.replaceAll("\"", "\"\"")}"`,
          `"${(item.quality ?? "").replaceAll("\"", "\"\"")}"`,
          onHand,
          status,
          branchById[selectedBranchId] ?? selectedBranchId,
          value,
        ].join(",");
      }),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `smartstock-inventory-selection-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    showToast({
      title: "Export complete",
      description: `${selectedRows.length} selected products exported as CSV.`,
    });
  };

  const archiveSelectedProducts = () => {
    if (bulkSelectedCount === 0) {
      showToast({
        title: "No products selected",
        description: "Select products to archive.",
      });
      return;
    }

    setArchivedProductIds((current) => Array.from(new Set([...current, ...selectedProductIds])));
    setSelectedProductIds([]);
    showToast({
      title: "Products archived",
      description: `${bulkSelectedCount} products archived from default view.`,
    });
  };

  const unarchiveProduct = (productId: number) => {
    setArchivedProductIds((current) => current.filter((id) => id !== productId));
    showToast({
      title: "Product restored",
      description: "Product moved back to active inventory list.",
    });
  };

  const deleteProductPermanently = (productId: number) => {
    const target = products.find((item) => item.id === productId);
    setProducts((current) => current.filter((item) => item.id !== productId));
    setArchivedProductIds((current) => current.filter((id) => id !== productId));
    setSelectedProductIds((current) => current.filter((id) => id !== productId));
    if (selectedProductId === productId) {
      const remaining = products.filter((item) => item.id !== productId);
      setSelectedProductId(remaining[0]?.id ?? 0);
    }
    setDetailProductId(null);
    setConfirmDeleteProductId(null);
    showToast({
      title: "Product deleted",
      description: `${target?.name ?? "Product"} permanently removed from inventory.`,
    });
  };

  const deleteSelectedProducts = () => {
    if (bulkSelectedCount === 0) {
      showToast({
        title: "No products selected",
        description: "Select products to delete.",
      });
      return;
    }

    const names = products
      .filter((item) => selectedProductIds.includes(item.id))
      .map((item) => item.name)
      .join(", ");

    setProducts((current) => current.filter((item) => !selectedProductIds.includes(item.id)));
    setArchivedProductIds((current) => current.filter((id) => !selectedProductIds.includes(id)));
    if (selectedProductIds.includes(selectedProductId)) {
      const remaining = products.filter((item) => !selectedProductIds.includes(item.id));
      setSelectedProductId(remaining[0]?.id ?? 0);
    }
    const count = bulkSelectedCount;
    setSelectedProductIds([]);
    showToast({
      title: "Products deleted",
      description: `${count} product${count !== 1 ? "s" : ""} permanently deleted (${names}).`,
    });
  };

  const saveCurrentView = () => {
    if (newViewName.trim().length === 0) {
      showToast({
        title: "View name required",
        description: "Enter a name before saving this filter view.",
      });
      return;
    }

    const nextView: SavedInventoryView = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: newViewName.trim(),
      branchId: selectedBranchId,
      searchQuery,
      stockFilter,
    };

    setSavedViews((current) => [nextView, ...current].slice(0, 12));
    setNewViewName("");
    showToast({
      title: "View saved",
      description: `${nextView.name} is now available in saved segments.`,
    });
  };

  const applySavedView = (view: SavedInventoryView) => {
    setSelectedBranchId(view.branchId);
    setSearchQuery(view.searchQuery);
    setStockFilter(view.stockFilter);
    setActiveTab("overview");

    showToast({
      title: "View applied",
      description: `Loaded ${view.name}.`,
    });
  };

  const deleteSavedView = (viewId: string) => {
    setSavedViews((current) => current.filter((view) => view.id !== viewId));
  };

  if (isBootstrapping) {
    return (
      <SmartStockShell title="Inventory Management" subtitle="Track stock levels, adjust quantities, and monitor movements across locations.">
        <section className="space-y-4" aria-label="Inventory loading">
          <LoadingState
            title="Loading inventory"
            description="Syncing branch stock and recent movement history."
            rows={4}
          />
        </section>
      </SmartStockShell>
    );
  }

  if (bootstrapError) {
    return (
      <SmartStockShell title="Inventory Management" subtitle="Track stock levels, adjust quantities, and monitor movements across locations.">
        <section className="space-y-4" aria-label="Inventory error">
          <ErrorState
            description={bootstrapError}
            onRetry={bootstrapInventory}
            retryLabel="Retry inventory"
            hint="Check browser local storage permissions if the issue repeats."
          />
        </section>
      </SmartStockShell>
    );
  }

  return (
    <>
      <SmartStockShell title="Inventory Management" subtitle="Track stock levels, adjust quantities, and monitor movements across locations.">
        <section className="space-y-6" aria-label="Inventory">
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <MapPin className="h-5 w-5" />
                  <span>Current Location</span>
                </div>
                <select
                  value={selectedBranchId}
                  onChange={(event) => setSelectedBranchId(event.target.value)}
                  className="mt-3 h-14 w-full rounded-xl border border-border bg-background px-4 text-xl font-semibold text-foreground"
                >
                  {ledgerState.branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:col-span-3">
              <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                    <p className="text-3xl font-bold text-foreground">{inventoryStats.totalProducts}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-green-500/10 p-3">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Stock Value</p>
                    <p className="text-3xl font-bold text-foreground">${inventoryStats.totalValue.toFixed(0)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-yellow-500/10 p-3">
                    <TrendingDown className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                    <p className="text-3xl font-bold text-foreground">{inventoryStats.lowStock}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card shadow-sm">
            <div className="border-b border-border/70 px-4">
              <div className="flex gap-6 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`relative flex items-center gap-2 px-2 py-4 text-base font-semibold ${
                    activeTab === "overview" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Package className="h-5 w-5" />
                  <span>Inventory Overview</span>
                  {activeTab === "overview" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>

                <button
                  onClick={() => setActiveTab("adjust")}
                  className={`relative flex items-center gap-2 px-2 py-4 text-base font-semibold ${
                    activeTab === "adjust" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ArrowUpDown className="h-5 w-5" />
                  <span>Stock Adjustment</span>
                  {activeTab === "adjust" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>

                <button
                  onClick={() => setActiveTab("movements")}
                  className={`relative flex items-center gap-2 px-2 py-4 text-base font-semibold ${
                    activeTab === "movements" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <History className="h-5 w-5" />
                  <span>Movement History</span>
                  {activeTab === "movements" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
              </div>
            </div>

            <div className="p-4">
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
                    <div className="space-y-3">
                      <div className="rounded-xl border border-border/70 bg-card/80 p-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                          <input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search products by name or quality..."
                            className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-3 text-base text-foreground"
                          />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <div className="flex items-center gap-1 rounded-xl border border-border bg-background p-1.5">
                            <button
                              onClick={() => setStockFilter("all")}
                              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                                stockFilter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              All
                            </button>
                            <button
                              onClick={() => setStockFilter("low")}
                              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                                stockFilter === "low" ? "bg-yellow-500 text-white" : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Low
                            </button>
                            <button
                              onClick={() => setStockFilter("good")}
                              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                                stockFilter === "good" ? "bg-green-500 text-white" : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Good
                            </button>
                            <button
                              onClick={() => setStockFilter("out")}
                              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                                stockFilter === "out" ? "bg-red-500 text-white" : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Out
                            </button>
                          </div>

                          <div className="flex items-center gap-1 rounded-xl border border-border bg-background p-1.5">
                            <button
                              type="button"
                              onClick={() => setViewMode("grid")}
                              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                                viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                              }`}
                            >
                              Grid
                            </button>
                            <button
                              type="button"
                              onClick={() => setViewMode("table")}
                              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                                viewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                              }`}
                            >
                              Table
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setShowArchived((current) => !current)}
                            className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground"
                          >
                            {showArchived ? "Hide Archived" : `Show Archived (${archivedProductIds.length})`}
                          </button>
                        </div>
                      </div>

                      <div className="rounded-xl border border-border/70 bg-card/80 p-3">
                        <AddProductPanel
                          products={products}
                          setProducts={setProducts}
                          setSelectedProductId={setSelectedProductId}
                          onProductsAdded={onProductsAdded}
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saved Views</p>
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <input
                          value={newViewName}
                          onChange={(event) => setNewViewName(event.target.value)}
                          placeholder="Save current filters as..."
                          className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                        />
                        <button
                          type="button"
                          onClick={saveCurrentView}
                          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                        >
                          Save View
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {savedViews.length === 0 && (
                          <span className="text-xs text-muted-foreground">No saved filters yet.</span>
                        )}
                        {savedViews.map((view) => (
                          <div key={view.id} className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1">
                            <button
                              type="button"
                              onClick={() => applySavedView(view)}
                              className="text-xs font-medium text-foreground"
                            >
                              {view.name}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSavedView(view.id)}
                              className="rounded p-0.5 text-muted-foreground hover:bg-muted"
                              aria-label={`Delete ${view.name}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAllVisible}
                          className="h-4 w-4 rounded border-border"
                        />
                        <span className="text-sm font-medium text-foreground">
                          {bulkSelectedCount} selected
                        </span>
                      </div>
                      {bulkSelectedCount > 0 && (
                        <button
                          type="button"
                          onClick={clearBulkSelection}
                          className="text-xs font-medium text-muted-foreground"
                        >
                          Clear selection
                        </button>
                      )}
                    </div>

                    <div className="mt-3 grid gap-2 lg:grid-cols-4">
                      <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-background p-2">
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                        <input
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9-]*"
                          value={bulkAdjustment}
                          onChange={(event) => setBulkAdjustment(Number(event.target.value))}
                          className="h-10 w-full rounded border border-border bg-background px-2 text-sm text-foreground"
                          placeholder="Bulk adjust"
                        />
                        <button
                          type="button"
                          onClick={applyBulkAdjustment}
                          className="h-10 rounded bg-primary px-3 text-sm font-semibold text-primary-foreground"
                        >
                          Apply
                        </button>
                      </div>

                      <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-background p-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <input
                          value={bulkTag}
                          onChange={(event) => setBulkTag(event.target.value)}
                          className="h-10 w-full rounded border border-border bg-background px-2 text-sm text-foreground"
                          placeholder="Bulk tag"
                        />
                        <button
                          type="button"
                          onClick={applyBulkTag}
                          className="h-10 rounded bg-primary px-3 text-sm font-semibold text-primary-foreground"
                        >
                          Apply
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={exportSelectedProducts}
                        className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Export Selected
                      </button>

                      <button
                        type="button"
                        onClick={archiveSelectedProducts}
                        className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground"
                      >
                        <Archive className="h-3.5 w-3.5" />
                        Archive Selected
                      </button>

                      <button
                        type="button"
                        onClick={deleteSelectedProducts}
                        className="flex h-10 items-center justify-center gap-2 rounded-lg border border-red-400/50 bg-red-500/10 px-3 text-sm font-medium text-red-700 dark:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Selected
                      </button>
                    </div>
                  </div>

                  {viewMode === "grid" ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {filteredProducts.map((item) => {
                        const scopedQty = getOnHandQty(ledgerState, selectedBranchId, item.id);
                        const status = getStockStatus({ ...item, currentStock: scopedQty });
                        const isSelected = selectedProductIds.includes(item.id);
                        const isArchived = archivedProductIds.includes(item.id);

                        return (
                          <div
                            key={item.id}
                            className="group relative rounded-xl border border-border/70 bg-muted/20 p-4 transition-all hover:border-primary/50 hover:shadow-md"
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleProductSelection(item.id)}
                                className="h-4 w-4 rounded border-border"
                              />
                              {isArchived && (
                                <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  Archived
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => setDetailProductId(item.id)}
                              className="block w-full text-left"
                            >
                              <div className="relative mb-3 aspect-square overflow-hidden rounded-lg border border-border/70 bg-background">
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <Package className="h-12 w-12 text-muted-foreground/50" />
                                  </div>
                                )}

                                <div className="absolute right-2 top-2">
                                  <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium shadow-sm ${getStatusClass(status)}`}>
                                    {status}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div>
                                  <h4 className="line-clamp-1 font-semibold text-foreground">{item.name}</h4>
                                  {item.quality && <p className="text-xs text-muted-foreground">{item.quality}</p>}
                                </div>

                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Stock</p>
                                    <p className="text-lg font-bold text-foreground">{scopedQty}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Value</p>
                                    <p className="text-sm font-semibold text-foreground">${(scopedQty * getUnitPrice(item)).toFixed(2)}</p>
                                  </div>
                                </div>
                              </div>
                            </button>

                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedProductId(item.id);
                                  setActiveTab("adjust");
                                }}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground"
                              >
                                Adjust
                              </button>
                              {isArchived && (
                                <button
                                  type="button"
                                  onClick={() => unarchiveProduct(item.id)}
                                  className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground"
                                >
                                  Restore
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {filteredProducts.length === 0 && (
                        <EmptyState
                          className="col-span-full"
                          title="No matching products"
                          description="Your current filters returned no products in this location."
                          actionLabel="Clear filters"
                          onAction={() => {
                            setSearchQuery("");
                            setStockFilter("all");
                          }}
                          hint="Try a saved view like 'Low stock Phnom Penh' for quick triage."
                        />
                      )}
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-border/70 bg-background shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-border/70 bg-muted/30">
                              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select</th>
                              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quality/Tag</th>
                              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">On Hand</th>
                              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Value</th>
                              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {filteredProducts.map((item) => {
                              const scopedQty = getOnHandQty(ledgerState, selectedBranchId, item.id);
                              const status = getStockStatus({ ...item, currentStock: scopedQty });

                              return (
                                <tr key={item.id} className="transition-colors hover:bg-muted/20">
                                  <td className="px-3 py-3">
                                    <input
                                      type="checkbox"
                                      checked={selectedProductIds.includes(item.id)}
                                      onChange={() => toggleProductSelection(item.id)}
                                      className="h-4 w-4 rounded border-border"
                                    />
                                  </td>
                                  <td className="px-3 py-3 text-sm font-medium text-foreground">{item.name}</td>
                                  <td className="px-3 py-3 text-sm text-muted-foreground">{item.quality || "-"}</td>
                                  <td className="px-3 py-3 text-right text-sm font-semibold text-foreground">{scopedQty}</td>
                                  <td className="px-3 py-3 text-sm">
                                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusClass(status)}`}>
                                      {status}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 text-right text-sm text-foreground">${(scopedQty * getUnitPrice(item)).toFixed(2)}</td>
                                  <td className="px-3 py-3">
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setDetailProductId(item.id)}
                                        className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium text-foreground"
                                      >
                                        Details
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedProductId(item.id);
                                          setActiveTab("adjust");
                                        }}
                                        className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium text-foreground"
                                      >
                                        Adjust
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "adjust" && (
                <div className="mx-auto max-w-2xl pb-24 sm:pb-0">
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-6">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <ArrowUpDown className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Stock Adjustment</h3>
                        <p className="text-sm text-muted-foreground">Update inventory quantities with full audit trail</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="productSelect">
                          Select Product
                        </label>
                        <select
                          id="productSelect"
                          value={selectedProductId}
                          onChange={(event) => setSelectedProductId(Number(event.target.value))}
                          className="h-12 w-full rounded-lg border border-border bg-background px-3 text-foreground"
                        >
                          {products.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} - {getOnHandQty(ledgerState, selectedBranchId, item.id)} units
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedProduct && (
                        <div className="rounded-lg border border-border bg-background p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-16 w-16 overflow-hidden rounded-md border border-border">
                                {selectedProduct.imageUrl ? (
                                  <img
                                    src={selectedProduct.imageUrl}
                                    alt={selectedProduct.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-muted">
                                    <Package className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{selectedProduct.name}</p>
                                <p className="text-sm text-muted-foreground">${getUnitPrice(selectedProduct).toFixed(2)} per unit</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Current Stock</p>
                              <p className="text-3xl font-bold text-foreground">{selectedOnHand}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="adjustmentInput">
                          Adjustment Amount
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setAdjustment((v) => v - 1)}
                            className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-background text-foreground"
                          >
                            <Minus className="h-5 w-5" />
                          </button>
                          <input
                            id="adjustmentInput"
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9-]*"
                            value={adjustment}
                            onChange={(event) => setAdjustment(Number(event.target.value))}
                            className="h-12 flex-1 rounded-lg border border-border bg-background px-3 text-center text-lg font-semibold text-foreground"
                          />
                          <button
                            type="button"
                            onClick={() => setAdjustment((v) => v + 1)}
                            className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-background text-foreground"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="mt-2 grid grid-cols-4 gap-2">
                          <button
                            type="button"
                            className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground"
                            onClick={() => setAdjustment((v) => v + 5)}
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground"
                            onClick={() => setAdjustment((v) => v + 10)}
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground"
                            onClick={() => setAdjustment((v) => v - 5)}
                          >
                            -5
                          </button>
                          <button
                            type="button"
                            className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground"
                            onClick={() => setAdjustment((v) => v - 10)}
                          >
                            -10
                          </button>
                        </div>

                        {adjustment !== 0 && (
                          <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                            <p className="text-sm font-medium text-foreground">
                              New stock will be: <span className="text-lg font-bold text-primary">{selectedOnHand + adjustment}</span>
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="actorInput">
                          Performed By
                        </label>
                        <input
                          id="actorInput"
                          value={actor}
                          onChange={(event) => setActor(event.target.value)}
                          className="h-12 w-full rounded-lg border border-border bg-background px-3 text-foreground"
                          placeholder="e.g., Store manager, John Doe"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="reasonInput">
                          Reason for Adjustment
                        </label>
                        <input
                          id="reasonInput"
                          value={reason}
                          onChange={(event) => setReason(event.target.value)}
                          className="h-12 w-full rounded-lg border border-border bg-background px-3 text-foreground"
                          placeholder="e.g., Stock count correction, Damaged goods"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setAdjustment(0)}
                          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-medium text-foreground"
                        >
                          <X className="h-4 w-4" />
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={applyAdjustment}
                          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                          disabled={adjustment === 0}
                        >
                          <Check className="h-4 w-4" />
                          Save Adjustment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "movements" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Movement History</h3>
                      <p className="text-sm text-muted-foreground">
                        Audit trail for {branchById[selectedBranchId] ?? "selected branch"}
                        {selectedProduct ? ` · ${selectedProduct.name}` : " · All products"}
                      </p>
                    </div>

                    <button className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground">
                      <Download className="h-4 w-4" />
                      Export
                    </button>
                  </div>

                  {movementRows.length === 0 ? (
                    <EmptyState
                      title="No movement records yet"
                      description="Stock adjustments and delivery updates will appear here."
                      actionLabel="Open stock adjustment"
                      onAction={() => setActiveTab("adjust")}
                      hint="Record your first adjustment to create a complete audit trail."
                      icon={History}
                    />
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-border/70 bg-background shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-border/70 bg-muted/30">
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timestamp</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quantity</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Change</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actor</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {movementRows.map((movement) => {
                              const product = products.find((p) => p.id === movement.productId);
                              return (
                                <tr key={movement.id} className="transition-colors hover:bg-muted/20">
                                  <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">
                                    {formatDateTime(movement.createdAt, preferences)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-foreground">
                                    <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/30 px-2.5 py-0.5 text-xs font-medium">
                                      {movement.type.replaceAll("_", " ")}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-foreground">{product?.name ?? "Unknown"}</td>
                                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-foreground">{movement.quantity}</td>
                                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold">
                                    <span className={`inline-flex items-center gap-1 ${movement.stockDelta > 0 ? "text-green-600" : "text-red-600"}`}>
                                      {movement.stockDelta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                      {movement.stockDelta > 0 ? `+${movement.stockDelta}` : movement.stockDelta}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-muted-foreground">{movement.actor}</td>
                                  <td className="px-4 py-3 text-sm text-muted-foreground">{movement.reason}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <HelpHint description="Use product details for quick supplier and forecast context, then run bulk actions from selected rows/cards for faster daily operations." />
        </section>
      </SmartStockShell>

      {activeTab === "adjust" && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 p-3 backdrop-blur sm:hidden">
          <div className="mx-auto flex max-w-2xl gap-2">
            <button
              type="button"
              onClick={() => setAdjustment(0)}
              className="flex h-12 flex-1 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium text-foreground"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={applyAdjustment}
              disabled={adjustment === 0}
              className="flex h-12 flex-1 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              Save Adjustment
            </button>
          </div>
        </div>
      )}

      {detailProduct && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40 sm:bg-black/35"
          role="dialog"
          aria-modal="true"
          aria-label={`Product details for ${detailProduct.name}`}
          onClick={() => setDetailProductId(null)}
          onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>) => {
            if (event.key === "Escape") {
              setDetailProductId(null);
            }
          }}
        >
          <div
            className="h-full w-full max-w-full overflow-y-auto border-0 bg-background p-4 shadow-2xl sm:max-w-xl sm:border-l sm:border-border sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 -mx-4 -mt-4 border-b border-border/70 bg-background/95 px-4 pb-3 pt-4 backdrop-blur sm:-mx-5 sm:-mt-5 sm:px-5 sm:pb-4 sm:pt-5">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border sm:hidden" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product Details</p>
                  <h2 className="mt-1 text-2xl font-semibold text-foreground">{detailProduct.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{detailProduct.quality || "No tag"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailProductId(null)}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:bg-muted/40"
                  aria-label="Close product details"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProductId(detailProduct.id);
                    setActiveTab("adjust");
                    setDetailProductId(null);
                  }}
                  className="min-h-11 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Adjust Stock
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProductId(detailProduct.id);
                    setActiveTab("movements");
                    setDetailProductId(null);
                  }}
                  className="min-h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted/30"
                >
                  View Full History
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border/70 bg-card p-3 sm:mt-5 sm:p-4">
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">On hand ({branchById[selectedBranchId] ?? selectedBranchId})</p>
                  <p className="text-xl font-bold text-foreground">{getOnHandQty(ledgerState, selectedBranchId, detailProduct.id)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <span className={`mt-1 inline-flex rounded-full border px-2 py-1 text-xs font-medium ${getStatusClass(getStockStatus({ ...detailProduct, currentStock: getOnHandQty(ledgerState, selectedBranchId, detailProduct.id) }))}`}>
                    {getStockStatus({ ...detailProduct, currentStock: getOnHandQty(ledgerState, selectedBranchId, detailProduct.id) })}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground">Estimated Value</p>
                  <p className="text-lg font-semibold text-foreground">
                    {formatCurrencyAmount(getOnHandQty(ledgerState, selectedBranchId, detailProduct.id) * getUnitPrice(detailProduct), preferences)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Recent Daily Sales</p>
                  <p className="text-lg font-semibold text-foreground">{detailProduct.todaySales}</p>
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-border/70 bg-card p-3 sm:mt-4 sm:p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Supplier</p>
              {(() => {
                const supplier = supplierDirectory.find((item) => item.id === detailProduct.supplierId);
                if (!supplier) {
                  return <p className="mt-2 text-sm text-muted-foreground">No supplier linked.</p>;
                }

                return (
                  <div className="mt-2 space-y-1.5 text-sm">
                    <p className="font-medium text-foreground">{supplier.name}</p>
                    <p className="text-muted-foreground">Phone: {supplier.phone}</p>
                    <p className="text-muted-foreground">Lead Time: {supplier.leadTimeDays} days</p>
                    <a href="/suppliers" className="inline-flex text-xs font-medium text-foreground underline-offset-4 hover:underline">
                      Open suppliers
                    </a>
                  </div>
                );
              })()}
            </div>

            <div className="mt-3 rounded-xl border border-border/70 bg-card p-3 sm:mt-4 sm:p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Forecast Snippet (7 days)</p>
                <a href="/forecast" className="text-xs font-medium text-foreground underline-offset-4 hover:underline">Open forecast</a>
              </div>
              <div className="mt-3 flex min-w-max items-end gap-1 overflow-x-auto rounded-lg border border-border/70 bg-muted/20 p-2">
                {detailForecast.map((value, index) => {
                  const max = Math.max(...detailForecast, 1);
                  const height = Math.max(16, Math.round((value / max) * 72));
                  return (
                    <div key={`forecast-${index}`} className="flex w-full flex-col items-center gap-1">
                      <div className="w-full rounded-sm bg-primary" style={{ height }} title={`Day ${index + 1}: ${value}`} />
                      <span className="text-[10px] text-muted-foreground">D{index + 1}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-border/70 bg-card p-3 sm:mt-4 sm:p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Movements</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProductId(detailProduct.id);
                    setActiveTab("movements");
                    setDetailProductId(null);
                  }}
                  className="min-h-9 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted/30"
                >
                  Full history
                </button>
              </div>

              {detailMovementRows.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No movements yet for this product.</p>
              ) : (
                <ul className="mt-2 space-y-2.5">
                  {detailMovementRows.map((entry) => (
                    <li key={entry.id} className="rounded-lg border border-border/70 bg-muted/20 p-2.5">
                      <p className="text-xs font-medium text-foreground">{entry.type.replaceAll("_", " ")}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty {entry.quantity} · Δ {entry.stockDelta > 0 ? `+${entry.stockDelta}` : entry.stockDelta} · {branchById[entry.branchId] ?? entry.branchId}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt, preferences)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="sticky bottom-0 -mx-4 mt-4 border-t border-border/70 bg-background/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:-mx-5 sm:px-5 sm:pb-5">
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProductId(detailProduct.id);
                    setActiveTab("adjust");
                    setDetailProductId(null);
                  }}
                  className="min-h-11 flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Adjust Product
                </button>
                <button
                  type="button"
                  onClick={() => { setDetailProductId(null); setConfirmDeleteProductId(null); }}
                  className="min-h-11 flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/30"
                >
                  Close
                </button>
              </div>
              <div className="mt-2">
                {confirmDeleteProductId === detailProduct.id ? (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2">
                    <p className="flex-1 text-xs font-medium text-red-600 dark:text-red-400">Delete permanently? This cannot be undone.</p>
                    <button
                      type="button"
                      onClick={() => deleteProductPermanently(detailProduct.id)}
                      className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
                    >
                      Yes, delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteProductId(null)}
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteProductId(detailProduct.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-400/40 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Product
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
