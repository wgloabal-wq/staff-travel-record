import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = (searchParams.get("from") || "").toUpperCase();
  const to = (searchParams.get("to") || "INR").toUpperCase();

  if (!from || !to) {
    return NextResponse.json(
      { error: "Currency codes are required." },
      { status: 400 }
    );
  }

  if (from === to) {
    return NextResponse.json({ rate: 1, source: "same-currency" });
  }

  try {
    // Primary source. The browser calls our own Next.js route, so the
    // external API is never called directly from the client.
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${encodeURIComponent(
        from
      )}&to=${encodeURIComponent(to)}`,
      { cache: "no-store" }
    );

    if (response.ok) {
      const data = (await response.json()) as {
        rates?: Record<string, number>;
      };
      const rate = Number(data.rates?.[to]);

      if (Number.isFinite(rate) && rate > 0) {
        return NextResponse.json({ rate, source: "frankfurter" });
      }
    }
  } catch {
    // Try the fallback provider below.
  }

  // Fallback source. This also runs server-side and avoids browser CORS issues.
  if (to === "INR") {
    try {
      const response = await fetch(
        `https://open.er-api.com/v6/latest/${encodeURIComponent(from)}`,
        { cache: "no-store" }
      );

      if (response.ok) {
        const data = (await response.json()) as {
          rates?: Record<string, number>;
        };
        const rate = Number(data.rates?.INR);

        if (Number.isFinite(rate) && rate > 0) {
          return NextResponse.json({ rate, source: "exchange-rate-api" });
        }
      }
    } catch {
      // Fall through to the error response.
    }
  }

  return NextResponse.json(
    { error: `Unable to fetch ${from} to ${to} exchange rate right now.` },
    { status: 503 }
  );
}
