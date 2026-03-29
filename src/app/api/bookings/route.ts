import { NextRequest, NextResponse } from "next/server";

import { normalizeBookingInput, validateBooking } from "@/lib/booking";
import { getAllBookings, getRecentBookings, saveBooking } from "@/lib/server/bookings-store";
import { generateBookingSummary } from "@/lib/server/gemini";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const limitParam = request.nextUrl.searchParams.get("limit");
    const bookings =
      limitParam === "all"
        ? await getAllBookings()
        : await getRecentBookings(Number(limitParam) || undefined);

    return NextResponse.json(
      { bookings },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Gagal mengambil daftar booking.",
        detail,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const booking = normalizeBookingInput(body?.booking ?? {});
    const validationError = validateBooking(booking);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const geminiResult = await generateBookingSummary(booking);

    if (!geminiResult.result || !geminiResult.model) {
      return NextResponse.json(
        {
          error: "Gagal menghubungi Gemini.",
          detail: geminiResult.error,
        },
        { status: geminiResult.status ?? 502 },
      );
    }

    const storedBooking = await saveBooking(booking, geminiResult.result, geminiResult.model);
    const bookings = await getRecentBookings();

    return NextResponse.json(
      {
        booking: storedBooking,
        bookings,
        result: storedBooking.aiSummary,
        model: storedBooking.aiModel,
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Terjadi kesalahan saat menyimpan booking.",
        detail,
      },
      { status: 500 },
    );
  }
}
