export type UserRole = "CUSTOMER" | "DESIGNER" | "ADMIN";

export type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type DesignerApprovalStatus =
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

export type BookingStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "AWAITING_PAYMENT"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUND_REQUESTED"
  | "REFUNDED";

export type PaymentStatus =
  | "UNPAID"
  | "DEPOSIT_INITIATED"
  | "DEPOSIT_PAID_DEMO"
  | "PAID_DEMO"
  | "REFUND_PENDING"
  | "REFUNDED_DEMO"
  | "FAILED";

export type AppointmentType =
  | "HOME_VISIT"
  | "STUDIO_APPOINTMENT"
  | "ONLINE_CONSULTATION"
  | "SHOPPING_ASSISTANCE"
  | "EVENT_VENUE_VISIT";

export type OccasionType =
  | "Wedding"
  | "Engagement"
  | "Reception"
  | "Birthday"
  | "Festival"
  | "Corporate"
  | "Personal"
  | "Other";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: AccountStatus;
  avatarUrl: string;
  city: string;
  createdAt: string;
}

export interface Address {
  id: string;
  userId: string;
  label: "Home" | "Event Venue" | "Office" | "Other";
  line1: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  preferredStyleTags: string[];
  defaultCity: string;
  savedAddresses: Address[];
  totalBookings: number;
  notes?: string;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  groupName: string;
  description: string;
  imageUrl: string;
  commissionRate: number;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  subcategories: Subcategory[];
}

export interface ServicePackage {
  id: string;
  serviceId: string;
  name: string;
  description: string;
  priceInr: number;
  deliverables: string[];
  durationLabel: string;
}

export interface Service {
  id: string;
  designerId: string;
  categoryId: string;
  subcategoryName: string;
  title: string;
  description: string;
  priceInr: number;
  durationMinutes: number;
  appointmentTypes: AppointmentType[];
  serviceCities: string[];
  travelChargeInr: number;
  imageUrl: string;
  isActive: boolean;
  packages: ServicePackage[];
}

export interface PortfolioImage {
  id: string;
  portfolioId: string;
  url: string;
  caption: string;
}

export interface Portfolio {
  id: string;
  designerId: string;
  title: string;
  categoryName: string;
  occasion: string;
  city: string;
  description: string;
  coverImageUrl: string;
  images: PortfolioImage[];
  createdAt: string;
}

export interface AvailabilitySlot {
  id: string;
  designerId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "10:00 AM"
  endTime: string; // e.g. "11:30 AM"
  isAvailable: boolean;
  isBreak?: boolean;
  bookedByBookingId?: string;
}

export interface AvailabilitySchedule {
  designerId: string;
  workingDays: string[];
  workingHoursStart: string;
  workingHoursEnd: string;
  breakStart: string;
  breakEnd: string;
  blockedDates: string[];
  slots: AvailabilitySlot[];
}

export interface DesignerVerification {
  id: string;
  designerId: string;
  documentType: "Aadhaar / Govt ID" | "Design Studio Registration" | "Portfolio Credential";
  documentRefMasked: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewerNotes?: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
}

export interface DesignerFaq {
  question: string;
  answer: string;
}

export interface UserLocationState {
  lat: number;
  lng: number;
  city: string;
  label?: string;
  kind?: string;
  source: "GPS" | "CITY" | "AUTO" | "PLACE";
  updatedAt: string;
}

export interface DesignerProfile {
  id: string;
  userId: string;
  slug: string;
  name: string;
  title: string;
  city: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  serviceRadiusKm: number;
  experienceYears: number;
  rating: number;
  reviewCount: number;
  startingPriceInr: number;
  bio: string;
  skills: string[];
  categoryIds: string[];
  categoryNames: string[];
  supportedAppointmentTypes: AppointmentType[];
  avatarUrl: string;
  coverImageUrl: string;
  isVerified: boolean;
  isFeatured: boolean;
  approvalStatus: DesignerApprovalStatus;
  commissionOverridePercent?: number;
  availabilitySummary: string;
  completedProjectsCount: number;
  faqs: DesignerFaq[];
}

export interface BookingRequirement {
  occasionDate: string;
  preferredStyle: string;
  budgetInr: number;
  peopleCount: number;
  additionalRequirements: string;
  referenceImageNames: string[];
  notes: string;
}

export interface BookingStatusHistory {
  id: string;
  bookingId: string;
  status: BookingStatus;
  changedByRole: UserRole;
  note: string;
  timestamp: string;
}

