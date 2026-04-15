/**
 * Cliente de API - reemplaza @base44/sdk
 *
 * Misma interfaz que el SDK de Base44 para facilitar la migración.
 * Los componentes existentes cambian solo el import.
 *
 * URL strategy:
 *  - Server-side (RSC / Server Actions): usa la URL completa del backend (localhost:8000 en dev, NAS en prod)
 *  - Client-side (browser): usa "" (relativo) para que el proxy de Next.js en /api/* maneje el request.
 *    next.config.ts reenvía /api/* → NEXT_PUBLIC_API_URL/api/* sin CORS.
 */
const isServer = typeof window === "undefined";
const API_URL = isServer
  ? (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
  : "";

// ─── Tipos base ───────────────────────────────────────────

export interface Accommodation {
  id: string;
  name: string;
  type: string;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  description?: string;
  short_description?: string;
  main_image?: string;
  gallery_images: string[];
  amenities: string[];
  booking_url?: string;
  price_per_night?: number;
  is_featured: boolean;
  order: number;
}

export interface Booking {
  id: string;
  accommodation_id: string;
  accommodation_name: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  number_of_guests: number;
  check_in: string;
  check_out: string;
  total_price: number;
  deposit_amount: number;
  balance_amount: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  source: "web" | "airbnb" | "booking" | "phone" | "whatsapp";
  special_requests?: string;
  created_at: string;
  payments: Payment[];
}

export interface Payment {
  id: string;
  type: "deposit" | "balance" | "full";
  amount: number;
  status: "pending" | "approved" | "rejected" | "in_process" | "refunded";
  mp_payment_id?: string;
  paid_at?: string;
  payment_url?: string;
}

export interface GalleryImage {
  id: string;
  image_url: string;
  title?: string;
  category: string;
  order: number;
  is_featured?: boolean;
}

export interface SiteContent {
  id: string;
  section: string;
  key?: string;    // alias de section para compatibilidad con ContentManager
  value?: string;  // valor genérico de la clave
  title?: string;
  subtitle?: string;
  content?: string;
  image_url?: string;
}

export interface PriceResponse {
  nights: number;
  base_price_per_night: number;
  weekday_discount_amount: number;
  total_price: number;
  deposit_amount: number;
  balance_amount: number;
  breakdown: { date: string; day_of_week: string; price: number; discount_applied: boolean }[];
}

// ─── Helper fetch ─────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ access_token: string; refresh_token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: (token: string) =>
    apiFetch<{ id: string; email: string; name: string; role: string }>("/api/auth/me", {}, token),

  refresh: (refreshToken: string) =>
    apiFetch<{ access_token: string; refresh_token: string }>("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),
};

// ─── Accommodations ───────────────────────────────────────

export const accommodationsApi = {
  list: () => apiFetch<Accommodation[]>("/api/accommodations"),

  featured: () => apiFetch<Accommodation[]>("/api/accommodations/featured"),

  get: (id: string) => apiFetch<Accommodation>(`/api/accommodations/${id}`),

  create: (data: Partial<Accommodation>, token: string) =>
    apiFetch<Accommodation>("/api/accommodations", {
      method: "POST",
      body: JSON.stringify(data),
    }, token),

  update: (id: string, data: Partial<Accommodation>, token: string) =>
    apiFetch<Accommodation>(`/api/accommodations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }, token),

  delete: (id: string, token: string) =>
    apiFetch<void>(`/api/accommodations/${id}`, { method: "DELETE" }, token),
};

// ─── Bookings ─────────────────────────────────────────────

export const bookingsApi = {
  list: (params: { status?: string; accommodation_id?: string; search?: string } = {}, token: string) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v) as [string, string][]
    ).toString();
    return apiFetch<Booking[]>(`/api/bookings${qs ? `?${qs}` : ""}`, {}, token);
  },

  get: (id: string, token: string) =>
    apiFetch<Booking>(`/api/bookings/${id}`, {}, token),

  create: (data: Partial<Booking>) =>
    apiFetch<Booking>("/api/bookings", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Booking>, token: string) =>
    apiFetch<Booking>(`/api/bookings/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }, token),

  delete: (id: string, token: string) =>
    apiFetch<void>(`/api/bookings/${id}`, { method: "DELETE" }, token),

  checkAvailability: (data: { accommodation_id: string; check_in: string; check_out: string }) =>
    apiFetch<{ available: boolean }>("/api/bookings/check-availability", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  unavailableDates: (accommodationId: string) =>
    apiFetch<{ blocked_dates: string[] }>(`/api/bookings/unavailable-dates/${accommodationId}`),

  calculatePrice: (data: { accommodation_id: string; check_in: string; check_out: string; number_of_guests: number }) =>
    apiFetch<PriceResponse>("/api/bookings/calculate-price", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ─── Gallery ──────────────────────────────────────────────

export const galleryApi = {
  list: (category?: string) =>
    apiFetch<GalleryImage[]>(`/api/gallery${category && category !== "all" ? `?category=${category}` : ""}`),

  create: (data: Partial<GalleryImage>, token: string) =>
    apiFetch<GalleryImage>("/api/gallery", { method: "POST", body: JSON.stringify(data) }, token),

  update: (id: string, data: Partial<GalleryImage>, token: string) =>
    apiFetch<GalleryImage>(`/api/gallery/${id}`, { method: "PUT", body: JSON.stringify(data) }, token),

  delete: (id: string, token: string) =>
    apiFetch<void>(`/api/gallery/${id}`, { method: "DELETE" }, token),
};

// ─── Site Content ─────────────────────────────────────────

export const contentApi = {
  list: () => apiFetch<SiteContent[]>("/api/content"),

  get: (section: string) => apiFetch<SiteContent>(`/api/content/${section}`),

  upsert: (section: string, data: Partial<SiteContent>, token: string) =>
    apiFetch<SiteContent>(`/api/content/${section}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }, token),
};
