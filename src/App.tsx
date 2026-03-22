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

import NewsList from './components/NewsList';
import NewsDetail from './components/NewsDetail';
import LegalPage from './components/LegalPage';
import ContactForm from './components/ContactForm';

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
                    <div className="pt-20 pb-24 px-4">
                      <div className="text-center max-w-3xl mx-auto mb-16">
                        <h1 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">Contactez-moi</h1>
                        <p className="text-xl text-gray-600 leading-relaxed">
                          Vous avez un projet en tête ou une question ? Je suis à votre écoute.
                        </p>
                      </div>
                      <ContactForm />
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
              <Route
                path="/livres"
                element={
                  <PageWrapper>
                    <NewsList />
                  </PageWrapper>
                }
              />
              <Route
                path="/news"
                element={
                  <PageWrapper>
                    <NewsList />
                  </PageWrapper>
                }
              />
              <Route
                path="/blog/:id"
                element={
                  <PageWrapper>
                    <NewsDetail />
                  </PageWrapper>
                }
              />
              <Route
                path="/mentions-legales"
                element={
                  <PageWrapper>
                    <LegalPage 
                      title="Mentions Légales" 
                      content={`Éditeur du site : Eboun Léonard KABO\nContact : leonardkabo32@gmail.com\nHébergement : Google Cloud Platform\n\nPropriété intellectuelle : L'ensemble des contenus de ce site est protégé par le droit d'auteur.`} 
                    />
                  </PageWrapper>
                }
              />
              <Route
                path="/confidentialite"
                element={
                  <PageWrapper>
                    <LegalPage 
                      title="Politique de Confidentialité" 
                      content={`Collecte des données : Nous collectons vos données via les formulaires de contact et de rendez-vous uniquement pour répondre à vos demandes.\n\nUtilisation des données : Vos données ne sont jamais partagées avec des tiers.\n\nVos droits : Vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles.`} 
                    />
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
