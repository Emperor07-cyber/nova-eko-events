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

export const buildEventUrl = (value = "") => {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const normalized = trimmed
    .replace(/^https?:\/\//i, "")
    .replace(/^www\.ekotixx\.com\//i, "")
    .replace(/^ekotixx\.com\//i, "");

  return `${EVENT_URL_PREFIX}${normalized}`;
};

export const getEventUrlDisplayValue = (value = "") =>
  value
    .replace(EVENT_URL_PREFIX, "")
    .replace(/^https?:\/\//i, "");

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
