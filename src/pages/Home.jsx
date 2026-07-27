import React, { useEffect, useState } from "react";
import { database } from "../firebase/firebaseConfig";
import { ref, onValue } from "firebase/database";
import { Link } from "react-router-dom";
import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";
import "./home.css";

const formatDate = (dateStr) => {
  if (!dateStr || dateStr === "TBA") return "To be announced";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const getMinPrice = (tickets) => {
  if (!tickets || tickets.length === 0) return "Free";
  const prices = tickets.map((t) => Number(t.price)).filter((p) => p > 0);
  if (prices.length === 0) return "Free";
  return `₦${Math.min(...prices).toLocaleString()}`;
};

const getEventLink = (event) => {
  try {
    if (event.eventUrl) return new URL(event.eventUrl).pathname;
  } catch {}
  return `/event/${event.id}`;
};

const Home = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    const eventsRef = ref(database, "events");
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const now = new Date();
        const list = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((e) => e.date === "TBA" || new Date(e.date) >= now)
          .sort((a, b) => {
            if (a.date === "TBA") return 1;
            if (b.date === "TBA") return -1;
            return new Date(a.date) - new Date(b.date);
          });
        setEvents(list);
      } else {
        setEvents([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Auto-rotate featured event every 5s
  useEffect(() => {
    if (events.length === 0) return;
    const interval = setInterval(() => {
      setFeaturedIdx((i) => (i + 1) % Math.min(events.length, 4));
    }, 5000);
    return () => clearInterval(interval);
  }, [events]);

  const featuredEvent = events[featuredIdx] || null;
  const popularEvents = events.slice(0, 4);

  const buildSearchUrl = () => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (location) params.set("loc", location);
    if (dateFilter) params.set("date", dateFilter);
    if (category) params.set("cat", category);
    return `/eventlist${params.toString() ? `?${params}` : ""}`;
  };

  return (
    <>
      <Header />

      {/* ── Hero ── */}
      <section className="hm-hero">
        <div className="hm-hero-bg">
          {featuredEvent?.image && (
            <img src={featuredEvent.image} alt="" className="hm-hero-bg-img" />
          )}
          <div className="hm-hero-overlay" />
        </div>

        <div className="hm-hero-inner">
          {/* Left: copy + trust badges */}
          <div className="hm-hero-left">
            <h1 className="hm-hero-h1">
              Discover Events.<br />
              Book <span className="hm-hero-accent">Instantly.</span><br />
              Experience <span className="hm-hero-accent">More.</span>
            </h1>
            <p className="hm-hero-sub">
              EKOTIX is your all-in-one platform for discovering,<br />
              booking and managing amazing events.
            </p>

            <div className="hm-hero-ctas">
              <Link to="/eventlist" className="hm-hero-btn-primary">
                Discover Events →
              </Link>
              <Link to="/register" className="hm-hero-btn-ghost">
                List Your Event 📅
              </Link>
            </div>

            {/* Trust badges */}
            <div className="hm-hero-trust">
              <div className="hm-hero-trust-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#16a34a" strokeWidth="2" strokeLinejoin="round"/></svg>
                <span><strong>100% Secure</strong> Secure payments</span>
              </div>
              <div className="hm-hero-trust-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#16a34a" strokeWidth="2" strokeLinejoin="round"/></svg>
                <span><strong>Instant Delivery</strong> E-tickets on time</span>
              </div>
              <div className="hm-hero-trust-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="9" stroke="#16a34a" strokeWidth="2"/></svg>
                <span><strong>Trusted Platform</strong> Reliable. Legit. Legal.</span>
              </div>
            </div>

            {/* Hero dots */}
            {events.length > 1 && (
              <div className="hm-hero-dots">
                {events.slice(0, 4).map((_, i) => (
                  <button
                    key={i}
                    className={`hm-hero-dot${i === featuredIdx ? " hm-hero-dot--active" : ""}`}
                    onClick={() => setFeaturedIdx(i)}
                    aria-label={`Featured event ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: Featured event card */}
          {featuredEvent && (
            <div className="hm-featured-card">
              <div className="hm-featured-label">
                <span className="hm-featured-dot-pulse" /> Featured Event
              </div>
              <img
                src={featuredEvent.image || "/images/nova1.jpg"}
                alt={featuredEvent.title}
                className="hm-featured-img"
              />
              <div className="hm-featured-body">
                <h3 className="hm-featured-title">{featuredEvent.title}</h3>
                <div className="hm-featured-meta">
                  <span>📅 {formatDate(featuredEvent.date)}{featuredEvent.startTime ? ` • ${featuredEvent.startTime}` : ""}</span>
                  <span>📍 {featuredEvent.location}</span>
                </div>
                <div className="hm-featured-footer">
                  <span className="hm-featured-price">{getMinPrice(featuredEvent.tickets)}</span>
                  <Link to={getEventLink(featuredEvent)} className="hm-featured-btn">
                    Get Tickets →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Search bar ── */}
      <div className="hm-search-bar">
        <div className="hm-search-inner">
          <div className="hm-search-field hm-search-field--main">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="#94a3b8" strokeWidth="1.5"/>
              <path d="M13.5 13.5L17 17" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search events, artists or venues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (window.location.href = buildSearchUrl())}
            />
          </div>
          <div className="hm-search-divider" />
          <div className="hm-search-field">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" fill="#94a3b8"/></svg>
            <input
              type="text"
              placeholder="All Locations"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="hm-search-divider" />
          <select
            className="hm-search-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <div className="hm-search-divider" />
          <select
            className="hm-search-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Concerts">Concerts</option>
            <option value="Parties">Parties</option>
            <option value="Sports">Sports</option>
            <option value="Festivals">Festivals</option>
            <option value="Campus">Campus</option>
            <option value="Business">Business</option>
          </select>
          <Link to={buildSearchUrl()} className="hm-search-btn">
            Search Events
          </Link>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="hm-stats-bar">
        <div className="hm-stats-inner">
          <div className="hm-stat-item">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="#16a34a" strokeWidth="1.5"/><path d="M3 10h18M8 2v4M16 2v4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <div><strong>10K+</strong><span>Events Hosted</span></div>
          </div>
          <div className="hm-stat-divider" />
          <div className="hm-stat-item">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <div><strong>250K+</strong><span>Tickets Sold</span></div>
          </div>
          <div className="hm-stat-divider" />
          <div className="hm-stat-item">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#16a34a" strokeWidth="1.5"/><path d="M8 13s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <div><strong>15K+</strong><span>Happy Hosts</span></div>
          </div>
          <div className="hm-stat-divider" />
          <div className="hm-stat-item">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#16a34a" strokeWidth="1.5" strokeLinejoin="round"/></svg>
            <div><strong>100%</strong><span>Secure & Reliable</span></div>
          </div>
        </div>
      </div>

      {/* ── Popular Events ── */}
      <section className="hm-section">
        <div className="hm-section-inner">
          <div className="hm-section-header">
            <h2 className="hm-section-title">Popular Events</h2>
            <Link to="/eventlist" className="hm-view-all">View All Events →</Link>
          </div>

          <div className="hm-popular-grid">
            {/* Event cards */}
            <div className="hm-events-col">
              {loading ? (
                <div className="hm-popular-cards">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="hm-sk" />)}
                </div>
              ) : popularEvents.length === 0 ? (
                <div className="hm-empty">
                  <p>No upcoming events yet. Check back soon!</p>
                </div>
              ) : (
                <div className="hm-popular-cards">
                  {popularEvents.map((event) => (
                    <Link to={getEventLink(event)} className="hm-event-card" key={event.id}>
                      <div className="hm-card-img-wrap">
                        <img src={event.image || "/images/nova1.jpg"} alt={event.title} className="hm-card-img" loading="lazy" />
                        <div className="hm-card-price-tag">{getMinPrice(event.tickets)}</div>
                      </div>
                      <div className="hm-card-body">
                        <p className="hm-card-cat-text">{event.category || "Event"}</p>
                        <h3 className="hm-card-title">{event.title}</h3>
                        <div className="hm-card-meta">
                          <span>📅 {formatDate(event.date)}{event.startTime ? ` • ${event.startTime}` : ""}</span>
                          <span>📍 {event.location}</span>
                        </div>
                        <div className="hm-card-footer">
                          <span className="hm-card-price">{getMinPrice(event.tickets)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Merch promo panel */}
            <div className="hm-merch-panel">
              <span className="hm-merch-kicker">Official Merch</span>
              <h3>Rep The Culture.<br />Wear NOVAEKO.</h3>
              <p>Premium quality. Timeless style.</p>
              <Link to="/eventlist" className="hm-merch-btn">Shop Merch →</Link>
              <img src="/images/ekotix7.jpeg" alt="NOVAEKO merch" className="hm-merch-img" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features bar ── */}
      <section className="hm-features">
        <div className="hm-features-inner">
          <div className="hm-feature">
            <div className="hm-feature-icon">✅</div>
            <div>
              <h4>100% Legal &amp; Compliant</h4>
              <p>We operate with full legality and protection.</p>
            </div>
          </div>
          <div className="hm-feature">
            <div className="hm-feature-icon">🎧</div>
            <div>
              <h4>24/7 Support</h4>
              <p>Our support team is always ready to help.</p>
            </div>
          </div>
          <div className="hm-feature">
            <div className="hm-feature-icon">🎫</div>
            <div>
              <h4>Easy Ticketing</h4>
              <p>Simple, fast and seamless ticket booking.</p>
            </div>
          </div>
          <div className="hm-feature">
            <div className="hm-feature-icon">📱</div>
            <div>
              <h4>Mobile Friendly</h4>
              <p>Seamless experience on any device.</p>
            </div>
          </div>
          <div className="hm-feature">
            <div className="hm-feature-icon">🏙️</div>
            <div>
              <h4>Built in EKO</h4>
              <p>Proudly made for creators and communities.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Home;