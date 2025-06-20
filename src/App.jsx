import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Register from './components/Auth/Register';
import Login from './components/Auth/Login';
import EventList from './components/Events/EventList';
import EventForm from './components/Events/EventForm';
import EventDetails from './components/Events/EventDetails';
import MyTickets from "./components/Tickets/MyTickets";
import Home from './pages/Home'; // 👈 Import your Home page
import RequireAdmin from './components/Auth/RequireAdmin'; // If you're using admin protection

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} /> {/* 👈 Set Home as the default route */}
      <Route path="/admin" element={<RequireAdmin EventList={EventList} />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/event/new" element={<EventForm />} />
      <Route path="/event/:eventId" element={<EventDetails />} />
      <Route path="/my-tickets" element={<MyTickets />} />
    </Routes>
  );
}

export default App;
