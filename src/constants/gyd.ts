import { AppointmentType, BookingStatus, OccasionType } from "../types";

export const GYD_BRAND = {
  name: "GYD",
  fullName: "GYD – Get Your Designer",
  tagline: "Your Occasion. Your Style. Your Designer.",
  proposition: "Don't Guess Your Style. Get Your Designer.",
  supportEmail: "concierge@getyourdesigner.in",
  supportPhone: "+91 40 4820 9100",
} as const;

export const INDIAN_CITIES = [
  "All Cities",
  "Hyderabad",
  "Bengaluru",
  "Chennai",
  "Mumbai",
  "New Delhi",
  "Pune",
  "Jaipur",
  "Kochi",
  "Kolkata",
] as const;

export const SERVICE_CITIES = INDIAN_CITIES.filter((c) => c !== "All Cities");

export const OCCASION_OPTIONS: OccasionType[] = [
  "Wedding",
  "Engagement",
  "Reception",
  "Birthday",
  "Festival",
  "Corporate",
  "Personal",
  "Other",
];

export const APPOINTMENT_TYPE_META: Record<
  AppointmentType,
  { label: string; shortLabel: string; description: string }
> = {
  HOME_VISIT: {
    label: "Home Visit",
    shortLabel: "Home Visit",
    description: "Designer visits your residence for private fittings & styling.",
  },
  STUDIO_APPOINTMENT: {
    label: "Studio Appointment",
    shortLabel: "Studio",
    description: "Meet at the designer's curated atelier with fabric libraries.",
  },
  ONLINE_CONSULTATION: {
    label: "Online Consultation",
    shortLabel: "Online",
    description: "High-definition video lookbook session & colour palette curation.",
  },
  SHOPPING_ASSISTANCE: {
    label: "Shopping Assistance",
    shortLabel: "Shopping Assist",
    description: "Accompanied boutique & flagship store sourcing across your city.",
  },
  EVENT_VENUE_VISIT: {
    label: "Event Venue Visit",
    shortLabel: "Venue Visit",
    description: "On-site spatial styling, lighting & mandap/decor walkthrough.",
  },
};

export const BOOKING_STATUS_META: Record<
  BookingStatus,
  { label: string; tone: "neutral" | "info" | "success" | "warning" | "error" }
> = {
  PENDING: { label: "Pending Designer Review", tone: "warning" },
  ACCEPTED: { label: "Accepted by Designer", tone: "info" },
  REJECTED: { label: "Declined", tone: "error" },
  AWAITING_PAYMENT: { label: "Awaiting Payment", tone: "warning" },
  CONFIRMED: { label: "Confirmed", tone: "success" },
  IN_PROGRESS: { label: "In Progress", tone: "info" },
  COMPLETED: { label: "Completed", tone: "success" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
  REFUND_REQUESTED: { label: "Refund Requested", tone: "warning" },
  REFUNDED: { label: "Refunded (Demo)", tone: "neutral" },
};

export const DEMO_ACCOUNTS = [
  {
    role: "CUSTOMER" as const,
    label: "Customer Demo",
    userId: "usr-cust-1",
    name: "Ananya Reddy",
    email: "customer.demo@gyd.in",
    passcodeLabel: "Demo Pass: GydDemo@2026",
    city: "Hyderabad",
    redirectHref: "/customer/dashboard",
    description: "Browse designers, complete multi-step bookings, message & track appointments.",
  },
  {
    role: "DESIGNER" as const,
    label: "Designer Demo",
    userId: "usr-des-1",
    designerId: "des-1",
    name: "Meera Vardhan",
    email: "designer.demo@gyd.in",
    passcodeLabel: "Demo Pass: GydDemo@2026",
    city: "Hyderabad",
    redirectHref: "/designer/dashboard",
    description: "Manage wedding styling services, portfolio, slot calendar & payouts.",
  },
] as const;

export const OCCASION_INSPIRATION_COLLECTIONS = [
  {
    id: "occ-weddings",
    title: "Weddings",
    subtitle: "Bridal Trousseau, Mandap Couture & Sangeet",
    imageUrl: "/images/occasions/weddings.jpg",
    filterCategory: "Wedding Styling",
    filterOccasion: "Wedding",
    designerCount: 42,
  },
  {
    id: "occ-engagements",
    title: "Engagement Celebrations",
    subtitle: "Cocktail Silhouettes & Evening Glam",
    imageUrl: "/images/occasions/engagements.jpg",
    filterCategory: "Engagement Styling",
    filterOccasion: "Engagement",
    designerCount: 28,
  },
  {
    id: "occ-birthdays",
    title: "Birthday Parties",
    subtitle: "Milestone Dinner Tablescapes & Statement Looks",
    imageUrl: "/images/occasions/birthdays.jpg",
    filterCategory: "Birthday Decoration",
    filterOccasion: "Birthday",
    designerCount: 31,
  },
  {
    id: "occ-festivals",
    title: "Festivals",
    subtitle: "Handloom Heritage, Puja Spaces & Family Colour Stories",
    imageUrl: "/images/occasions/festivals.jpg",
    filterCategory: "Traditional Wear Styling",
    filterOccasion: "Festival",
    designerCount: 35,
  },
  {
    id: "occ-corporate",
    title: "Corporate Events",
    subtitle: "Executive Presence, Summits & Brand Keynotes",
    imageUrl: "/images/occasions/corporate.jpg",
    filterCategory: "Corporate Styling",
    filterOccasion: "Corporate",
    designerCount: 19,
  },
  {
    id: "occ-everyday",
    title: "Everyday Transformations",
    subtitle: "Capsule Wardrobes & Serene Living Corners",
    imageUrl: "/images/occasions/everyday.jpg",
    filterCategory: "Wardrobe Makeover",
    filterOccasion: "Personal",
    designerCount: 27,
  },
] as const;
