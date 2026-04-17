import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { CONFIG, SERVICE_CATEGORIES, servicesData as staticServices, portfolioItems as staticPortfolio } from '../data';
import { SITE_NAME, SITE_TITLE, CONTACT_EMAIL, SOCIAL_LINKS } from '../constants';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

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
  logoImage?: string;
  successMessages?: {
    contact?: string;
    appointment?: string;
    quote?: string;
  };
  countdown?: {
    active: boolean;
    targetDate: string;
    message: string;
    title: string;
  };
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
  promoPrice?: number;
  isPromoActive?: boolean;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  technologies: string[];
}

export interface NewsItem {
  id: string;
  title: string;
  body: string;
  author: string;
  readTime: string;
  createdAt: number;
  image: string;
}

export interface Candidate {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  voteCount: number;
}

export interface VotingSession {
  id: string;
  title: string;
  description: string;
  rules: string;
  active: boolean;
  maxVotes: number;
  endDate: string;
  candidates: Candidate[];
  voterCount: number;
  createdAt: number;
}

export interface VotingBallot {
  id: string;
  sessionId: string;
  voterName: string;
  candidateIds: string[];
  timestamp: number;
}

export function useSiteData() {
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: SITE_NAME,
    siteTitle: SITE_TITLE,
    contactEmail: CONTACT_EMAIL,
    socialLinks: SOCIAL_LINKS,
    logoText: 'L. KABO',
    countdown: {
      active: false,
      targetDate: '2026-04-15T14:00:00+01:00',
      message: 'Nous préparons quelque chose d\'exceptionnel pour vous. Restez à l\'écoute !',
      title: 'Lancement Officiel'
    }
  });

  const [hero, setHero] = useState<HeroContent>({
    badge: "Expert en Transformation Numérique | Multimédia | IA",
    title: "Eboun Léonard KABO",
    subtitle: "Expert en Transformation Numérique",
    description: "Expert en transformation numérique, je mets mes compétences au service du changement social et de la performance numérique. De la production multimédia haute définition à la conception d'outils d'automatisation intelligents.",
    ctaText: "Explorer mes Services",
    ctaLink: "/services",
    secondaryCtaText: "Me Contacter",
    secondaryCtaLink: "/contact",
    profileImage: "https://picsum.photos/seed/profile/800/800",
    stats: [
      { value: "2", label: "Livres Publiés", sublabel: "Auteur Engagé", color: "emerald" },
      { value: "+5", label: "Ans d'Expérience", sublabel: "Expertise Pro", color: "blue" }
    ]
  });

  const [services, setServices] = useState<any[]>(staticServices);
  const [portfolio, setPortfolio] = useState<any[]>(staticPortfolio);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [votingSessions, setVotingSessions] = useState<VotingSession[]>([]);
  const [loaded, setLoaded] = useState({
    settings: false,
    hero: false,
    services: false,
    portfolio: false,
    news: false,
    voting: false
  });

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'site'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SiteSettings;
        setSettings({
          ...data,
          socialLinks: {
            ...SOCIAL_LINKS,
            ...(data.socialLinks || {})
          }
        });
      }
      setLoaded(prev => ({ ...prev, settings: true }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/site');
      setLoaded(prev => ({ ...prev, settings: true }));
    });

    const unsubHero = onSnapshot(doc(db, 'sections', 'hero'), (docSnap) => {
      if (docSnap.exists()) {
        setHero(docSnap.data() as HeroContent);
      }
      setLoaded(prev => ({ ...prev, hero: true }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'sections/hero');
      setLoaded(prev => ({ ...prev, hero: true }));
    });

    const qServices = query(collection(db, 'services'), orderBy('priority', 'asc'));
    const unsubServices = onSnapshot(qServices, (snapshot) => {
      if (!snapshot.empty) {
        const remoteData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        // Merge with static data to ensure all fields (pricing, description, etc.) are present
        // even if they weren't fully initialized in Firestore yet
        const merged = remoteData.map(rs => {
          const local = staticServices.find(ls => ls.id === rs.id || ls.slug === rs.slug);
          return local ? { ...local, ...rs } : rs;
        });
        setServices(merged);
      }
      setLoaded(prev => ({ ...prev, services: true }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'services');
      setLoaded(prev => ({ ...prev, services: true }));
    });

    const qPortfolio = query(collection(db, 'portfolio'));
    const unsubPortfolio = onSnapshot(qPortfolio, (snapshot) => {
      if (!snapshot.empty) {
        const remoteData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        const merged = remoteData.map(rp => {
          const local = staticPortfolio.find(lp => String(lp.id) === String(rp.id) || lp.title === rp.title);
          return local ? { ...local, ...rp } : rp;
        });
        setPortfolio(merged);
      }
      setLoaded(prev => ({ ...prev, portfolio: true }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'portfolio');
      setLoaded(prev => ({ ...prev, portfolio: true }));
    });

    const qNews = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
    const unsubNews = onSnapshot(qNews, (snapshot) => {
      if (!snapshot.empty) {
        setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsItem)));
      }
      setLoaded(prev => ({ ...prev, news: true }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'news');
      setLoaded(prev => ({ ...prev, news: true }));
    });

    const qVoting = query(collection(db, 'voting'), orderBy('createdAt', 'desc'));
    const unsubVoting = onSnapshot(qVoting, (snapshot) => {
      setVotingSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VotingSession)));
      setLoaded(prev => ({ ...prev, voting: true }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'voting');
      setLoaded(prev => ({ ...prev, voting: true }));
    });

    return () => {
      unsubSettings();
      unsubHero();
      unsubServices();
      unsubPortfolio();
      unsubNews();
      unsubVoting();
    };
  }, []);

  const loading = !loaded.settings || !loaded.hero || !loaded.services || !loaded.portfolio || !loaded.news || !loaded.voting;

  return { settings, hero, services, portfolio, news, votingSessions, loading };
}
