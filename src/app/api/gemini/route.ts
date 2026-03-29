import { NextRequest, NextResponse } from "next/server";

import { normalizeBookingInput, validateBooking } from "@/lib/booking";
import { calculateRentalPrice } from "@/lib/pricing";
import { generateBookingSummary } from "@/lib/server/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const booking = normalizeBookingInput(body?.booking ?? {});
    const validationError = validateBooking(booking);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const priceBreakdown = calculateRentalPrice(booking);
    const geminiResult = await generateBookingSummary(booking, priceBreakdown);

    if (!geminiResult.result) {
      return NextResponse.json(
        {
          error: "Gagal menghubungi Gemini.",
          detail: geminiResult.error,
        },
        { status: geminiResult.status ?? 502 },
      );
    }

    return NextResponse.json({
      result: geminiResult.result,
      model: geminiResult.model,
      priceBreakdown,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Terjadi kesalahan saat memproses booking.",
        detail,
      },
      { status: 500 },
    );
  }
}
