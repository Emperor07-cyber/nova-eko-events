import React, { useEffect, useState, Suspense } from "react";
import { Routes, Route, Link, Outlet, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Register from "./components/Auth/Register";
import Login from "./components/Auth/Login";
import HostSetup from "./components/Auth/HostSetup";
import Footer from "./components/Layout/Footer";

import EventList from "./components/Events/EventList";
import EventForm from "./components/Events/EventForm";
import EventDetails from "./components/Events/EventDetails";
import EditEvent from "./components/Events/EditEvent";

import MyTickets from "./components/Tickets/MyTickets";

import Home from "./pages/Home";
const Dashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminTransactions = React.lazy(() => import('./pages/AdminTransactions'));
const AdminWithdrawals = React.lazy(() => import('./pages/AdminWithdrawals'));
const AdminEvents = React.lazy(() => import('./pages/AdminEvents'));
const AdminReports = React.lazy(() => import('./pages/AdminReports'));
const AdminTicketsLedger = React.lazy(() => import('./pages/AdminTicketsLedger'));
const AdminUsers = React.lazy(() => import('./pages/AdminUsers'));
const AdminSettings = React.lazy(() => import('./pages/AdminSettings'));
const AdminSystemLogs = React.lazy(() => import('./pages/AdminSystemLogs'));

import HostDashboard from "./pages/HostDashboard";
import HostEvents from "./pages/HostEvents";
import HostEventDetails from "./pages/HostEventDetails";
import TicketCheckout from "./pages/TicketCheckout";
import MerchCheckout from "./pages/MerchCheckout";
import HostWallet from "./pages/HostWallet";
import HostSettings from "./pages/HostSettings";
import HostAttendees from "./pages/HostAttendees";
import HostMerch from "./pages/HostMerch";
import HostCheckIn from "./pages/HostCheckIn";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import CheckInPage from "./pages/CheckInPage";
import HostLayout from "./components/Layout/HostLayout";
import AdminLayout from "./components/Layout/AdminLayout";
import EventEditorShell from "./components/Layout/EventEditorShell";
import AdminPlaceholder from "./pages/AdminPlaceholder";

import RequireAdmin from "./components/Auth/RequireAdmin";
import RequireAuth from "./components/Auth/RequireAuth";
import RequireHost from "./components/Auth/RequireHost";
import RequireHostOrAdmin from "./components/Auth/RequireHostOrAdmin";

function SiteHeader({ links, navId }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link to="/" className="brand">
          <img src="/images/Logo1.jpg" alt="Ekotix logo" className="brand-logo" />
          <span>Ekotix</span>
        </Link>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={mobileMenuOpen}
          aria-controls={navId}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
        <nav id={navId} className={`nav ${mobileMenuOpen ? "nav-open" : ""}`}>
          {links.map((link) => (
            <Link key={link.to} to={link.to}>{link.label}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

function PublicLayout() {
  return (
    <div className="app-shell">
      <SiteHeader
        navId="public-nav"
        links={[
          { to: "/", label: "Discover" },
          { to: "/eventlist", label: "Events" },
          { to: "/my-tickets", label: "My Tickets" },
          { to: "/login", label: "Login" },
        ]}
      />

      <main className="page">
        <div className="container">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}

function AuthLayout() {
  return (
    <div className="app-shell">
      <SiteHeader
        navId="auth-nav"
        links={[
          { to: "/", label: "Discover" },
          { to: "/eventlist", label: "Events" },
          { to: "/login", label: "Login" },
          { to: "/register", label: "Register" },
        ]}
      />
      <main className="page">
        <div className="container" style={{ maxWidth: 540 }}>
          <div className="card card-body auth-panel">
            <Outlet />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function AdminShellLayout() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

function App() {
  return (
    <>
      <Routes>
        {/* Public shell */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/eventlist" element={<EventList />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/checkin" element={<CheckInPage />} />

          {/* Event routes */}
          <Route path="/event/:eventId" element={<EventDetails />} />
          <Route path="/:slug" element={<EventDetails />} />
          <Route path="/checkout/tickets/:eventId" element={<TicketCheckout />} />
          <Route path="/checkout/merch/:eventId" element={<MerchCheckout />} />

          {/* Protected */}
          <Route
            path="/my-tickets"
            element={
              <RequireAuth>
                <MyTickets />
              </RequireAuth>
            }
          />

        </Route>

        {/* Auth shell */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/host-setup" element={<HostSetup />} />
        </Route>

        <Route
          path="/host/dashboard"
          element={
            <RequireHost>
              <HostDashboard />
            </RequireHost>
          }
        />
        <Route
          path="/host/events"
          element={
            <RequireHost>
              <HostEvents />
            </RequireHost>
          }
        />
        <Route
          path="/host/events/:eventId"
          element={
            <RequireHost>
              <HostEventDetails />
            </RequireHost>
          }
        />
        <Route
          path="/host/checkin"
          element={
            <RequireHost>
              <HostCheckIn />
            </RequireHost>
          }
        />
        <Route
          path="/host/attendees"
          element={
            <RequireHost>
              <HostAttendees />
            </RequireHost>
          }
        />
        <Route
          path="/host/merch"
          element={
            <RequireHost>
              <HostMerch />
            </RequireHost>
          }
        />
        <Route
          path="/host/wallet"
          element={
            <RequireHost>
              <HostWallet />
            </RequireHost>
          }
        />
        <Route
          path="/host/settings"
          element={
            <RequireHost>
              <HostSettings />
            </RequireHost>
          }
        />

        <Route
          element={
            <RequireAdmin>
              <Suspense fallback={<div className="admin-loading">Loading admin...</div>}>
                <AdminShellLayout />
              </Suspense>
            </RequireAdmin>
          }
        >
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/transactions" element={<AdminTransactions />} />
          <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
          <Route path="/admin/events" element={<AdminEvents />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/tickets-ledger" element={<AdminTicketsLedger />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/system-logs" element={<AdminSystemLogs />} />
          <Route path="/admin/:section" element={<AdminPlaceholder />} />
        </Route>

        <Route
          element={
            <RequireHostOrAdmin>
              <EventEditorShell />
            </RequireHostOrAdmin>
          }
        >
          <Route path="/event/new" element={<EventForm />} />
          <Route path="/event/edit/:eventId" element={<EditEvent />} />
        </Route>
      </Routes>

      <ToastContainer position="top-center" autoClose={3000} theme="light" />
    </>
  );
}

export default App;