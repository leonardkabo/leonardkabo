/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import React, { useEffect, Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AnnouncementBanner from './components/AnnouncementBanner';
import { motion, AnimatePresence } from 'motion/react';
import SEO from './components/SEO';
import LoadingScreen from './components/LoadingScreen';
import { useSiteData } from './hooks/useSiteData';

// Lazy load components
const Hero = lazy(() => import('./components/Hero'));
const ServicesGrid = lazy(() => import('./components/ServicesGrid'));
const Portfolio = lazy(() => import('./components/Portfolio'));
const ServiceDetail = lazy(() => import('./components/ServiceDetail'));
const AppointmentForm = lazy(() => import('./components/AppointmentForm'));
const QuoteForm = lazy(() => import('./components/QuoteForm'));
const AdminLogin = lazy(() => import('./components/AdminLogin'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const BookingCTA = lazy(() => import('./components/BookingCTA'));
const MapSection = lazy(() => import('./components/MapSection'));
const BlogSection = lazy(() => import('./components/BlogSection'));
const NewsList = lazy(() => import('./components/NewsList'));
const NewsDetail = lazy(() => import('./components/NewsDetail'));
const LegalPage = lazy(() => import('./components/LegalPage'));
const ContactForm = lazy(() => import('./components/ContactForm'));
const CountdownOverlay = lazy(() => import('./components/CountdownOverlay'));
const VotingPage = lazy(() => import('./components/VotingPage'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

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
  const { loading } = useSiteData();

  return (
    <Router>
      <ScrollToTop />
      <AnimatePresence>
        {loading && <LoadingScreen />}
      </AnimatePresence>
      <Suspense fallback={null}>
        <CountdownOverlay />
      </Suspense>
      <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-600">
        <Navbar />
        <main>
          <AnimatePresence mode="wait">
            <Suspense fallback={<div className="min-h-screen" />}>
              <Routes>
              <Route
                path="/"
                element={
                  <PageWrapper>
                    <div className="pt-16">
                      <AnnouncementBanner />
                    </div>
                    <SEO />
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
                    <SEO title="Mes Services" description="Découvrez mes services en transformation numérique, multimédia et innovation sociale." />
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
                    <SEO title="Mes Réalisations" description="Explorez mes projets et réalisations dans le domaine du numérique et de l'innovation." />
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
                    <SEO title="Prendre Rendez-vous" description="Réservez une consultation pour discuter de vos projets numériques." />
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
                    <SEO title="Demander un Devis" description="Obtenez un devis personnalisé pour vos besoins en transformation numérique." />
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
                    <SEO title="Contactez-moi" description="Besoin d'aide pour votre projet ? Contactez Léonard KABO dès aujourd'hui." />
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
                path="/vote"
                element={
                  <PageWrapper>
                    <SEO title="Système de Vote" description="Participez aux scrutins officiels et consultez les tendances en direct." />
                    <div className="pt-20">
                      <VotingPage />
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
                    <SEO title="Livres & Publications" description="Découvrez mes livres et publications sur le numérique et la société." />
                    <NewsList />
                  </PageWrapper>
                }
              />
              <Route
                path="/news"
                element={
                  <PageWrapper>
                    <SEO title="Actualités" description="Suivez mes dernières actualités et articles de blog." />
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
                    <SEO title="Mentions Légales" />
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
                    <SEO title="Politique de Confidentialité" />
                    <LegalPage 
                      title="Politique de Confidentialité" 
                      content={`Collecte des données : Nous collectons vos données via les formulaires de contact et de rendez-vous uniquement pour répondre à vos demandes.\n\nUtilisation des données : Vos données ne sont jamais partagées avec des tiers.\n\nVos droits : Vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles.`} 
                    />
                  </PageWrapper>
                }
              />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </main>
        <Footer />
      </div>
    </Router>
  );
}
