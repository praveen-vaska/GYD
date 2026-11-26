"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AccountStatus,
  Address,
  AdminAuditLog,
  AppointmentType,
  AvailabilitySchedule,
  Booking,
  BookingRequirement,
  BookingStatus,
  Category,
  CmsContent,
  Commission,
  Coupon,
  Conversation,
  CustomerProfile,
  DesignerApprovalStatus,
  DesignerProfile,
  DesignerVerification,
  Favourite,
  Message,
  NotificationItem,
  OccasionType,
  Payment,
  PaymentStatus,
  Payout,
  PlatformSettings,
  Portfolio,
  Refund,
  Review,
  Service,
  User,
  UserLocationState,
  UserRole,
} from "@/types";
import {
  SEED_ADDRESSES,
  SEED_AUDIT_LOGS,
  SEED_AVAILABILITY,
  SEED_BOOKINGS,
  SEED_CATEGORIES,
  SEED_CMS,
  SEED_COMMISSIONS,
  SEED_CONVERSATIONS,
  SEED_COUPONS,
  SEED_CUSTOMERS,
  SEED_DESIGNERS,
  SEED_FAVOURITES,
  SEED_MESSAGES,
  SEED_NOTIFICATIONS,
  SEED_PAYMENTS,
  SEED_PAYOUTS,
  SEED_PLATFORM_SETTINGS,
  SEED_PORTFOLIOS,
  SEED_REFUNDS,
  SEED_REVIEWS,
  SEED_SERVICES,
  SEED_USERS,
  SEED_VERIFICATIONS,
} from "@/services/mock/seed-data";
import { DEMO_ACCOUNTS } from "@/constants/gyd";
import {
  calculateCommissionBreakdown,
  generateBookingCode,
  slugify,
} from "@/lib/utils";
import {
  CITY_COORDINATES,
  PlaceSuggestion,
  calculateDistanceKm,
  getDesignerCoordinates,
  resolveNearestCity,
} from "@/lib/location/nearby";
import { SessionPayload, sanitizeText } from "@/lib/auth/session";

export type LocationDetectStatus =
  | "idle"
  | "detecting"
  | "granted"
  | "denied"
  | "unavailable";

export type DbSourceMode = "mongodb" | "local_fallback";

type ClientSyncOp =
  | { op: "upsert"; collection: string; doc: unknown }
  | { op: "patch"; collection: string; id: string; patch: Record<string, unknown> }
  | { op: "delete"; collection: string; id: string }
  | { op: "deleteMany"; collection: string; filter: Record<string, string> }
  | { op: "patchConfig"; key: "settings" | "cms"; patch: Record<string, unknown> };

export interface GydMarketplaceState {
  session: SessionPayload | null;
  selectedCity: string;
  userLocation: UserLocationState | null;
  users: User[];
  customers: CustomerProfile[];
  addresses: Address[];
  categories: Category[];
  designers: DesignerProfile[];
  services: Service[];
  portfolios: Portfolio[];
  availability: AvailabilitySchedule[];
  verifications: DesignerVerification[];
  bookings: Booking[];
  payments: Payment[];
  refunds: Refund[];
  commissions: Commission[];
  payouts: Payout[];
  reviews: Review[];
  conversations: Conversation[];
  messages: Message[];
  notifications: NotificationItem[];
  favourites: Favourite[];
  coupons: Coupon[];
  settings: PlatformSettings;
  cms: CmsContent;
  auditLogs: AdminAuditLog[];
}

export interface CreateBookingInput {
  designerId: string;
  serviceId: string;
  occasion: OccasionType;
  appointmentType: AppointmentType;
  date: string;
  startTime: string;
  endTime: string;
  slotId?: string;
  addressLabel: string;
  addressFull: string;
  city: string;
  paymentMode: "DEPOSIT" | "FULL";
  initiateDemoPayment: boolean;
  couponCode?: string;
  requirements: BookingRequirement;
  idempotencyKey: string;
}

export interface CreateDesignerRegistrationInput {
  name: string;
  email: string;
  phone: string;
  city: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  title: string;
  experienceYears: number;
  startingPriceInr: number;
  categoryIds: string[];
  skills: string[];
  bio: string;
  supportedAppointmentTypes: AppointmentType[];
  documentType: DesignerVerification["documentType"];
  documentRefMasked: string;
}

interface GydActionResult<T = undefined> {
  ok: boolean;
  error?: string;
  data?: T;
}

interface GydStoreContextValue {
  state: GydMarketplaceState;
  hydrated: boolean;
  dbSource: DbSourceMode;
  dbStatus: string;
  locationStatus: LocationDetectStatus;
  setSelectedCity: (city: string) => void;
  setSelectedPlace: (place: PlaceSuggestion) => void;
  detectCurrentLocation: () => Promise<GydActionResult<UserLocationState>>;
  clearUserLocation: () => void;
  getDesignerDistanceKm: (designer: DesignerProfile) => number | null;
  loginDemoRole: (role: UserRole) => SessionPayload | null;
  loginWithCredentials: (
    email: string,
    password: string
  ) => GydActionResult<SessionPayload>;
  loginAdminWithCredentials: (
    email: string,
    password: string
  ) => Promise<GydActionResult<SessionPayload>>;
  registerCustomer: (input: {
    name: string;
    email: string;
    phone: string;
    city: string;
  }) => GydActionResult<SessionPayload>;
  registerDesigner: (
    input: CreateDesignerRegistrationInput
  ) => GydActionResult<SessionPayload>;
  logout: () => void;
  resetDemoState: () => void;

  // Customer & Discovery helpers
  getVisibleDesigners: () => DesignerProfile[];
  toggleFavourite: (designerId: string) => GydActionResult<boolean>;
  isFavourited: (designerId: string) => boolean;
  addAddress: (addr: Omit<Address, "id" | "userId">) => GydActionResult;
  deleteAddress: (addressId: string) => void;
  updateCustomerProfile: (
    patch: Partial<Pick<User, "name" | "phone" | "city">>
  ) => GydActionResult;

  // Booking & Payments
  createBooking: (input: CreateBookingInput) => GydActionResult<Booking>;
  updateBookingStatus: (
    bookingId: string,
    nextStatus: BookingStatus,
    note?: string,
    extra?: {
      rejectionReason?: string;
      rescheduleSuggestedSlot?: string;
      cancellationReason?: string;
    }
  ) => GydActionResult;
  authorizeDemoPayment: (
    bookingId: string,
    mode: "DEPOSIT" | "FULL"
  ) => GydActionResult;
  submitReview: (
    bookingId: string,
    rating: number,
    comment: string
  ) => GydActionResult;

  // Messaging & Notifications
  sendMessage: (
    conversationId: string,
    body: string,
    attachment?: { name: string; url: string }
  ) => GydActionResult;
  startOrOpenConversation: (
    designerId: string,
    bookingId?: string
  ) => GydActionResult<Conversation>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Designer actions
  saveService: (
    service: Omit<Service, "id" | "designerId"> & { id?: string }
  ) => GydActionResult<Service>;
  toggleServiceActive: (serviceId: string) => void;
  deleteService: (serviceId: string) => void;
  addPortfolioProject: (
    project: Omit<Portfolio, "id" | "designerId" | "createdAt" | "images"> & {
      extraImages?: string[];
    }
  ) => GydActionResult<Portfolio>;
  deletePortfolioProject: (portfolioId: string) => void;
  toggleAvailabilitySlot: (designerId: string, slotId: string) => void;
  toggleBlockedDate: (designerId: string, date: string) => void;
  updateDesignerProfileSettings: (
    designerId: string,
    patch: Partial<
      Pick<
        DesignerProfile,
        | "title"
        | "city"
        | "serviceRadiusKm"
        | "bio"
        | "startingPriceInr"
        | "supportedAppointmentTypes"
      >
    >
  ) => GydActionResult;

  // Admin actions
  updateUserAccountStatus: (userId: string, status: AccountStatus) => void;
  removeUser: (userId: string) => GydActionResult;
  updateDesignerApproval: (
    designerId: string,
    status: DesignerApprovalStatus,
    notes?: string
  ) => void;
  removeDesigner: (designerId: string) => GydActionResult;
  toggleDesignerFeatured: (designerId: string) => void;
  deleteCategory: (categoryId: string) => GydActionResult;
  saveCategory: (
    cat: Omit<Category, "id" | "subcategories" | "sortOrder" | "slug"> & {
      id?: string;
    }
  ) => GydActionResult;
  toggleCategoryActive: (categoryId: string) => void;
  moveCategoryOrder: (categoryId: string, direction: "UP" | "DOWN") => void;
  addSubcategory: (
    categoryId: string,
    name: string,
    description: string
  ) => GydActionResult;
  setDesignerCommissionOverride: (designerId: string, rate?: number) => void;
  processRefundDemo: (
    refundId: string,
    decision: "APPROVED_DEMO" | "PROCESSED_DEMO" | "REJECTED"
  ) => void;
  markPayoutPaidDemo: (payoutId: string) => void;
  moderateReview: (reviewId: string, status: Review["moderationStatus"]) => void;
  updateCmsContent: (patch: Partial<CmsContent>) => void;
  updatePlatformSettings: (patch: Partial<PlatformSettings>) => void;
}

const STORAGE_KEY = "gyd_marketplace_state_v1";

function createInitialState(): GydMarketplaceState {
  return {
    session: null,
    selectedCity: "All Cities",
    userLocation: null,
    users: SEED_USERS,
    customers: SEED_CUSTOMERS,
    addresses: SEED_ADDRESSES,
    categories: SEED_CATEGORIES,
    designers: SEED_DESIGNERS,
    services: SEED_SERVICES,
    portfolios: SEED_PORTFOLIOS,
    availability: SEED_AVAILABILITY,
    verifications: SEED_VERIFICATIONS,
    bookings: SEED_BOOKINGS,
    payments: SEED_PAYMENTS,
    refunds: SEED_REFUNDS,
    commissions: SEED_COMMISSIONS,
    payouts: SEED_PAYOUTS,
    reviews: SEED_REVIEWS,
    conversations: SEED_CONVERSATIONS,
    messages: SEED_MESSAGES,
    notifications: SEED_NOTIFICATIONS,
    favourites: SEED_FAVOURITES,
    coupons: SEED_COUPONS,
    settings: SEED_PLATFORM_SETTINGS,
    cms: SEED_CMS,
    auditLogs: SEED_AUDIT_LOGS,
  };
}

const GydStoreContext = createContext<GydStoreContextValue | null>(null);

