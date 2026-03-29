"use client";

import Link from "next/link";
import type { BookingStatus, StoredBooking } from "@/lib/booking";
import { bookingStatuses } from "@/lib/booking";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";

type BookingsListResponse = {
  bookings?: StoredBooking[];
  error?: string;
};

type BookingStatusResponse = {
  booking?: StoredBooking;
  bookings?: StoredBooking[];
  error?: string;
};

const statusLabels: Record<BookingStatus, string> = {
  baru: "Baru",
  diproses: "Diproses",
  selesai: "Selesai",
  batal: "Batal",
};

const statusClasses: Record<BookingStatus, string> = {
  baru: "bg-sky-400/14 text-sky-100 border border-sky-300/16",
  diproses: "bg-amber-400/14 text-amber-100 border border-amber-300/16",
  selesai: "bg-emerald-400/14 text-emerald-100 border border-emerald-300/16",
  batal: "bg-rose-400/14 text-rose-100 border border-rose-300/16",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function countByStatus(bookings: StoredBooking[], status: BookingStatus) {
  return bookings.filter((booking) => booking.status === status).length;
}

export default function AdminPage() {
  const [bookings, setBookings] = useState<StoredBooking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "semua">("semua");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    let isActive = true;

    async function loadBookings() {
      try {
        const response = await fetch("/api/bookings?limit=all", { cache: "no-store" });
        const data: BookingsListResponse = await response.json();

        if (!response.ok || !isActive) {
          setError(data.error ?? "Gagal memuat data booking.");
          return;
        }

        setBookings(data.bookings ?? []);
      } catch {
        if (isActive) {
          setError("Jaringan bermasalah saat memuat dashboard.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadBookings();

    return () => {
      isActive = false;
    };
  }, []);

  const filteredBookings = useMemo(() => {
    const keyword = deferredSearch.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesStatus = statusFilter === "semua" || booking.status === statusFilter;
      const matchesKeyword =
        keyword === "" ||
        booking.id.toLowerCase().includes(keyword) ||
        booking.nama.toLowerCase().includes(keyword) ||
        booking.whatsapp.toLowerCase().includes(keyword) ||
        booking.tujuan.toLowerCase().includes(keyword) ||
        booking.lokasiJemput.toLowerCase().includes(keyword);

      return matchesStatus && matchesKeyword;
    });
  }, [bookings, deferredSearch, statusFilter]);

  useEffect(() => {
    if (filteredBookings.length === 0) {
      setSelectedBookingId("");
      return;
    }

    if (!filteredBookings.some((booking) => booking.id === selectedBookingId)) {
      setSelectedBookingId(filteredBookings[0].id);
    }
  }, [filteredBookings, selectedBookingId]);

  const selectedBooking =
    filteredBookings.find((booking) => booking.id === selectedBookingId) ?? null;

  async function handleStatusUpdate(nextStatus: BookingStatus) {
    if (!selectedBooking || selectedBooking.status === nextStatus) {
      return;
    }

    setIsUpdating(true);
    setError("");

    try {
      const response = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data: BookingStatusResponse = await response.json();

      if (!response.ok || !data.bookings || !data.booking) {
        setError(data.error ?? "Gagal memperbarui status booking.");
        return;
      }

      startTransition(() => {
        setBookings(data.bookings ?? []);
        setSelectedBookingId(data.booking?.id ?? "");
      });
    } catch {
      setError("Jaringan bermasalah saat memperbarui status.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="min-h-screen px-3 py-3 md:px-6 md:py-6">
      <div className="dashboard-shell mx-auto max-w-7xl rounded-[32px] p-3 md:p-5">
        <div className="pointer-events-none absolute left-0 top-0 h-80 w-80 rounded-full bg-[#8b74ff]/14 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#52c7ff]/12 blur-3xl" />

        <header className="glass-panel rounded-[26px] px-4 py-4 md:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-sky-200">CARSI ADMIN</p>
              <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">
                Dashboard Booking
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-soft">
                UX tetap seperti dashboard admin sebelumnya: statistik, filter, daftar booking, dan
                detail order. Yang berubah hanya skin visual agar selaras dengan referensi.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="neon-pill flex h-11 items-center gap-3 rounded-full px-4 text-sm text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                Admin console live
              </div>
              <Link
                href="/"
                className="ghost-button rounded-full px-5 py-2 text-sm font-semibold text-slate-200"
              >
                Kembali ke Form
              </Link>
            </div>
          </div>
        </header>

        <section className="mt-4 grid gap-4 md:grid-cols-4">
          <StatCard label="Total Booking" value={String(bookings.length)} />
          <StatCard label="Baru" value={String(countByStatus(bookings, "baru"))} />
          <StatCard label="Diproses" value={String(countByStatus(bookings, "diproses"))} />
          <StatCard label="Selesai" value={String(countByStatus(bookings, "selesai"))} />
        </section>

        <section className="mt-4 glass-panel rounded-[30px] p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <label className="block text-xs uppercase tracking-[0.16em] text-dim">
                Cari booking
              </label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama, nomor WA, ID booking, atau tujuan"
                className="neon-input mt-2 h-12 w-full rounded-2xl px-4 text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <FilterPill
                label="Semua"
                active={statusFilter === "semua"}
                onClick={() => setStatusFilter("semua")}
              />
              {bookingStatuses.map((status) => (
                <FilterPill
                  key={status}
                  label={statusLabels[status]}
                  active={statusFilter === status}
                  onClick={() => setStatusFilter(status)}
                />
              ))}
            </div>
          </div>
        </section>

        {error ? (
          <div className="mt-4 rounded-[24px] border border-rose-300/12 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <section className="mt-4 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="glass-panel rounded-[30px] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Daftar Booking</p>
                <p className="mt-1 text-xs text-dim">
                  {filteredBookings.length} booking cocok dengan filter
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-24 animate-pulse rounded-2xl bg-white/[0.04]" />
                ))}
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-center">
                <p className="text-sm font-semibold text-white">Belum ada data yang cocok</p>
                <p className="mt-1 text-sm text-dim">
                  Coba ubah filter atau kembali ke form booking.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookings.map((booking) => {
                  const isActive = booking.id === selectedBookingId;

                  return (
                    <button
                      key={booking.id}
                      type="button"
                      onClick={() => setSelectedBookingId(booking.id)}
                      className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                        isActive
                          ? "border-[#89a6ff]/45 bg-[#111a2f] shadow-[0_18px_42px_rgba(78,203,255,0.08)]"
                          : "border-white/8 bg-white/[0.03] hover:border-[#7395ff]/28"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-white">{booking.nama}</p>
                          <p className="mt-1 text-xs text-dim">
                            {booking.id} | {booking.mobil} | {booking.durasi}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[11px] ${statusClasses[booking.status]}`}>
                          {statusLabels[booking.status]}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-soft">
                        {booking.lokasiJemput} ke {booking.tujuan}
                      </p>
                      <p className="mt-2 text-xs text-dim">
                        Dibuat {formatDateTime(booking.createdAt)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="glass-panel-strong rounded-[30px] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Detail Booking</p>
                <p className="mt-1 text-xs text-dim">
                  Lihat detail lengkap dan ubah status order di sini
                </p>
              </div>
            </div>

            {!selectedBooking ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-center">
                <p className="text-sm font-semibold text-white">
                  Pilih salah satu booking untuk melihat detailnya
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-[26px] border border-white/8 bg-[#090d18]/82 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-sky-200">
                        {selectedBooking.id}
                      </p>
                      <h2 className="mt-2 text-3xl font-black text-white">
                        {selectedBooking.nama}
                      </h2>
                      <p className="mt-2 text-sm text-soft">
                        {selectedBooking.whatsapp} | {formatDateTime(selectedBooking.createdAt)}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1.5 text-xs ${statusClasses[selectedBooking.status]}`}>
                      {statusLabels[selectedBooking.status]}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <DetailCard label="Lokasi Jemput" value={selectedBooking.lokasiJemput} />
                  <DetailCard label="Tujuan" value={selectedBooking.tujuan} />
                  <DetailCard label="Tanggal" value={selectedBooking.tanggal} />
                  <DetailCard label="Jam" value={selectedBooking.jam} />
                  <DetailCard label="Mobil" value={selectedBooking.mobil} />
                  <DetailCard label="Durasi" value={selectedBooking.durasi} />
                </div>

                <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-sm font-semibold text-white">Ubah Status Booking</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {bookingStatuses.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => void handleStatusUpdate(status)}
                        disabled={isUpdating || selectedBooking.status === status}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          selectedBooking.status === status
                            ? `${statusClasses[status]} shadow-[0_0_24px_rgba(126,166,255,0.14)]`
                            : "ghost-button text-slate-200"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {statusLabels[status]}
                      </button>
                    ))}
                  </div>
                </div>

                <DetailPanel
                  label="Catatan Tambahan"
                  value={selectedBooking.catatan || "Tidak ada catatan tambahan."}
                />

                <DetailPanel label="Ringkasan AI" value={selectedBooking.aiSummary} />

                <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-sm font-semibold text-white">Model AI</p>
                  <p className="mt-2 text-sm text-soft">{selectedBooking.aiModel}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-panel rounded-[24px] px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-dim">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active ? "neon-button text-white" : "ghost-button text-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-dim">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function DetailPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
      <p className="text-sm font-semibold text-white">{label}</p>
      <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-7 text-soft">{value}</pre>
    </div>
  );
}
