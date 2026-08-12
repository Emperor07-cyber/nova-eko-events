export const EVENT_CATEGORIES = [
  "Business",
  "Concert",
  "Meetup",
  "Nightlife",
  "Sports",
  "Workshop",
  "Conference",
  "Festival",
  "Webinar",
  "Health & Wellness",
  "Education",
  "Charity",
  "Other",
];

export const TICKETING_POLICY_ITEMS = [
  "All tickets must be sold exclusively through this platform.",
  "Physical ticket sales are strictly prohibited. Selling paper or physical tickets outside this platform is a violation of our terms and may result in account suspension.",
  "All ticket proceeds will be processed through our payment system.",
  "You are responsible for the accuracy of event details provided.",
];

const EVENT_URL_PREFIX = "https://www.ekotixx.com/";

// Path segments already used by real app routes (see src/App.jsx). A slug
// matching one of these would be permanently unreachable behind the static
// route, so we block them at creation time instead of failing silently.
export const RESERVED_SLUGS = [
  "", "event", "eventlist", "privacy", "terms", "checkin", "checkout",
  "my-tickets", "login", "register", "host-setup", "host", "admin",
  "images", "assets", "api", "favicon.ico",
];

// Turns free-typed input into a safe, canonical URL segment:
// lowercase, [a-z0-9-] only, no leading/trailing/double hyphens.
export const sanitizeSlug = (value = "") =>
  value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\.ekotixx\.com\//i, "")
    .replace(/^ekotixx\.com\//i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const isReservedSlug = (slug = "") =>
  RESERVED_SLUGS.includes(sanitizeSlug(slug));

export const buildEventUrl = (value = "") => {
  const normalized = sanitizeSlug(value);

  if (!normalized) {
    return "";
  }

  return `${EVENT_URL_PREFIX}${normalized}`;
};

export const getEventUrlDisplayValue = (value = "") =>
  value
    .replace(EVENT_URL_PREFIX, "")
    .replace(/^https?:\/\//i, "");

// Extracts just the slug segment from a stored eventUrl value, however it
// was saved historically (bare slug, path, or full URL).
export const extractSlug = (eventUrl = "") => {
  const raw = String(eventUrl || "").trim();
  if (!raw) return "";
  if (!/^https?:\/\//i.test(raw)) {
    return sanitizeSlug(raw.replace(/^\/+/, ""));
  }
  try {
    const path = new URL(raw).pathname.replace(/^\/+/, "");
    return sanitizeSlug(path);
  } catch {
    return "";
  }
};

export const createEmptyTicket = () => ({
  type: "",
  price: "",
  perks: [],
  limit: "",
});

export const createDefaultTicket = () => ({
  type: "Regular",
  price: "",
  perks: [],
  limit: "",
});

export const createDefaultEmailBranding = () => ({
  brandName: "",
  supportEmail: "",
  logoUrl: "",
  primaryColor: "#10612B",
  accentColor: "#1F7A47",
  footerNote: "",
});

export const normalizeTicket = (ticket = {}) => ({
  type: ticket.type || "",
  price: ticket.price ?? "",
  perks: Array.isArray(ticket.perks) ? ticket.perks : [],
  limit: ticket.limit ?? "",
});

export const normalizeMerchItem = (item = {}) => ({
  name: item.name || "",
  price: item.price ?? "",
  stock: item.stock ?? "",
  image: item.image || "",
  description: item.description || "",
});

export const normalizeEmailBranding = (branding = {}) => ({
  brandName: branding.brandName || "",
  supportEmail: branding.supportEmail || "",
  logoUrl: branding.logoUrl || "",
  primaryColor: branding.primaryColor || "#10612B",
  accentColor: branding.accentColor || "#1F7A47",
  footerNote: branding.footerNote || "",
});

export const createEmptyMerchItem = () => normalizeMerchItem();

export const formatEventDate = (dateValue) => {
  if (!dateValue || dateValue === "TBA") return "To be announced";
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  return parsed.toLocaleDateString();
};

export const formatEventTime = (timeValue) => {
  if (!timeValue) return "To be announced";
  return timeValue;
};

export const formatEventLocation = (locationValue) => {
  if (!locationValue || String(locationValue).trim().toUpperCase() === "TBA") {
    return "To be announced";
  }
  return locationValue;
};

// Checks whether `slug` is free to use. Excludes `excludeEventId` so editing
// an event doesn't flag its own current slug as taken.
export const checkSlugAvailability = async (database, slug, excludeEventId = null) => {
  const clean = sanitizeSlug(slug);
  if (!clean) {
    return { available: true, slug: clean };
  }
  if (isReservedSlug(clean)) {
    return { available: false, slug: clean, reason: "reserved" };
  }

  const { ref, get } = await import("firebase/database");
  const snapshot = await get(ref(database, "events"));
  if (!snapshot.exists()) {
    return { available: true, slug: clean };
  }

  const entries = Object.entries(snapshot.val());
  const clash = entries.find(([id, data]) => {
    if (excludeEventId && id === excludeEventId) return false;
    return extractSlug(data.eventUrl) === clean;
  });

  return { available: !clash, slug: clean, reason: clash ? "taken" : null };
};

export const getEventMapUrl = (event = {}) => {
  const latitude = Number(event.latitude);
  const longitude = Number(event.longitude);

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return `https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;
  }

  const query = [event.location, event.title].filter(Boolean).join(", ").trim();
  if (!query) return "";
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
};
