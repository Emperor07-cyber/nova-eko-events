import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Register from './components/Auth/Register';
import Login from './components/Auth/Login';
import EventList from './components/Events/EventList';
import EventForm from './components/Events/EventForm';
import EventDetails from './components/Events/EventDetails';
import MyTickets from "./components/Tickets/MyTickets";
import Dashboard from "./pages/AdminDashboard"; // 👈 Import it
import Home from './pages/Home'; // 👈 Import your Home page
import RequireAdmin from './components/Auth/RequireAdmin'; // If you're using admin protection
import RequireAuth from './components/Auth/RequireAuth'; // ✅ Add this
import RequireHost from "./components/Auth/RequireHost";
import RequireHostOrAdmin from "./components/Auth/RequireHostOrAdmin";
import HostDashboard from "./pages/HostDashboard";
import EditEvent from "./components/Events/EditEvent"; // or wherever you keep it

function App() {
  return (
    <Routes>
  <Route path="/" element={<Home />} />
  <Route path="/eventlist" element={<EventList />} />
  <Route
  path="/admin/dashboard"
  element={<RequireAdmin Component={Dashboard} />}
/>
  <Route path="/edit-event/:eventId" element={<EditEvent />} />
  <Route path="/register" element={<Register />} />
  <Route path="/login" element={<Login />} />
  <Route
  path="/event/new"
  element={
    <RequireHostOrAdmin>
      <EventForm />
    </RequireHostOrAdmin>
  }
/>
  <Route path="/event/:eventId" element={<EventDetails />} />
  <Route
  path="/my-tickets"
  element={
    <RequireAuth>
      <MyTickets />
    </RequireAuth>
  }
/>
  <Route
  path="/host/dashboard"
  element={
    <RequireHost>
      <HostDashboard />
    </RequireHost>
  }
/>
</Routes>
  );
}

export default App;
