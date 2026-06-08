"use client";

import {
	useEffect,
	useMemo,
	useState,
	type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
	AddProductPanel,
	type InventoryProduct,
} from "../../components/inventory/add-product-panel";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { SmartStockShell } from "@/components/smartstock-shell";
import {
	EmptyState,
	ErrorState,
	HelpHint,
	LoadingState,
} from "@/components/ui/data-state";
import { useToast } from "@/components/ui/toast-provider";
import { formatCurrencyAmount, formatDateTime } from "@/lib/user-preferences";
import { useT } from "@/lib/i18n";
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
	Grid2X2,
	History,
	List,
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
	const t = useT();

	const [products, setProducts] = useState<InventoryProduct[]>(() =>
		readSmartStockState().products as InventoryProduct[],
	);
	const [supplierDirectory, setSupplierDirectory] = useState(
		() => readSmartStockState().suppliers,
	);
	const [ledgerState, setLedgerState] = useState(() =>
		getInventoryLedgerState(),
	);

	const [isBootstrapping, setIsBootstrapping] = useState(true);
	const [bootstrapError, setBootstrapError] = useState<string | null>(null);
	const [selectedBranchId, setSelectedBranchId] = useState<string>(
		ledgerState.branches[0]?.id ?? "",
	);
	const [selectedProductId, setSelectedProductId] = useState<number>(
		() => products[0]?.id ?? 1,
	);

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
	const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<
		number | null
	>(null);

	useEffect(() => {
		if (!detailProductId) return;

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
					setArchivedProductIds(
						parsedArchived.filter((id) => Number.isInteger(id)),
					);
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

		window.localStorage.setItem(
			ARCHIVED_PRODUCTS_KEY,
			JSON.stringify(archivedProductIds),
		);
	}, [archivedProductIds]);

	const selectedProduct = useMemo(
		() => products.find((item) => item.id === selectedProductId) ?? products[0],
		[products, selectedProductId],
	);

	const detailProduct = useMemo(
		() =>
			detailProductId
				? products.find((item) => item.id === detailProductId) ?? null
				: null,
		[products, detailProductId],
	);

	const selectedOnHand = selectedProduct
		? getOnHandQty(ledgerState, selectedBranchId, selectedProduct.id)
		: 0;

	const filteredProducts = useMemo(() => {
		const keyword = searchQuery.trim().toLowerCase();

		let filtered = products;

		if (!showArchived) {
			filtered = filtered.filter(
				(item) => !archivedProductIds.includes(item.id),
			);
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
	}, [
		products,
		searchQuery,
		stockFilter,
		ledgerState,
		selectedBranchId,
		archivedProductIds,
		showArchived,
	]);

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
				.filter((item) =>
					selectedProduct ? item.productId === selectedProduct.id : true,
				)
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
		() =>
			Object.fromEntries(
				ledgerState.branches.map((branch) => [branch.id, branch.name]),
			),
		[ledgerState.branches],
	);

	const visibleProductIds = useMemo(
		() => filteredProducts.map((item) => item.id),
		[filteredProducts],
	);

	const allVisibleSelected =
		visibleProductIds.length > 0 &&
		visibleProductIds.every((productId) =>
			selectedProductIds.includes(productId),
		);

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
			description: `${selectedProduct.name} adjusted by ${
				adjustment > 0 ? `+${adjustment}` : adjustment
			} at ${
				ledgerState.branches.find((item) => item.id === selectedBranchId)
					?.name ?? "location"
			}.`,
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
			setSelectedProductIds((current) =>
				current.filter((id) => !visibleProductIds.includes(id)),
			);
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
			description: `${selectedProductIds.length} products adjusted by ${
				bulkAdjustment > 0 ? `+${bulkAdjustment}` : bulkAdjustment
			}.`,
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
				description: "Enter a tag or quality label to apply.",
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

		const selectedRows = products.filter((item) =>
			selectedProductIds.includes(item.id),
		);

		const lines = [
			["id", "name", "quality", "onHand", "status", "branch", "value"].join(
				",",
			),
			...selectedRows.map((item) => {
				const onHand = getOnHandQty(ledgerState, selectedBranchId, item.id);
				const status = getStockStatus({ ...item, currentStock: onHand });
				const value = (onHand * getUnitPrice(item)).toFixed(2);

				return [
					item.id,
					`"${item.name.replaceAll('"', '""')}"`,
					`"${(item.quality ?? "").replaceAll('"', '""')}"`,
					onHand,
					status,
					branchById[selectedBranchId] ?? selectedBranchId,
					value,
				].join(",");
			}),
		];

		const blob = new Blob([lines.join("\n")], {
			type: "text/csv;charset=utf-8;",
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");

		link.href = url;
		link.download = `smartstock-inventory-selection-${new Date()
			.toISOString()
			.slice(0, 10)}.csv`;
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

		setArchivedProductIds((current) =>
			Array.from(new Set([...current, ...selectedProductIds])),
		);
		setSelectedProductIds([]);

		showToast({
			title: "Products archived",
			description: `${bulkSelectedCount} products archived from default view.`,
		});
	};

	const unarchiveProduct = (productId: number) => {
		setArchivedProductIds((current) =>
			current.filter((id) => id !== productId),
		);

		showToast({
			title: "Product restored",
			description: "Product moved back to active inventory list.",
		});
	};

	const deleteProductPermanently = (productId: number) => {
		const target = products.find((item) => item.id === productId);

		setProducts((current) => current.filter((item) => item.id !== productId));
		setArchivedProductIds((current) =>
			current.filter((id) => id !== productId),
		);
		setSelectedProductIds((current) =>
			current.filter((id) => id !== productId),
		);

		if (selectedProductId === productId) {
			const remaining = products.filter((item) => item.id !== productId);
			setSelectedProductId(remaining[0]?.id ?? 0);
		}

		setDetailProductId(null);
		setConfirmDeleteProductId(null);

		showToast({
			title: "Product deleted",
			description: `${
				target?.name ?? "Product"
			} permanently removed from inventory.`,
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

		setProducts((current) =>
			current.filter((item) => !selectedProductIds.includes(item.id)),
		);
		setArchivedProductIds((current) =>
			current.filter((id) => !selectedProductIds.includes(id)),
		);

		if (selectedProductIds.includes(selectedProductId)) {
			const remaining = products.filter(
				(item) => !selectedProductIds.includes(item.id),
			);
			setSelectedProductId(remaining[0]?.id ?? 0);
		}

		const count = bulkSelectedCount;

		setSelectedProductIds([]);

		showToast({
			title: "Products deleted",
			description: `${count} product${
				count !== 1 ? "s" : ""
			} permanently deleted (${names}).`,
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
			<SmartStockShell
				title={t("inventory.title", "Inventory Management")}
				subtitle={t("inventory.subtitle", "Track stock levels, adjust quantities, and monitor movements across locations.")}
			>
				<section className="space-y-4" aria-label="Inventory loading">
					<LoadingState
						title={t("inventory.loading", "Loading inventory")}
						description={t("inventory.syncing", "Syncing branch stock and recent movement history.")}
						rows={4}
					/>
				</section>
			</SmartStockShell>
		);
	}

	if (bootstrapError) {
		return (
			<SmartStockShell
				title={t("inventory.title", "Inventory Management")}
				subtitle={t("inventory.subtitle", "Track stock levels, adjust quantities, and monitor movements across locations.")}
			>
				<section className="space-y-4" aria-label="Inventory error">
					<ErrorState
						description={bootstrapError}
						onRetry={bootstrapInventory}
						retryLabel={t("inventory.retry", "Retry inventory")}
						hint={t("inventory.checkPermissions", "Check browser local storage permissions if the issue repeats.")}
					/>
				</section>
			</SmartStockShell>
		);
	}

	return (
		<>
			<SmartStockShell
				title={t("inventory.title", "Inventory Management")}
				subtitle={t("inventory.subtitle", "Track stock levels, adjust quantities, and monitor movements across locations.")}
			>
				<section className="space-y-6" aria-label="Inventory">
					<div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
						<article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
							<div className="flex items-center gap-2">
								<div className="rounded-lg bg-primary/10 p-2 text-primary">
									<MapPin className="h-5 w-5" />
								</div>
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										{t("inventory.location", "Location")}
									</p>
									<p className="text-base font-semibold text-foreground">
										{branchById[selectedBranchId] ?? t("inventory.selectBranch", "Select branch")}
									</p>
								</div>
							</div>

							<select
								value={selectedBranchId}
								onChange={(event) => setSelectedBranchId(event.target.value)}
								className="mt-4 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground"
							>
								{ledgerState.branches.map((branch) => (
									<option key={branch.id} value={branch.id}>
										{branch.name}
									</option>
								))}
							</select>
						</article>

						<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
							<article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											{t("inventory.products", "Products")}
										</p>
										<p className="mt-1 text-3xl font-bold text-foreground">
											{inventoryStats.totalProducts}
										</p>
									</div>
									<div className="rounded-lg bg-primary/10 p-3 text-primary">
										<Package className="h-6 w-6" />
									</div>
								</div>
							</article>

							<article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											{t("inventory.stockValue", "Stock value")}
										</p>
										<p className="mt-1 text-3xl font-bold text-foreground">
											{formatCurrencyAmount(
												inventoryStats.totalValue,
												preferences,
											)}
										</p>
									</div>
									<div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-600">
										<BarChart3 className="h-6 w-6" />
									</div>
								</div>
							</article>

							<article className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 shadow-sm">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											{t("inventory.lowStock", "Low stock")}
										</p>
										<p className="mt-1 text-3xl font-bold text-foreground">
											{inventoryStats.lowStock}
										</p>
									</div>
									<div className="rounded-lg bg-amber-500/10 p-3 text-amber-600">
										<TrendingDown className="h-6 w-6" />
									</div>
								</div>
							</article>

							<article className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 shadow-sm">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											{t("inventory.outOfStock", "Out of stock")}
										</p>
										<p className="mt-1 text-3xl font-bold text-foreground">
											{inventoryStats.outOfStock}
										</p>
									</div>
									<div className="rounded-lg bg-red-500/10 p-3 text-red-600">
										<Package className="h-6 w-6" />
									</div>
								</div>
							</article>
						</div>
					</div>

					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="inline-flex rounded-xl border border-border bg-background p-1">
							<button
								type="button"
								onClick={() => setActiveTab("overview")}
								className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold ${
									activeTab === "overview"
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<Package className="h-4 w-4" />
								{t("inventory.overview", "Overview")}
							</button>

							<button
								type="button"
								onClick={() => setActiveTab("adjust")}
								className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold ${
									activeTab === "adjust"
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<ArrowUpDown className="h-4 w-4" />
								{t("inventory.adjust", "Adjust")}
							</button>

							<button
								type="button"
								onClick={() => setActiveTab("movements")}
								className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold ${
									activeTab === "movements"
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<History className="h-4 w-4" />
								{t("inventory.movements", "Movements")}
							</button>
						</div>

						{activeTab === "overview" && (
							<div className="inline-flex rounded-xl border border-border bg-background p-1">
								<button
									type="button"
									onClick={() => setViewMode("grid")}
									className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold ${
										viewMode === "grid"
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									<Grid2X2 className="h-4 w-4" />
									{t("inventory.grid", "Grid")}
								</button>

								<button
									type="button"
									onClick={() => setViewMode("table")}
									className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold ${
										viewMode === "table"
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									<List className="h-4 w-4" />
									{t("inventory.table", "Table")}
								</button>
							</div>
						)}
					</div>

					{activeTab === "overview" && (
						<div className="space-y-4">
							<article className="rounded-2xl border border-border/70 bg-card shadow-sm">
								<div className="border-b border-border/70 p-4">
									<div className="grid gap-3 xl:grid-cols-[1fr_auto]">
										<div className="relative">
											<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
											<input
												value={searchQuery}
												onChange={(event) =>
													setSearchQuery(event.target.value)
												}
												placeholder={t("inventory.search", "Search products by name or tag")}
												className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm text-foreground"
											/>
										</div>

										<div className="flex flex-wrap gap-2">
											<div className="inline-flex rounded-lg border border-border bg-background p-1">
												{(["all", "low", "good", "out"] as StockFilter[]).map(
													(filter) => (
														<button
															key={filter}
															type="button"
															onClick={() => setStockFilter(filter)}
															className={`h-9 rounded-md px-3 text-sm font-medium capitalize ${
																stockFilter === filter
																	? "bg-primary text-primary-foreground"
																	: "text-muted-foreground hover:text-foreground"
															}`}
														>
															{filter}
														</button>
													),
												)}
											</div>

											<button
												type="button"
												onClick={() =>
													setShowArchived((current) => !current)
												}
												className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted"
											>
												{showArchived
													? t("inventory.hideArchived", "Hide archived")
													: `${t("inventory.showArchived", "Show archived")} (${archivedProductIds.length})`}
											</button>
										</div>
									</div>
								</div>

								<div className="grid gap-4 p-4 xl:grid-cols-[1fr_360px]">
									<div className="rounded-xl border border-border/70 bg-background p-3">
										<AddProductPanel
											products={products}
											setProducts={setProducts}
											setSelectedProductId={setSelectedProductId}
											onProductsAdded={onProductsAdded}
										/>
									</div>

									<div className="rounded-xl border border-border/70 bg-background p-4">
										<div className="flex items-center justify-between gap-3">
											<div>
												<p className="text-sm font-semibold text-foreground">
													{t("inventory.savedViews", "Saved views")}
												</p>
												<p className="text-xs text-muted-foreground">
													{t("inventory.saveFiltersDesc", "Save filters for repeat checks.")}
												</p>
											</div>
										</div>

										<div className="mt-3 flex gap-2">
											<input
												value={newViewName}
												onChange={(event) =>
													setNewViewName(event.target.value)
												}
												placeholder={t("inventory.viewName", "View name")}
												className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
											/>

											<button
												type="button"
												onClick={saveCurrentView}
												className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
											>
												{t("inventory.save", "Save")}
											</button>
										</div>

										<div className="mt-3 flex flex-wrap gap-2">
											{savedViews.length === 0 && (
												<span className="text-xs text-muted-foreground">
													{t("inventory.noSavedViews", "No saved views yet.")}
												</span>
											)}

											{savedViews.map((view) => (
												<div
													key={view.id}
													className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1"
												>
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
														className="rounded-full p-0.5 text-muted-foreground hover:bg-muted"
														aria-label={`Delete ${view.name}`}
													>
														<X className="h-3 w-3" />
													</button>
												</div>
											))}
										</div>
									</div>
								</div>
							</article>

							{bulkSelectedCount > 0 && (
								<article className="rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm">
									<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
										<div className="flex items-center gap-3">
											<input
												type="checkbox"
												checked={allVisibleSelected}
												onChange={toggleSelectAllVisible}
												className="h-4 w-4 rounded border-border"
											/>

											<div>
												<p className="text-sm font-semibold text-foreground">
													{bulkSelectedCount} {t("inventory.selected", "selected")}
												</p>
												<button
													type="button"
													onClick={clearBulkSelection}
													className="text-xs font-medium text-muted-foreground hover:text-foreground"
												>
													{t("inventory.clearSelection", "Clear selection")}
												</button>
											</div>
										</div>

										<div className="grid gap-2 lg:grid-cols-[220px_220px_auto_auto_auto]">
											<div className="flex items-center gap-2 rounded-lg border border-border bg-background p-2">
												<ArrowUpDown className="h-4 w-4 text-muted-foreground" />
												<input
													type="number"
													inputMode="numeric"
													pattern="[0-9-]*"
													value={bulkAdjustment}
													onChange={(event) =>
														setBulkAdjustment(Number(event.target.value))
													}
													className="h-9 w-full rounded border border-border bg-background px-2 text-sm text-foreground"
													placeholder="Adjust"
												/>
												<button
													type="button"
													onClick={applyBulkAdjustment}
													className="h-9 rounded bg-primary px-3 text-sm font-semibold text-primary-foreground"
												>
													{t("inventory.apply", "Apply")}
												</button>
											</div>

											<div className="flex items-center gap-2 rounded-lg border border-border bg-background p-2">
												<Tag className="h-4 w-4 text-muted-foreground" />
												<input
													value={bulkTag}
													onChange={(event) => setBulkTag(event.target.value)}
													className="h-9 w-full rounded border border-border bg-background px-2 text-sm text-foreground"
													placeholder={t("inventory.tag", "Tag")}
												/>
												<button
													type="button"
													onClick={applyBulkTag}
													className="h-9 rounded bg-primary px-3 text-sm font-semibold text-primary-foreground"
												>
													{t("inventory.apply", "Apply")}
												</button>
											</div>

											<button
												type="button"
												onClick={exportSelectedProducts}
												className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"
											>
												<Download className="h-4 w-4" />
												{t("inventory.export", "Export")}
											</button>

											<button
												type="button"
												onClick={archiveSelectedProducts}
												className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"
											>
												<Archive className="h-4 w-4" />
												{t("inventory.archive", "Archive")}
											</button>

											<button
												type="button"
												onClick={deleteSelectedProducts}
												className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-red-400/40 bg-red-500/10 px-3 text-sm font-medium text-red-700 hover:bg-red-500/15 dark:text-red-400"
											>
												<Trash2 className="h-4 w-4" />
												{t("inventory.delete", "Delete")}
											</button>
										</div>
									</div>
								</article>
							)}

							{bulkSelectedCount === 0 && filteredProducts.length > 0 && (
								<div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-4 py-3 text-sm text-muted-foreground">
									<input
										type="checkbox"
										checked={allVisibleSelected}
										onChange={toggleSelectAllVisible}
										className="h-4 w-4 rounded border-border"
									/>
									<span>{t("inventory.selectVisibleInfo", "Select visible products for bulk actions.")}</span>
								</div>
							)}

							{viewMode === "grid" ? (
								<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
									{filteredProducts.map((item) => {
										const scopedQty = getOnHandQty(
											ledgerState,
											selectedBranchId,
											item.id,
										);
										const status = getStockStatus({
											...item,
											currentStock: scopedQty,
										});
										const isSelected = selectedProductIds.includes(item.id);
										const isArchived = archivedProductIds.includes(item.id);

										return (
											<article
												key={item.id}
												className={`group rounded-2xl border bg-card p-3 shadow-sm transition-all hover:border-primary/50 ${
													isSelected
														? "border-primary ring-2 ring-primary/20"
														: "border-border/70"
												}`}
											>
												<div className="mb-3 flex items-center justify-between">
													<input
														type="checkbox"
														checked={isSelected}
														onChange={() => toggleProductSelection(item.id)}
														className="h-4 w-4 rounded border-border"
													/>

													<div className="flex items-center gap-2">
														{isArchived && (
															<span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
																{t("inventory.archived", "Archived")}
															</span>
														)}

														<span
															className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusClass(
																status,
															)}`}
														>
															{status}
														</span>
													</div>
												</div>

												<button
													type="button"
													onClick={() => setDetailProductId(item.id)}
													className="block w-full text-left"
												>
													<div className="relative mb-3 aspect-square overflow-hidden rounded-xl border border-border/70 bg-background">
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
													</div>

													<h3 className="line-clamp-1 font-semibold text-foreground">
														{item.name}
													</h3>

													<p className="mt-1 text-xs text-muted-foreground">
														{item.quality || t("inventory.noTag", "No tag")}
													</p>

													<div className="mt-4 grid grid-cols-2 gap-3">
														<div>
															<p className="text-xs text-muted-foreground">{t("inventory.stock", "Stock")}</p>
															<p className="text-2xl font-bold text-foreground">
																{scopedQty}
															</p>
														</div>

														<div className="text-right">
															<p className="text-xs text-muted-foreground">{t("inventory.value", "Value")}</p>
															<p className="text-sm font-semibold text-foreground">
																{formatCurrencyAmount(
																	scopedQty * getUnitPrice(item),
																	preferences,
																)}
															</p>
														</div>
													</div>
												</button>

												<div className="mt-4 flex gap-2">
													<button
														type="button"
														onClick={() => {
															setSelectedProductId(item.id);
															setActiveTab("adjust");
														}}
														className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"
													>
														{t("inventory.adjust", "Adjust")}
													</button>

													<button
														type="button"
														onClick={() => setDetailProductId(item.id)}
														className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground"
													>
														{t("inventory.details", "Details")}
													</button>

													{isArchived && (
														<button
															type="button"
															onClick={() => unarchiveProduct(item.id)}
															className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"
														>
															{t("inventory.restore", "Restore")}
														</button>
													)}
												</div>
											</article>
										);
									})}

									{filteredProducts.length === 0 && (
										<EmptyState
											className="col-span-full"
											title={t("inventory.noProducts", "No matching products")}
											description={t("inventory.noProductsDesc", "Your current filters returned no products in this location.")}
											actionLabel={t("inventory.clearFilters", "Clear filters")}
											onAction={() => {
												setSearchQuery("");
												setStockFilter("all");
											}}
											hint={t("inventory.trySavingHint", "Try saving common filters for quick daily checks.")}
										/>
									)}
								</div>
							) : (
								<article className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
									<div className="overflow-x-auto">
										<table className="w-full border-collapse">
											<thead>
												<tr className="border-b border-border/70 bg-muted/30">
													<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
														{t("inventory.select", "Select")}
													</th>
													<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
														{t("inventory.product", "Product")}
													</th>
													<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
														{t("inventory.tag", "Tag")}
													</th>
													<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
														{t("inventory.onHand", "On hand")}
													</th>
													<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
														{t("inventory.status", "Status")}
													</th>
													<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
														{t("inventory.value", "Value")}
													</th>
													<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
														{t("inventory.actions", "Actions")}
													</th>
												</tr>
											</thead>

											<tbody className="divide-y divide-border/40">
												{filteredProducts.map((item) => {
													const scopedQty = getOnHandQty(
														ledgerState,
														selectedBranchId,
														item.id,
													);
													const status = getStockStatus({
														...item,
														currentStock: scopedQty,
													});

													return (
														<tr
															key={item.id}
															className="transition-colors hover:bg-muted/20"
														>
															<td className="px-4 py-3">
																<input
																	type="checkbox"
																	checked={selectedProductIds.includes(item.id)}
																	onChange={() =>
																		toggleProductSelection(item.id)
																	}
																	className="h-4 w-4 rounded border-border"
																/>
															</td>

															<td className="px-4 py-3 text-sm font-medium text-foreground">
																{item.name}
															</td>

															<td className="px-4 py-3 text-sm text-muted-foreground">
																{item.quality || "-"}
															</td>

															<td className="px-4 py-3 text-right text-sm font-semibold text-foreground">
																{scopedQty}
															</td>

															<td className="px-4 py-3 text-sm">
																<span
																	className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusClass(
																		status,
																	)}`}
																>
																	{status}
																</span>
															</td>

															<td className="px-4 py-3 text-right text-sm text-foreground">
																{formatCurrencyAmount(
																	scopedQty * getUnitPrice(item),
																	preferences,
																)}
															</td>

															<td className="px-4 py-3">
																<div className="flex items-center gap-2">
																	<button
																		type="button"
																		onClick={() => setDetailProductId(item.id)}
																		className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-muted"
																	>
																		Details
																	</button>

																	<button
																		type="button"
																		onClick={() => {
																			setSelectedProductId(item.id);
																			setActiveTab("adjust");
																		}}
																		className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-muted"
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
								</article>
							)}
						</div>
					)}

					{activeTab === "adjust" && (
						<div className="grid gap-4 lg:grid-cols-[1fr_380px]">
							<article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
								<div className="flex items-center gap-3">
									<div className="rounded-lg bg-primary/10 p-3 text-primary">
										<ArrowUpDown className="h-6 w-6" />
									</div>

									<div>
										<h2 className="text-lg font-semibold text-foreground">
											Stock adjustment
										</h2>
										<p className="text-sm text-muted-foreground">
											Update stock with an audit trail.
										</p>
									</div>
								</div>

								<div className="mt-5 space-y-5">
									<div>
										<label
											className="mb-2 block text-sm font-medium text-foreground"
											htmlFor="productSelect"
										>
											Product
										</label>

										<select
											id="productSelect"
											value={selectedProductId}
											onChange={(event) =>
												setSelectedProductId(Number(event.target.value))
											}
											className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
										>
											{products.map((item) => (
												<option key={item.id} value={item.id}>
													{item.name} ·{" "}
													{getOnHandQty(
														ledgerState,
														selectedBranchId,
														item.id,
													)}{" "}
													units
												</option>
											))}
										</select>
									</div>

									<div>
										<label
											className="mb-2 block text-sm font-medium text-foreground"
											htmlFor="adjustmentInput"
										>
											Adjustment amount
										</label>

										<div className="flex gap-2">
											<button
												type="button"
												onClick={() => setAdjustment((value) => value - 1)}
												className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted"
											>
												<Minus className="h-5 w-5" />
											</button>

											<input
												id="adjustmentInput"
												type="number"
												inputMode="numeric"
												pattern="[0-9-]*"
												value={adjustment}
												onChange={(event) =>
													setAdjustment(Number(event.target.value))
												}
												className="h-12 flex-1 rounded-lg border border-border bg-background px-3 text-center text-lg font-semibold text-foreground"
											/>

											<button
												type="button"
												onClick={() => setAdjustment((value) => value + 1)}
												className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted"
											>
												<Plus className="h-5 w-5" />
											</button>
										</div>

										<div className="mt-2 grid grid-cols-4 gap-2">
											{[5, 10, -5, -10].map((value) => (
												<button
													key={value}
													type="button"
													className="h-10 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"
													onClick={() =>
														setAdjustment((current) => current + value)
													}
												>
													{value > 0 ? `+${value}` : value}
												</button>
											))}
										</div>

										{adjustment !== 0 && (
											<div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
												<p className="text-sm font-medium text-foreground">
													New stock will be{" "}
													<span className="text-lg font-bold text-primary">
														{selectedOnHand + adjustment}
													</span>
												</p>
											</div>
										)}
									</div>

									<div className="grid gap-4 sm:grid-cols-2">
										<div>
											<label
												className="mb-2 block text-sm font-medium text-foreground"
												htmlFor="actorInput"
											>
												Performed by
											</label>

											<input
												id="actorInput"
												value={actor}
												onChange={(event) => setActor(event.target.value)}
												className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
												placeholder="Store manager"
											/>
										</div>

										<div>
											<label
												className="mb-2 block text-sm font-medium text-foreground"
												htmlFor="reasonInput"
											>
												Reason
											</label>

											<input
												id="reasonInput"
												value={reason}
												onChange={(event) => setReason(event.target.value)}
												className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
												placeholder="Stock count correction"
											/>
										</div>
									</div>

									<div className="flex gap-3">
										<button
											type="button"
											onClick={() => setAdjustment(0)}
											className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-medium text-foreground hover:bg-muted"
										>
											<X className="h-4 w-4" />
											Reset
										</button>

										<button
											type="button"
											onClick={applyAdjustment}
											className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
											disabled={adjustment === 0}
										>
											<Check className="h-4 w-4" />
											Save adjustment
										</button>
									</div>
								</div>
							</article>

							<aside className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
								<p className="text-sm font-semibold text-foreground">
									Selected product
								</p>

								{selectedProduct ? (
									<div className="mt-4">
										<div className="h-40 overflow-hidden rounded-xl border border-border bg-background">
											{selectedProduct.imageUrl ? (
												<img
													src={selectedProduct.imageUrl}
													alt={selectedProduct.name}
													className="h-full w-full object-cover"
												/>
											) : (
												<div className="flex h-full w-full items-center justify-center bg-muted">
													<Package className="h-10 w-10 text-muted-foreground" />
												</div>
											)}
										</div>

										<h3 className="mt-4 font-semibold text-foreground">
											{selectedProduct.name}
										</h3>

										<p className="mt-1 text-sm text-muted-foreground">
											{selectedProduct.quality || "No tag"}
										</p>

										<div className="mt-4 grid grid-cols-2 gap-3">
											<div className="rounded-xl bg-muted/30 p-3">
												<p className="text-xs text-muted-foreground">
													Current stock
												</p>
												<p className="text-2xl font-bold text-foreground">
													{selectedOnHand}
												</p>
											</div>

											<div className="rounded-xl bg-muted/30 p-3">
												<p className="text-xs text-muted-foreground">
													Unit price
												</p>
												<p className="text-lg font-semibold text-foreground">
													{formatCurrencyAmount(
														getUnitPrice(selectedProduct),
														preferences,
													)}
												</p>
											</div>
										</div>
									</div>
								) : (
									<p className="mt-3 text-sm text-muted-foreground">
										Select a product to adjust stock.
									</p>
								)}
							</aside>
						</div>
					)}

					{activeTab === "movements" && (
						<div className="space-y-4">
							<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<div>
									<h2 className="text-lg font-semibold text-foreground">
										Movement history
									</h2>
									<p className="text-sm text-muted-foreground">
										Audit trail for{" "}
										{branchById[selectedBranchId] ?? "selected branch"}
										{selectedProduct ? ` · ${selectedProduct.name}` : ""}
									</p>
								</div>

								<button
									type="button"
									className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted"
								>
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
								<article className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
									<div className="overflow-x-auto">
										<table className="w-full border-collapse">
											<thead>
												<tr className="border-b border-border/70 bg-muted/30">
													<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
														Time
													</th>
													<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
														Type
													</th>
													<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
														Product
													</th>
													<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
														Qty
													</th>
													<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
														Change
													</th>
													<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
														Actor
													</th>
													<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
														Reason
													</th>
												</tr>
											</thead>

											<tbody className="divide-y divide-border/40">
												{movementRows.map((movement) => {
													const product = products.find(
														(item) => item.id === movement.productId,
													);

													return (
														<tr
															key={movement.id}
															className="transition-colors hover:bg-muted/20"
														>
															<td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">
																{formatDateTime(
																	movement.createdAt,
																	preferences,
																)}
															</td>

															<td className="px-4 py-3 text-sm text-foreground">
																<span className="inline-flex items-center rounded-full border border-border/70 bg-muted/30 px-2.5 py-0.5 text-xs font-medium">
																	{movement.type.replaceAll("_", " ")}
																</span>
															</td>

															<td className="px-4 py-3 text-sm text-foreground">
																{product?.name ?? "Unknown"}
															</td>

															<td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-foreground">
																{movement.quantity}
															</td>

															<td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold">
																<span
																	className={`inline-flex items-center gap-1 ${
																		movement.stockDelta > 0
																			? "text-emerald-600"
																			: "text-red-600"
																	}`}
																>
																	{movement.stockDelta > 0 ? (
																		<TrendingUp className="h-3 w-3" />
																	) : (
																		<TrendingDown className="h-3 w-3" />
																	)}
																	{movement.stockDelta > 0
																		? `+${movement.stockDelta}`
																		: movement.stockDelta}
																</span>
															</td>

															<td className="px-4 py-3 text-sm text-muted-foreground">
																{movement.actor}
															</td>

															<td className="px-4 py-3 text-sm text-muted-foreground">
																{movement.reason}
															</td>
														</tr>
													);
												})}
											</tbody>
										</table>
									</div>
								</article>
							)}
						</div>
					)}

					<HelpHint description="Use product details for supplier and forecast context. Select products only when you need bulk actions." />
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
							Save adjustment
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
									<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										Product details
									</p>
									<h2 className="mt-1 text-2xl font-semibold text-foreground">
										{detailProduct.name}
									</h2>
									<p className="mt-1 text-sm text-muted-foreground">
										{detailProduct.quality || "No tag"}
									</p>
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
									Adjust stock
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
									View history
								</button>
							</div>
						</div>

						<div className="mt-5 grid gap-3 sm:grid-cols-2">
							<div className="rounded-xl border border-border/70 bg-card p-4">
								<p className="text-sm text-muted-foreground">
									On hand, {branchById[selectedBranchId] ?? selectedBranchId}
								</p>
								<p className="mt-1 text-3xl font-bold text-foreground">
									{getOnHandQty(ledgerState, selectedBranchId, detailProduct.id)}
								</p>
							</div>

							<div className="rounded-xl border border-border/70 bg-card p-4">
								<p className="text-sm text-muted-foreground">Status</p>
								<span
									className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-medium ${getStatusClass(
										getStockStatus({
											...detailProduct,
											currentStock: getOnHandQty(
												ledgerState,
												selectedBranchId,
												detailProduct.id,
											),
										}),
									)}`}
								>
									{getStockStatus({
										...detailProduct,
										currentStock: getOnHandQty(
											ledgerState,
											selectedBranchId,
											detailProduct.id,
										),
									})}
								</span>
							</div>

							<div className="rounded-xl border border-border/70 bg-card p-4">
								<p className="text-sm text-muted-foreground">Estimated value</p>
								<p className="mt-1 text-lg font-semibold text-foreground">
									{formatCurrencyAmount(
										getOnHandQty(
											ledgerState,
											selectedBranchId,
											detailProduct.id,
										) * getUnitPrice(detailProduct),
										preferences,
									)}
								</p>
							</div>

							<div className="rounded-xl border border-border/70 bg-card p-4">
								<p className="text-sm text-muted-foreground">
									Recent daily sales
								</p>
								<p className="mt-1 text-lg font-semibold text-foreground">
									{detailProduct.todaySales}
								</p>
							</div>
						</div>

						<div className="mt-4 rounded-xl border border-border/70 bg-card p-4">
							<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Supplier
							</p>

							{(() => {
								const supplier = supplierDirectory.find(
									(item) => item.id === detailProduct.supplierId,
								);

								if (!supplier) {
									return (
										<p className="mt-2 text-sm text-muted-foreground">
											No supplier linked.
										</p>
									);
								}

								return (
									<div className="mt-2 space-y-1.5 text-sm">
										<p className="font-medium text-foreground">
											{supplier.name}
										</p>
										<p className="text-muted-foreground">
											Phone: {supplier.phone}
										</p>
										<p className="text-muted-foreground">
											Lead time: {supplier.leadTimeDays} days
										</p>
										<a
											href="/suppliers"
											className="inline-flex text-xs font-medium text-foreground underline-offset-4 hover:underline"
										>
											Open suppliers
										</a>
									</div>
								);
							})()}
						</div>

						<div className="mt-4 rounded-xl border border-border/70 bg-card p-4">
							<div className="flex items-center justify-between">
								<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Forecast, 7 days
								</p>
								<a
									href="/forecast"
									className="text-xs font-medium text-foreground underline-offset-4 hover:underline"
								>
									Open forecast
								</a>
							</div>

							<div className="mt-3 flex min-w-max items-end gap-1 overflow-x-auto rounded-lg border border-border/70 bg-muted/20 p-2">
								{detailForecast.map((value, index) => {
									const max = Math.max(...detailForecast, 1);
									const height = Math.max(
										16,
										Math.round((value / max) * 72),
									);

									return (
										<div
											key={`forecast-${index}`}
											className="flex w-full flex-col items-center gap-1"
										>
											<div
												className="w-full rounded-sm bg-primary"
												style={{ height }}
												title={`Day ${index + 1}: ${value}`}
											/>
											<span className="text-[10px] text-muted-foreground">
												D{index + 1}
											</span>
										</div>
									);
								})}
							</div>
						</div>

						<div className="mt-4 rounded-xl border border-border/70 bg-card p-4">
							<div className="flex items-center justify-between">
								<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Recent movements
								</p>

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
								<p className="mt-2 text-sm text-muted-foreground">
									No movements yet for this product.
								</p>
							) : (
								<ul className="mt-3 divide-y divide-border/70">
									{detailMovementRows.map((entry) => (
										<li key={entry.id} className="py-3">
											<p className="text-sm font-medium text-foreground">
												{entry.type.replaceAll("_", " ")}
											</p>
											<p className="text-xs text-muted-foreground">
												Qty {entry.quantity} · Change{" "}
												{entry.stockDelta > 0
													? `+${entry.stockDelta}`
													: entry.stockDelta}{" "}
												· {branchById[entry.branchId] ?? entry.branchId}
											</p>
											<p className="text-xs text-muted-foreground">
												{formatDateTime(entry.createdAt, preferences)}
											</p>
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
									Adjust product
								</button>

								<button
									type="button"
									onClick={() => {
										setDetailProductId(null);
										setConfirmDeleteProductId(null);
									}}
									className="min-h-11 flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/30"
								>
									Close
								</button>
							</div>

							<div className="mt-2">
								{confirmDeleteProductId === detailProduct.id ? (
									<div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2">
										<p className="flex-1 text-xs font-medium text-red-600 dark:text-red-400">
											Delete permanently? This cannot be undone.
										</p>

										<button
											type="button"
											onClick={() =>
												deleteProductPermanently(detailProduct.id)
											}
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
										Delete product
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