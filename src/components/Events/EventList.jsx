import React, { useEffect, useState } from "react";
import { database } from "../../firebase/firebaseConfig";
import { ref, onValue } from "firebase/database";
import { Link } from "react-router-dom";
import "./eventlist.css";

const CATEGORIES = ["All", "Nightlife", "Concert", "Festival", "Business", "Workshop", "Sports", "Other"];

const formatDate = (dateStr) => {
  if (!dateStr || dateStr === "TBA") return "To be announced";
  const d = new Date(dateStr);
  if (isNaN(d)) return "To be announced";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

const getMinPrice = (tickets) => {
  if (!tickets || tickets.length === 0) return null;
  const prices = tickets.map((t) => Number(t.price)).filter((p) => p > 0);
  if (prices.length === 0) return "Free";
  return `From ₦${Math.min(...prices).toLocaleString()}`;
};

const getEventLink = (event) => {
if (event.eventUrl) {
  try {
    return new URL(event.eventUrl).pathname;
  } catch (error) {
    console.warn("Invalid eventUrl, falling back to event id route", error);
  }
}
return `/event/${event.id}`;
};

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid"); // grid | list

  useEffect(() => {
    const eventsRef = ref(database, "events");
    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const now = new Date();
        const loaded = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((e) => e.date === "TBA" || new Date(e.date) >= now)
          .sort((a, b) => {
            if (a.date === "TBA") return 1;
            if (b.date === "TBA") return -1;
            return new Date(a.date) - new Date(b.date);
          });
        setEvents(loaded);
      }
      setLoading(false);
    });
  }, []);

  const filtered = events.filter((e) => {
    const matchSearch =
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.location?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || e.category === category;
    return matchSearch && matchCat;
  });

  return (
    <>
      {/* ── Page Header ── */}
      <div className="el-page-header">
        <div className="el-page-header-inner">
          <div className="el-page-title-wrap">
            <h1 className="el-page-title">Discover events</h1>
            <p className="el-page-sub">{events.length} upcoming events in Lagos & beyond</p>
          </div>

          {/* Search */}
          <div className="el-search-wrap">
            <svg className="el-search-icon" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="#94a3b8" strokeWidth="1.5"/>
              <path d="M13.5 13.5L17 17" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              className="el-search"
              type="text"
              placeholder="Search events or locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="el-search-clear" onClick={() => setSearch("")}>✕</button>
            )}
          </div>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div className="el-filters-bar">
        <div className="el-filters-inner">
          <div className="el-cats">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`el-cat${category === cat ? " el-cat--active" : ""}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="el-view-toggle">
            <button
              className={`el-view-btn${view === "grid" ? " el-view-btn--active" : ""}`}
              onClick={() => setView("grid")}
              title="Grid view"
            >
              <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
                <rect x="1" y="1" width="6" height="6" rx="1"/>
                <rect x="9" y="1" width="6" height="6" rx="1"/>
                <rect x="1" y="9" width="6" height="6" rx="1"/>
                <rect x="9" y="9" width="6" height="6" rx="1"/>
              </svg>
            </button>
            <button
              className={`el-view-btn${view === "list" ? " el-view-btn--active" : ""}`}
              onClick={() => setView("list")}
              title="List view"
            >
              <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
                <rect x="1" y="2" width="14" height="2" rx="1"/>
                <rect x="1" y="7" width="14" height="2" rx="1"/>
                <rect x="1" y="12" width="14" height="2" rx="1"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="el-content">
        <div className="el-content-inner">

          {/* Results count */}
          {!loading && (
            <p className="el-results-count">
              {filtered.length === 0
                ? "No events found"
                : `${filtered.length} event${filtered.length !== 1 ? "s" : ""} found`}
              {search && ` for "${search}"`}
              {category !== "All" && ` in ${category}`}
            </p>
          )}

          {/* Loading */}
          {loading && (
            <div className={view === "grid" ? "el-grid" : "el-list"}>
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="el-skeleton" />
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div className="el-empty">
              <div className="el-empty-icon">🎭</div>
              <h3>No events found</h3>
              <p>Try adjusting your search or changing the category filter.</p>
              <button className="el-empty-reset" onClick={() => { setSearch(""); setCategory("All"); }}>
                Clear filters
              </button>
            </div>
          )}

          {/* Grid view */}
          {!loading && filtered.length > 0 && view === "grid" && (
            <div className="el-grid">
              {filtered.map((event) => (
                <Link to={getEventLink(event)} className="el-card" key={event.id}>
                  <div className="el-card-img-wrap">
                    <img
                      src={event.image || "/images/partypic.jpg"}
                      alt={event.title}
                      className="el-card-img"
                      loading="lazy"
                    />
                    {event.category && (
                      <span className="el-card-cat">{event.category}</span>
                    )}
                    {getMinPrice(event.tickets) && (
                      <span className="el-card-price-badge">{getMinPrice(event.tickets)}</span>
                    )}
                  </div>
                  <div className="el-card-body">
                    <h3 className="el-card-title">{event.title}</h3>
                    <p className="el-card-desc">{event.description}</p>
                    <div className="el-card-meta">
                      <span>📅 {formatDate(event.date)}</span>
                      {event.startTime && <span>🕐 {event.startTime}</span>}
                      <span>📍 {event.location}</span>
                    </div>
                    <div className="el-card-footer">
                      <span className="el-card-price-text">
                        {getMinPrice(event.tickets) || "Free"}
                      </span>
                      <span className="el-card-arrow">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* List view */}
          {!loading && filtered.length > 0 && view === "list" && (
            <div className="el-list">
              {filtered.map((event) => (
                <Link to={getEventLink(event)} className="el-list-card" key={event.id}>
                  <div className="el-list-img-wrap">
                    <img
                      src={event.image || "/images/partypic.jpg"}
                      alt={event.title}
                      className="el-list-img"
                      loading="lazy"
                    />
                  </div>
                  <div className="el-list-body">
                    <div className="el-list-top">
                      {event.category && <span className="el-card-cat">{event.category}</span>}
                      <h3 className="el-list-title">{event.title}</h3>
                      <p className="el-list-desc">{event.description}</p>
                    </div>
                    <div className="el-list-meta">
                      <span>📅 {formatDate(event.date)}</span>
                      {event.startTime && <span>🕐 {event.startTime}</span>}
                      <span>📍 {event.location}</span>
                    </div>
                  </div>
                  <div className="el-list-right">
                    <span className="el-list-price">{getMinPrice(event.tickets) || "Free"}</span>
                    <span className="el-list-cta">Get tickets →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </div>

    </>
  );
};

export default EventList;