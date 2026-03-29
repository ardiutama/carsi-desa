export type BookingInput = {
  nama?: string;
  whatsapp?: string;
  lokasiJemput?: string;
  tujuan?: string;
  tanggal?: string;
  jam?: string;
  durasi?: string;
  mobil?: string;
  catatan?: string;
  jarakKm?: string | number;
  estimasiMenit?: string | number;
  surgeMultiplier?: string | number;
};

export type PriceBreakdown = {
  baseFare: number;
  distanceRate: number;
  distanceKm: number;
  distanceCost: number;
  timeRate: number;
  timeMinutes: number;
  timeCost: number;
  surgeMultiplier: number;
  surgeAmount: number;
  subtotal: number;
  minimumFare: number;
  minimumApplied: boolean;
  total: number;
};

export type BookingPayload = {
  nama: string;
  whatsapp: string;
  lokasiJemput: string;
  tujuan: string;
  tanggal: string;
  jam: string;
  durasi: string;
  mobil: string;
  catatan: string;
  jarakKm: number;
  estimasiMenit: number;
  surgeMultiplier: number;
};

export const bookingStatuses = ["baru", "diproses", "selesai", "batal"] as const;

export type BookingStatus = (typeof bookingStatuses)[number];

export type StoredBooking = BookingPayload & {
  id: string;
  status: BookingStatus;
  aiSummary: string;
  aiModel: string;
  createdAt: string;
  priceBreakdown: PriceBreakdown | null;
};

export function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function cleanNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().replace(",", ".");

    if (!normalized) {
      return fallback;
    }

    const parsed = Number.parseFloat(normalized);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

export function normalizeBookingInput(input: BookingInput): BookingPayload {
  return {
    nama: cleanText(input.nama),
    whatsapp: cleanText(input.whatsapp),
    lokasiJemput: cleanText(input.lokasiJemput),
    tujuan: cleanText(input.tujuan),
    tanggal: cleanText(input.tanggal),
    jam: cleanText(input.jam),
    durasi: cleanText(input.durasi),
    mobil: cleanText(input.mobil),
    catatan: cleanText(input.catatan),
    jarakKm: cleanNumber(input.jarakKm),
    estimasiMenit: Math.round(cleanNumber(input.estimasiMenit)),
    surgeMultiplier: Math.max(1, cleanNumber(input.surgeMultiplier, 1)),
  };
}

export function validateBooking(booking: BookingPayload): string | null {
  const requiredFields = [
    booking.nama,
    booking.whatsapp,
    booking.lokasiJemput,
    booking.tujuan,
    booking.tanggal,
    booking.jam,
    booking.durasi,
    booking.mobil,
  ];

  if (requiredFields.some((field) => !field)) {
    return "Data booking belum lengkap.";
  }

  if (booking.jarakKm <= 0) {
    return "Jarak tempuh harus lebih dari 0 km.";
  }

  if (booking.estimasiMenit <= 0) {
    return "Estimasi waktu harus lebih dari 0 menit.";
  }

  return null;
}

export function isBookingStatus(value: string): value is BookingStatus {
  return bookingStatuses.includes(value as BookingStatus);
}
