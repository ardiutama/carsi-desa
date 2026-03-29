"use client";

import Link from "next/link";
import type { StoredBooking } from "@/lib/booking";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatRupiah, surgeOptions } from "@/lib/pricing";

type BookingForm = {
  nama: string;
  whatsapp: string;
  lokasiJemput: string;
  tujuan: string;
  tanggal: string;
  jam: string;
  durasi: string;
  mobil: string;
  catatan: string;
  jarakKm: string;
  estimasiMenit: string;
  surgeMultiplier: string;
};

type BookingResponse = {
  result?: string;
  error?: string;
  booking?: StoredBooking;
  bookings?: StoredBooking[];
};

type BookingsListResponse = {
  bookings?: StoredBooking[];
};

const initialForm: BookingForm = {
  nama: "",
  whatsapp: "",
  lokasiJemput: "",
  tujuan: "",
  tanggal: "",
  jam: "",
  durasi: "",
  mobil: "Avanza",
  catatan: "",
  jarakKm: "",
  estimasiMenit: "",
  surgeMultiplier: "1",
};

const mobilOptions = ["Avanza", "Xenia", "Innova", "Hiace", "Pickup", "Lainnya"];

function formatBookingTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusTone(status: string) {
  if (status === "selesai") {
    return "bg-emerald-400/14 text-emerald-100 border border-emerald-300/16";
  }

  if (status === "diproses") {
    return "bg-amber-400/14 text-amber-100 border border-amber-300/16";
  }

  if (status === "batal") {
    return "bg-rose-400/14 text-rose-100 border border-rose-300/16";
  }

  return "bg-sky-400/14 text-sky-100 border border-sky-300/16";
}

