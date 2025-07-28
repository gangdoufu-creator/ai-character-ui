// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CoverPage from "./pages/CoverPage";
import MainPage from "./pages/MainPage";
import AccountPage from "./pages/AccountPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CoverPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/account" element={<AccountPage />} /> {/* 👈 Add this */}
      </Routes>
    </Router>
  );
}
