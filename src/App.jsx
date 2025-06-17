import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Register from './components/Auth/Register';
import Login from './components/Auth/Login';
import EventList from './components/Events/EventList';
import EventForm from './components/Events/EventForm';
import EventDetails from './components/Events/EventDetails';

function App() {
  return (
    <Routes>
      <Route path="/" element={<EventList />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/event/new" element={<EventForm />} />
      <Route path="/event/:eventId" element={<EventDetails />} />
    </Routes>
  );
}

export default App;