export default function Home() {
  const [form, setForm] = useState<BookingForm>(initialForm);
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [error, setError] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [savedBooking, setSavedBooking] = useState<StoredBooking | null>(null);
  const [recentBookings, setRecentBookings] = useState<StoredBooking[]>([]);

  const canSubmit = useMemo(() => {
    return Boolean(
      form.nama &&
        form.whatsapp &&
        form.lokasiJemput &&
        form.tujuan &&
        form.tanggal &&
        form.jam &&
        form.durasi &&
        form.mobil &&
        form.jarakKm &&
        form.estimasiMenit &&
        form.surgeMultiplier,
    );
  }, [form]);

  const summary = useMemo(() => {
    return {
      total: recentBookings.length,
      baru: recentBookings.filter((booking) => booking.status === "baru").length,
      diproses: recentBookings.filter((booking) => booking.status === "diproses").length,
      selesai: recentBookings.filter((booking) => booking.status === "selesai").length,
    };
  }, [recentBookings]);

  useEffect(() => {
    let isActive = true;

    async function loadBookings() {
      try {
        const response = await fetch("/api/bookings", { cache: "no-store" });
        const data: BookingsListResponse = await response.json();

        if (!response.ok || !isActive) {
          return;
        }

        setRecentBookings(data.bookings ?? []);
      } finally {
        if (isActive) {
          setIsLoadingBookings(false);
        }
      }
    }

    void loadBookings();

    return () => {
      isActive = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setResult("");
    setSavedBooking(null);
    setIsCopied(false);
    setIsLoading(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ booking: form }),
      });

      const data: BookingResponse = await response.json();

      if (!response.ok || !data.result || !data.booking) {
        setError(data.error ?? "Terjadi kesalahan saat membuat booking.");
        return;
      }

      setResult(data.result);
      setSavedBooking(data.booking);
      setRecentBookings(data.bookings ?? []);
    } catch {
      setError("Jaringan bermasalah. Coba lagi beberapa saat.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyResult = async () => {
    if (!result) {
      return;
    }

    await navigator.clipboard.writeText(result);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1500);
  };

  return (
    <div className="min-h-screen px-3 py-3 md:px-6 md:py-6">
      <div className="dashboard-shell mx-auto max-w-7xl rounded-[32px] p-3 md:p-5">
        <div className="pointer-events-none absolute left-0 top-0 h-80 w-80 rounded-full bg-[#7b8dff]/16 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#4ecbff]/12 blur-3xl" />

        <header className="glass-panel rounded-[26px] px-4 py-4 md:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-sky-200">CARSI</p>
              <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">
                Booking Mobil Dengan Sopir
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-soft">
                Flow tetap sederhana untuk demo: isi data pelanggan, proses booking, lihat hasil
                AI, lalu buka dashboard admin jika perlu.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="neon-pill flex h-11 items-center gap-3 rounded-full px-4 text-sm text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                Backend booking aktif
              </div>
              <Link
                href="/admin"
                className="neon-button rounded-full px-5 py-2 text-sm font-bold text-white"
              >
                Dashboard Admin
              </Link>
            </div>
          </div>
        </header>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="glass-panel-strong rounded-[30px] p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
              <div>
                <p className="text-sm text-slate-300">Booking overview</p>
                <h2 className="accent-text mt-2 text-4xl font-black md:text-5xl">
                  Rental Mobil Pedesaan
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-soft">
                  Tema visual mengikuti referensi dashboard premium, tetapi UX tetap sama:
                  halaman ini berfokus pada pembuatan booking, hasil AI, dan bukti riwayat order.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-[#090d18]/82 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-dim">System Pulse</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <StatCard label="Total Booking" value={String(summary.total)} />
                  <StatCard label="Baru" value={String(summary.baru)} />
                  <StatCard label="Diproses" value={String(summary.diproses)} />
                  <StatCard label="Selesai" value={String(summary.selesai)} />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[30px] p-5">
            <p className="text-sm font-semibold text-white">Live Feed</p>
            <p className="mt-1 text-xs text-dim">Booking terbaru yang tersimpan di backend</p>
            <div className="mt-4 space-y-3">
              {(recentBookings.length > 0 ? recentBookings.slice(0, 4) : [null, null, null]).map(
                (booking, index) => (
                  <div
                    key={booking?.id ?? `live-${index}`}
                    className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {booking ? booking.nama : "Belum ada booking"}
                        </p>
                        <p className="truncate text-xs text-dim">
                          {booking ? `${booking.lokasiJemput} ke ${booking.tujuan}` : "Siap untuk demo"}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[11px] ${statusTone(booking?.status ?? "baru")}`}>
                        {booking ? booking.status : "standby"}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-300">
                      <span>{booking ? booking.mobil : "Avanza"}</span>
                      <span>{booking ? booking.durasi : "1 hari"}</span>
                      <span>
                        {booking?.priceBreakdown
                          ? formatRupiah(booking.priceBreakdown.total)
                          : "Tarif otomatis"}
                      </span>
                      <span>{booking ? formatBookingTime(booking.createdAt) : "Realtime"}</span>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <form onSubmit={handleSubmit} className="glass-panel rounded-[30px] p-5 md:p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Input Area</p>
                <h2 className="mt-2 text-3xl font-black text-white">Form Booking</h2>
              </div>
              <span className="neon-pill rounded-full px-4 py-2 text-sm text-slate-300">
                Booking + AI + Save
              </span>
            </div>

            <div className="mb-5 rounded-[22px] border border-sky-300/10 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">
              Rumus demo: tarif dasar {formatRupiah(10000)} + {formatRupiah(3500)}/km +{" "}
              {formatRupiah(500)}/menit, minimum {formatRupiah(20000)}, surge hingga 2.0x.
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="Nama Pelanggan"
                value={form.nama}
                onChange={(value) => setForm((prev) => ({ ...prev, nama: value }))}
                placeholder="Contoh: Pak Rahmat"
              />
              <InputField
                label="Nomor WhatsApp"
                value={form.whatsapp}
                onChange={(value) => setForm((prev) => ({ ...prev, whatsapp: value }))}
                placeholder="08xxxxxxxxxx"
              />
              <InputField
                label="Lokasi Jemput"
                value={form.lokasiJemput}
                onChange={(value) => setForm((prev) => ({ ...prev, lokasiJemput: value }))}
                placeholder="Desa / kecamatan"
              />
              <InputField
                label="Tujuan"
                value={form.tujuan}
                onChange={(value) => setForm((prev) => ({ ...prev, tujuan: value }))}
                placeholder="Kota / alamat tujuan"
              />
              <InputField
                label="Tanggal"
                type="date"
                value={form.tanggal}
                onChange={(value) => setForm((prev) => ({ ...prev, tanggal: value }))}
              />
              <InputField
                label="Jam"
                type="time"
                value={form.jam}
                onChange={(value) => setForm((prev) => ({ ...prev, jam: value }))}
              />
              <InputField
                label="Durasi Sewa"
                value={form.durasi}
                onChange={(value) => setForm((prev) => ({ ...prev, durasi: value }))}
                placeholder="12 jam / 2 hari"
              />
              <InputField
                label="Jarak Tempuh (km)"
                type="number"
                value={form.jarakKm}
                onChange={(value) => setForm((prev) => ({ ...prev, jarakKm: value }))}
                placeholder="Contoh: 25"
                min="0"
                step="0.1"
              />
              <InputField
                label="Estimasi Waktu (menit)"
                type="number"
                value={form.estimasiMenit}
                onChange={(value) => setForm((prev) => ({ ...prev, estimasiMenit: value }))}
                placeholder="Contoh: 45"
                min="0"
                step="1"
              />

              <label className="flex flex-col gap-2 text-sm text-slate-200">
                Jenis Mobil
                <select
                  value={form.mobil}
                  onChange={(event) => setForm((prev) => ({ ...prev, mobil: event.target.value }))}
                  className="neon-input h-12 rounded-2xl px-4 text-sm"
                >
                  {mobilOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm text-slate-200">
                Surge Pricing
                <select
                  value={form.surgeMultiplier}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, surgeMultiplier: event.target.value }))
                  }
                  className="neon-input h-12 rounded-2xl px-4 text-sm"
                >
                  {surgeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-4 flex flex-col gap-2 text-sm text-slate-200">
              Catatan Tambahan
              <textarea
                value={form.catatan}
                onChange={(event) => setForm((prev) => ({ ...prev, catatan: event.target.value }))}
                rows={4}
                placeholder="Jumlah penumpang, barang bawaan, kebutuhan khusus"
                className="neon-input rounded-2xl px-4 py-3 text-sm"
              />
            </label>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={!canSubmit || isLoading}
                className="neon-button inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Menyimpan booking...
                  </>
                ) : (
                  "Proses Booking"
                )}
              </button>
              <Link
                href="/admin"
                className="ghost-button inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold text-slate-200"
              >
                Buka Admin
              </Link>
            </div>
          </form>

          <div className="space-y-4">
            <section className="glass-panel-strong rounded-[30px] p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Result Display</p>
                  <h2 className="mt-2 text-3xl font-black text-white">Hasil AI Booking</h2>
                </div>
                <button
                  type="button"
                  onClick={copyResult}
                  disabled={!result || isLoading}
                  className="ghost-button rounded-full px-4 py-2 text-sm font-semibold text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCopied ? "Copied" : "Copy Result"}
                </button>
              </div>

              {savedBooking ? (
                <div className="mb-4 rounded-[22px] border border-emerald-300/14 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                  <p className="font-semibold">Booking berhasil disimpan</p>
                  <p className="mt-1">Kode: {savedBooking.id}</p>
                  <p>Status: {savedBooking.status}</p>
                  {savedBooking.priceBreakdown ? (
                    <p className="mt-1">
                      Estimasi harga: {formatRupiah(savedBooking.priceBreakdown.total)}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {savedBooking?.priceBreakdown ? (
                <PriceBreakdownCard booking={savedBooking} />
              ) : null}

              <div className="min-h-[320px] rounded-[24px] border border-white/8 bg-[#090d18]/82 p-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[93, 76, 88, 95, 68, 84].map((width, index) => (
                      <div
                        key={`${width}-${index}`}
                        className="h-3.5 animate-pulse rounded-full bg-white/10"
                        style={{ width: `${width}%` }}
                      />
                    ))}
                  </div>
                ) : error ? (
                  <p className="rounded-2xl border border-rose-300/12 bg-rose-400/10 p-3 text-sm text-rose-100">
                    {error}
                  </p>
                ) : result ? (
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-soft">
                    {result}
                  </pre>
                ) : (
                  <p className="text-sm leading-7 text-dim">
                    Hasil booking akan muncul di sini setelah form diproses. Tombol dan alur tetap
                    sama, hanya tampilan visualnya yang mengikuti tema referensi.
                  </p>
                )}
              </div>
            </section>

            <section className="glass-panel rounded-[30px] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Riwayat Booking Terbaru</p>
                  <p className="mt-1 text-xs text-dim">Bukti bahwa order benar-benar tersimpan</p>
                </div>
                <span className="neon-pill rounded-full px-3 py-1 text-xs text-slate-300">
                  {recentBookings.length} data
                </span>
              </div>

              {isLoadingBookings ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-20 animate-pulse rounded-2xl bg-white/[0.04]" />
                  ))}
                </div>
              ) : recentBookings.length === 0 ? (
                <p className="text-sm leading-7 text-dim">
                  Belum ada booking tersimpan. Buat satu booking dari form untuk melihat riwayat ini.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{booking.nama}</p>
                          <p className="mt-1 text-xs text-dim">
                            {booking.mobil} | {booking.durasi}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[11px] ${statusTone(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-soft">
                        {booking.lokasiJemput} ke {booking.tujuan}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-sky-100">
                        {booking.priceBreakdown
                          ? formatRupiah(booking.priceBreakdown.total)
                          : "Kalkulasi belum tersedia"}
                      </p>
                      <p className="mt-2 text-xs text-dim">
                        {booking.id} | {formatBookingTime(booking.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-dim">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

type InputFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "date" | "time" | "number";
  step?: string;
  min?: string;
};

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  step,
  min,
}: InputFieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-200">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="neon-input h-12 rounded-2xl px-4 text-sm"
        step={step}
        min={min}
      />
    </label>
  );
}

function PriceBreakdownCard({ booking }: { booking: StoredBooking }) {
  if (!booking.priceBreakdown) {
    return null;
  }

  const pricing = booking.priceBreakdown;

  return (
    <div className="mb-4 rounded-[24px] border border-sky-300/12 bg-sky-400/10 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">Kalkulasi Harga Sewa</p>
          <p className="mt-1 text-xs text-slate-300">
            Estimasi sistem sebelum dikirim ke pelanggan
          </p>
        </div>
        <p className="text-lg font-black text-sky-100">{formatRupiah(pricing.total)}</p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <PriceLine label="Tarif dasar" value={formatRupiah(pricing.baseFare)} />
        <PriceLine
          label={`Jarak (${pricing.distanceKm} km)`}
          value={formatRupiah(pricing.distanceCost)}
        />
        <PriceLine
          label={`Waktu (${pricing.timeMinutes} menit)`}
          value={formatRupiah(pricing.timeCost)}
        />
        <PriceLine label="Subtotal" value={formatRupiah(pricing.subtotal)} />
        <PriceLine label="Surge" value={`${pricing.surgeMultiplier.toFixed(1)}x`} />
        <PriceLine label="Kenaikan surge" value={formatRupiah(pricing.surgeAmount)} />
        <PriceLine
          label="Minimum fare"
          value={
            pricing.minimumApplied
              ? `${formatRupiah(pricing.minimumFare)} dipakai`
              : formatRupiah(pricing.minimumFare)
          }
        />
        <PriceLine label="Total akhir" value={formatRupiah(pricing.total)} highlight />
      </div>
    </div>
  );
}

function PriceLine({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-dim">{label}</p>
      <p className={`mt-2 text-sm font-semibold ${highlight ? "text-sky-100" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