export function GydStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GydMarketplaceState>(() =>
    createInitialState()
  );
  const stateRef = useRef<GydMarketplaceState>(state);
  const [hydrated, setHydrated] = useState(false);
  const [dbSource, setDbSource] = useState<DbSourceMode>("local_fallback");
  const [dbStatus, setDbStatus] = useState<string>("checking");
  const dbSourceRef = useRef<DbSourceMode>("local_fallback");
  const [locationStatus, setLocationStatus] =
    useState<LocationDetectStatus>("idle");

  const syncOps = useCallback((ops: ClientSyncOp[]) => {
    if (dbSourceRef.current !== "mongodb" || ops.length === 0) return;
    if (typeof fetch === "undefined") return;
    fetch("/api/marketplace", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ops }),
      keepalive: true,
    })
      .then((res) => res.text())
      .catch(() => {});
  }, []);

  const commitState = useCallback(
    (
      updater: (prev: GydMarketplaceState) => GydMarketplaceState,
      ops: ClientSyncOp[] = []
    ): GydMarketplaceState => {
      const next = updater(stateRef.current);
      stateRef.current = next;
      setState(next);
      if (ops.length > 0) {
        syncOps(ops);
      }
      return next;
    },
    [syncOps]
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      let localParsed: Partial<GydMarketplaceState> | null = null;
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          localParsed = JSON.parse(raw) as Partial<GydMarketplaceState>;
          if (
            localParsed &&
            Array.isArray(localParsed.designers) &&
            Array.isArray(localParsed.categories)
          ) {
            const nextLocal = { ...stateRef.current, ...localParsed };
            stateRef.current = nextLocal;
            if (!cancelled) setState(nextLocal);
          }
        }
      } catch {
        // fallback to seed state
      }

      // Restore/verify server HttpOnly Admin cookie when inside /admin/*
      const isProtectedAdminRoute =
        typeof window !== "undefined" &&
        window.location.pathname.startsWith("/admin") &&
        window.location.pathname !== "/admin/login";
      if (isProtectedAdminRoute || localParsed?.session?.role === "ADMIN") {
        try {
          const authRes = await fetch("/api/admin/auth?check=1", {
            cache: "no-store",
          });
          const authJson = (await authRes.json().catch(() => null)) as {
            authenticated?: boolean;
            session?: SessionPayload;
          } | null;
          if (!cancelled) {
            if (authJson?.authenticated && authJson.session) {
              commitState((prev) => ({
                ...prev,
                session: authJson.session ?? null,
              }));
            } else if (localParsed?.session?.role === "ADMIN") {
              commitState((prev) => ({ ...prev, session: null }));
            }
          }
        } catch {
          // ignore network check failure
        }
      }

      // Fetch authoritative shared marketplace data from MongoDB Atlas if configured
      try {
        const res = await fetch("/api/marketplace", { cache: "no-store" });
        const payload = (await res.json().catch(() => null)) as {
          ok?: boolean;
          source?: DbSourceMode;
          reason?: string;
          data?: Omit<
            GydMarketplaceState,
            "session" | "selectedCity" | "userLocation"
          >;
        } | null;

        if (res.ok && payload && !cancelled) {
          if (payload.source === "mongodb" && payload.data) {
            dbSourceRef.current = "mongodb";
            setDbSource("mongodb");
            setDbStatus("connected");
            commitState((prev) => ({
              ...prev,
              ...payload.data,
              session: prev.session,
              selectedCity: prev.selectedCity,
              userLocation: prev.userLocation,
            }));
          } else {
            dbSourceRef.current = "local_fallback";
            setDbSource("local_fallback");
            setDbStatus(payload.reason ?? "not_configured");
          }
        }
      } catch {
        if (!cancelled) {
          dbSourceRef.current = "local_fallback";
          setDbSource("local_fallback");
          setDbStatus("offline");
        }
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [commitState]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state, hydrated]);

  const setSelectedCity = useCallback(
    (city: string) => {
      commitState((prev) => {
        const hub = city !== "All Cities" ? CITY_COORDINATES[city] : undefined;
        return {
          ...prev,
          selectedCity: city,
          userLocation: hub
            ? {
                lat: hub.lat,
                lng: hub.lng,
                city,
                label: city,
                kind: "city",
                source: "CITY",
                updatedAt: new Date().toISOString(),
              }
            : prev.userLocation?.source === "GPS"
              ? prev.userLocation
              : null,
        };
      });
    },
    [commitState]
  );

  const setSelectedPlace = useCallback(
    (place: PlaceSuggestion) => {
      setLocationStatus("granted");
      commitState((prev) => ({
        ...prev,
        selectedCity: place.city,
        userLocation: {
          lat: place.lat,
          lng: place.lng,
          city: place.city,
          label: place.label,
          kind: place.kind,
          source: "PLACE",
          updatedAt: new Date().toISOString(),
        },
      }));
    },
    [commitState]
  );

  const applyResolvedPosition = useCallback(
    (lat: number, lng: number, source: "GPS" | "AUTO"): UserLocationState => {
      const { city, distanceToHubKm } = resolveNearestCity(lat, lng);
      const nextLoc: UserLocationState = {
        lat,
        lng,
        city,
        label: city,
        kind: "gps",
        source,
        updatedAt: new Date().toISOString(),
      };
      setLocationStatus("granted");
      commitState((prev) => ({
        ...prev,
        userLocation: nextLoc,
        selectedCity: distanceToHubKm <= 150 ? city : prev.selectedCity,
      }));
      return nextLoc;
    },
    [commitState]
  );

  const detectCurrentLocation = useCallback((): Promise<
    GydActionResult<UserLocationState>
  > => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setLocationStatus("unavailable");
      return Promise.resolve({
        ok: false,
        error: "Browser geolocation is not available on this device.",
      });
    }
    setLocationStatus("detecting");
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const nextLoc = applyResolvedPosition(
            pos.coords.latitude,
            pos.coords.longitude,
            "GPS"
          );
          resolve({ ok: true, data: nextLoc });
        },
        (err) => {
          setLocationStatus(
            err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"
          );
          resolve({
            ok: false,
            error:
              err.code === err.PERMISSION_DENIED
                ? "Location access was denied. You can pick your city manually anytime."
                : "Unable to determine GPS position right now.",
          });
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });
  }, [applyResolvedPosition]);

  const clearUserLocation = useCallback(() => {
    setLocationStatus("idle");
    commitState((prev) => ({
      ...prev,
      selectedCity: "All Cities",
      userLocation: null,
    }));
  }, [commitState]);

  const getDesignerDistanceKm = useCallback(
    (designer: DesignerProfile): number | null => {
      const refCoords =
        state.userLocation ??
        (state.selectedCity !== "All Cities" &&
        CITY_COORDINATES[state.selectedCity]
          ? {
              ...CITY_COORDINATES[state.selectedCity],
            }
          : null);
      if (!refCoords) return null;
      const studio = getDesignerCoordinates(designer);
      return calculateDistanceKm(
        refCoords.lat,
        refCoords.lng,
        studio.lat,
        studio.lng
      );
    },
    [state.userLocation, state.selectedCity]
  );

  useEffect(() => {
    if (
      !hydrated ||
      typeof navigator === "undefined" ||
      !("geolocation" in navigator)
    ) {
      return;
    }
    if (state.userLocation?.source === "GPS") return;
    const perms = navigator.permissions;
    if (!perms?.query) return;
    perms
      .query({ name: "geolocation" })
      .then((status) => {
        if (status.state === "granted") {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              applyResolvedPosition(
                pos.coords.latitude,
                pos.coords.longitude,
                "AUTO"
              );
            },
            () => {}
          );
        }
      })
      .catch(() => {});
  }, [hydrated, state.userLocation?.source, applyResolvedPosition]);

  const loginDemoRole = useCallback(
    (role: UserRole): SessionPayload | null => {
      if (role === "ADMIN" || role === "DESIGNER") {
        return null;
      }
      const cur = stateRef.current;
      const account = DEMO_ACCOUNTS.find((a) => a.role === role);
      if (!account) return null;
      const existingUser = cur.users.find((u) => u.id === account.userId);
      if (!existingUser || existingUser.status !== "ACTIVE") {
        return null;
      }
      const payload: SessionPayload = {
        userId: account.userId,
        name: existingUser?.name ?? account.name,
        email: existingUser?.email ?? account.email,
        role: account.role,
        city: existingUser?.city ?? account.city,
        isDemoSession: true,
      };
      commitState((prev) => ({ ...prev, session: payload }));
      return payload;
    },
    [commitState]
  );

  const loginWithCredentials = useCallback(
    (email: string, password: string): GydActionResult<SessionPayload> => {
      const cur = stateRef.current;
      const normalized = email.trim().toLowerCase();
      const existingUser = cur.users.find(
        (u) => u.email.toLowerCase() === normalized
      );
      if (!existingUser) {
        return {
          ok: false,
          error:
            "Account not found or removed. Use an active account or create a new customer profile.",
        };
      }
      if (existingUser.role === "ADMIN") {
        return {
          ok: false,
          error:
            "Administrator sign-in is restricted to authorized operations personnel via the Admin portal.",
        };
      }
      if (existingUser.status !== "ACTIVE") {
        return {
          ok: false,
          error:
            "This account is currently blocked or suspended by an administrator.",
        };
      }
      const designer = cur.designers.find((d) => d.userId === existingUser.id);
      if (
        existingUser.role === "DESIGNER" &&
        (!designer ||
          designer.approvalStatus === "SUSPENDED" ||
          designer.approvalStatus === "REJECTED")
      ) {
        return {
          ok: false,
          error:
            "This designer studio has been suspended or rejected by moderation.",
        };
      }
      const demo = DEMO_ACCOUNTS.find(
        (a) => a.email.toLowerCase() === normalized
      );
      if (demo && password !== "GydDemo@2026") {
        return {
          ok: false,
          error: "Invalid password for this demo account.",
        };
      }
      if (!demo && password.length < 6) {
        return {
          ok: false,
          error: "Invalid password. Enter at least 6 characters.",
        };
      }
      const payload: SessionPayload = {
        userId: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        designerId: designer?.id,
        city: existingUser.city,
        isDemoSession: true,
      };
      commitState((prev) => ({ ...prev, session: payload }));
      return { ok: true, data: payload };
    },
    [commitState]
  );

  const loginAdminWithCredentials = useCallback(
    async (
      email: string,
      password: string
    ): Promise<GydActionResult<SessionPayload>> => {
      try {
        const res = await fetch("/api/admin/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          session?: SessionPayload;
        };
        if (!res.ok || !data.ok || !data.session) {
          return {
            ok: false,
            error: data.error ?? "Invalid administrator email or password.",
          };
        }
        commitState((prev) => ({ ...prev, session: data.session ?? null }));
        return { ok: true, data: data.session };
      } catch {
        return {
          ok: false,
          error: "Unable to verify administrator credentials right now.",
        };
      }
    },
    [commitState]
  );

  const registerCustomer = useCallback(
    (input: {
      name: string;
      email: string;
      phone: string;
      city: string;
    }): GydActionResult<SessionPayload> => {
      const cur = stateRef.current;
      const normalizedEmail = input.email.trim().toLowerCase();
      if (cur.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
        return { ok: false, error: "An account with this email already exists." };
      }
      const userId = `usr-cust-${Date.now()}`;
      const newUser: User = {
        id: userId,
        name: sanitizeText(input.name),
        email: normalizedEmail,
        phone: sanitizeText(input.phone),
        role: "CUSTOMER",
        status: "ACTIVE",
        avatarUrl: "/images/designers/designer-06.jpg",
        city: input.city,
        createdAt: new Date().toISOString(),
      };
      const newCust: CustomerProfile = {
        id: `cust-${Date.now()}`,
        userId,
        preferredStyleTags: ["Personal Curation"],
        defaultCity: input.city,
        savedAddresses: [],
        totalBookings: 0,
      };
      const payload: SessionPayload = {
        userId,
        name: newUser.name,
        email: newUser.email,
        role: "CUSTOMER",
        city: newUser.city,
        isDemoSession: true,
      };
      commitState(
        (prev) => ({
          ...prev,
          users: [newUser, ...prev.users],
          customers: [newCust, ...prev.customers],
          session: payload,
        }),
        [
          { op: "upsert", collection: "users", doc: newUser },
          { op: "upsert", collection: "customers", doc: newCust },
        ]
      );
      return { ok: true, data: payload };
    },
    [commitState]
  );

  const registerDesigner = useCallback(
    (
      input: CreateDesignerRegistrationInput
    ): GydActionResult<SessionPayload> => {
      const cur = stateRef.current;
      const normalizedEmail = input.email.trim().toLowerCase();
      if (cur.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
        return { ok: false, error: "An account with this email already exists." };
      }
      const userId = `usr-des-${Date.now()}`;
      const designerId = `des-${Date.now()}`;
      const matchedCats = cur.categories.filter((c) =>
        input.categoryIds.includes(c.id)
      );
      const approvalStatus: DesignerApprovalStatus = cur.settings
        .requireDesignerVerification
        ? "PENDING_REVIEW"
        : "APPROVED";

      const newUser: User = {
        id: userId,
        name: sanitizeText(input.name),
        email: normalizedEmail,
        phone: sanitizeText(input.phone),
        role: "DESIGNER",
        status: "ACTIVE",
        avatarUrl: "/images/designers/designer-14.jpg",
        city: input.city,
        createdAt: new Date().toISOString(),
      };

      const newDesigner: DesignerProfile = {
        id: designerId,
        userId,
        slug: `${slugify(input.name)}-${Date.now().toString().slice(-4)}`,
        name: sanitizeText(input.name),
        title: sanitizeText(input.title),
        city: input.city,
        neighborhood: input.neighborhood
          ? sanitizeText(input.neighborhood)
          : undefined,
        latitude: input.latitude,
        longitude: input.longitude,
        serviceRadiusKm: 30,
        experienceYears: input.experienceYears,
        rating: 5.0,
        reviewCount: 0,
        startingPriceInr: input.startingPriceInr,
        bio: sanitizeText(input.bio),
        skills: input.skills,
        categoryIds: input.categoryIds,
        categoryNames: matchedCats.map((c) => c.name),
        supportedAppointmentTypes:
          input.supportedAppointmentTypes.length > 0
            ? input.supportedAppointmentTypes
            : ["ONLINE_CONSULTATION", "STUDIO_APPOINTMENT"],
        avatarUrl: "/images/designers/designer-14.jpg",
        coverImageUrl:
          matchedCats[0]?.imageUrl ?? "/images/categories/wedding-styling.jpg",
        isVerified: approvalStatus === "APPROVED",
        isFeatured: false,
        approvalStatus,
        availabilitySummary:
          approvalStatus === "PENDING_REVIEW"
            ? "Pending Admin Verification"
            : "Available This Week",
        completedProjectsCount: 0,
        faqs: [],
      };

      const newVer: DesignerVerification = {
        id: `ver-${Date.now()}`,
        designerId,
        documentType: input.documentType,
        documentRefMasked: sanitizeText(input.documentRefMasked),
        submittedAt: new Date().toISOString(),
        status: approvalStatus === "APPROVED" ? "VERIFIED" : "PENDING",
      };

      const defaultDates = [
        "2026-11-28",
        "2026-11-29",
        "2026-11-30",
        "2026-12-01",
      ];
      const slots = defaultDates.flatMap((date, idx) => [
        {
          id: `slot-${designerId}-${date}-0`,
          designerId,
          date,
          startTime: "10:00 AM",
          endTime: "11:30 AM",
          isAvailable: true,
        },
        {
          id: `slot-${designerId}-${date}-1`,
          designerId,
          date,
          startTime: "03:00 PM",
          endTime: "04:30 PM",
          isAvailable: idx % 2 === 0,
        },
      ]);

      const newSchedule: AvailabilitySchedule = {
        designerId,
        workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        workingHoursStart: "10:00 AM",
        workingHoursEnd: "07:00 PM",
        breakStart: "01:30 PM",
        breakEnd: "02:30 PM",
        blockedDates: [],
        slots,
      };

      const adminNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: "usr-admin-1",
        role: "ADMIN",
        type: "DESIGNER_APPROVAL",
        title: `New Designer Application: ${newDesigner.name}`,
        message: `${newDesigner.title} in ${newDesigner.city} awaits verification review.`,
        linkHref: "/admin/designers",
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      const payload: SessionPayload = {
        userId,
        name: newDesigner.name,
        email: newUser.email,
        role: "DESIGNER",
        designerId,
        city: newDesigner.city,
        isDemoSession: true,
      };

      commitState(
        (prev) => ({
          ...prev,
          users: [newUser, ...prev.users],
          designers: [newDesigner, ...prev.designers],
          verifications: [newVer, ...prev.verifications],
          availability: [newSchedule, ...prev.availability],
          notifications: [adminNotif, ...prev.notifications],
          session: payload,
        }),
        [
          { op: "upsert", collection: "users", doc: newUser },
          { op: "upsert", collection: "designers", doc: newDesigner },
          { op: "upsert", collection: "verifications", doc: newVer },
          { op: "upsert", collection: "availability", doc: newSchedule },
          { op: "upsert", collection: "notifications", doc: adminNotif },
        ]
      );

      return { ok: true, data: payload };
    },
    [commitState]
  );

  const logout = useCallback(() => {
    commitState((prev) => ({ ...prev, session: null }));
    if (typeof fetch !== "undefined") {
      fetch("/api/admin/auth", { method: "DELETE" })
        .then((res) => res.text())
        .catch(() => {});
    }
  }, [commitState]);

  const resetDemoState = useCallback(() => {
    const fresh = createInitialState();
    commitState((prev) => ({
      ...fresh,
      session:
        prev.session?.role === "ADMIN" && !prev.session.isDemoSession
          ? prev.session
          : null,
    }));
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    if (dbSourceRef.current === "mongodb" && typeof fetch !== "undefined") {
      fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESET_SEED" }),
      })
        .then((res) => res.text())
        .catch(() => {});
    }
  }, [commitState]);

  const getVisibleDesigners = useCallback(() => {
    const activeUserIds = new Set(
      state.users.filter((u) => u.status === "ACTIVE").map((u) => u.id)
    );
    return state.designers.filter((d) => {
      if (!activeUserIds.has(d.userId)) return false;
      if (d.approvalStatus === "SUSPENDED" || d.approvalStatus === "REJECTED") {
        return false;
      }
      if (state.settings.requireDesignerVerification) {
        return d.approvalStatus === "APPROVED";
      }
      return true;
    });
  }, [
    state.designers,
    state.users,
    state.settings.requireDesignerVerification,
  ]);

  const isFavourited = useCallback(
    (designerId: string) => {
      const uid = state.session?.userId ?? "usr-cust-1";
      return state.favourites.some(
        (f) => f.customerId === uid && f.designerId === designerId
      );
    },
    [state.favourites, state.session]
  );

  const toggleFavourite = useCallback(
    (designerId: string): GydActionResult<boolean> => {
      const cur = stateRef.current;
      const uid = cur.session?.userId ?? "usr-cust-1";
      const existing = cur.favourites.find(
        (f) => f.customerId === uid && f.designerId === designerId
      );
      if (existing) {
        commitState(
          (prev) => ({
            ...prev,
            favourites: prev.favourites.filter(
              (f) => !(f.customerId === uid && f.designerId === designerId)
            ),
          }),
          [{ op: "delete", collection: "favourites", id: existing.id }]
        );
        return { ok: true, data: false };
      }
      const newFav: Favourite = {
        id: `fav-${Date.now()}`,
        customerId: uid,
        designerId,
        createdAt: new Date().toISOString(),
      };
      commitState(
        (prev) => ({
          ...prev,
          favourites: [newFav, ...prev.favourites],
        }),
        [{ op: "upsert", collection: "favourites", doc: newFav }]
      );
      return { ok: true, data: true };
    },
    [commitState]
  );

  const addAddress = useCallback(
    (addr: Omit<Address, "id" | "userId">): GydActionResult => {
      const cur = stateRef.current;
      const uid = cur.session?.userId ?? "usr-cust-1";
      const newAddr: Address = {
        ...addr,
        id: `addr-${Date.now()}`,
        userId: uid,
      };
      const ops: ClientSyncOp[] = [];
      if (addr.isDefault) {
        for (const existing of cur.addresses) {
          if (existing.userId === uid && existing.isDefault) {
            ops.push({
              op: "patch",
              collection: "addresses",
              id: existing.id,
              patch: { isDefault: false },
            });
          }
        }
      }
      ops.push({ op: "upsert", collection: "addresses", doc: newAddr });
      commitState(
        (prev) => ({
          ...prev,
          addresses: addr.isDefault
            ? [
                newAddr,
                ...prev.addresses.map((a) =>
                  a.userId === uid ? { ...a, isDefault: false } : a
                ),
              ]
            : [newAddr, ...prev.addresses],
        }),
        ops
      );
      return { ok: true };
    },
    [commitState]
  );

  const deleteAddress = useCallback(
    (addressId: string) => {
      commitState(
        (prev) => ({
          ...prev,
          addresses: prev.addresses.filter((a) => a.id !== addressId),
        }),
        [{ op: "delete", collection: "addresses", id: addressId }]
      );
    },
    [commitState]
  );

  const updateCustomerProfile = useCallback(
    (patch: Partial<Pick<User, "name" | "phone" | "city">>): GydActionResult => {
      const cur = stateRef.current;
      if (!cur.session) return { ok: false, error: "Sign in to update profile." };
      const uid = cur.session.userId;
      const safePatch: Record<string, unknown> = {};
      if (patch.name !== undefined) safePatch.name = patch.name;
      if (patch.phone !== undefined) safePatch.phone = patch.phone;
      if (patch.city !== undefined) safePatch.city = patch.city;

      commitState(
        (prev) => ({
          ...prev,
          users: prev.users.map((u) => (u.id === uid ? { ...u, ...patch } : u)),
          session: prev.session
            ? {
                ...prev.session,
                name: patch.name ?? prev.session.name,
                city: patch.city ?? prev.session.city,
              }
            : null,
        }),
        [{ op: "patch", collection: "users", id: uid, patch: safePatch }]
      );
      return { ok: true };
    },
    [commitState]
  );

  const createBooking = useCallback(
    (input: CreateBookingInput): GydActionResult<Booking> => {
      const cur = stateRef.current;
      const dup = cur.bookings.find(
        (b) => b.idempotencyKey && b.idempotencyKey === input.idempotencyKey
      );
      if (dup) {
        return { ok: true, data: dup };
      }

      const designer = cur.designers.find((d) => d.id === input.designerId);
      const designerOwner = designer
        ? cur.users.find((u) => u.id === designer.userId)
        : undefined;
      if (
        !designer ||
        designer.approvalStatus !== "APPROVED" ||
        !designerOwner ||
        designerOwner.status !== "ACTIVE"
      ) {
        return {
          ok: false,
          error:
            "This designer is not currently verified/active for public bookings.",
        };
      }

      const actorUser =
        cur.users.find((u) => u.id === cur.session?.userId) ?? cur.users[0];
      if (!actorUser || actorUser.status !== "ACTIVE") {
        return {
          ok: false,
          error:
            "Your account is currently blocked or inactive and cannot place bookings.",
        };
      }

      const service = cur.services.find(
        (s) => s.id === input.serviceId && s.designerId === designer.id && s.isActive
      );
      if (!service) {
        return { ok: false, error: "Selected service is unavailable." };
      }

      const schedule = cur.availability.find((a) => a.designerId === designer.id);
      if (schedule?.blockedDates.includes(input.date)) {
        return {
          ok: false,
          error:
            "The designer has blocked this date. Please choose another slot.",
        };
      }
      const conflictBooking = cur.bookings.find(
        (b) =>
          b.designerId === designer.id &&
          b.date === input.date &&
          b.startTime === input.startTime &&
          ["CONFIRMED", "ACCEPTED", "IN_PROGRESS"].includes(b.status)
      );
      if (conflictBooking) {
        return {
          ok: false,
          error:
            "This time slot was just reserved. Please pick another time window.",
        };
      }

      const travelFeeInr =
        input.appointmentType === "ONLINE_CONSULTATION" ||
        input.appointmentType === "STUDIO_APPOINTMENT"
          ? 0
          : service.travelChargeInr;
      const platformServiceFeeInr = Math.round(service.priceInr * 0.05);

      let discountInr = 0;
      if (input.couponCode) {
        const coupon = cur.coupons.find(
          (c) =>
            c.isActive &&
            c.code.toUpperCase() === input.couponCode?.trim().toUpperCase() &&
            service.priceInr >= c.minOrderInr
        );
        if (coupon) {
          discountInr = Math.min(
            coupon.maxDiscountInr,
            Math.round((service.priceInr * coupon.discountPercent) / 100)
          );
        }
      }

      const totalAmountInr = Math.max(
        499,
        service.priceInr + travelFeeInr + platformServiceFeeInr - discountInr
      );
      const depositAmountInr = Math.round(
        (totalAmountInr * cur.settings.depositPercentage) / 100
      );

      const paymentStatus: PaymentStatus = input.initiateDemoPayment
        ? input.paymentMode === "DEPOSIT"
          ? "DEPOSIT_PAID_DEMO"
          : "PAID_DEMO"
        : "UNPAID";

      const bookingId = `bkg-${Date.now()}`;
      const bookingCode = generateBookingCode(cur.bookings.length + 1);
      const nowIso = new Date().toISOString();

      const newBooking: Booking = {
        id: bookingId,
        bookingCode,
        idempotencyKey: input.idempotencyKey,
        customerId: actorUser.id,
        customerName: actorUser.name,
        designerId: designer.id,
        designerName: designer.name,
        serviceId: service.id,
        serviceTitle: service.title,
        categoryId: service.categoryId,
        occasion: input.occasion,
        appointmentType: input.appointmentType,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        slotId: input.slotId,
        addressLabel: input.addressLabel,
        addressFull: sanitizeText(input.addressFull),
        city: input.city,
        basePriceInr: service.priceInr,
        travelFeeInr,
        platformServiceFeeInr,
        discountInr,
        totalAmountInr,
        depositAmountInr,
        paymentMode: input.paymentMode,
        paymentStatus,
        status: "PENDING",
        requirements: input.requirements,
        statusHistory: [
          {
            id: `hist-${bookingId}-1`,
            bookingId,
            status: "PENDING",
            changedByRole: "CUSTOMER",
            note: input.initiateDemoPayment
              ? "Booking request submitted with Razorpay sandbox demo hold."
              : "Booking request submitted (awaiting designer review).",
            timestamp: nowIso,
          },
        ],
        createdAt: nowIso,
      };

      const newPayment: Payment | null = input.initiateDemoPayment
        ? {
            id: `pay-${Date.now()}`,
            bookingId,
            bookingCode,
            customerName: actorUser.name,
            designerName: designer.name,
            gateway: "RAZORPAY_TEST_SANDBOX",
            gatewayOrderId: `order_gyd_demo_${Date.now().toString().slice(-6)}`,
            amountInr:
              input.paymentMode === "DEPOSIT"
                ? depositAmountInr
                : totalAmountInr,
            paymentMode: input.paymentMode,
            status: paymentStatus,
            createdAt: nowIso,
          }
        : null;

      const conv: Conversation = {
        id: `conv-${bookingId}`,
        bookingId,
        bookingCode,
        customerId: actorUser.id,
        customerName: actorUser.name,
        customerAvatar: actorUser.avatarUrl,
        designerId: designer.id,
        designerName: designer.name,
        designerAvatar: designer.avatarUrl,
        subject: `${service.subcategoryName} · ${bookingCode}`,
        lastMessagePreview: input.requirements.additionalRequirements,
        unreadCountCustomer: 0,
        unreadCountDesigner: 1,
        updatedAt: nowIso,
      };

      const initialMessage: Message = {
        id: `msg-${Date.now()}`,
        conversationId: conv.id,
        senderId: actorUser.id,
        senderName: actorUser.name,
        senderRole: "CUSTOMER",
        body: `Booking request ${bookingCode} submitted for ${input.date} (${input.startTime}). Notes: ${input.requirements.additionalRequirements}`,
        isRead: false,
        createdAt: nowIso,
      };

      const designerNotif: NotificationItem = {
        id: `notif-d-${Date.now()}`,
        userId: designer.userId,
        role: "DESIGNER",
        type: "BOOKING_RECEIVED",
        title: `New Booking Request ${bookingCode}`,
        message: `${actorUser.name} requested ${service.title} on ${input.date}.`,
        linkHref: "/designer/bookings",
        isRead: false,
        createdAt: nowIso,
      };

      const updatedSchedule = schedule
        ? {
            ...schedule,
            slots: schedule.slots.map((sl) =>
              sl.id === input.slotId ||
              (sl.date === input.date && sl.startTime === input.startTime)
                ? { ...sl, isAvailable: false, bookedByBookingId: bookingId }
                : sl
            ),
          }
        : null;

      const ops: ClientSyncOp[] = [
        { op: "upsert", collection: "bookings", doc: newBooking },
        ...(newPayment
          ? [{ op: "upsert" as const, collection: "payments", doc: newPayment }]
          : []),
        { op: "upsert", collection: "conversations", doc: conv },
        { op: "upsert", collection: "messages", doc: initialMessage },
        { op: "upsert", collection: "notifications", doc: designerNotif },
        ...(updatedSchedule
          ? [
              {
                op: "patch" as const,
                collection: "availability",
                id: designer.id,
                patch: { slots: updatedSchedule.slots },
              },
            ]
          : []),
      ];

      commitState(
        (prev) => ({
          ...prev,
          bookings: [newBooking, ...prev.bookings],
          payments: newPayment ? [newPayment, ...prev.payments] : prev.payments,
          conversations: [conv, ...prev.conversations],
          messages: [...prev.messages, initialMessage],
          notifications: [designerNotif, ...prev.notifications],
          availability: updatedSchedule
            ? prev.availability.map((av) =>
                av.designerId === designer.id ? updatedSchedule : av
              )
            : prev.availability,
        }),
        ops
      );

      return { ok: true, data: newBooking };
    },
    [commitState]
  );

  const updateBookingStatus = useCallback(
    (
      bookingId: string,
      nextStatus: BookingStatus,
      note?: string,
      extra?: {
        rejectionReason?: string;
        rescheduleSuggestedSlot?: string;
        cancellationReason?: string;
      }
    ): GydActionResult => {
      const cur = stateRef.current;
      const booking = cur.bookings.find((b) => b.id === bookingId);
      if (!booking) return { ok: false, error: "Booking not found." };

      if (nextStatus === "ACCEPTED" || nextStatus === "CONFIRMED") {
        const conflict = cur.bookings.find(
          (other) =>
            other.id !== booking.id &&
            other.designerId === booking.designerId &&
            other.date === booking.date &&
            other.startTime === booking.startTime &&
            ["ACCEPTED", "CONFIRMED", "IN_PROGRESS"].includes(other.status)
        );
        if (conflict) {
          return {
            ok: false,
            error: `Slot conflict detected with booking ${conflict.bookingCode}. Suggest an alternate time slot instead.`,
          };
        }
      }

      const actorRole = cur.session?.role ?? "DESIGNER";
      const nowIso = new Date().toISOString();
      const cat = cur.categories.find((c) => c.id === booking.categoryId);
      const designer = cur.designers.find((d) => d.id === booking.designerId);
      const commissionRate =
        designer?.commissionOverridePercent ??
        cat?.commissionRate ??
        cur.settings.defaultCommissionPercent;

      const shouldReleaseSlot =
        nextStatus === "CANCELLED" || nextStatus === "REJECTED";

      let refundToCreate: Refund | null = null;
      let updatedPaymentStatus = booking.paymentStatus;
      if (
        (nextStatus === "CANCELLED" || nextStatus === "REFUND_REQUESTED") &&
        (booking.paymentStatus === "PAID_DEMO" ||
          booking.paymentStatus === "DEPOSIT_PAID_DEMO")
      ) {
        const paidAmt =
          booking.paymentStatus === "DEPOSIT_PAID_DEMO"
            ? booking.depositAmountInr
            : booking.totalAmountInr;
        const apptMs = new Date(booking.date).getTime();
        const hoursAhead = (apptMs - Date.now()) / (1000 * 60 * 60);
        const eligiblePercent =
          hoursAhead >= cur.settings.cancellationFreeHours
            ? 100
            : cur.settings.partialRefundPercent;
        const refundAmt = Math.round((paidAmt * eligiblePercent) / 100);
        const paymentRec = cur.payments.find((p) => p.bookingId === booking.id);
        if (paymentRec) {
          refundToCreate = {
            id: `ref-${Date.now()}`,
            bookingId: booking.id,
            bookingCode: booking.bookingCode,
            paymentId: paymentRec.id,
            customerName: booking.customerName,
            amountInr: refundAmt,
            reason:
              extra?.cancellationReason ||
              `Policy refund (${eligiblePercent}% eligible under ${cur.settings.cancellationFreeHours}h rule).`,
            status: "REQUESTED",
            createdAt: nowIso,
          };
          updatedPaymentStatus = "REFUND_PENDING";
        }
      }

      let commissionToAdd: Commission | null = null;
      if (
        nextStatus === "COMPLETED" &&
        !cur.commissions.some((c) => c.bookingId === booking.id)
      ) {
        const breakdown = calculateCommissionBreakdown(
          booking.totalAmountInr,
          commissionRate
        );
        commissionToAdd = {
          id: `com-${Date.now()}`,
          bookingId: booking.id,
          bookingCode: booking.bookingCode,
          designerId: booking.designerId,
          designerName: booking.designerName,
          categoryName: cat?.name ?? "Design Service",
          grossAmountInr: booking.totalAmountInr,
          commissionRatePercent: commissionRate,
          platformFeeInr: breakdown.platformFee,
          netDesignerInr: breakdown.netDesignerEarnings,
          settled: false,
          createdAt: nowIso,
        };
      }

      const customerNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: booking.customerId,
        role: "CUSTOMER",
        type:
          nextStatus === "ACCEPTED" || nextStatus === "CONFIRMED"
            ? "BOOKING_ACCEPTED"
            : nextStatus === "REJECTED"
              ? "BOOKING_REJECTED"
              : nextStatus === "COMPLETED"
                ? "REVIEW_REMINDER"
                : "BOOKING_CANCELLED",
        title: `Booking ${booking.bookingCode} · ${nextStatus.replace(/_/g, " ")}`,
        message:
          note ||
          `Your ${booking.serviceTitle} with ${booking.designerName} is now ${nextStatus.toLowerCase().replace(/_/g, " ")}.`,
        linkHref: "/customer/bookings",
        isRead: false,
        createdAt: nowIso,
      };

      const updatedBooking: Booking = {
        ...booking,
        status: nextStatus,
        paymentStatus: updatedPaymentStatus,
        rejectionReason: extra?.rejectionReason ?? booking.rejectionReason,
        rescheduleSuggestedSlot:
          extra?.rescheduleSuggestedSlot ?? booking.rescheduleSuggestedSlot,
        cancellationReason:
          extra?.cancellationReason ?? booking.cancellationReason,
        statusHistory: [
          ...booking.statusHistory,
          {
            id: `hist-${Date.now()}`,
            bookingId,
            status: nextStatus,
            changedByRole: actorRole,
            note: note || `Status changed to ${nextStatus.replace(/_/g, " ")}.`,
            timestamp: nowIso,
          },
        ],
      };

      const targetSchedule = shouldReleaseSlot
        ? cur.availability.find((av) => av.designerId === booking.designerId)
        : undefined;
      const releasedSlots = targetSchedule
        ? targetSchedule.slots.map((sl) =>
            sl.bookedByBookingId === booking.id ||
            (sl.date === booking.date && sl.startTime === booking.startTime)
              ? { ...sl, isAvailable: true, bookedByBookingId: undefined }
              : sl
          )
        : null;

      const ops: ClientSyncOp[] = [
        { op: "upsert", collection: "bookings", doc: updatedBooking },
        ...(releasedSlots
          ? [
              {
                op: "patch" as const,
                collection: "availability",
                id: booking.designerId,
                patch: { slots: releasedSlots },
              },
            ]
          : []),
        ...(refundToCreate
          ? [{ op: "upsert" as const, collection: "refunds", doc: refundToCreate }]
          : []),
        ...(commissionToAdd
          ? [
              {
                op: "upsert" as const,
                collection: "commissions",
                doc: commissionToAdd,
              },
            ]
          : []),
        { op: "upsert", collection: "notifications", doc: customerNotif },
      ];

      commitState(
        (prev) => ({
          ...prev,
          bookings: prev.bookings.map((b) =>
            b.id === bookingId ? updatedBooking : b
          ),
          availability: releasedSlots
            ? prev.availability.map((av) =>
                av.designerId === booking.designerId
                  ? { ...av, slots: releasedSlots }
                  : av
              )
            : prev.availability,
          refunds: refundToCreate
            ? [refundToCreate, ...prev.refunds]
            : prev.refunds,
          commissions: commissionToAdd
            ? [commissionToAdd, ...prev.commissions]
            : prev.commissions,
          notifications: [customerNotif, ...prev.notifications],
        }),
        ops
      );

      return { ok: true };
    },
    [commitState]
  );

  const authorizeDemoPayment = useCallback(
    (bookingId: string, mode: "DEPOSIT" | "FULL"): GydActionResult => {
      const cur = stateRef.current;
      const booking = cur.bookings.find((b) => b.id === bookingId);
      if (!booking) return { ok: false, error: "Booking not found." };
      const nowIso = new Date().toISOString();
      const paymentStatus: PaymentStatus =
        mode === "DEPOSIT" ? "DEPOSIT_PAID_DEMO" : "PAID_DEMO";
      const amountInr =
        mode === "DEPOSIT" ? booking.depositAmountInr : booking.totalAmountInr;

      const newPay: Payment = {
        id: `pay-${Date.now()}`,
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        customerName: booking.customerName,
        designerName: booking.designerName,
        gateway: "RAZORPAY_TEST_SANDBOX",
        gatewayOrderId: `order_gyd_demo_${Date.now().toString().slice(-6)}`,
        amountInr,
        paymentMode: mode,
        status: paymentStatus,
        createdAt: nowIso,
      };

      const nextStatus =
        booking.status === "ACCEPTED" || booking.status === "AWAITING_PAYMENT"
          ? "CONFIRMED"
          : booking.status;

      commitState(
        (prev) => ({
          ...prev,
          payments: [newPay, ...prev.payments],
          bookings: prev.bookings.map((b) =>
            b.id === bookingId
              ? {
                  ...b,
                  paymentMode: mode,
                  paymentStatus,
                  status: nextStatus,
                }
              : b
          ),
        }),
        [
          { op: "upsert", collection: "payments", doc: newPay },
          {
            op: "patch",
            collection: "bookings",
            id: bookingId,
            patch: { paymentMode: mode, paymentStatus, status: nextStatus },
          },
        ]
      );
      return { ok: true };
    },
    [commitState]
  );

  const submitReview = useCallback(
    (bookingId: string, rating: number, comment: string): GydActionResult => {
      const cur = stateRef.current;
      const booking = cur.bookings.find((b) => b.id === bookingId);
      if (!booking) return { ok: false, error: "Booking not found." };
      if (booking.status !== "COMPLETED") {
        return {
          ok: false,
          error:
            "Reviews can only be submitted after the appointment is completed.",
        };
      }
      if (cur.reviews.some((r) => r.bookingId === bookingId)) {
        return {
          ok: false,
          error: "A review has already been submitted for this booking.",
        };
      }

      const newReview: Review = {
        id: `rev-${Date.now()}`,
        bookingId: booking.id,
        customerId: booking.customerId,
        customerName: booking.customerName,
        designerId: booking.designerId,
        designerName: booking.designerName,
        serviceTitle: booking.serviceTitle,
        rating,
        comment: sanitizeText(comment),
        isDemoSample: false,
        moderationStatus: "PUBLISHED",
        createdAt: new Date().toISOString(),
      };

      const designerReviews = [
        newReview,
        ...cur.reviews.filter(
          (r) =>
            r.designerId === booking.designerId &&
            r.moderationStatus === "PUBLISHED"
        ),
      ];
      const avg =
        designerReviews.reduce((acc, r) => acc + r.rating, 0) /
        Math.max(1, designerReviews.length);
      const nextRating = Number(avg.toFixed(1));
      const targetDesigner = cur.designers.find(
        (d) => d.id === booking.designerId
      );
      const nextReviewCount = (targetDesigner?.reviewCount ?? 0) + 1;

      commitState(
        (prev) => ({
          ...prev,
          reviews: [newReview, ...prev.reviews],
          designers: prev.designers.map((d) =>
            d.id === booking.designerId
              ? {
                  ...d,
                  rating: nextRating,
                  reviewCount: nextReviewCount,
                }
              : d
          ),
        }),
        [
          { op: "upsert", collection: "reviews", doc: newReview },
          {
            op: "patch",
            collection: "designers",
            id: booking.designerId,
            patch: { rating: nextRating, reviewCount: nextReviewCount },
          },
        ]
      );

      return { ok: true };
    },
    [commitState]
  );

  const sendMessage = useCallback(
    (
      conversationId: string,
      body: string,
      attachment?: { name: string; url: string }
    ): GydActionResult => {
      const cur = stateRef.current;
      const clean = sanitizeText(body);
      if (!clean && !attachment) {
        return { ok: false, error: "Message cannot be empty." };
      }
      const actorRole = cur.session?.role ?? "CUSTOMER";
      const actorName = cur.session?.name ?? "Ananya Reddy";
      const actorId = cur.session?.userId ?? "usr-cust-1";
      const actorUser = cur.users.find((u) => u.id === actorId);
      if (cur.session && (!actorUser || actorUser.status !== "ACTIVE")) {
        return { ok: false, error: "Your account is currently suspended." };
      }
      const nowIso = new Date().toISOString();

      const msg: Message = {
        id: `msg-${Date.now()}`,
        conversationId,
        senderId: actorId,
        senderName: actorName,
        senderRole: actorRole,
        body: clean || "Shared reference attachment",
        attachmentName: attachment?.name,
        attachmentUrl: attachment?.url,
        isRead: false,
        createdAt: nowIso,
      };

      const conv = cur.conversations.find((c) => c.id === conversationId);
      const convPatch = conv
        ? {
            lastMessagePreview: msg.body,
            updatedAt: nowIso,
            unreadCountCustomer:
              actorRole === "DESIGNER" ? conv.unreadCountCustomer + 1 : 0,
            unreadCountDesigner:
              actorRole === "CUSTOMER" ? conv.unreadCountDesigner + 1 : 0,
          }
        : null;

      commitState(
        (prev) => ({
          ...prev,
          messages: [...prev.messages, msg],
          conversations: convPatch
            ? prev.conversations.map((c) =>
                c.id === conversationId ? { ...c, ...convPatch } : c
              )
            : prev.conversations,
        }),
        [
          { op: "upsert", collection: "messages", doc: msg },
          ...(convPatch
            ? [
                {
                  op: "patch" as const,
                  collection: "conversations",
                  id: conversationId,
                  patch: convPatch,
                },
              ]
            : []),
        ]
      );

      return { ok: true };
    },
    [commitState]
  );

  const startOrOpenConversation = useCallback(
    (designerId: string, bookingId?: string): GydActionResult<Conversation> => {
      const cur = stateRef.current;
      const uid = cur.session?.userId ?? "usr-cust-1";
      const uname = cur.session?.name ?? "Ananya Reddy";
      const userObj = cur.users.find((u) => u.id === uid);
      if (cur.session && (!userObj || userObj.status !== "ACTIVE")) {
        return {
          ok: false,
          error: "Your account is currently blocked or inactive.",
        };
      }
      const designer = cur.designers.find((d) => d.id === designerId);
      const designerUser = designer
        ? cur.users.find((u) => u.id === designer.userId)
        : undefined;
      if (
        !designer ||
        designer.approvalStatus === "SUSPENDED" ||
        designer.approvalStatus === "REJECTED" ||
        !designerUser ||
        designerUser.status !== "ACTIVE"
      ) {
        return { ok: false, error: "This designer studio is unavailable." };
      }

      const existing = cur.conversations.find(
        (c) =>
          c.customerId === uid &&
          c.designerId === designerId &&
          (!bookingId || c.bookingId === bookingId)
      );
      if (existing) return { ok: true, data: existing };

      const conv: Conversation = {
        id: `conv-${Date.now()}`,
        bookingId,
        customerId: uid,
        customerName: uname,
        customerAvatar: userObj?.avatarUrl ?? "/images/designers/designer-09.jpg",
        designerId: designer.id,
        designerName: designer.name,
        designerAvatar: designer.avatarUrl,
        subject: `Style Enquiry · ${designer.name}`,
        lastMessagePreview: "New enquiry started",
        unreadCountCustomer: 0,
        unreadCountDesigner: 1,
        updatedAt: new Date().toISOString(),
      };
      commitState(
        (prev) => ({
          ...prev,
          conversations: [conv, ...prev.conversations],
        }),
        [{ op: "upsert", collection: "conversations", doc: conv }]
      );
      return { ok: true, data: conv };
    },
    [commitState]
  );

  const markNotificationRead = useCallback(
    (id: string) => {
      commitState(
        (prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }),
        [{ op: "patch", collection: "notifications", id, patch: { isRead: true } }]
      );
    },
    [commitState]
  );

  const markAllNotificationsRead = useCallback(() => {
    const unreadIds = stateRef.current.notifications
      .filter((n) => !n.isRead)
      .map((n) => n.id);
    commitState(
      (prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
      }),
      unreadIds.map((id) => ({
        op: "patch",
        collection: "notifications",
        id,
        patch: { isRead: true },
      }))
    );
  }, [commitState]);

  const saveService = useCallback(
    (
      service: Omit<Service, "id" | "designerId"> & { id?: string }
    ): GydActionResult<Service> => {
      const designerId = stateRef.current.session?.designerId ?? "des-1";
      const saved: Service = {
        ...service,
        id: service.id ?? `srv-${Date.now()}`,
        designerId,
        title: sanitizeText(service.title),
        description: sanitizeText(service.description),
      };
      commitState(
        (prev) => {
          const exists = prev.services.some((s) => s.id === saved.id);
          return {
            ...prev,
            services: exists
              ? prev.services.map((s) =>
                  s.id === saved.id && s.designerId === designerId ? saved : s
                )
              : [saved, ...prev.services],
          };
        },
        [{ op: "upsert", collection: "services", doc: saved }]
      );
      return { ok: true, data: saved };
    },
    [commitState]
  );

  const toggleServiceActive = useCallback(
    (serviceId: string) => {
      const cur = stateRef.current;
      const designerId = cur.session?.designerId ?? "des-1";
      const target = cur.services.find(
        (s) => s.id === serviceId && s.designerId === designerId
      );
      if (!target) return;
      const nextActive = !target.isActive;
      commitState(
        (prev) => ({
          ...prev,
          services: prev.services.map((s) =>
            s.id === serviceId && s.designerId === designerId
              ? { ...s, isActive: nextActive }
              : s
          ),
        }),
        [
          {
            op: "patch",
            collection: "services",
            id: serviceId,
            patch: { isActive: nextActive },
          },
        ]
      );
    },
    [commitState]
  );

  const deleteService = useCallback(
    (serviceId: string) => {
      const cur = stateRef.current;
      const designerId = cur.session?.designerId ?? "des-1";
      const owned = cur.services.some(
        (s) => s.id === serviceId && s.designerId === designerId
      );
      if (!owned) return;
      commitState(
        (prev) => ({
          ...prev,
          services: prev.services.filter(
            (s) => !(s.id === serviceId && s.designerId === designerId)
          ),
        }),
        [{ op: "delete", collection: "services", id: serviceId }]
      );
    },
    [commitState]
  );

  const addPortfolioProject = useCallback(
    (
      project: Omit<Portfolio, "id" | "designerId" | "createdAt" | "images"> & {
        extraImages?: string[];
      }
    ): GydActionResult<Portfolio> => {
      const designerId = stateRef.current.session?.designerId ?? "des-1";
      const id = `port-${Date.now()}`;
      const newProj: Portfolio = {
        id,
        designerId,
        title: sanitizeText(project.title),
        categoryName: project.categoryName,
        occasion: project.occasion,
        city: project.city,
        description: sanitizeText(project.description),
        coverImageUrl: project.coverImageUrl,
        createdAt: new Date().toISOString(),
        images: [
          {
            id: `pimg-${Date.now()}-0`,
            portfolioId: id,
            url: project.coverImageUrl,
            caption: project.title,
          },
          ...(project.extraImages ?? []).map((url, idx) => ({
            id: `pimg-${Date.now()}-${idx + 1}`,
            portfolioId: id,
            url,
            caption: `${project.title} · Detail ${idx + 1}`,
          })),
        ],
      };
      commitState(
        (prev) => ({
          ...prev,
          portfolios: [newProj, ...prev.portfolios],
        }),
        [{ op: "upsert", collection: "portfolios", doc: newProj }]
      );
      return { ok: true, data: newProj };
    },
    [commitState]
  );

  const deletePortfolioProject = useCallback(
    (portfolioId: string) => {
      const cur = stateRef.current;
      const designerId = cur.session?.designerId ?? "des-1";
      const owned = cur.portfolios.some(
        (p) => p.id === portfolioId && p.designerId === designerId
      );
      if (!owned) return;
      commitState(
        (prev) => ({
          ...prev,
          portfolios: prev.portfolios.filter(
            (p) => !(p.id === portfolioId && p.designerId === designerId)
          ),
        }),
        [{ op: "delete", collection: "portfolios", id: portfolioId }]
      );
    },
    [commitState]
  );

  const toggleAvailabilitySlot = useCallback(
    (designerId: string, slotId: string) => {
      const target = stateRef.current.availability.find(
        (av) => av.designerId === designerId
      );
      if (!target) return;
      const nextSlots = target.slots.map((sl) =>
        sl.id === slotId && !sl.bookedByBookingId
          ? { ...sl, isAvailable: !sl.isAvailable }
          : sl
      );
      commitState(
        (prev) => ({
          ...prev,
          availability: prev.availability.map((av) =>
            av.designerId === designerId ? { ...av, slots: nextSlots } : av
          ),
        }),
        [
          {
            op: "patch",
            collection: "availability",
            id: designerId,
            patch: { slots: nextSlots },
          },
        ]
      );
    },
    [commitState]
  );

  const toggleBlockedDate = useCallback(
    (designerId: string, date: string) => {
      const target = stateRef.current.availability.find(
        (av) => av.designerId === designerId
      );
      if (!target) return;
      const exists = target.blockedDates.includes(date);
      const nextBlocked = exists
        ? target.blockedDates.filter((d) => d !== date)
        : [...target.blockedDates, date];
      commitState(
        (prev) => ({
          ...prev,
          availability: prev.availability.map((av) =>
            av.designerId === designerId
              ? { ...av, blockedDates: nextBlocked }
              : av
          ),
        }),
        [
          {
            op: "patch",
            collection: "availability",
            id: designerId,
            patch: { blockedDates: nextBlocked },
          },
        ]
      );
    },
    [commitState]
  );

  const updateDesignerProfileSettings = useCallback(
    (
      designerId: string,
      patch: Partial<
        Pick<
          DesignerProfile,
          | "title"
          | "city"
          | "serviceRadiusKm"
          | "bio"
          | "startingPriceInr"
          | "supportedAppointmentTypes"
        >
      >
    ): GydActionResult => {
      commitState(
        (prev) => ({
          ...prev,
          designers: prev.designers.map((d) =>
            d.id === designerId ? { ...d, ...patch } : d
          ),
        }),
        [
          {
            op: "patch",
            collection: "designers",
            id: designerId,
            patch: patch as Record<string, unknown>,
          },
        ]
      );
      return { ok: true };
    },
    [commitState]
  );

  // Admin actions
  const updateUserAccountStatus = useCallback(
    (userId: string, status: AccountStatus) => {
      const cur = stateRef.current;
      const linkedDesigners = cur.designers.filter((d) => d.userId === userId);
      const auditEntry: AdminAuditLog = {
        id: `audit-${Date.now()}`,
        actorName: cur.session?.name ?? "Admin",
        action: `USER_STATUS_${status}`,
        targetType: "User",
        targetId: userId,
        details: `Changed user ${userId} status to ${status}.`,
        createdAt: new Date().toISOString(),
      };

      const ops: ClientSyncOp[] = [
        { op: "patch", collection: "users", id: userId, patch: { status } },
        ...linkedDesigners.map((d) => {
          const nextApproval: DesignerApprovalStatus =
            status === "ACTIVE"
              ? d.approvalStatus === "SUSPENDED"
                ? "APPROVED"
                : d.approvalStatus
              : "SUSPENDED";
          const nextVerified = status === "ACTIVE" ? d.isVerified : false;
          const nextSummary =
            status === "ACTIVE"
              ? "Available Tomorrow · 10:00 AM"
              : "Blocked by Moderation";
          return {
            op: "patch" as const,
            collection: "designers",
            id: d.id,
            patch: {
              approvalStatus: nextApproval,
              isVerified: nextVerified,
              availabilitySummary: nextSummary,
            },
          };
        }),
        { op: "upsert", collection: "audit_logs", doc: auditEntry },
      ];

      commitState(
        (prev) => ({
          ...prev,
          users: prev.users.map((u) => (u.id === userId ? { ...u, status } : u)),
          designers: prev.designers.map((d) =>
            d.userId === userId
              ? {
                  ...d,
                  approvalStatus:
                    status === "ACTIVE"
                      ? d.approvalStatus === "SUSPENDED"
                        ? "APPROVED"
                        : d.approvalStatus
                      : "SUSPENDED",
                  isVerified: status === "ACTIVE" ? d.isVerified : false,
                  availabilitySummary:
                    status === "ACTIVE"
                      ? "Available Tomorrow · 10:00 AM"
                      : "Blocked by Moderation",
                }
              : d
          ),
          session:
            prev.session?.userId === userId && status !== "ACTIVE"
              ? null
              : prev.session,
          auditLogs: [auditEntry, ...prev.auditLogs],
        }),
        ops
      );
    },
    [commitState]
  );

  const removeUser = useCallback(
    (userId: string): GydActionResult => {
      const cur = stateRef.current;
      const targetUser = cur.users.find((u) => u.id === userId);
      if (!targetUser) {
        return { ok: false, error: "User account not found." };
      }
      if (targetUser.role === "ADMIN") {
        return {
          ok: false,
          error: "Administrator accounts cannot be deleted.",
        };
      }

      const linkedDesigners = new Set(
        cur.designers.filter((d) => d.userId === userId).map((d) => d.id)
      );
      const auditEntry: AdminAuditLog = {
        id: `audit-${Date.now()}`,
        actorName: cur.session?.name ?? "Admin",
        action: "USER_REMOVED",
        targetType: "User",
        targetId: userId,
        details: `Permanently removed ${targetUser.name} (${targetUser.email}) from platform.`,
        createdAt: new Date().toISOString(),
      };

      const ops: ClientSyncOp[] = [
        { op: "delete", collection: "users", id: userId },
        { op: "deleteMany", collection: "customers", filter: { userId } },
        { op: "deleteMany", collection: "designers", filter: { userId } },
        {
          op: "deleteMany",
          collection: "favourites",
          filter: { customerId: userId },
        },
        ...Array.from(linkedDesigners).flatMap((desId): ClientSyncOp[] => [
          {
            op: "deleteMany",
            collection: "services",
            filter: { designerId: desId },
          },
          {
            op: "deleteMany",
            collection: "portfolios",
            filter: { designerId: desId },
          },
          {
            op: "deleteMany",
            collection: "availability",
            filter: { designerId: desId },
          },
          {
            op: "deleteMany",
            collection: "verifications",
            filter: { designerId: desId },
          },
          {
            op: "deleteMany",
            collection: "favourites",
            filter: { designerId: desId },
          },
        ]),
        { op: "upsert", collection: "audit_logs", doc: auditEntry },
      ];

      commitState(
        (prev) => ({
          ...prev,
          users: prev.users.filter((u) => u.id !== userId),
          customers: prev.customers.filter((c) => c.userId !== userId),
          designers: prev.designers.filter((d) => d.userId !== userId),
          services: prev.services.filter((s) => !linkedDesigners.has(s.designerId)),
          portfolios: prev.portfolios.filter(
            (p) => !linkedDesigners.has(p.designerId)
          ),
          availability: prev.availability.filter(
            (a) => !linkedDesigners.has(a.designerId)
          ),
          verifications: prev.verifications.filter(
            (v) => !linkedDesigners.has(v.designerId)
          ),
          favourites: prev.favourites.filter(
            (f) => f.customerId !== userId && !linkedDesigners.has(f.designerId)
          ),
          session:
            prev.session?.userId === userId ||
            (prev.session?.designerId &&
              linkedDesigners.has(prev.session.designerId))
              ? null
              : prev.session,
          auditLogs: [auditEntry, ...prev.auditLogs],
        }),
        ops
      );
      return { ok: true };
    },
    [commitState]
  );

  const updateDesignerApproval = useCallback(
    (
      designerId: string,
      status: DesignerApprovalStatus,
      notes?: string
    ) => {
      const cur = stateRef.current;
      const target = cur.designers.find((d) => d.id === designerId);
      const shouldDeactivateUser =
        status === "SUSPENDED" || status === "REJECTED";
      const nowIso = new Date().toISOString();

      const nextSummary =
        status === "APPROVED"
          ? "Available Tomorrow · 10:00 AM"
          : status === "PENDING_REVIEW"
            ? "Pending Admin Verification"
            : "Profile Suspended";

      const notifDoc: NotificationItem | null = target
        ? {
            id: `notif-${Date.now()}`,
            userId: target.userId,
            role: "DESIGNER",
            type: "DESIGNER_APPROVAL",
            title: `Studio Application ${status.replace(/_/g, " ")}`,
            message:
              notes ||
              `Admin updated your GYD designer approval status to ${status}.`,
            linkHref: "/designer/dashboard",
            isRead: false,
            createdAt: nowIso,
          }
        : null;

      const auditEntry: AdminAuditLog = {
        id: `audit-${Date.now()}`,
        actorName: cur.session?.name ?? "Admin",
        action: `DESIGNER_${status}`,
        targetType: "DesignerProfile",
        targetId: designerId,
        details: notes || `Set approval status to ${status}.`,
        createdAt: nowIso,
      };

      const targetUser = target
        ? cur.users.find((u) => u.id === target.userId)
        : undefined;
      const nextUserStatus: AccountStatus | undefined = targetUser
        ? status === "APPROVED"
          ? "ACTIVE"
          : shouldDeactivateUser
            ? "SUSPENDED"
            : targetUser.status
        : undefined;

      const verUpdates = cur.verifications
        .filter((v) => v.designerId === designerId)
        .map((v) => ({
          id: v.id,
          patch: {
            status:
              status === "APPROVED"
                ? "VERIFIED"
                : status === "REJECTED"
                  ? "REJECTED"
                  : "PENDING",
            reviewerNotes: notes ?? v.reviewerNotes,
            reviewedAt: nowIso,
          },
        }));

      const ops: ClientSyncOp[] = [
        {
          op: "patch",
          collection: "designers",
          id: designerId,
          patch: {
            approvalStatus: status,
            isVerified: status === "APPROVED",
            availabilitySummary: nextSummary,
          },
        },
        ...(target && nextUserStatus
          ? [
              {
                op: "patch" as const,
                collection: "users",
                id: target.userId,
                patch: { status: nextUserStatus },
              },
            ]
          : []),
        ...verUpdates.map((vu) => ({
          op: "patch" as const,
          collection: "verifications",
          id: vu.id,
          patch: vu.patch,
        })),
        ...(notifDoc
          ? [{ op: "upsert" as const, collection: "notifications", doc: notifDoc }]
          : []),
        { op: "upsert", collection: "audit_logs", doc: auditEntry },
      ];

      commitState(
        (prev) => ({
          ...prev,
          designers: prev.designers.map((d) =>
            d.id === designerId
              ? {
                  ...d,
                  approvalStatus: status,
                  isVerified: status === "APPROVED",
                  availabilitySummary: nextSummary,
                }
              : d
          ),
          users:
            target && nextUserStatus
              ? prev.users.map((u) =>
                  u.id === target.userId ? { ...u, status: nextUserStatus } : u
                )
              : prev.users,
          verifications: prev.verifications.map((v) =>
            v.designerId === designerId
              ? {
                  ...v,
                  status:
                    status === "APPROVED"
                      ? "VERIFIED"
                      : status === "REJECTED"
                        ? "REJECTED"
                        : "PENDING",
                  reviewerNotes: notes ?? v.reviewerNotes,
                  reviewedAt: nowIso,
                }
              : v
          ),
          session:
            shouldDeactivateUser &&
            (prev.session?.designerId === designerId ||
              (target && prev.session?.userId === target.userId))
              ? null
              : prev.session,
          notifications: notifDoc
            ? [notifDoc, ...prev.notifications]
            : prev.notifications,
          auditLogs: [auditEntry, ...prev.auditLogs],
        }),
        ops
      );
    },
    [commitState]
  );

  const removeDesigner = useCallback(
    (designerId: string): GydActionResult => {
      const cur = stateRef.current;
      const target = cur.designers.find((d) => d.id === designerId);
      if (!target) {
        return { ok: false, error: "Designer studio not found." };
      }
      const ownerUser = cur.users.find((u) => u.id === target.userId);
      const shouldDeleteOwner = ownerUser && ownerUser.role !== "ADMIN";

      const auditEntry: AdminAuditLog = {
        id: `audit-${Date.now()}`,
        actorName: cur.session?.name ?? "Admin",
        action: "DESIGNER_REMOVED",
        targetType: "DesignerProfile",
        targetId: designerId,
        details: `Permanently removed ${target.name} (${target.city}) from platform.`,
        createdAt: new Date().toISOString(),
      };

      const ops: ClientSyncOp[] = [
        { op: "delete", collection: "designers", id: designerId },
        ...(shouldDeleteOwner
          ? [{ op: "delete" as const, collection: "users", id: target.userId }]
          : []),
        { op: "deleteMany", collection: "services", filter: { designerId } },
        { op: "deleteMany", collection: "portfolios", filter: { designerId } },
        { op: "deleteMany", collection: "availability", filter: { designerId } },
        { op: "deleteMany", collection: "verifications", filter: { designerId } },
        { op: "deleteMany", collection: "favourites", filter: { designerId } },
        { op: "upsert", collection: "audit_logs", doc: auditEntry },
      ];

      commitState(
        (prev) => ({
          ...prev,
          designers: prev.designers.filter((d) => d.id !== designerId),
          users: prev.users.filter(
            (u) => u.id !== target.userId || u.role === "ADMIN"
          ),
          services: prev.services.filter((s) => s.designerId !== designerId),
          portfolios: prev.portfolios.filter((p) => p.designerId !== designerId),
          availability: prev.availability.filter(
            (a) => a.designerId !== designerId
          ),
          verifications: prev.verifications.filter(
            (v) => v.designerId !== designerId
          ),
          favourites: prev.favourites.filter((f) => f.designerId !== designerId),
          session:
            prev.session?.designerId === designerId ||
            prev.session?.userId === target.userId
              ? null
              : prev.session,
          auditLogs: [auditEntry, ...prev.auditLogs],
        }),
        ops
      );
      return { ok: true };
    },
    [commitState]
  );

  const toggleDesignerFeatured = useCallback(
    (designerId: string) => {
      const target = stateRef.current.designers.find(
        (d) => d.id === designerId
      );
      if (!target) return;
      const nextFeatured = !target.isFeatured;
      commitState(
        (prev) => ({
          ...prev,
          designers: prev.designers.map((d) =>
            d.id === designerId ? { ...d, isFeatured: nextFeatured } : d
          ),
        }),
        [
          {
            op: "patch",
            collection: "designers",
            id: designerId,
            patch: { isFeatured: nextFeatured },
          },
        ]
      );
    },
    [commitState]
  );

  const deleteCategory = useCallback(
    (categoryId: string): GydActionResult => {
      const cur = stateRef.current;
      const target = cur.categories.find((c) => c.id === categoryId);
      if (!target) return { ok: false, error: "Category not found." };
      const auditEntry: AdminAuditLog = {
        id: `audit-${Date.now()}`,
        actorName: cur.session?.name ?? "Admin",
        action: "CATEGORY_REMOVED",
        targetType: "Category",
        targetId: categoryId,
        details: `Removed category "${target.name}".`,
        createdAt: new Date().toISOString(),
      };
      commitState(
        (prev) => ({
          ...prev,
          categories: prev.categories.filter((c) => c.id !== categoryId),
          auditLogs: [auditEntry, ...prev.auditLogs],
        }),
        [
          { op: "delete", collection: "categories", id: categoryId },
          { op: "upsert", collection: "audit_logs", doc: auditEntry },
        ]
      );
      return { ok: true };
    },
    [commitState]
  );

  const saveCategory = useCallback(
    (
      cat: Omit<Category, "id" | "subcategories" | "sortOrder" | "slug"> & {
        id?: string;
      }
    ): GydActionResult => {
      const cur = stateRef.current;
      if (cat.id) {
        const existing = cur.categories.find((c) => c.id === cat.id);
        if (!existing) return { ok: false, error: "Category not found." };
        const updated: Category = {
          ...existing,
          ...cat,
          name: sanitizeText(cat.name),
          description: sanitizeText(cat.description),
          slug: slugify(cat.name),
        };
        commitState(
          (prev) => ({
            ...prev,
            categories: prev.categories.map((c) =>
              c.id === cat.id ? updated : c
            ),
          }),
          [{ op: "upsert", collection: "categories", doc: updated }]
        );
        return { ok: true };
      }

      const newCat: Category = {
        ...cat,
        id: `cat-${Date.now()}`,
        name: sanitizeText(cat.name),
        description: sanitizeText(cat.description),
        slug: slugify(cat.name),
        sortOrder: cur.categories.length + 1,
        subcategories: [],
      };
      commitState(
        (prev) => ({
          ...prev,
          categories: [...prev.categories, newCat],
        }),
        [{ op: "upsert", collection: "categories", doc: newCat }]
      );
      return { ok: true };
    },
    [commitState]
  );

  const toggleCategoryActive = useCallback(
    (categoryId: string) => {
      const target = stateRef.current.categories.find(
        (c) => c.id === categoryId
      );
      if (!target) return;
      const nextActive = !target.isActive;
      commitState(
        (prev) => ({
          ...prev,
          categories: prev.categories.map((c) =>
            c.id === categoryId ? { ...c, isActive: nextActive } : c
          ),
        }),
        [
          {
            op: "patch",
            collection: "categories",
            id: categoryId,
            patch: { isActive: nextActive },
          },
        ]
      );
    },
    [commitState]
  );

  const moveCategoryOrder = useCallback(
    (categoryId: string, direction: "UP" | "DOWN") => {
      const sorted = [...stateRef.current.categories].sort(
        (a, b) => a.sortOrder - b.sortOrder
      );
      const idx = sorted.findIndex((c) => c.id === categoryId);
      const swapIdx = direction === "UP" ? idx - 1 : idx + 1;
      if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;
      const temp = sorted[idx];
      sorted[idx] = sorted[swapIdx];
      sorted[swapIdx] = temp;
      const reordered = sorted.map((c, i) => ({ ...c, sortOrder: i + 1 }));
      commitState(
        (prev) => ({ ...prev, categories: reordered }),
        reordered.map((c) => ({
          op: "patch",
          collection: "categories",
          id: c.id,
          patch: { sortOrder: c.sortOrder },
        }))
      );
    },
    [commitState]
  );

  const addSubcategory = useCallback(
    (categoryId: string, name: string, description: string): GydActionResult => {
      const target = stateRef.current.categories.find(
        (c) => c.id === categoryId
      );
      if (!target) return { ok: false, error: "Category not found." };
      const nextSubs = [
        ...target.subcategories,
        {
          id: `sub-${Date.now()}`,
          categoryId,
          name: sanitizeText(name),
          slug: slugify(name),
          description: sanitizeText(description),
          isActive: true,
          sortOrder: target.subcategories.length + 1,
        },
      ];
      commitState(
        (prev) => ({
          ...prev,
          categories: prev.categories.map((c) =>
            c.id === categoryId ? { ...c, subcategories: nextSubs } : c
          ),
        }),
        [
          {
            op: "patch",
            collection: "categories",
            id: categoryId,
            patch: { subcategories: nextSubs },
          },
        ]
      );
      return { ok: true };
    },
    [commitState]
  );

  const setDesignerCommissionOverride = useCallback(
    (designerId: string, rate?: number) => {
      commitState(
        (prev) => ({
          ...prev,
          designers: prev.designers.map((d) =>
            d.id === designerId ? { ...d, commissionOverridePercent: rate } : d
          ),
        }),
        [
          {
            op: "patch",
            collection: "designers",
            id: designerId,
            patch: { commissionOverridePercent: rate ?? null },
          },
        ]
      );
    },
    [commitState]
  );

  const processRefundDemo = useCallback(
    (
      refundId: string,
      decision: "APPROVED_DEMO" | "PROCESSED_DEMO" | "REJECTED"
    ) => {
      const target = stateRef.current.refunds.find((r) => r.id === refundId);
      const ops: ClientSyncOp[] = [
        {
          op: "patch",
          collection: "refunds",
          id: refundId,
          patch: { status: decision },
        },
      ];
      if (target && decision === "PROCESSED_DEMO") {
        ops.push({
          op: "patch",
          collection: "bookings",
          id: target.bookingId,
          patch: { status: "REFUNDED", paymentStatus: "REFUNDED_DEMO" },
        });
      }
      commitState(
        (prev) => ({
          ...prev,
          refunds: prev.refunds.map((r) =>
            r.id === refundId ? { ...r, status: decision } : r
          ),
          bookings:
            target && decision === "PROCESSED_DEMO"
              ? prev.bookings.map((b) =>
                  b.id === target.bookingId
                    ? { ...b, status: "REFUNDED", paymentStatus: "REFUNDED_DEMO" }
                    : b
                )
              : prev.bookings,
        }),
        ops
      );
    },
    [commitState]
  );

  const markPayoutPaidDemo = useCallback(
    (payoutId: string) => {
      const paidAt = new Date().toISOString();
      commitState(
        (prev) => ({
          ...prev,
          payouts: prev.payouts.map((p) =>
            p.id === payoutId ? { ...p, status: "PAID_DEMO", paidAt } : p
          ),
        }),
        [
          {
            op: "patch",
            collection: "payouts",
            id: payoutId,
            patch: { status: "PAID_DEMO", paidAt },
          },
        ]
      );
    },
    [commitState]
  );

  const moderateReview = useCallback(
    (reviewId: string, status: Review["moderationStatus"]) => {
      commitState(
        (prev) => ({
          ...prev,
          reviews: prev.reviews.map((r) =>
            r.id === reviewId ? { ...r, moderationStatus: status } : r
          ),
        }),
        [
          {
            op: "patch",
            collection: "reviews",
            id: reviewId,
            patch: { moderationStatus: status },
          },
        ]
      );
    },
    [commitState]
  );

  const updateCmsContent = useCallback(
    (patch: Partial<CmsContent>) => {
      commitState(
        (prev) => ({ ...prev, cms: { ...prev.cms, ...patch } }),
        [
          {
            op: "patchConfig",
            key: "cms",
            patch: patch as Record<string, unknown>,
          },
        ]
      );
    },
    [commitState]
  );

  const updatePlatformSettings = useCallback(
    (patch: Partial<PlatformSettings>) => {
      commitState(
        (prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }),
        [
          {
            op: "patchConfig",
            key: "settings",
            patch: patch as Record<string, unknown>,
          },
        ]
      );
    },
    [commitState]
  );

  return (
    <GydStoreContext.Provider
      value={{
        state,
        hydrated,
        dbSource,
        dbStatus,
        locationStatus,
        setSelectedCity,
        setSelectedPlace,
        detectCurrentLocation,
        clearUserLocation,
        getDesignerDistanceKm,
        loginDemoRole,
        loginWithCredentials,
        loginAdminWithCredentials,
        registerCustomer,
        registerDesigner,
        logout,
        resetDemoState,
        getVisibleDesigners,
        toggleFavourite,
        isFavourited,
        addAddress,
        deleteAddress,
        updateCustomerProfile,
        createBooking,
        updateBookingStatus,
        authorizeDemoPayment,
        submitReview,
        sendMessage,
        startOrOpenConversation,
        markNotificationRead,
        markAllNotificationsRead,
        saveService,
        toggleServiceActive,
        deleteService,
        addPortfolioProject,
        deletePortfolioProject,
        toggleAvailabilitySlot,
        toggleBlockedDate,
        updateDesignerProfileSettings,
        updateUserAccountStatus,
        removeUser,
        updateDesignerApproval,
        removeDesigner,
        toggleDesignerFeatured,
        saveCategory,
        deleteCategory,
        toggleCategoryActive,
        moveCategoryOrder,
        addSubcategory,
        setDesignerCommissionOverride,
        processRefundDemo,
        markPayoutPaidDemo,
        moderateReview,
        updateCmsContent,
        updatePlatformSettings,
      }}
    >
      {children}
    </GydStoreContext.Provider>
  );
}

export function useGydStore() {
  const ctx = useContext(GydStoreContext);
  if (!ctx) {
    throw new Error("useGydStore must be used inside GydStoreProvider");
  }
  return ctx;
}
