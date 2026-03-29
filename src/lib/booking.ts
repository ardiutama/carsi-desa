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
};

export const bookingStatuses = ["baru", "diproses", "selesai", "batal"] as const;

export type BookingStatus = (typeof bookingStatuses)[number];

export type StoredBooking = BookingPayload & {
  id: string;
  status: BookingStatus;
  aiSummary: string;
  aiModel: string;
  createdAt: string;
};

export function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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

  return null;
}

export function isBookingStatus(value: string): value is BookingStatus {
  return bookingStatuses.includes(value as BookingStatus);
}
