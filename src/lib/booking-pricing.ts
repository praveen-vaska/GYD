import type {
  AppointmentType,
  AvailabilitySchedule,
  Booking,
  Coupon,
  Service,
} from "../types";

export const ACTIVE_SLOT_HOLD_STATUSES = new Set<string>([
  "PENDING",
  "ACCEPTED",
  "AWAITING_PAYMENT",
  "CONFIRMED",
  "IN_PROGRESS",
]);

export interface BookingQuoteInput {
  service: Pick<Service, "priceInr" | "travelChargeInr">;
  appointmentType: AppointmentType;
  couponCode?: string;
  coupons: Coupon[];
  depositPercentage: number;
}

export interface BookingQuoteResult {
  basePriceInr: number;
  travelFeeInr: number;
  platformServiceFeeInr: number;
  discountInr: number;
  matchedCouponCode: string | null;
  couponMessage: string | null;
  totalAmountInr: number;
  depositPercentage: number;
  depositAmountInr: number;
  balanceDueInr: number;
}

/** Computes authoritative INR booking amounts matching GYD platform rules. */
export function calculateBookingQuote(
  input: BookingQuoteInput
): BookingQuoteResult {
  const basePriceInr = Math.max(0, Math.round(input.service.priceInr));
  const travelFeeInr =
    input.appointmentType === "ONLINE_CONSULTATION" ||
    input.appointmentType === "STUDIO_APPOINTMENT"
      ? 0
      : Math.max(0, Math.round(input.service.travelChargeInr));
  const platformServiceFeeInr = Math.round(basePriceInr * 0.05);

  const normalizedCode = input.couponCode?.trim().toUpperCase() ?? "";
  let discountInr = 0;
  let matchedCouponCode: string | null = null;
  let couponMessage: string | null = null;

  if (normalizedCode) {
    const matched = input.coupons.find(
      (c) => c.isActive && c.code.toUpperCase() === normalizedCode
    );
    if (!matched) {
      couponMessage = `Promo code "${normalizedCode}" is invalid or inactive.`;
    } else if (basePriceInr < matched.minOrderInr) {
      couponMessage = `Minimum service order ₹${matched.minOrderInr} required for ${matched.code}.`;
    } else {
      discountInr = Math.min(
        matched.maxDiscountInr,
        Math.round((basePriceInr * matched.discountPercent) / 100)
      );
      matchedCouponCode = matched.code;
      couponMessage = `${matched.code} applied (-${matched.discountPercent}% up to ₹${matched.maxDiscountInr}).`;
    }
  }

  const totalAmountInr = Math.max(
    499,
    basePriceInr + travelFeeInr + platformServiceFeeInr - discountInr
  );
  const depositPercentage = Math.min(
    100,
    Math.max(10, Math.round(input.depositPercentage))
  );
  const depositAmountInr = Math.round(
    (totalAmountInr * depositPercentage) / 100
  );
  const balanceDueInr = Math.max(0, totalAmountInr - depositAmountInr);

  return {
    basePriceInr,
    travelFeeInr,
    platformServiceFeeInr,
    discountInr,
    matchedCouponCode,
    couponMessage,
    totalAmountInr,
    depositPercentage,
    depositAmountInr,
    balanceDueInr,
  };
}

/** Overlays live booking reservations onto a designer's availability slots. */
export function applyBookingSlotLocks(
  schedule: AvailabilitySchedule | null,
  bookings: Array<
    Pick<Booking, "id" | "slotId" | "date" | "startTime" | "status">
  >
): AvailabilitySchedule | null {
  if (!schedule) return null;

  const lockedBookings = bookings.filter((b) =>
    ACTIVE_SLOT_HOLD_STATUSES.has(b.status)
  );
  const blockedSet = new Set(schedule.blockedDates ?? []);

  return {
    ...schedule,
    slots: (schedule.slots ?? []).map((slot) => {
      const conflict = lockedBookings.find(
        (b) =>
          b.slotId === slot.id ||
          (b.date === slot.date && b.startTime === slot.startTime)
      );
      const isBlockedDate = blockedSet.has(slot.date);
      if (conflict) {
        return {
          ...slot,
          isAvailable: false,
          bookedByBookingId: conflict.id,
        };
      }
      if (isBlockedDate) {
        return {
          ...slot,
          isAvailable: false,
        };
      }
      return slot;
    }),
  };
}
