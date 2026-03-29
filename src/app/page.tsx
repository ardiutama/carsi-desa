"use client";

import Link from "next/link";
import type { StoredBooking } from "@/lib/booking";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  calculateRentalPrice,
  formatRupiah,
  pricingConfig,
  surgeOptions,
} from "@/lib/pricing";

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
    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  }

  if (status === "diproses") {
    return "bg-amber-100 text-amber-700 border border-amber-200";
  }

  if (status === "batal") {
    return "bg-rose-100 text-rose-700 border border-rose-200";
  }

  return "bg-sky-100 text-sky-700 border border-sky-200";
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

  const liveEstimate = useMemo(() => {
    const distance = Number.parseFloat(form.jarakKm.replace(",", "."));
    const minutes = Number.parseFloat(form.estimasiMenit.replace(",", "."));
    const surge = Number.parseFloat(form.surgeMultiplier.replace(",", "."));

    if (!Number.isFinite(distance) || !Number.isFinite(minutes) || distance <= 0 || minutes <= 0) {
      return null;
    }

    return calculateRentalPrice({
      jarakKm: distance,
      estimasiMenit: minutes,
      surgeMultiplier: Number.isFinite(surge) && surge >= 1 ? surge : 1,
    });
  }, [form.estimasiMenit, form.jarakKm, form.surgeMultiplier]);

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

  const featuredPrice = savedBooking?.priceBreakdown ?? liveEstimate;
  const recentPreview = recentBookings.slice(0, 3);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.94),_transparent_24%),linear-gradient(180deg,_#edf4fb_0%,_#eef3fa_35%,_#f7f1f7_100%)] px-3 py-3 text-[#172433] md:px-6 md:py-6">
      <div className="soft-dashboard mx-auto max-w-7xl rounded-[36px] p-4 md:p-6">
        <header className="flex flex-col gap-4 rounded-[26px] px-1 py-1 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#8fdcff,#dce7ff)] text-lg font-black text-white shadow-[0_10px_26px_rgba(123,167,214,0.24)]">
              C
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#7b8fa6]">CARSI</p>
              <p className="text-2xl font-semibold tracking-[-0.04em] text-[#111827]">Car Booking</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="#form-booking"
              className="soft-dark-button rounded-2xl px-4 py-2 text-sm font-semibold"
            >
              Rent
            </a>
            <a
              href="#pricing-breakdown"
              className="soft-ghost-button rounded-2xl px-4 py-2 text-sm font-medium"
            >
              Pricing
            </a>
            <a
              href="#booking-history"
              className="soft-ghost-button rounded-2xl px-4 py-2 text-sm font-medium"
            >
              History
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="soft-ghost-button h-11 w-11 rounded-2xl text-sm font-semibold"
            >
              ○
            </button>
            <button
              type="button"
              className="soft-ghost-button h-11 w-11 rounded-2xl text-sm font-semibold"
            >
              ◇
            </button>
            <span className="location-pill rounded-2xl px-4 py-2 text-sm font-semibold">
              Location: Sidemen
            </span>
            <Link
              href="/admin"
              className="soft-panel inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-[#111827]"
            >
              Admin
            </Link>
          </div>
        </header>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <aside className="flex flex-col gap-5 xl:order-2">
            <section
              id="form-booking"
              className="order-1 soft-panel-strong rounded-[30px] p-5 xl:sticky xl:top-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#7b8fa6]">
                    Input Area
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#111827]">
                    Form Booking
                  </h2>
                  <p className="mt-2 text-sm text-[#6f8196]">
                    Mulai dari sini untuk booking. Field paling penting saya taruh di atas agar
                    alurnya terasa lebih natural.
                  </p>
                </div>
                <span className="soft-chip rounded-2xl px-3 py-2 text-xs font-semibold">
                  Booking + AI
                </span>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid gap-3">
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
                    placeholder="Sidemen"
                  />
                  <InputField
                    label="Tujuan"
                    value={form.tujuan}
                    onChange={(value) => setForm((prev) => ({ ...prev, tujuan: value }))}
                    placeholder="Denpasar / Ubud"
                  />

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
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
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                    <InputField
                      label="Durasi Sewa"
                      value={form.durasi}
                      onChange={(value) => setForm((prev) => ({ ...prev, durasi: value }))}
                      placeholder="12 jam / 1 hari"
                    />
                    <label className="flex flex-col gap-2 text-sm font-medium text-[#27384d]">
                      Jenis Mobil
                      <select
                        value={form.mobil}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, mobil: event.target.value }))
                        }
                        className="soft-input h-12 rounded-2xl px-4 text-sm"
                      >
                        {mobilOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
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
                      onChange={(value) =>
                        setForm((prev) => ({ ...prev, estimasiMenit: value }))
                      }
                      placeholder="Contoh: 45"
                      min="0"
                      step="1"
                    />
                  </div>

                  <label className="flex flex-col gap-2 text-sm font-medium text-[#27384d]">
                    Surge Pricing
                    <select
                      value={form.surgeMultiplier}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, surgeMultiplier: event.target.value }))
                      }
                      className="soft-input h-12 rounded-2xl px-4 text-sm"
                    >
                      {surgeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-2 text-sm font-medium text-[#27384d]">
                    Catatan Tambahan
                    <textarea
                      value={form.catatan}
                      onChange={(event) => setForm((prev) => ({ ...prev, catatan: event.target.value }))}
                      rows={4}
                      placeholder="Jumlah penumpang, barang bawaan, kebutuhan khusus"
                      className="soft-input rounded-2xl px-4 py-3 text-sm"
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={!canSubmit || isLoading}
                    className="soft-dark-button inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="soft-ghost-button inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold"
                  >
                    Buka Admin
                  </Link>
                </div>
              </form>
            </section>

            <section className="order-2 soft-panel rounded-[30px] p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#111827]">Tarif Aktif</p>
                  <p className="mt-1 text-xs text-[#8093a8]">
                    Engine harga otomatis untuk demo client
                  </p>
                </div>
                <div className="soft-ghost-button flex h-11 w-11 items-center justify-center rounded-2xl text-sm">
                  ⌕
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <ConfigChip label={formatRupiah(pricingConfig.baseFare)} />
                <ConfigChip label={`${formatRupiah(pricingConfig.distanceRate)}/km`} />
                <ConfigChip label={`${formatRupiah(pricingConfig.timeRate)}/menit`} />
                <ConfigChip label={`Min ${formatRupiah(pricingConfig.minimumFare)}`} />
              </div>

              <div className="mt-4 space-y-3">
                <SidebarBookingCard
                  title="Avanza Family"
                  subtitle="Cocok untuk wisata desa dan antar kota"
                  accent="from-[#e8f1ff] to-white"
                />
                <SidebarBookingCard
                  title="Innova Comfort"
                  subtitle="Lebih lega untuk penumpang dan bagasi"
                  accent="from-[#edf7ff] to-white"
                />
                <SidebarBookingCard
                  title="Hiace Group"
                  subtitle="Ideal untuk rombongan kecil dan tamu"
                  accent="from-[#fff1ef] to-white"
                />
              </div>
            </section>

            <section className="order-3 soft-panel rounded-[30px] p-4">
              <div className="mb-3">
                <p className="text-sm font-semibold text-[#111827]">Recent Requests</p>
                <p className="mt-1 text-xs text-[#8093a8]">Booking yang baru masuk ke sistem</p>
              </div>

              <div className="space-y-3">
                {(recentPreview.length > 0 ? recentPreview : [null, null]).map((booking, index) => (
                  <div
                    key={booking?.id ?? `preview-${index}`}
                    className="rounded-[24px] border border-[#d6e3f2] bg-white/82 p-4 shadow-[0_12px_24px_rgba(144,169,196,0.08)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#111827]">
                          {booking ? booking.nama : "Belum ada booking"}
                        </p>
                        <p className="mt-1 truncate text-xs text-[#8093a8]">
                          {booking ? `${booking.lokasiJemput} ke ${booking.tujuan}` : "Siap untuk demo"}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusTone(booking?.status ?? "baru")}`}
                      >
                        {booking ? booking.status : "standby"}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#51657b]">
                      <span>{booking ? booking.mobil : "Avanza"}</span>
                      <span>{booking ? booking.durasi : "1 hari"}</span>
                      <span>
                        {booking?.priceBreakdown
                          ? formatRupiah(booking.priceBreakdown.total)
                          : "Harga otomatis"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <main className="space-y-5 xl:order-1">
            <section id="hero-booking" className="soft-panel-strong rounded-[32px] p-5 md:p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-sm font-medium text-[#6d839b]">Cars that were viewed</p>
                  <h1 className="mt-2 max-w-3xl text-4xl font-semibold tracking-[-0.06em] text-[#111827] md:text-5xl">
                    Rental Mobil Sidemen-by indovma
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5f7388]">
                    Tampilan baru mengikuti nuansa referensi: airy, modern, premium, dan ringan.
                    Booking flow tetap sama, hanya visualnya yang sekarang terasa lebih polished
                    untuk presentasi client.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="soft-chip rounded-2xl px-3 py-2 text-xs font-semibold">
                    Driver Included
                  </span>
                  <span className="soft-chip rounded-2xl px-3 py-2 text-xs font-semibold">
                    Auto Pricing
                  </span>
                  <span className="location-pill rounded-2xl px-3 py-2 text-xs font-semibold">
                    Sidemen Base
                  </span>
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
                <div className="car-stage rounded-[30px] p-5 md:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-3xl font-semibold tracking-[-0.05em] text-[#111827]">
                        {form.mobil || "Avanza"}
                      </p>
                      <p className="mt-1 text-sm text-[#6f8196]">
                        Pilihan rute: {form.lokasiJemput || "Sidemen"} ke {form.tujuan || "Tujuan Anda"}
                      </p>
                    </div>
                    <div className="soft-ghost-button flex h-11 w-11 items-center justify-center rounded-2xl text-lg">
                      ⋯
                    </div>
                  </div>

                  <div className="relative mt-6">
                    <div className="absolute left-2 top-10 car-tag rounded-2xl px-3 py-2 text-xs font-semibold">
                      Driver On Duty
                    </div>
                    <div className="absolute bottom-5 right-2 car-tag rounded-2xl px-3 py-2 text-xs font-semibold">
                      Smooth Ride
                    </div>
                    <CarShowcase />
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <MetricCard
                      label="Jarak"
                      value={liveEstimate ? `${liveEstimate.distanceKm} km` : "0 km"}
                    />
                    <MetricCard
                      label="Durasi"
                      value={liveEstimate ? `${liveEstimate.timeMinutes} min` : "0 min"}
                    />
                    <MetricCard
                      label="Total"
                      value={featuredPrice ? formatRupiah(featuredPrice.total) : formatRupiah(0)}
                      highlight
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <section className="soft-panel rounded-[28px] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#111827]">Estimation Engine</p>
                        <p className="mt-1 text-xs text-[#8093a8]">
                          Snapshot tarif yang sedang aktif
                        </p>
                      </div>
                      <div className="soft-ghost-button flex h-10 w-10 items-center justify-center rounded-2xl text-sm">
                        ↗
                      </div>
                    </div>

                    <p className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-[#111827]">
                      {featuredPrice ? formatRupiah(featuredPrice.total) : formatRupiah(0)}
                    </p>

                    <div className="mt-5 space-y-3">
                      <EstimateRow
                        label="Tarif dasar"
                        value={formatRupiah(pricingConfig.baseFare)}
                      />
                      <EstimateRow
                        label="Tarif jarak"
                        value={
                          featuredPrice
                            ? `${formatRupiah(featuredPrice.distanceCost)}`
                            : `${formatRupiah(pricingConfig.distanceRate)}/km`
                        }
                      />
                      <EstimateRow
                        label="Tarif waktu"
                        value={
                          featuredPrice
                            ? `${formatRupiah(featuredPrice.timeCost)}`
                            : `${formatRupiah(pricingConfig.timeRate)}/menit`
                        }
                      />
                      <EstimateRow
                        label="Surge"
                        value={
                          featuredPrice
                            ? `${featuredPrice.surgeMultiplier.toFixed(1)}x`
                            : `${Number.parseFloat(form.surgeMultiplier || "1").toFixed(1)}x`
                        }
                      />
                    </div>
                  </section>

                  <section id="result-display" className="soft-panel rounded-[28px] p-5">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[#111827]">Hasil AI Booking</p>
                        <p className="mt-1 text-xs text-[#8093a8]">
                          Copy-ready summary untuk admin dan WhatsApp
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={copyResult}
                        disabled={!result || isLoading}
                        className="soft-ghost-button rounded-2xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isCopied ? "Copied" : "Copy Result"}
                      </button>
                    </div>

                    {savedBooking ? (
                      <div className="mb-4 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
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

                    <div className="rounded-[24px] border border-[#d9e5f2] bg-white/86 p-4">
                      {isLoading ? (
                        <div className="space-y-3">
                          {[93, 76, 88, 95, 68, 84].map((width, index) => (
                            <div
                              key={`${width}-${index}`}
                              className="h-3.5 animate-pulse rounded-full bg-[#e8f0fa]"
                              style={{ width: `${width}%` }}
                            />
                          ))}
                        </div>
                      ) : error ? (
                        <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                          {error}
                        </p>
                      ) : result ? (
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-[#33465a]">
                          {result}
                        </pre>
                      ) : (
                        <p className="text-sm leading-7 text-[#5f7388]">
                          Hasil AI akan muncul di sini setelah form diproses. Tampilan baru ini
                          hanya mengubah visual presentasi, bukan flow booking.
                        </p>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              <OverviewCard label="Total Booking" value={String(summary.total)} tone="blue" />
              <OverviewCard
                label="Surge Tertinggi"
                value="2.0x"
                tone="yellow"
                helper="Siap untuk demand tinggi"
              />
              <OverviewCard
                label="Minimum Fare"
                value={formatRupiah(pricingConfig.minimumFare)}
                tone="teal"
                helper="Batas bawah estimasi"
              />
            </section>

            <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
              <section id="pricing-breakdown" className="soft-panel rounded-[28px] p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">Pricing Breakdown</p>
                    <p className="mt-1 text-xs text-[#8093a8]">
                      Breakdown sistem harga yang tampil untuk demo
                    </p>
                  </div>
                  <div className="soft-ghost-button flex h-10 w-10 items-center justify-center rounded-2xl text-sm">
                    ↘
                  </div>
                </div>

                <PriceBreakdownPanel breakdown={featuredPrice} />
              </section>

              <section id="booking-history" className="soft-panel rounded-[28px] p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">Riwayat Booking Terbaru</p>
                    <p className="mt-1 text-xs text-[#8093a8]">
                      Bukti bahwa booking benar-benar tersimpan di backend
                    </p>
                  </div>
                  <span className="soft-chip rounded-2xl px-3 py-2 text-xs font-semibold">
                    {recentBookings.length} data
                  </span>
                </div>

                {isLoadingBookings ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="h-24 animate-pulse rounded-[22px] bg-[#eef4fb]"
                      />
                    ))}
                  </div>
                ) : recentBookings.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-[#d6e3f2] bg-white/70 p-6">
                    <p className="text-sm font-semibold text-[#111827]">
                      Belum ada booking tersimpan
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[#5f7388]">
                      Buat satu booking dari form untuk melihat riwayat ini.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="rounded-[24px] border border-[#d6e3f2] bg-white/85 px-4 py-4 shadow-[0_12px_24px_rgba(144,169,196,0.08)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[#111827]">{booking.nama}</p>
                            <p className="mt-1 text-xs text-[#8093a8]">
                              {booking.mobil} | {booking.durasi}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusTone(booking.status)}`}
                          >
                            {booking.status}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                          <div>
                            <p className="text-sm text-[#33465a]">
                              {booking.lokasiJemput} ke {booking.tujuan}
                            </p>
                            <p className="mt-2 text-xs text-[#8093a8]">
                              {booking.id} | {formatBookingTime(booking.createdAt)}
                            </p>
                          </div>
                          <p className="text-base font-semibold text-[#111827]">
                            {booking.priceBreakdown
                              ? formatRupiah(booking.priceBreakdown.total)
                              : "Kalkulasi belum tersedia"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

function ConfigChip({ label }: { label: string }) {
  return <span className="soft-chip rounded-2xl px-3 py-2 text-sm font-medium">{label}</span>;
}

function SidebarBookingCard({
  title,
  subtitle,
  accent,
}: {
  title: string;
  subtitle: string;
  accent: string;
}) {
  return (
    <div className={`rounded-[24px] border border-[#d7e3f1] bg-gradient-to-br ${accent} p-4`}>
      <div className="rounded-[20px] border border-white/80 bg-white/92 px-4 py-6 shadow-[0_10px_24px_rgba(153,174,198,0.08)]">
        <div className="mx-auto h-10 max-w-[160px] rounded-[999px] bg-[radial-gradient(circle_at_center,_#dde7f4,_#b7c6d9)]" />
        <p className="mt-4 text-sm font-semibold text-[#111827]">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[#6c8095]">{subtitle}</p>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-[22px] border border-[#d7e3f1] bg-white/88 px-4 py-4 shadow-[0_10px_24px_rgba(153,174,198,0.08)]">
      <p className="text-xs uppercase tracking-[0.16em] text-[#8a9cb0]">{label}</p>
      <p
        className={`mt-2 text-2xl font-semibold tracking-[-0.05em] ${
          highlight ? "text-[#111827]" : "text-[#243548]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function EstimateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[20px] border border-[#dde7f3] bg-[#fbfdff] px-4 py-3">
      <span className="text-sm text-[#63778d]">{label}</span>
      <span className="text-sm font-semibold text-[#111827]">{value}</span>
    </div>
  );
}

function OverviewCard({
  label,
  value,
  tone,
  helper,
}: {
  label: string;
  value: string;
  tone: "blue" | "yellow" | "teal";
  helper?: string;
}) {
  const toneClass =
    tone === "yellow"
      ? "bg-[linear-gradient(135deg,#ffffff,#fffce3)]"
      : tone === "teal"
        ? "bg-[linear-gradient(135deg,#ffffff,#ecfcff)]"
        : "bg-[linear-gradient(135deg,#ffffff,#eef5ff)]";

  return (
    <div
      className={`rounded-[28px] border border-[#d6e3f2] ${toneClass} px-5 py-5 shadow-[0_14px_28px_rgba(144,169,196,0.08)]`}
    >
      <p className="text-xs uppercase tracking-[0.18em] text-[#8a9cb0]">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#111827]">{value}</p>
      <p className="mt-2 text-sm text-[#65788d]">{helper ?? "Realtime dari sistem booking"}</p>
    </div>
  );
}

function PriceBreakdownPanel({
  breakdown,
}: {
  breakdown: StoredBooking["priceBreakdown"] | null;
}) {
  if (!breakdown) {
    return (
      <div className="rounded-[24px] border border-dashed border-[#d6e3f2] bg-white/70 p-6">
        <p className="text-sm font-semibold text-[#111827]">Belum ada kalkulasi aktif</p>
        <p className="mt-2 text-sm leading-7 text-[#5f7388]">
          Isi jarak, durasi, dan surge di form untuk melihat breakdown harga di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <EstimateRow label="Tarif dasar" value={formatRupiah(breakdown.baseFare)} />
      <EstimateRow
        label={`Biaya jarak (${breakdown.distanceKm} km)`}
        value={formatRupiah(breakdown.distanceCost)}
      />
      <EstimateRow
        label={`Biaya waktu (${breakdown.timeMinutes} menit)`}
        value={formatRupiah(breakdown.timeCost)}
      />
      <EstimateRow label="Subtotal" value={formatRupiah(breakdown.subtotal)} />
      <EstimateRow label="Surge" value={`${breakdown.surgeMultiplier.toFixed(1)}x`} />
      <EstimateRow label="Kenaikan surge" value={formatRupiah(breakdown.surgeAmount)} />
      <EstimateRow
        label="Minimum fare"
        value={
          breakdown.minimumApplied
            ? `${formatRupiah(breakdown.minimumFare)} dipakai`
            : formatRupiah(breakdown.minimumFare)
        }
      />

      <div className="rounded-[24px] border border-[#d6e3f2] bg-[#111317] px-4 py-4 text-white shadow-[0_16px_30px_rgba(17,19,23,0.18)]">
        <p className="text-xs uppercase tracking-[0.18em] text-white/60">Total akhir</p>
        <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
          {formatRupiah(breakdown.total)}
        </p>
      </div>
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
  const inputRef = useRef<HTMLInputElement>(null);
  const hasPickerButton = type === "date" || type === "time";

  const openPicker = () => {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    input.focus();

    if ("showPicker" in input && typeof input.showPicker === "function") {
      try {
        input.showPicker();
        return;
      } catch {
        // Fall back to click for browsers that block showPicker.
      }
    }

    input.click();
  };

  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-[#27384d]">
      {label}
      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`soft-input h-12 rounded-2xl px-4 text-sm ${
            hasPickerButton ? "has-picker pr-14" : ""
          }`}
          step={step}
          min={min}
        />
        {hasPickerButton ? (
          <button
            type="button"
            onClick={openPicker}
            aria-label={
              type === "date"
                ? `Buka kalender untuk ${label}`
                : `Buka pilihan waktu untuk ${label}`
            }
            className="picker-trigger absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl border border-[#cbd9ea] bg-white text-[#1d2a3d] shadow-[0_8px_18px_rgba(118,146,181,0.16)] transition hover:border-[#a9c3e0] hover:bg-[#f8fbff]"
          >
            {type === "date" ? <CalendarGlyph /> : <ClockGlyph />}
          </button>
        ) : null}
      </div>
    </label>
  );
}

function CalendarGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3.8v3.6M16 3.8v3.6M4 9.5h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.5 13h2.5M13 13h2.5M8.5 16.5H11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ClockGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.8v4.7l3.2 1.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CarShowcase() {
  return (
    <svg
      viewBox="0 0 860 280"
      className="mx-auto block w-full max-w-4xl"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="car-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fbff" />
          <stop offset="36%" stopColor="#c9d4e1" />
          <stop offset="78%" stopColor="#8f9dad" />
          <stop offset="100%" stopColor="#dfe7f0" />
        </linearGradient>
        <linearGradient id="car-shadow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(104,124,148,0)" />
          <stop offset="50%" stopColor="rgba(104,124,148,0.22)" />
          <stop offset="100%" stopColor="rgba(104,124,148,0)" />
        </linearGradient>
      </defs>

      <ellipse cx="430" cy="232" rx="260" ry="18" fill="url(#car-shadow)" />
      <path
        d="M188 168c18-44 70-92 129-104 52-11 165-13 225 0 52 11 114 54 130 104l-34 7H220l-32-7Z"
        fill="url(#car-body)"
        stroke="#7c8da1"
        strokeWidth="4"
      />
      <path
        d="M298 70c35-16 179-18 238-5 36 8 78 38 105 77H248c20-31 27-44 50-72Z"
        fill="#edf2f7"
        stroke="#7c8da1"
        strokeWidth="4"
      />
      <path
        d="M332 83c45-12 129-13 170-6 23 4 52 24 77 57H300c12-17 15-28 32-51Z"
        fill="#d9e4f0"
      />
      <rect x="474" y="112" width="83" height="13" rx="6" fill="#9ca9b8" />
      <rect x="244" y="133" width="76" height="13" rx="6" fill="#aeb8c4" />
      <path d="M170 168h518l-16 23H188z" fill="#c4cfdb" />
      <path d="M385 118h105l-18 48h-94z" fill="#202833" opacity="0.75" />
      <path d="M273 142h82l-14 24h-90z" fill="#202833" opacity="0.88" />
      <path d="M608 145h41l-4 20h-39z" fill="#202833" opacity="0.82" />
      <path d="M679 166h29l-15 25h-22z" fill="#d0d8e1" />
      <path d="M155 166h44l18 28h-59z" fill="#d0d8e1" />
      <circle cx="291" cy="200" r="44" fill="#1c2430" />
      <circle cx="291" cy="200" r="25" fill="#d5dee8" />
      <circle cx="587" cy="200" r="44" fill="#1c2430" />
      <circle cx="587" cy="200" r="25" fill="#d5dee8" />
      <circle cx="291" cy="200" r="10" fill="#7f8c9b" />
      <circle cx="587" cy="200" r="10" fill="#7f8c9b" />
    </svg>
  );
}
