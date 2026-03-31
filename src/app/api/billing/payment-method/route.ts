import { NextResponse } from "next/server";
import type { PaymentMethod, PaymentMethodType } from "@/lib/billing";

type BillingStore = {
  paymentMethod: PaymentMethod | null;
};

declare global {
  var __smartstockBillingPaymentStore: BillingStore | undefined;
}

function getStore(): BillingStore {
  if (!globalThis.__smartstockBillingPaymentStore) {
    globalThis.__smartstockBillingPaymentStore = {
      paymentMethod: null,
    };
  }

  return globalThis.__smartstockBillingPaymentStore;
}

function isPaymentMethodType(value: unknown): value is PaymentMethodType {
  return value === "card" || value === "bank_transfer" || value === "mobile_wallet";
}

function normalizePaymentMethod(payload: unknown): PaymentMethod | null {
  if (!payload || typeof payload !== "object") return null;

  const data = payload as Partial<PaymentMethod>;
  if (!isPaymentMethodType(data.type)) return null;
  if (typeof data.label !== "string" || data.label.trim().length === 0) return null;
  if (typeof data.updatedAt !== "string" || data.updatedAt.trim().length === 0) return null;

  return {
    type: data.type,
    label: data.label,
    last4: typeof data.last4 === "string" ? data.last4 : undefined,
    updatedAt: data.updatedAt,
  };
}

export async function GET() {
  const store = getStore();
  return NextResponse.json(store.paymentMethod);
}

export async function POST(request: Request) {
  const store = getStore();
  const payload = await request.json();
  const method = normalizePaymentMethod(payload);

  if (!method) {
    return NextResponse.json({ error: "Invalid payment method payload" }, { status: 400 });
  }

  store.paymentMethod = method;
  return NextResponse.json(method);
}
