import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { CONFIG, SERVICE_CATEGORIES, servicesData as staticServices, portfolioItems as staticPortfolio } from '../data';
import { SITE_NAME, SITE_TITLE, CONTACT_EMAIL, SOCIAL_LINKS } from '../constants';

export interface SiteSettings {
  siteName: string;
  siteTitle: string;
  contactEmail: string;
  socialLinks: {
    linkedin: string;
    twitter: string;
    facebook: string;
    whatsapp: string;
  };
  logoText: string;
}

export interface HeroContent {
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  profileImage: string;
  stats: {
    value: string;
    label: string;
    sublabel: string;
    color: 'blue' | 'emerald' | 'amber' | 'purple';
  }[];
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  shortDesc: string;
  thumbnail: string;
  categoryId: string;
  priority: number;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  technologies: string[];
}

export function useSiteData() {
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: SITE_NAME,
    siteTitle: SITE_TITLE,
    contactEmail: CONTACT_EMAIL,
    socialLinks: SOCIAL_LINKS,
    logoText: 'L. KABO'
  });

  const [hero, setHero] = useState<HeroContent>({
    badge: "Producteur Multimédia | Journaliste | Développeur Web | Activiste DSSR",
    title: "Eboun Léonard",
    subtitle: "KABO",
    description: "Expert en transformation numérique, je mets mes compétences au service du changement social et de la performance numérique. De la production multimédia haute définition à la conception d'outils d'automatisation intelligents.",
    ctaText: "Explorer mes Services",
    ctaLink: "/services",
    secondaryCtaText: "Me Contacter",
    secondaryCtaLink: "/contact",
    profileImage: "/profile.jpg",
    stats: [
      { value: "5+", label: "Ans d'Expertise", sublabel: "Expérience Pro", color: "blue" },
      { value: "2", label: "Livres Publiés", sublabel: "Auteur Engagé", color: "emerald" }
    ]
  });

  const [services, setServices] = useState<any[]>(staticServices);
  const [portfolio, setPortfolio] = useState<any[]>(staticPortfolio);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'site'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as SiteSettings);
      }
    });

    const unsubHero = onSnapshot(doc(db, 'sections', 'hero'), (docSnap) => {
      if (docSnap.exists()) {
        setHero(docSnap.data() as HeroContent);
      }
    });

    const qServices = query(collection(db, 'services'), orderBy('priority', 'asc'));
    const unsubServices = onSnapshot(qServices, (snapshot) => {
      if (!snapshot.empty) {
        setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    });

    const qPortfolio = query(collection(db, 'portfolio'));
    const unsubPortfolio = onSnapshot(qPortfolio, (snapshot) => {
      if (!snapshot.empty) {
        setPortfolio(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    });

    setLoading(false);

    return () => {
      unsubSettings();
      unsubHero();
      unsubServices();
      unsubPortfolio();
    };
  }, []);

  return { settings, hero, services, portfolio, loading };
}
