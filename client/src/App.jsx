import { useState } from 'react'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './App.css'
import LandingPage from './pages/landing-page'
import TravelBot from './pages/travel-bot'

const router = createBrowserRouter([
  {
    children: [
      {
        path: "/",
        element: <LandingPage/>,
      },
      {
        path: "/travelbot",
        element: <TravelBot/>,
      },
    ],
  },
]);

function App() {
  return (
    <RouterProvider router={router}/>
  );
}

export default App;
