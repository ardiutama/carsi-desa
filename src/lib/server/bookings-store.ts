import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { BookingPayload, BookingStatus, StoredBooking } from "@/lib/booking";

const dataDirectory = path.join(process.cwd(), "data");
const dataFile = path.join(dataDirectory, "bookings.json");

async function ensureStore() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(dataFile, "utf8");
  } catch {
    await writeFile(dataFile, "[]", "utf8");
  }
}

async function readBookings(): Promise<StoredBooking[]> {
  await ensureStore();

  try {
    const content = await readFile(dataFile, "utf8");
    const parsed = JSON.parse(content) as StoredBooking[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeBookings(bookings: StoredBooking[]) {
  await ensureStore();
  await writeFile(dataFile, JSON.stringify(bookings, null, 2), "utf8");
}

function createBookingId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `CRS-${date}-${randomUUID().slice(0, 6).toUpperCase()}`;
}

export async function saveBooking(
  booking: BookingPayload,
  aiSummary: string,
  aiModel: string,
): Promise<StoredBooking> {
  const bookings = await readBookings();
  const record: StoredBooking = {
    ...booking,
    id: createBookingId(),
    status: "baru",
    aiSummary,
    aiModel,
    createdAt: new Date().toISOString(),
  };

  const updatedBookings = [record, ...bookings];
  await writeBookings(updatedBookings);
  return record;
}

export async function getRecentBookings(limit = 6): Promise<StoredBooking[]> {
  const bookings = await readBookings();
  return bookings.slice(0, limit);
}

export async function getAllBookings(): Promise<StoredBooking[]> {
  return readBookings();
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
): Promise<StoredBooking | null> {
  const bookings = await readBookings();
  const targetIndex = bookings.findIndex((booking) => booking.id === id);

  if (targetIndex === -1) {
    return null;
  }

  const updatedBooking: StoredBooking = {
    ...bookings[targetIndex],
    status,
  };

  bookings[targetIndex] = updatedBooking;
  await writeBookings(bookings);

  return updatedBooking;
}
