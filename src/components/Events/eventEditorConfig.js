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

export const createEmptyMerchItem = () => normalizeMerchItem();