export interface Booking {
  id: string;
  bookingCode: string;
  customerId: string;
  customerName: string;
  designerId: string;
  designerName: string;
  serviceId: string;
  serviceTitle: string;
  categoryId: string;
  occasion: OccasionType;
  appointmentType: AppointmentType;
  date: string;
  startTime: string;
  endTime: string;
  slotId?: string;
  addressLabel: string;
  addressFull: string;
  city: string;
  basePriceInr: number;
  travelFeeInr: number;
  platformServiceFeeInr: number;
  discountInr: number;
  totalAmountInr: number;
  depositAmountInr: number;
  paymentMode: "DEPOSIT" | "FULL";
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  rejectionReason?: string;
  rescheduleSuggestedSlot?: string;
  cancellationReason?: string;
  requirements: BookingRequirement;
  statusHistory: BookingStatusHistory[];
  createdAt: string;
  idempotencyKey?: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  bookingCode: string;
  customerName: string;
  designerName: string;
  gateway: "RAZORPAY_TEST_SANDBOX";
  gatewayOrderId: string;
  amountInr: number;
  paymentMode: "DEPOSIT" | "FULL";
  status: PaymentStatus;
  createdAt: string;
}

export interface Refund {
  id: string;
  bookingId: string;
  bookingCode: string;
  paymentId: string;
  customerName: string;
  amountInr: number;
  reason: string;
  status: "REQUESTED" | "APPROVED_DEMO" | "REJECTED" | "PROCESSED_DEMO";
  createdAt: string;
}

export interface Commission {
  id: string;
  bookingId: string;
  bookingCode: string;
  designerId: string;
  designerName: string;
  categoryName: string;
  grossAmountInr: number;
  commissionRatePercent: number;
  platformFeeInr: number;
  netDesignerInr: number;
  settled: boolean;
  createdAt: string;
}

export interface Payout {
  id: string;
  designerId: string;
  designerName: string;
  amountInr: number;
  periodLabel: string;
  status: "PENDING_SETTLEMENT" | "PAID_DEMO";
  referenceCode: string;
  paidAt?: string;
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  designerId: string;
  designerName: string;
  serviceTitle: string;
  rating: number;
  comment: string;
  isDemoSample: boolean;
  moderationStatus: "PUBLISHED" | "FLAGGED" | "HIDDEN";
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  body: string;
  attachmentUrl?: string;
  attachmentName?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  bookingId?: string;
  bookingCode?: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  designerId: string;
  designerName: string;
  designerAvatar: string;
  subject: string;
  lastMessagePreview: string;
  unreadCountCustomer: number;
  unreadCountDesigner: number;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  role: UserRole;
  type:
    | "BOOKING_RECEIVED"
    | "BOOKING_ACCEPTED"
    | "BOOKING_REJECTED"
    | "PAYMENT_UPDATE"
    | "APPOINTMENT_REMINDER"
    | "BOOKING_CANCELLED"
    | "RESCHEDULE_REQUEST"
    | "NEW_MESSAGE"
    | "REVIEW_REMINDER"
    | "DESIGNER_APPROVAL";
  title: string;
  message: string;
  linkHref: string;
  isRead: boolean;
  createdAt: string;
}

export interface Favourite {
  id: string;
  customerId: string;
  designerId: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountPercent: number;
  maxDiscountInr: number;
  minOrderInr: number;
  isActive: boolean;
  expiresAt: string;
}

export interface PlatformSettings {
  platformName: string;
  tagline: string;
  defaultCommissionPercent: number;
  requireDesignerVerification: boolean;
  depositPercentage: number;
  cancellationFreeHours: number;
  partialRefundPercent: number;
  razorpayMode: "TEST_SANDBOX_PREP";
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  termsSummary: string;
  privacySummary: string;
}

export interface AdminAuditLog {
  id: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
}

export interface CmsContent {
  heroHeadline: string;
  heroSubheadline: string;
  becomeDesignerHeadline: string;
  becomeDesignerSubheadline: string;
  promoBannerText: string;
  promoBannerActive: boolean;
  faqs: Array<{ id: string; question: string; answer: string }>;
  footerTagline: string;
  testimonials: Array<{
    id: string;
    authorName: string;
    city: string;
    occasion: string;
    quote: string;
    rating: number;
    isDemoSample: boolean;
  }>;
}
