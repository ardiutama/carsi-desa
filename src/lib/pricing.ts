import { BookingPayload, PriceBreakdown } from "@/lib/booking";

export const pricingConfig = {
  baseFare: 10_000,
  distanceRate: 3_500,
  timeRate: 500,
  minimumFare: 20_000,
} as const;

export const surgeOptions = [
  { value: 1, label: "Normal (1.0x)" },
  { value: 1.2, label: "Ramai (1.2x)" },
  { value: 1.5, label: "Sibuk (1.5x)" },
  { value: 2, label: "Puncak (2.0x)" },
] as const;

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function calculateRentalPrice(
  booking: Pick<BookingPayload, "jarakKm" | "estimasiMenit" | "surgeMultiplier">,
): PriceBreakdown {
  const distanceKm = Number(booking.jarakKm.toFixed(1));
  const timeMinutes = Math.round(booking.estimasiMenit);
  const surgeMultiplier = Number(booking.surgeMultiplier.toFixed(2));

  const distanceCost = Math.round(distanceKm * pricingConfig.distanceRate);
  const timeCost = Math.round(timeMinutes * pricingConfig.timeRate);
  const subtotal = pricingConfig.baseFare + distanceCost + timeCost;
  const surgedTotal = Math.round(subtotal * surgeMultiplier);
  const total = Math.max(pricingConfig.minimumFare, surgedTotal);

  return {
    baseFare: pricingConfig.baseFare,
    distanceRate: pricingConfig.distanceRate,
    distanceKm,
    distanceCost,
    timeRate: pricingConfig.timeRate,
    timeMinutes,
    timeCost,
    surgeMultiplier,
    surgeAmount: Math.max(0, surgedTotal - subtotal),
    subtotal,
    minimumFare: pricingConfig.minimumFare,
    minimumApplied: total === pricingConfig.minimumFare && surgedTotal < pricingConfig.minimumFare,
    total,
  };
}
