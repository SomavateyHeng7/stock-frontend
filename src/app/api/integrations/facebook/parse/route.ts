import { NextResponse } from "next/server";

type FacebookParseRequest = {
  message?: string;
};

type ParsedOrderLine = {
  product: string;
  quantity: number;
};

function parseOrderLines(message: string): ParsedOrderLine[] {
  const lines = message
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed: ParsedOrderLine[] = [];

  for (const line of lines) {
    const withX = line.match(/^(.*?)\s*[xX]\s*(\d+)$/);
    if (withX) {
      parsed.push({
        product: withX[1].trim(),
        quantity: Number(withX[2]),
      });
      continue;
    }

    const qtyPrefix = line.match(/^(\d+)\s+(.*)$/);
    if (qtyPrefix) {
      parsed.push({
        product: qtyPrefix[2].trim(),
        quantity: Number(qtyPrefix[1]),
      });
    }
  }

  return parsed.filter((item) => item.product.length > 0 && Number.isFinite(item.quantity) && item.quantity > 0);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as FacebookParseRequest;
  const message = payload.message?.trim();

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const orderLines = parseOrderLines(message);
  return NextResponse.json({
    ok: true,
    orderLines,
    totalItems: orderLines.reduce((sum, line) => sum + line.quantity, 0),
  });
}
