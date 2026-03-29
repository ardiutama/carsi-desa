import { BookingPayload, PriceBreakdown } from "@/lib/booking";
import { formatRupiah } from "@/lib/pricing";

const MODEL_CANDIDATES = [
  "gemini-1.5-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest",
] as const;

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

function createPrompt(booking: BookingPayload, priceBreakdown: PriceBreakdown): string {
  return `
Anda adalah admin profesional rental mobil pedesaan bernama CARSI.

Susun hasil dalam Bahasa Indonesia yang ramah dan jelas dengan format:
1) Ringkasan Booking
2) Rekomendasi Mobil & Alasan Singkat
3) Estimasi Total Biaya (gunakan angka kalkulasi sistem di bawah sebagai acuan utama)
4) SOP Penjemputan Singkat (3-5 poin)
5) Teks Konfirmasi Siap Kirim ke WhatsApp pelanggan

Data pelanggan:
- Nama: ${booking.nama}
- WhatsApp: ${booking.whatsapp}
- Lokasi Jemput: ${booking.lokasiJemput}
- Tujuan: ${booking.tujuan}
- Tanggal: ${booking.tanggal}
- Jam: ${booking.jam}
- Durasi: ${booking.durasi}
- Estimasi Jarak: ${booking.jarakKm} km
- Estimasi Waktu Perjalanan: ${booking.estimasiMenit} menit
- Surge Pricing: ${booking.surgeMultiplier}x
- Pilihan Mobil: ${booking.mobil}
- Catatan Tambahan: ${booking.catatan || "Tidak ada"}

Kalkulasi harga sistem:
- Tarif dasar: ${formatRupiah(priceBreakdown.baseFare)}
- Tarif jarak: ${formatRupiah(priceBreakdown.distanceRate)} x ${priceBreakdown.distanceKm} km = ${formatRupiah(priceBreakdown.distanceCost)}
- Tarif waktu: ${formatRupiah(priceBreakdown.timeRate)} x ${priceBreakdown.timeMinutes} menit = ${formatRupiah(priceBreakdown.timeCost)}
- Subtotal: ${formatRupiah(priceBreakdown.subtotal)}
- Kenaikan surge: ${formatRupiah(priceBreakdown.surgeAmount)}
- Minimum fare: ${formatRupiah(priceBreakdown.minimumFare)}
- Total akhir sistem: ${formatRupiah(priceBreakdown.total)}

Jaga gaya ringkas, profesional, dan mudah dipahami masyarakat umum. Jangan mengubah total akhir sistem, tetapi boleh beri catatan bahwa nominal bisa berubah bila jarak atau waktu aktual berbeda.
`;
}

export async function generateBookingSummary(
  booking: BookingPayload,
  priceBreakdown: PriceBreakdown,
) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      error: "GEMINI_API_KEY belum ditemukan di .env",
      status: 500,
    };
  }

  const prompt = createPrompt(booking, priceBreakdown);
  let lastError = "Model Gemini tidak tersedia.";

  for (const model of MODEL_CANDIDATES) {
    try {
      const response = await fetch(`${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.65,
            topP: 0.95,
            topK: 32,
            maxOutputTokens: 900,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastError = `[${model}] ${errorText}`;

        const shouldTryNextModel =
          response.status === 404 || /not found|not supported/i.test(errorText);

        if (shouldTryNextModel) {
          continue;
        }

        return { error: lastError, status: response.status };
      }

      const data = await response.json();
      const parts: Array<{ text?: string }> = data?.candidates?.[0]?.content?.parts ?? [];
      const result = parts
        .map((part) => part.text?.trim())
        .filter(Boolean)
        .join("\n\n");

      if (result) {
        return { result, model };
      }

      lastError = `[${model}] Gemini tidak mengembalikan konten jawaban.`;
    } catch (error) {
      lastError =
        error instanceof Error ? `[${model}] ${error.message}` : `[${model}] Unknown error`;
    }
  }

  return { error: lastError, status: 502 };
}
