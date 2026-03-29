import { NextRequest, NextResponse } from "next/server";

import { isBookingStatus } from "@/lib/booking";
import { getAllBookings, updateBookingStatus } from "@/lib/server/bookings-store";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const status = typeof body?.status === "string" ? body.status : "";

    if (!isBookingStatus(status)) {
      return NextResponse.json({ error: "Status booking tidak valid." }, { status: 400 });
    }

    const booking = await updateBookingStatus(id, status);

    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan." }, { status: 404 });
    }

    const bookings = await getAllBookings();

    return NextResponse.json(
      { booking, bookings },
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
        error: "Terjadi kesalahan saat memperbarui status booking.",
        detail,
      },
      { status: 500 },
    );
  }
}
