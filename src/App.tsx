/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import React, { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Hero from './components/Hero';
import ServicesGrid from './components/ServicesGrid';
import Portfolio from './components/Portfolio';
import ServiceDetail from './components/ServiceDetail';
import AppointmentForm from './components/AppointmentForm';
import QuoteForm from './components/QuoteForm';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import BookingCTA from './components/BookingCTA';
import { motion, AnimatePresence } from 'motion/react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

import MapSection from './components/MapSection';
import BlogSection from './components/BlogSection';

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-600">
        <Navbar />
        <main>
          <AnimatePresence mode="wait">
            <Routes>
              <Route
                path="/"
                element={
                  <PageWrapper>
                    <Hero />
                    <ServicesGrid />
                    <BookingCTA />
                    <Portfolio />
                    <BlogSection />
                    <MapSection />
                  </PageWrapper>
                }
              />
              <Route
                path="/services"
                element={
                  <PageWrapper>
                    <div className="pt-20">
                      <ServicesGrid />
                    </div>
                  </PageWrapper>
                }
              />
              <Route
                path="/services/:slug"
                element={
                  <PageWrapper>
                    <ServiceDetail />
                  </PageWrapper>
                }
              />
              <Route
                path="/portfolio"
                element={
                  <PageWrapper>
                    <div className="pt-20">
                      <Portfolio />
                    </div>
                  </PageWrapper>
                }
              />
              <Route
                path="/rendez-vous"
                element={
                  <PageWrapper>
                    <div className="pt-20">
                      <AppointmentForm />
                    </div>
                  </PageWrapper>
                }
              />
              <Route
                path="/devis"
                element={
                  <PageWrapper>
                    <div className="pt-20">
                      <QuoteForm />
                    </div>
                  </PageWrapper>
                }
              />
              <Route
                path="/contact"
                element={
                  <PageWrapper>
                    <div className="pt-20">
                      <AppointmentForm />
                    </div>
                  </PageWrapper>
                }
              />
              <Route
                path="/admin/login"
                element={
                  <PageWrapper>
                    <AdminLogin />
                  </PageWrapper>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <PageWrapper>
                    <AdminDashboard />
                  </PageWrapper>
                }
              />
            </Routes>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
