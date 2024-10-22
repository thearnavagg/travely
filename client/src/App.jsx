import { useState } from 'react'
import { Route } from 'react-router-dom'
import './App.css'
import LandingPage from './pages/landing-page'
import { Routes } from 'react-router-dom'
import { TravelBot } from './pages/travel-bot';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage/>} />
      <Route path="/travelbot" element={<TravelBot/>} />
    </Routes>
  );
}

export default App
