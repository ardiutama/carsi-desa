import { BookingPayload } from "@/lib/booking";

const MODEL_CANDIDATES = [
  "gemini-1.5-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest",
] as const;

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

function createPrompt(booking: BookingPayload): string {
  return `
Anda adalah admin profesional rental mobil pedesaan bernama CARSI.

Susun hasil dalam Bahasa Indonesia yang ramah dan jelas dengan format:
1) Ringkasan Booking
2) Rekomendasi Mobil & Alasan Singkat
3) Estimasi Total Biaya (beri rentang realistis)
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
- Pilihan Mobil: ${booking.mobil}
- Catatan Tambahan: ${booking.catatan || "Tidak ada"}

Jaga gaya ringkas, profesional, dan mudah dipahami masyarakat umum.
`;
}

export async function generateBookingSummary(booking: BookingPayload) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      error: "GEMINI_API_KEY belum ditemukan di .env",
      status: 500,
    };
  }

  const prompt = createPrompt(booking);
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
