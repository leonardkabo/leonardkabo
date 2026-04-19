/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Calendar, FileText, LogOut, Trash2, Check, X, Clock, User, Mail, Phone, MessageSquare, Settings, MapPin, Save, ChevronLeft, ChevronRight, Layout, Briefcase, Image as ImageIcon, Plus, Edit2, Globe, Search, TrendingUp, Users, DollarSign, CreditCard, Eye, Upload, Loader2, Vote, Info, Activity, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, setDoc, getDoc, addDoc } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, Cell, PieChart, Pie } from 'recharts';
import Button from './ui/Button';
import { servicesData as staticServices, portfolioItems as staticPortfolio } from '../data';
import { SITE_NAME, SITE_TITLE, CONTACT_EMAIL, SOCIAL_LINKS } from '../constants';
import { formatPrice, convertToEur, getDirectImageUrl, cn } from '../lib/utils';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

const ITEMS_PER_PAGE = 5;

const PERMISSIONS_LIST = [
  { id: 'appointments', label: 'Rendez-vous', icon: Calendar },
  { id: 'quotes', label: 'Devis', icon: FileText },
  { id: 'contacts', label: 'Messages', icon: MessageSquare },
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'portfolio', label: 'Portfolio', icon: Layout },
  { id: 'news', label: 'Actualités', icon: Globe },
  { id: 'voting', label: 'Votes', icon: Vote },
  { id: 'audience', label: 'Audience', icon: TrendingUp },
  { id: 'settings', label: 'Paramètres', icon: Settings },
];

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [adminData, setAdminData] = useState<any>(null);
  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState<any>({ email: '', displayName: '', role: 'moderator', permissions: [] });
  const [editingUserEmail, setEditingUserEmail] = useState<string | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [votingSessions, setVotingSessions] = useState<any[]>([]);
  const [ballots, setBallots] = useState<any[]>([]);
  const [realtimeSessions, setRealtimeSessions] = useState<any[]>([]);
  const [visitHistory, setVisitHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'appointments' | 'quotes' | 'contacts' | 'content' | 'services' | 'portfolio' | 'news' | 'settings' | 'promos' | 'voting' | 'audience' | 'team'>('appointments');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const isNew = (timestamp: any) => {
    if (!timestamp) return false;
    const now = Date.now();
    const itemDate = typeof timestamp === 'number' ? timestamp : (timestamp.seconds ? timestamp.seconds * 1000 : now);
    const diff = now - itemDate;
    return diff < 24 * 60 * 60 * 1000; // 24 hours
  };
  
  // Edit States
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editType, setEditType] = useState<'service' | 'portfolio' | 'news' | null>(null);
  const [siteSettings, setSiteSettings] = useState<any>({
    siteName: SITE_NAME,
    siteTitle: SITE_TITLE,
    contactEmail: CONTACT_EMAIL,
    socialLinks: SOCIAL_LINKS,
    logoText: 'L. KABO',
    logoImage: '/favicon.svg',
    countdown: {
      active: false,
      targetDate: '2026-04-15T14:00:00+01:00',
      message: 'Nous préparons quelque chose d\'exceptionnel pour vous. Restez à l\'écoute !',
      title: 'Lancement Officiel'
    }
  });

  const [votingContent, setVotingContent] = useState<any>({
    title: "",
    description: "",
    rules: "",
    active: false,
    maxVotes: 1,
    candidates: []
  });
  
  const [heroContent, setHeroContent] = useState<any>({
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

  const [mapConfig, setMapConfig] = useState({ lat: 9.3372, lng: 2.6288 });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null); // Track which field is uploading
  const [savingSettings, setSavingSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfirm, setShowConfirm] = useState<{ collection: string, id: string } | null>(null);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  };

  const hasPermission = (tab: string) => {
    if (!adminData) return false;
    if (adminData.isAdmin || adminData.role === 'superadmin' || adminData.permissions?.includes('all')) return true;
    
    // Content is a meta-tab for hero, etc.
    if (tab === 'content') return adminData.permissions?.includes('settings') || adminData.permissions?.includes('all');
    
    return adminData.permissions?.includes(tab);
  };

  const handleFileUpload = async (file: File, path: string, fieldId: string, callback: (url: string) => void) => {
    if (!file) return;
    setUploading(fieldId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', path);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        callback(result.url);
        setShowSuccess('Fichier téléchargé sur le serveur avec succès !');
      } else {
        throw new Error(result.message || 'Erreur lors du téléchargement');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      alert('Erreur lors du téléchargement du fichier sur le serveur. Vérifiez la connexion.');
    } finally {
      setUploading(null);
    }
  };

  const handleDeleteFile = async (url: string) => {
    if (!url.startsWith('/uploads/')) {
       // Only delete local files
       return;
    }
    try {
      const response = await fetch('/api/delete-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const result = await response.json();
      if (result.success) {
        setShowSuccess('Ancien fichier supprimé du serveur.');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/admin/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.email!));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser(user);
          setAdminData(userData);
          console.log('User logged in with profile:', userData);
        } else if (user.email === 'leonardkabo32@gmail.com') {
          // Auto-promote owner if record missing
          const superAdminData = {
            email: user.email,
            displayName: user.displayName || 'Léonard KABO',
            role: 'superadmin',
            isAdmin: true,
            permissions: ['all'],
            createdAt: Date.now()
          };
          await setDoc(doc(db, 'users', user.email!), superAdminData);
          setUser(user);
          setAdminData(superAdminData);
          console.log('Owner auto-promoted to superadmin');
        } else {
          console.warn('Access denied: User not in the team list');
          await signOut(auth);
          navigate('/admin/login');
        }
      } catch (e) {
        console.error('Error fetching user data:', e);
        navigate('/admin/login');
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  useEffect(() => {
    if (!user || !adminData) return;

    setLoading(false);

    // Real-time listeners
    const unsubAppointments = hasPermission('appointments') ? onSnapshot(query(collection(db, 'appointments'), orderBy('createdAt', 'desc')), (snapshot) => {
      setAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'appointments')) : () => {};

    const unsubQuotes = hasPermission('quotes') ? onSnapshot(query(collection(db, 'quotes'), orderBy('createdAt', 'desc')), (snapshot) => {
      setQuotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'quotes')) : () => {};

    const unsubContacts = hasPermission('contacts') ? onSnapshot(query(collection(db, 'contacts'), orderBy('createdAt', 'desc')), (snapshot) => {
      setContacts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'contacts')) : () => {};

    const unsubServices = hasPermission('services') || hasPermission('settings') ? onSnapshot(query(collection(db, 'services'), orderBy('priority', 'asc')), (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'services')) : () => {};

    const unsubPortfolio = hasPermission('portfolio') || hasPermission('settings') ? onSnapshot(collection(db, 'portfolio'), (snapshot) => {
      setPortfolio(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'portfolio')) : () => {};

    const unsubNews = hasPermission('news') || hasPermission('settings') ? onSnapshot(query(collection(db, 'news'), orderBy('createdAt', 'desc')), (snapshot) => {
      setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'news')) : () => {};

    const unsubUsers = hasPermission('settings') ? onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'desc')), (snapshot) => {
      setTeamUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users')) : () => {};

    // Fetch single docs
    const unsubSettings = hasPermission('settings') ? onSnapshot(doc(db, 'settings', 'site'), (docSnap) => {
      if (docSnap.exists()) setSiteSettings(docSnap.data());
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/site')) : () => {};

    const unsubHero = hasPermission('settings') ? onSnapshot(doc(db, 'sections', 'hero'), (docSnap) => {
      if (docSnap.exists()) setHeroContent(docSnap.data());
    }, (error) => handleFirestoreError(error, OperationType.GET, 'sections/hero')) : () => {};

    const unsubVoting = hasPermission('voting') || hasPermission('settings') ? onSnapshot(query(collection(db, 'voting'), orderBy('createdAt', 'desc')), (snapshot) => {
      setVotingSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'voting')) : () => {};

    const unsubRealtime = hasPermission('audience') ? onSnapshot(collection(db, 'analytics', 'realtime', 'sessions'), (snapshot) => {
      setRealtimeSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'analytics/realtime/sessions')) : () => {};

    const unsubHistory = hasPermission('audience') ? onSnapshot(query(collection(db, 'analytics', 'history', 'days'), orderBy('date', 'desc')), (snapshot) => {
      setVisitHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'analytics/history/days')) : () => {};

    if (hasPermission('settings')) {
      getDoc(doc(db, 'settings', 'mapConfig')).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMapConfig({ lat: data.mapLat, lng: data.mapLng });
        }
      });
    }

    return () => {
      unsubAppointments();
      unsubQuotes();
      unsubContacts();
      unsubServices();
      unsubPortfolio();
      unsubNews();
      unsubUsers();
      unsubVoting();
      unsubRealtime();
      unsubHistory();
      unsubSettings();
      unsubHero();
    };
  }, [user, adminData]);

  const handleSaveSiteSettings = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'site'), siteSettings);
      setShowSuccess('Paramètres du site enregistrés !');
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'settings/site'); }
    setSaving(false);
  };

  const handleAddTeamUser = async () => {
    if (!newUser.email || !newUser.displayName) {
      alert("Veuillez remplir le nom et l'email.");
      return;
    }
    const email = newUser.email.toLowerCase().trim();
    setSaving(true);
    try {
      if (editingUserEmail) {
        // Update
        await updateDoc(doc(db, 'users', editingUserEmail.toLowerCase()), {
          displayName: newUser.displayName,
          permissions: newUser.permissions,
          role: newUser.role
        });
        setShowSuccess('Utilisateur mis à jour !');
      } else {
        // Add
        await setDoc(doc(db, 'users', email), {
          ...newUser,
          email: email,
          createdAt: Date.now()
        });
        setShowSuccess('Utilisateur ajouté à l\'équipe !');
      }
      setNewUser({ email: '', displayName: '', role: 'moderator', permissions: [] });
      setEditingUserEmail(null);
      setIsAddingUser(false);
    } catch (e) { handleFirestoreError(e, editingUserEmail ? OperationType.UPDATE : OperationType.WRITE, 'users'); }
    setSaving(false);
  };

  const handleUpdateTeamUser = async (email: string, data: any) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', email), data);
      setShowSuccess('Permissions mises à jour !');
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'users'); }
    setSaving(false);
  };

  const handleDeleteTeamUser = async (email: string) => {
    if (email === 'leonardkabo32@gmail.com') {
      alert("Impossible de supprimer le propriétaire.");
      return;
    }
    if (!confirm("Supprimer cet utilisateur ?")) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'users', email));
      setShowSuccess('Utilisateur supprimé.');
    } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'users'); }
    setSaving(false);
  };

  const handleSaveHero = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'sections', 'hero'), heroContent);
      setShowSuccess('Contenu Hero enregistré !');
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'sections/hero'); }
    setSaving(false);
  };

  const handleSaveVoting = async (session: any) => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'voting', session.id), session);
      setShowSuccess('Scrutin enregistré !');
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, `voting/${session.id}`); }
    setSaving(false);
  };

  const handleAddVotingSession = async () => {
    try {
      const newSession = {
        title: "Nouveau Scrutin",
        description: "Description du vote...",
        rules: "1. Une voix par personne.\n2. Sélection libre.",
        active: false,
        maxVotes: 1,
        isPaid: false,
        pricePerVote: 100,
        endDate: new Date(Date.now() + 7 * 864 * 1000 * 100).toISOString(),
        candidates: [],
        voterCount: 0,
        createdAt: Date.now()
      };
      await addDoc(collection(db, 'voting'), newSession);
      setShowSuccess('Nouveau scrutin ajouté !');
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, 'voting'); }
  };

  const handleAddService = async () => {
    try {
      const title = `Nouveau Service ${services.length + 1}`;
      await addDoc(collection(db, 'services'), {
        title,
        slug: title.toLowerCase().replace(/ /g, '-'),
        categoryId: 'multimedia',
        priority: services.length + 1,
        shortDesc: 'Description courte...',
        tagline: 'Slogan...',
        thumbnail: 'https://picsum.photos/seed/service/800/600',
        createdAt: Date.now()
      });
      setShowSuccess('Service ajouté ! Vous pouvez maintenant le modifier.');
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, 'services'); }
  };

  const handleAddPortfolio = async () => {
    try {
      const title = `Nouveau Projet ${portfolio.length + 1}`;
      await addDoc(collection(db, 'portfolio'), {
        title,
        category: 'web',
        image: 'https://picsum.photos/seed/portfolio/800/600',
        description: 'Description du projet...',
        technologies: ['React', 'Firebase'],
        createdAt: Date.now()
      });
      setShowSuccess('Projet ajouté ! Vous pouvez maintenant le modifier.');
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, 'portfolio'); }
  };

  const handleAddNews = async () => {
    try {
      const title = `Nouvel Article ${news.length + 1}`;
      await addDoc(collection(db, 'news'), {
        title,
        body: 'Contenu de l\'article...',
        author: 'L. KABO',
        readTime: '5 min',
        createdAt: Date.now(),
        image: 'https://picsum.photos/seed/news/800/600'
      });
      setShowSuccess('Article ajouté ! Vous pouvez maintenant le modifier.');
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, 'news'); }
  };

  const handleEdit = (item: any, type: 'service' | 'portfolio' | 'news') => {
    setEditingItem({ ...item });
    setEditType(type);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editType) return;
    setSaving(true);
    try {
      const collectionName = editType === 'service' ? 'services' : editType === 'portfolio' ? 'portfolio' : 'news';
      const { id, ...data } = editingItem;
      await updateDoc(doc(db, collectionName, id), data);
      setEditingItem(null);
      setEditType(null);
      setShowSuccess('Élément mis à jour !');
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, `${editType}/${editingItem.id}`); }
    setSaving(false);
  };

  const initializeData = async () => {
    setSaving(true);
    try {
      // Initialize Hero
      await setDoc(doc(db, 'sections', 'hero'), {
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
      // Initialize Services
      for (const s of staticServices) {
        await setDoc(doc(db, 'services', s.id), {
          title: s.title,
          slug: s.slug,
          tagline: s.tagline || '',
          shortDesc: s.shortDesc || '',
          thumbnail: s.thumbnail || '',
          categoryId: s.category?.id || 'multimedia',
          priority: staticServices.indexOf(s) + 1,
          promoPrice: (s as any).promoPrice || 0,
          isPromoActive: (s as any).isPromoActive || false,
          pricing: s.pricing || null,
          description: s.description || null,
          metrics: s.metrics || null,
          gallery: s.gallery || [],
          createdAt: Date.now()
        });
      }
      // Initialize Portfolio
      for (const p of staticPortfolio) {
        await addDoc(collection(db, 'portfolio'), {
          title: p.title,
          category: p.category,
          image: p.image,
          description: p.description,
          technologies: p.technologies,
          createdAt: Date.now()
        });
      }
      // Initialize News
      const defaultNews = [
        {
          title: "Lancement de mon nouveau site portfolio",
          body: "Je suis ravi de vous présenter mon nouveau site web dynamique, conçu pour mieux vous servir.",
          author: "L. KABO",
          readTime: "3 min",
          createdAt: Date.now(),
          image: "https://picsum.photos/seed/news1/800/600"
        },
        {
          title: "L'importance de la transformation numérique",
          body: "Dans un monde en constante évolution, la transformation numérique est devenue une nécessité pour toutes les organisations.",
          author: "L. KABO",
          readTime: "5 min",
          createdAt: Date.now() - 86400000,
          image: "https://picsum.photos/seed/news2/800/600"
        }
      ];
      for (const n of defaultNews) {
        await addDoc(collection(db, 'news'), n);
      }
      // Initialize Settings
      await setDoc(doc(db, 'settings', 'site'), {
        siteName: "Eboun Léonard KABO",
        siteTitle: "Expert en Transformation Numérique",
        contactEmail: "leonardkabo32@gmail.com",
        logoText: "L. KABO",
        logoImage: "/favicon.svg",
        socialLinks: {
          linkedin: "https://linkedin.com/in/leonardkabo",
          twitter: "https://x.com/leonardkabo1",
          facebook: "https://facebook.com/leonardkabo1",
          whatsapp: "https://wa.me/22965458778"
        },
        countdown: {
          active: false,
          targetDate: "2026-04-15T14:00:00+01:00",
          message: "Nous préparons quelque chose d'exceptionnel pour vous. Restez à l'écoute !",
          title: "Lancement Officiel"
        }
      });
      // Initialize Voting
      await setDoc(doc(db, 'voting', 'active'), {
        title: "Élection du Meilleur Projet de l'Année",
        description: "Votez pour le projet qui a eu le plus d'impact numérique et social cette année.",
        rules: "1. Le vote est ouvert à tous les visiteurs.\n2. Vous pouvez voter pour un maximum de 2 candidats.\n3. Chaque utilisateur ne peut voter qu'une seule fois.\n4. Les résultats sont affichés en temps réel après votre vote.",
        active: false,
        maxVotes: 2,
        candidates: [
          { id: "c1", name: "Projet Alpha", description: "Plateforme d'e-santé pour les zones rurales.", imageUrl: "https://picsum.photos/seed/alpha/800/1000", voteCount: 15 },
          { id: "c2", name: "Système Beta", description: "Solution de domotique intelligente à bas coût.", imageUrl: "https://picsum.photos/seed/beta/800/1000", voteCount: 22 },
          { id: "c3", name: "Initiative Gamma", description: "Programme de formation IA pour les jeunes.", imageUrl: "https://picsum.photos/seed/gamma/800/1000", voteCount: 18 }
        ]
      });
      setShowSuccess('Données initialisées avec succès !');
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'initialization'); }
    setSaving(false);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/admin/login');
  };

  const updateStatus = async (collectionName: string, id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, collectionName, id), { status: newStatus });
      setShowSuccess('Statut mis à jour !');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${id}`);
    }
  };

  const deleteItem = async (collectionName: string, id: string) => {
    setShowConfirm({ collection: collectionName, id });
  };

  const confirmDelete = async () => {
    if (!showConfirm) return;
    try {
      await deleteDoc(doc(db, showConfirm.collection, showConfirm.id));
      setShowConfirm(null);
      setShowSuccess('Élément supprimé avec succès.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${showConfirm.collection}/${showConfirm.id}`);
    }
  };

  const saveMapSettings = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'mapConfig'), {
        mapLat: Number(mapConfig.lat),
        mapLng: Number(mapConfig.lng),
        updatedAt: Date.now()
      });
      setShowSuccess('Paramètres de la carte mis à jour !');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/mapConfig');
    } finally {
      setSavingSettings(false);
    }
  };

  // Stats Calculation
  const stats = {
    totalAppointments: appointments.length,
    pendingQuotes: quotes.filter(q => q.status === 'pending').length,
    newClients: new Set([...appointments.map(a => a.email), ...quotes.map(q => q.email)]).size,
    estimatedRevenue: quotes
      .filter(q => q.status === 'responded')
      .reduce((acc, q) => {
        if (q.budget === '< 100k') return acc + 50000;
        if (q.budget === '100k-500k') return acc + 300000;
        if (q.budget === '500k-1M') return acc + 750000;
        if (q.budget === '> 1M') return acc + 1000000;
        return acc;
      }, 0)
  };

  // Real-time data aggregation for charts
  const getVisitorData = () => {
    // Use last 7 days from actual history if available
    const last7DaysData = visitHistory.slice(0, 7).reverse();
    
    if (last7DaysData.length > 0) {
      return last7DaysData.map(d => ({
        name: new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
        visitors: d.visits || 0
      }));
    }

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('fr-FR', { weekday: 'short' });
    });

    const counts = last7Days.map(day => {
      const appts = appointments.filter(a => {
        const d = new Date(a.createdAt);
        return d.toLocaleDateString('fr-FR', { weekday: 'short' }) === day;
      }).length;
      const qts = quotes.filter(q => {
        const d = new Date(q.createdAt);
        return d.toLocaleDateString('fr-FR', { weekday: 'short' }) === day;
      }).length;
      return { name: day, visitors: (appts + qts) * 5 + 10, activity: appts + qts }; // Fallback mock
    });

    return counts;
  };

  const getRevenueData = () => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    const currentMonth = new Date().getMonth();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const m = (currentMonth - (5 - i) + 12) % 12;
      return months[m];
    });

    return last6Months.map(monthName => {
      const monthIndex = months.indexOf(monthName);
      const revenue = quotes
        .filter(q => {
          const d = new Date(q.createdAt);
          return d.getMonth() === monthIndex && q.status === 'responded';
        })
        .reduce((acc, q) => {
          if (q.budget === '< 100k') return acc + 50000;
          if (q.budget === '100k-500k') return acc + 300000;
          if (q.budget === '500k-1M') return acc + 750000;
          if (q.budget === '> 1M') return acc + 1000000;
          return acc;
        }, 0);
      return { month: monthName, revenue };
    });
  };

  const visitorData = getVisitorData();
  const revenueData = getRevenueData();

  const filteredAppointments = appointments.filter(item => 
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.service?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredQuotes = quotes.filter(item => 
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.service?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = contacts.filter(item => 
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.message?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentItems = activeTab === 'appointments' 
    ? filteredAppointments 
    : activeTab === 'quotes' 
      ? filteredQuotes 
      : activeTab === 'contacts'
        ? filteredContacts
        : [];

  const totalPages = Math.ceil(currentItems.length / ITEMS_PER_PAGE);
  const paginatedItems = currentItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = typeof timestamp === 'number' ? new Date(timestamp) : (timestamp.toDate ? timestamp.toDate() : new Date(timestamp));
      return date.toLocaleDateString('fr-FR');
    } catch (e) {
      return 'Date invalide';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const onlineCount = realtimeSessions.filter(s => {
    if (!s.lastSeen) return false;
    const lastSeen = typeof s.lastSeen === 'number' ? s.lastSeen : (s.lastSeen.toMillis ? s.lastSeen.toMillis() : Date.now());
    return Date.now() - lastSeen < 5 * 60 * 1000;
  }).length;

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Tableau de Bord</h1>
            <p className="text-gray-500 mt-2">Gérez vos demandes de rendez-vous et de devis</p>
          </div>
          <Button
            variant="danger"
            onClick={handleLogout}
            icon={LogOut}
          >
            Déconnexion
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Calendar size={24} />
              </div>
              <TrendingUp size={20} className="text-emerald-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalAppointments}</div>
            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Rendez-vous</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                <FileText size={24} />
              </div>
              <Clock size={20} className="text-amber-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.pendingQuotes}</div>
            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Devis en attente</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                <Users size={24} />
              </div>
              <Users size={20} className="text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.newClients}</div>
            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Nouveaux Clients</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <DollarSign size={24} />
              </div>
              <TrendingUp size={20} className="text-emerald-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.estimatedRevenue.toLocaleString()} FCFA
              <span className="text-sm font-normal text-gray-400 ml-2">
                (≈{convertToEur(stats.estimatedRevenue)}€)
              </span>
            </div>
            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">CA Estimé (Mois)</div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-gray-900">Visiteurs & Activité</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Eye size={16} />
                <span>Temps réel</span>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={visitorData}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Area type="monotone" dataKey="visitors" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-gray-900">Performance Financière</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <TrendingUp size={16} />
                <span>Croissance</span>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    cursor={{fill: '#f8fafc'}}
                  />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        <div className="flex flex-wrap gap-4 mb-10">
          {hasPermission('appointments') && (
            <Button
              variant={activeTab === 'appointments' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('appointments')}
              icon={Calendar}
            >
              Rendez-vous ({appointments.length})
            </Button>
          )}
          {hasPermission('quotes') && (
            <Button
              variant={activeTab === 'quotes' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('quotes')}
              icon={FileText}
            >
              Devis ({quotes.length})
            </Button>
          )}
          {hasPermission('contacts') && (
            <Button
              variant={activeTab === 'contacts' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('contacts')}
              icon={MessageSquare}
            >
              Messages ({contacts.length})
            </Button>
          )}
          {hasPermission('content') && (
            <Button
              variant={activeTab === 'content' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('content')}
              icon={Layout}
            >
              Contenu
            </Button>
          )}
          {hasPermission('services') && (
            <Button
              variant={activeTab === 'services' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('services')}
              icon={Briefcase}
            >
              Services ({services.length})
            </Button>
          )}
          {hasPermission('promos') && (
            <Button
              variant={activeTab === 'promos' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('promos')}
              icon={TrendingUp}
            >
              Promos
            </Button>
          )}
          {hasPermission('portfolio') && (
            <Button
              variant={activeTab === 'portfolio' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('portfolio')}
              icon={ImageIcon}
            >
              Portfolio ({portfolio.length})
            </Button>
          )}
          {hasPermission('news') && (
            <Button
              variant={activeTab === 'news' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('news')}
              icon={FileText}
            >
              Actualités ({news.length})
            </Button>
          )}
          {hasPermission('voting') && (
            <Button
              variant={activeTab === 'voting' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('voting')}
              icon={Vote}
            >
              Système de Vote
            </Button>
          )}
          {hasPermission('audience') && (
            <Button
              variant={activeTab === 'audience' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('audience')}
              icon={Users}
            >
              Audience (Live: {onlineCount})
            </Button>
          )}
          {hasPermission('settings') && (
            <Button
              variant={activeTab === 'settings' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('settings')}
              icon={Settings}
            >
              Paramètres
            </Button>
          )}
          {(adminData?.isAdmin || adminData?.role === 'superadmin') && (
            <Button
              variant={activeTab === 'team' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('team')}
              icon={Shield}
            >
              Gestion de l'Équipe
            </Button>
          )}
        </div>

        {/* Search Bar */}
        {(activeTab === 'appointments' || activeTab === 'quotes' || activeTab === 'contacts') && (
          <div className="mb-8 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou service..."
              className="w-full bg-white border-2 border-transparent focus:border-blue-600/20 rounded-[2rem] py-5 pl-16 pr-8 outline-none transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="wait">
            {activeTab === 'appointments' ? (
              <motion.div
                key="appointments-tab"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {filteredAppointments.length === 0 ? (
                  <div className="bg-white p-20 rounded-[3rem] text-center border border-gray-100">
                    <Calendar size={48} className="mx-auto text-gray-200 mb-6" />
                    <p className="text-gray-400 font-medium">Aucun rendez-vous {searchQuery ? 'correspondant à votre recherche' : 'pour le moment'}.</p>
                  </div>
                ) : (
                  <>
                    {paginatedItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-start md:items-center"
                      >
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center space-x-4">
                            {isNew(item.createdAt) && (
                              <div className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 animate-pulse">
                                Nouveau
                              </div>
                            )}
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              item.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' :
                              item.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                              'bg-amber-50 text-amber-600'
                            }`}>
                              {item.status}
                            </div>
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                              {formatDate(item.createdAt)}
                            </span>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900">{item.name}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Mail size={16} className="text-blue-600" />
                              <span>{item.email}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Phone size={16} className="text-blue-600" />
                              <span>{item.phone}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar size={16} className="text-blue-600" />
                              <span>{item.date} à {item.time}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock size={16} className="text-blue-600" />
                              <span>{item.service}</span>
                            </div>
                          </div>
                          {item.message && (
                            <div className="bg-gray-50 p-4 rounded-2xl flex items-start space-x-3">
                              <MessageSquare size={16} className="text-gray-400 mt-1 shrink-0" />
                              <p className="text-sm italic text-gray-500">{item.message}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex md:flex-col gap-2">
                          <Button
                            variant="success"
                            size="icon"
                            onClick={() => updateStatus('appointments', item.id, 'confirmed')}
                            icon={Check}
                            title="Confirmer"
                          />
                          <Button
                            variant="warning"
                            size="icon"
                            onClick={() => updateStatus('appointments', item.id, 'cancelled')}
                            icon={X}
                            title="Annuler"
                          />
                          <Button
                            variant="danger"
                            size="icon"
                            onClick={() => deleteItem('appointments', item.id)}
                            icon={Trash2}
                            title="Supprimer"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </>
                )}
              </motion.div>
            ) : activeTab === 'quotes' ? (
              <motion.div
                key="quotes-tab"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {filteredQuotes.length === 0 ? (
                  <div className="bg-white p-20 rounded-[3rem] text-center border border-gray-100">
                    <FileText size={48} className="mx-auto text-gray-200 mb-6" />
                    <p className="text-gray-400 font-medium">Aucune demande de devis {searchQuery ? 'correspondant à votre recherche' : 'pour le moment'}.</p>
                  </div>
                ) : (
                  <>
                    {paginatedItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-start md:items-center"
                      >
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center space-x-4">
                            {isNew(item.createdAt) && (
                              <div className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 animate-pulse">
                                Nouveau
                              </div>
                            )}
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              item.status === 'responded' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {item.status}
                            </div>
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                              {formatDate(item.createdAt)}
                            </span>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900">{item.name}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Mail size={16} className="text-blue-600" />
                              <span>{item.email}</span>
                            </div>
                            {item.company && (
                              <div className="flex items-center space-x-2">
                                <User size={16} className="text-blue-600" />
                                <span>{item.company}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-2">
                              <Clock size={16} className="text-blue-600" />
                              <span>{item.service}</span>
                            </div>
                            {item.budget && (
                              <div className="flex items-center space-x-2">
                                <FileText size={16} className="text-blue-600" />
                                <span>Budget: {item.budget}</span>
                              </div>
                            )}
                          </div>
                          <div className="bg-gray-50 p-6 rounded-2xl">
                            <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                          </div>
                        </div>
                        <div className="flex md:flex-col gap-2">
                          <Button
                            variant="success"
                            size="icon"
                            onClick={() => updateStatus('quotes', item.id, 'responded')}
                            icon={Check}
                            title="Marquer comme répondu"
                          />
                          <Button
                            variant="danger"
                            size="icon"
                            onClick={() => deleteItem('quotes', item.id)}
                            icon={Trash2}
                            title="Supprimer"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </>
                )}
              </motion.div>
            ) : activeTab === 'contacts' ? (
              <motion.div
                key="contacts-tab"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {filteredContacts.length === 0 ? (
                  <div className="bg-white p-20 rounded-[3rem] text-center border border-gray-100">
                    <MessageSquare size={48} className="mx-auto text-gray-200 mb-6" />
                    <p className="text-gray-400 font-medium">Aucun message {searchQuery ? 'correspondant à votre recherche' : 'pour le moment'}.</p>
                  </div>
                ) : (
                  <>
                    {paginatedItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-start md:items-center"
                      >
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center space-x-4">
                            {isNew(item.createdAt) && (
                              <div className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 animate-pulse">
                                Nouveau
                              </div>
                            )}
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              item.status === 'read' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {item.status === 'read' ? 'Lu' : 'Nouveau'}
                            </div>
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                              {formatDate(item.createdAt)}
                            </span>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900">{item.name}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Mail size={16} className="text-blue-600" />
                              <span>{item.email}</span>
                            </div>
                            <div className="flex items-center space-x-2 font-bold">
                              <MessageSquare size={16} className="text-blue-600" />
                              <span>Sujet: {item.subject}</span>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-6 rounded-2xl flex items-start space-x-3">
                            <MessageSquare size={16} className="text-gray-400 mt-1 shrink-0" />
                            <p className="text-sm text-gray-600 leading-relaxed">{item.message}</p>
                          </div>
                        </div>
                        <div className="flex md:flex-col gap-2">
                          <Button
                            variant="success"
                            size="icon"
                            onClick={() => updateStatus('contacts', item.id, 'read')}
                            icon={Check}
                            title="Marquer comme lu"
                          />
                          <Button
                            variant="danger"
                            size="icon"
                            onClick={() => deleteItem('contacts', item.id)}
                            icon={Trash2}
                            title="Supprimer"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </>
                )}
              </motion.div>
            ) : activeTab === 'audience' ? (
              <motion.div
                key="audience-tab"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-12"
              >
                {/* Dashboard summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-blue-600 text-white p-10 rounded-[3rem] shadow-xl shadow-blue-600/20">
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        <Activity size={24} />
                      </div>
                      <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">Live</div>
                    </div>
                    <p className="text-blue-100 font-bold uppercase tracking-widest text-xs mb-2">Visiteurs Actifs</p>
                    <h4 className="text-5xl font-black">{onlineCount}</h4>
                  </div>

                  <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                      <Users size={24} />
                    </div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Total Sessions (24h)</p>
                    <h4 className="text-4xl font-black text-gray-900">{realtimeSessions.length}</h4>
                  </div>

                  <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                      <TrendingUp size={24} />
                    </div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Historique Dispo.</p>
                    <h4 className="text-4xl font-black text-gray-900">{visitHistory.length} Jours</h4>
                  </div>
                </div>

                {/* History Chart */}
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                  <h3 className="text-2xl font-bold mb-8">Evolution du Trafic</h3>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[...visitHistory].reverse().slice(-30)}>
                        <defs>
                          <linearGradient id="colorVisitsAudience" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#94a3b8', fontSize: 10}} 
                          dy={10}
                          tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <Tooltip 
                          contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        />
                        <Area type="monotone" dataKey="visits" name="Visites" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorVisitsAudience)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Real-time Sessions Table */}
                <div className="bg-white rounded-[3rem] overflow-hidden border border-gray-100 shadow-sm">
                  <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Sessions Actuelles</h3>
                      <p className="text-sm text-gray-500">Mise à jour en temps réel</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-8 py-6 text-xs font-black uppercase text-gray-400">Session ID</th>
                          <th className="px-8 py-6 text-xs font-black uppercase text-gray-400">Page Actuelle</th>
                          <th className="px-8 py-6 text-xs font-black uppercase text-gray-400">Dernière Activité</th>
                          <th className="px-8 py-6 text-xs font-black uppercase text-gray-400">Appareil</th>
                          <th className="px-8 py-6 text-xs font-black uppercase text-gray-400">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {realtimeSessions
                          .sort((a, b) => {
                             const ta = a.lastSeen?.toMillis?.() || 0;
                             const tb = b.lastSeen?.toMillis?.() || 0;
                             return tb - ta;
                          })
                          .map(session => {
                            const lastSeenMillis = session.lastSeen?.toMillis?.() || 0;
                            const isOnline = Date.now() - lastSeenMillis < 5 * 60 * 1000;
                            return (
                              <tr key={session.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-8 py-6 font-mono text-xs text-blue-600">{session.id}</td>
                                <td className="px-8 py-6">
                                  <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-600 tracking-tight">
                                    {session.path || '/'}
                                  </span>
                                </td>
                                <td className="px-8 py-6 text-sm text-gray-500">
                                  {session.lastSeen ? new Date(lastSeenMillis).toLocaleTimeString() : 'Inconnu'}
                                </td>
                                <td className="px-8 py-6 text-xs text-gray-400 truncate max-w-[200px]" title={session.device}>
                                  {session.device || 'Inconnu'}
                                </td>
                                <td className="px-8 py-6">
                                  <div className="flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full", isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-300")} />
                                    <span className={cn("text-[10px] font-black uppercase tracking-widest", isOnline ? "text-emerald-600" : "text-gray-400")}>
                                      {isOnline ? 'En ligne' : 'Inactif'}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'content' ? (
              <motion.div
                key="content-tab"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-12"
              >
                {/* Site Settings */}
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-4 mb-8">
                    <Globe className="text-blue-600" size={32} />
                    <h2 className="text-2xl font-bold">Paramètres du Site</h2>
                  </div>

                  {/* Image Upload Info Box */}
                  <div className="mb-8 p-6 bg-blue-50 rounded-3xl border border-blue-100">
                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <ImageIcon size={16} /> Aide pour les images
                    </h3>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      Vous pouvez importer des images de deux manières :
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-blue-600 list-disc list-inside">
                      <li><strong>Importation directe :</strong> Cliquez sur l'icône bleue <Upload size={14} className="inline" /> pour choisir un fichier sur votre appareil.</li>
                      <li><strong>Lien externe :</strong> Collez un lien (Google Drive, Dropbox, ou lien direct). Les liens Drive sont automatiquement convertis pour être visibles.</li>
                    </ul>
                    <p className="mt-3 text-[10px] text-blue-500 italic">
                      Note : Si l'importation directe échoue, assurez-vous que Firebase Storage est activé dans votre console Firebase avec les règles appropriées.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nom du Site</label>
                      <input
                        className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                        value={siteSettings.siteName}
                        onChange={(e) => setSiteSettings({...siteSettings, siteName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Titre du Site</label>
                      <input
                        className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                        value={siteSettings.siteTitle}
                        onChange={(e) => setSiteSettings({...siteSettings, siteTitle: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Contact</label>
                      <input
                        className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                        value={siteSettings.contactEmail}
                        onChange={(e) => setSiteSettings({...siteSettings, contactEmail: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Texte Logo</label>
                      <input
                        className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                        value={siteSettings.logoText}
                        onChange={(e) => setSiteSettings({...siteSettings, logoText: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Image Logo</label>
                      {siteSettings.logoImage && (
                        <div className="mb-2 relative group w-20 h-20">
                          <img 
                            src={siteSettings.logoImage} 
                            className="w-full h-full rounded-2xl object-contain bg-gray-50 border border-gray-100" 
                            referrerPolicy="no-referrer"
                            alt="Logo Preview"
                          />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          className="flex-1 bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                          value={siteSettings.logoImage}
                          onChange={(e) => setSiteSettings({...siteSettings, logoImage: getDirectImageUrl(e.target.value)})}
                          placeholder="URL de l'image (Directe, Drive, Dropbox...)"
                        />
                        <label className="cursor-pointer bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition-colors flex items-center justify-center min-w-[56px]">
                          {uploading === 'logoImage' ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                                  if (file) handleFileUpload(file, 'settings', 'logoImage', (url) => setSiteSettings({...siteSettings, logoImage: url}));
                            }}
                          />
                        </label>
                      </div>
                    </div>
                    
                    <div className="space-y-4 md:col-span-2">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mt-4 mb-2">Réseaux Sociaux</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">LinkedIn</label>
                          <input
                            className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                            value={siteSettings.socialLinks?.linkedin || ''}
                            onChange={(e) => setSiteSettings({...siteSettings, socialLinks: {...siteSettings.socialLinks, linkedin: e.target.value}})}
                            placeholder="https://linkedin.com/in/..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Twitter (X)</label>
                          <input
                            className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                            value={siteSettings.socialLinks?.twitter || ''}
                            onChange={(e) => setSiteSettings({...siteSettings, socialLinks: {...siteSettings.socialLinks, twitter: e.target.value}})}
                            placeholder="https://x.com/..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Facebook</label>
                          <input
                            className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                            value={siteSettings.socialLinks?.facebook || ''}
                            onChange={(e) => setSiteSettings({...siteSettings, socialLinks: {...siteSettings.socialLinks, facebook: e.target.value}})}
                            placeholder="https://facebook.com/..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">WhatsApp</label>
                          <input
                            className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                            value={siteSettings.socialLinks?.whatsapp || ''}
                            onChange={(e) => setSiteSettings({...siteSettings, socialLinks: {...siteSettings.socialLinks, whatsapp: e.target.value}})}
                            placeholder="https://wa.me/..."
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mt-4 mb-2">Messages de Succès (Formulaires)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contact</label>
                          <textarea
                            className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none resize-none"
                            rows={3}
                            value={siteSettings.successMessages?.contact || ''}
                            onChange={(e) => setSiteSettings({...siteSettings, successMessages: {...(siteSettings.successMessages || {}), contact: e.target.value}})}
                            placeholder="Message après envoi contact..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rendez-vous</label>
                          <textarea
                            className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none resize-none"
                            rows={3}
                            value={siteSettings.successMessages?.appointment || ''}
                            onChange={(e) => setSiteSettings({...siteSettings, successMessages: {...(siteSettings.successMessages || {}), appointment: e.target.value}})}
                            placeholder="Message après demande RDV..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Devis</label>
                          <textarea
                            className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none resize-none"
                            rows={3}
                            value={siteSettings.successMessages?.quote || ''}
                            onChange={(e) => setSiteSettings({...siteSettings, successMessages: {...(siteSettings.successMessages || {}), quote: e.target.value}})}
                            placeholder="Message après demande devis..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleSaveSiteSettings} isLoading={saving} icon={Save}>Enregistrer les Paramètres</Button>
                </div>

                {/* Hero Content */}
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-4 mb-8">
                    <Layout className="text-blue-600" size={32} />
                    <h2 className="text-2xl font-bold">Section Hero</h2>
                  </div>
                  <div className="space-y-6 mb-8">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Badge (Texte au dessus du titre)</label>
                      <input
                        className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                        value={heroContent.badge}
                        onChange={(e) => setHeroContent({...heroContent, badge: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Titre (Prénom)</label>
                        <input
                          className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                          value={heroContent.title}
                          onChange={(e) => setHeroContent({...heroContent, title: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sous-titre (NOM)</label>
                        <input
                          className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                          value={heroContent.subtitle}
                          onChange={(e) => setHeroContent({...heroContent, subtitle: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description</label>
                      <textarea
                        rows={4}
                        className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none resize-none"
                        value={heroContent.description}
                        onChange={(e) => setHeroContent({...heroContent, description: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Image de Profil</label>
                      {heroContent.profileImage && (
                        <div className="mb-2 relative group w-32 h-32">
                          <img 
                            src={heroContent.profileImage} 
                            className="w-full h-full rounded-2xl object-cover border border-gray-100" 
                            referrerPolicy="no-referrer"
                            alt="Profile Preview"
                          />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          className="flex-1 bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                          value={heroContent.profileImage}
                          onChange={(e) => setHeroContent({...heroContent, profileImage: getDirectImageUrl(e.target.value)})}
                          placeholder="URL de l'image (Directe, Drive, Dropbox...)"
                        />
                        <label className="cursor-pointer bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition-colors flex items-center justify-center min-w-[56px]">
                          {uploading === 'profileImage' ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                                  if (file) handleFileUpload(file, 'hero', 'profileImage', (url) => setHeroContent({...heroContent, profileImage: url}));
                            }}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Zones Flottantes (Stats)</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[0, 1].map((idx) => (
                          <div key={idx} className="bg-gray-50 p-6 rounded-3xl space-y-4">
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                              Zone {idx === 0 ? 'Haut' : 'Bas'}
                            </h4>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valeur</label>
                              <input
                                className="w-full bg-white p-3 rounded-xl border border-gray-200 outline-none"
                                value={heroContent.stats?.[idx]?.value || ''}
                                onChange={(e) => {
                                  const newStats = [...(heroContent.stats || [{value:'',label:'',sublabel:'',color:'emerald'},{value:'',label:'',sublabel:'',color:'blue'}])];
                                  if (!newStats[idx]) newStats[idx] = {value:'',label:'',sublabel:'',color: idx === 0 ? 'emerald' : 'blue'};
                                  newStats[idx].value = e.target.value;
                                  setHeroContent({...heroContent, stats: newStats});
                                }}
                                placeholder="ex: 2"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Libellé</label>
                              <input
                                className="w-full bg-white p-3 rounded-xl border border-gray-200 outline-none"
                                value={heroContent.stats?.[idx]?.label || ''}
                                onChange={(e) => {
                                  const newStats = [...(heroContent.stats || [{value:'',label:'',sublabel:'',color:'emerald'},{value:'',label:'',sublabel:'',color:'blue'}])];
                                  if (!newStats[idx]) newStats[idx] = {value:'',label:'',sublabel:'',color: idx === 0 ? 'emerald' : 'blue'};
                                  newStats[idx].label = e.target.value;
                                  setHeroContent({...heroContent, stats: newStats});
                                }}
                                placeholder="ex: Livres Publiés"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sous-libellé</label>
                              <input
                                className="w-full bg-white p-3 rounded-xl border border-gray-200 outline-none"
                                value={heroContent.stats?.[idx]?.sublabel || ''}
                                onChange={(e) => {
                                  const newStats = [...(heroContent.stats || [{value:'',label:'',sublabel:'',color:'emerald'},{value:'',label:'',sublabel:'',color:'blue'}])];
                                  if (!newStats[idx]) newStats[idx] = {value:'',label:'',sublabel:'',color: idx === 0 ? 'emerald' : 'blue'};
                                  newStats[idx].sublabel = e.target.value;
                                  setHeroContent({...heroContent, stats: newStats});
                                }}
                                placeholder="ex: Auteur Engagé"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleSaveHero} isLoading={saving} icon={Save}>Enregistrer le Hero</Button>
                </div>
              </motion.div>
            ) : activeTab === 'services' ? (
              <motion.div
                key="services-tab"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Gestion des Services</h2>
                  <Button onClick={handleAddService} icon={Plus} size="sm">Ajouter un Service</Button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {services.map(s => (
                    <div key={s.id} className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <img src={s.thumbnail} className="w-16 h-16 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-bold text-gray-900">{s.title}</h4>
                              {isNew(s.createdAt) && (
                                <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">Nouveau</span>
                              )}
                              {s.isPromoActive && (
                                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Promo</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{s.categoryId}</p>
                            <div className="text-sm font-bold text-blue-600 mt-1">
                              {formatPrice(s.isPromoActive ? s.promoPrice : s.pricing?.basePrice, s.pricing?.currency)}
                            </div>
                          </div>
                        </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="icon" icon={Edit2} onClick={() => handleEdit(s, 'service')} />
                        <Button variant="danger" size="icon" icon={Trash2} onClick={() => deleteItem('services', s.id)} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : activeTab === 'portfolio' ? (
              <motion.div
                key="portfolio-tab"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Gestion du Portfolio</h2>
                  <Button onClick={handleAddPortfolio} icon={Plus} size="sm">Ajouter un Projet</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {portfolio.map(p => (
                    <div key={p.id} className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
                      <img src={p.image} className="w-full h-48 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-gray-900">{p.title}</h4>
                            {isNew(p.createdAt) && (
                              <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">Nouveau</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{p.category}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="icon" icon={Edit2} onClick={() => handleEdit(p, 'portfolio')} />
                          <Button variant="danger" size="icon" icon={Trash2} onClick={() => deleteItem('portfolio', p.id)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : activeTab === 'promos' ? (
              <motion.div
                key="promos-tab"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Gestion des Promotions</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {services.filter(s => s.isPromoActive).length === 0 ? (
                    <div className="col-span-2 bg-white p-20 rounded-[3rem] text-center border border-gray-100">
                      <TrendingUp size={48} className="mx-auto text-gray-200 mb-6" />
                      <p className="text-gray-400 font-medium">Aucune promotion active pour le moment.</p>
                    </div>
                  ) : (
                    services.filter(s => s.isPromoActive).map(s => (
                      <div key={s.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-emerald-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-emerald-500 text-white px-6 py-2 rounded-bl-3xl text-xs font-black uppercase tracking-widest">
                          Active
                        </div>
                        <div className="flex items-center space-x-6 mb-6">
                          <img src={s.thumbnail} className="w-20 h-20 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{s.title}</h3>
                            <p className="text-sm text-gray-500">{s.categoryId}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-gray-50 p-4 rounded-2xl">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Prix Promo</p>
                            <p className="text-lg font-bold text-emerald-600">{s.promoPrice?.toLocaleString()} FCFA</p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-2xl">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Période</p>
                            <p className="text-xs font-medium text-gray-600">
                              {s.promoStartDate || 'N/A'} au {s.promoEndDate || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleEdit(s, 'service')}
                          icon={Edit2}
                        >
                          Modifier la Promo
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            ) : activeTab === 'news' ? (
              <motion.div
                key="news-tab"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Gestion des Actualités</h2>
                  <Button onClick={handleAddNews} icon={Plus} size="sm">Ajouter un Article</Button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {news.map(n => (
                    <div key={n.id} className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <img src={n.image} className="w-16 h-16 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-gray-900">{n.title}</h4>
                            {isNew(n.createdAt) && (
                              <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">Nouveau</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{formatDate(n.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="icon" icon={Edit2} onClick={() => handleEdit(n, 'news')} />
                        <Button variant="danger" size="icon" icon={Trash2} onClick={() => deleteItem('news', n.id)} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : activeTab === 'voting' ? (
              <motion.div
                key="voting-tab"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-12 pb-24"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Campagnes de Vote</h2>
                    <p className="text-gray-500 font-medium italic">Gérez vos scrutins et challenges en temps réel.</p>
                  </div>
                  <Button onClick={handleAddVotingSession} icon={Plus}>Nouveau Scrutin</Button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {votingSessions.map(session => (
                    <VotingSessionCard 
                      key={session.id} 
                      session={session} 
                      onSave={handleSaveVoting}
                      onDelete={() => deleteItem('voting', session.id)}
                      onFileUpload={handleFileUpload}
                      onDeleteFile={handleDeleteFile}
                    />
                  ))}
                </div>
              </motion.div>
            ) : activeTab === 'settings' ? (
              <motion.div
                key="settings-tab"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Configuration de la Carte</h3>
                      <p className="text-gray-500">Modifiez les coordonnées GPS de votre siège</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600/20 focus:bg-white rounded-2xl py-4 px-6 outline-none transition-all"
                        value={mapConfig.lat}
                        onChange={(e) => setMapConfig({ ...mapConfig, lat: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600/20 focus:bg-white rounded-2xl py-4 px-6 outline-none transition-all"
                        value={mapConfig.lng}
                        onChange={(e) => setMapConfig({ ...mapConfig, lng: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={saveMapSettings}
                    isLoading={saving}
                    icon={Save}
                  >
                    Enregistrer les Coordonnées
                  </Button>
                </div>

                <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                      <Settings size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Initialisation</h3>
                      <p className="text-gray-500">Remplir la base de données avec les données par défaut</p>
                    </div>
                  </div>
                  <Button variant="warning" onClick={initializeData} isLoading={saving} icon={Globe}>
                    Initialiser les données Firestore
                  </Button>
                </div>

                {/* Countdown Settings */}
                <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <Clock size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Mode "Bientôt Disponible" (Countdown)</h3>
                      <p className="text-gray-500">Activez un compte à rebours pour le lancement du site</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl">
                      <div>
                        <h4 className="font-bold text-gray-900">Activer le compte à rebours</h4>
                        <p className="text-sm text-gray-500">Si activé, les visiteurs verront la page d'attente</p>
                      </div>
                      <button
                        onClick={() => setSiteSettings({
                          ...siteSettings,
                          countdown: { ...siteSettings.countdown, active: !siteSettings.countdown?.active }
                        })}
                        className={cn(
                          "w-16 h-8 rounded-full transition-colors relative",
                          siteSettings.countdown?.active ? "bg-blue-600" : "bg-gray-200"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-6 h-6 bg-white rounded-full transition-all",
                          siteSettings.countdown?.active ? "left-9" : "left-1"
                        )} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Titre de l'événement</label>
                        <input
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600/20 focus:bg-white rounded-2xl py-4 px-6 outline-none transition-all"
                          value={siteSettings.countdown?.title || ''}
                          onChange={(e) => setSiteSettings({
                            ...siteSettings,
                            countdown: { ...siteSettings.countdown, title: e.target.value }
                          })}
                          placeholder="ex: Lancement Officiel"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Date et Heure Cible (ISO)</label>
                        <input
                          type="datetime-local"
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600/20 focus:bg-white rounded-2xl py-4 px-6 outline-none transition-all"
                          value={siteSettings.countdown?.targetDate ? new Date(siteSettings.countdown.targetDate).toISOString().slice(0, 16) : ''}
                          onChange={(e) => setSiteSettings({
                            ...siteSettings,
                            countdown: { ...siteSettings.countdown, targetDate: new Date(e.target.value).toISOString() }
                          })}
                        />
                        <p className="text-[10px] text-gray-400 italic ml-1">Note: L'heure sera convertie en UTC. Le Bénin est à UTC+1.</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Message d'attente</label>
                      <textarea
                        rows={3}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600/20 focus:bg-white rounded-2xl py-4 px-6 outline-none transition-all resize-none"
                        value={siteSettings.countdown?.message || ''}
                        onChange={(e) => setSiteSettings({
                          ...siteSettings,
                          countdown: { ...siteSettings.countdown, message: e.target.value }
                        })}
                        placeholder="Message chaleureux pour vos visiteurs..."
                      />
                    </div>

                    <Button
                      onClick={handleSaveSiteSettings}
                      isLoading={saving}
                      icon={Save}
                      className="w-full"
                    >
                      Enregistrer les paramètres du Countdown
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'team' ? (
              <motion.div
                key="team-tab"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Gestion de l'Équipe</h2>
                    <p className="text-gray-500 font-medium italic">Accréditez vos collaborateurs et gérez leurs permissions.</p>
                  </div>
                  <Button onClick={() => {
                    setNewUser({ email: '', displayName: '', role: 'moderator', permissions: [] });
                    setEditingUserEmail(null);
                    setIsAddingUser(true);
                  }} icon={Plus} size="sm">Ajouter un Membre</Button>
                </div>

                {isAddingUser && (
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-blue-100 space-y-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{editingUserEmail ? 'Modifier les accès' : 'Nouvel Utilisateur'}</h3>
                      {editingUserEmail && <span className="text-sm font-mono text-blue-600">{editingUserEmail}</span>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Nom Complet</label>
                        <input
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600/20 focus:bg-white rounded-2xl py-4 px-6 outline-none transition-all"
                          value={newUser.displayName}
                          onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
                          placeholder="ex: Jean Dupont"
                        />
                      </div>
                      <div className={cn("space-y-2", editingUserEmail && "opacity-50 pointer-events-none")}>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Adresse Email (Google)</label>
                        <input
                          type="email"
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600/20 focus:bg-white rounded-2xl py-4 px-6 outline-none transition-all"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          placeholder="jean.dupont@gmail.com"
                          readOnly={!!editingUserEmail}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Permissions d'accès</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {PERMISSIONS_LIST.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              const perms = newUser.permissions?.includes(p.id)
                                ? newUser.permissions.filter((id: string) => id !== p.id)
                                : [...(newUser.permissions || []), p.id];
                              setNewUser({...newUser, permissions: perms});
                            }}
                            className={cn(
                              "flex items-center space-x-3 p-4 rounded-2xl border-2 transition-all text-left",
                              newUser.permissions?.includes(p.id)
                                ? "bg-blue-50 border-blue-600 text-blue-700 font-bold"
                                : "bg-gray-50 border-transparent text-gray-500"
                            )}
                          >
                            <p.icon size={18} />
                            <span className="text-sm">{p.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <Button variant="outline" className="flex-1" onClick={() => {
                        setIsAddingUser(false);
                        setEditingUserEmail(null);
                      }}>Annuler</Button>
                      <Button className="flex-1" onClick={handleAddTeamUser} isLoading={saving}>
                        {editingUserEmail ? 'Enregistrer les modifications' : 'Confirmer l\'Ajout'}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6">
                  {teamUsers.map((tUser) => (
                    <div key={tUser.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl uppercase">
                          {tUser.displayName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-xl font-bold text-gray-900">{tUser.displayName}</h4>
                            <span className={cn(
                              "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                              tUser.role === 'superadmin' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                            )}>
                              {tUser.role}
                            </span>
                          </div>
                          <p className="text-gray-500">{tUser.email}</p>
                        </div>
                      </div>

                      <div className="flex-1 max-w-md">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Modules accessibles</p>
                        <div className="flex flex-wrap gap-1">
                          {tUser.permissions?.includes('all') ? (
                            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-lg">Accès Total</span>
                          ) : (
                            tUser.permissions?.map((pId: string) => {
                              const p = PERMISSIONS_LIST.find(x => x.id === pId);
                              return p ? (
                                <span key={pId} className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-lg">
                                  {p.label}
                                </span>
                              ) : null;
                            })
                          )}
                          {(tUser.permissions?.length === 0 || !tUser.permissions) && (
                            <span className="text-gray-400 text-[10px] italic">Aucun accès</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          icon={Edit2} 
                          onClick={() => {
                            setNewUser({
                              email: tUser.email,
                              displayName: tUser.displayName,
                              role: tUser.role,
                              permissions: tUser.permissions || []
                            });
                            setEditingUserEmail(tUser.email);
                            setIsAddingUser(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }} 
                        />
                        {tUser.role !== 'superadmin' && tUser.email !== adminData?.email && (
                          <Button variant="danger" size="icon" icon={Trash2} onClick={() => handleDeleteTeamUser(tUser.email)} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Success Notification */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-8 right-8 z-[150] bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center space-x-4"
              >
                <Check size={24} />
                <span className="font-bold">{showSuccess}</span>
                <button onClick={() => setShowSuccess(null)} className="ml-4 hover:bg-white/20 p-1 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirmation Modal */}
          <AnimatePresence>
            {showConfirm && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  onClick={() => setShowConfirm(null)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative bg-white w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl text-center"
                >
                  <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trash2 size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Confirmer la suppression</h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.
                  </p>
                  <div className="flex space-x-4">
                    <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(null)}>Annuler</Button>
                    <Button variant="danger" className="flex-1" onClick={confirmDelete}>Supprimer</Button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          
          {/* Edit Modal */}
          <AnimatePresence>
            {editingItem && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  onClick={() => setEditingItem(null)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden"
                >
                  <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-2xl font-bold text-gray-900">Modifier {editType}</h3>
                    <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-white rounded-full transition-colors">
                      <X size={24} className="text-gray-400" />
                    </button>
                  </div>
                  
                  <div className="p-8 max-h-[70vh] overflow-y-auto space-y-6">
                    {editType === 'service' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Titre</label>
                          <input
                            className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                            value={editingItem.title}
                            onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Slogan (Tagline)</label>
                          <input
                            className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                            value={editingItem.tagline}
                            onChange={(e) => setEditingItem({...editingItem, tagline: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description Courte</label>
                          <textarea
                            rows={3}
                            className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none resize-none"
                            value={editingItem.shortDesc}
                            onChange={(e) => setEditingItem({...editingItem, shortDesc: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Image</label>
                          {editingItem.thumbnail && (
                            <div className="mb-2 relative group w-32 h-32">
                              <img 
                                src={editingItem.thumbnail} 
                                className="w-full h-full rounded-2xl object-cover border border-gray-100" 
                                referrerPolicy="no-referrer"
                                alt="Preview"
                              />
                            </div>
                          )}
                          <div className="flex gap-2">
                            <input
                              className="flex-1 bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                              value={editingItem.thumbnail}
                              onChange={(e) => setEditingItem({...editingItem, thumbnail: getDirectImageUrl(e.target.value)})}
                              placeholder="URL de l'image (Directe, Drive, Dropbox...)"
                            />
                            <label className="cursor-pointer bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition-colors flex items-center justify-center min-w-[56px]">
                              {uploading === 'thumbnail' ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(file, 'services', 'thumbnail', (url) => setEditingItem({...editingItem, thumbnail: url}));
                                }}
                              />
                            </label>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Prix Promo (FCFA)</label>
                            <input
                              type="number"
                              className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                              value={editingItem.promoPrice || ''}
                              onChange={(e) => setEditingItem({...editingItem, promoPrice: parseInt(e.target.value) || 0})}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Promo Active</label>
                            <div className="flex items-center h-[56px]">
                              <button
                                onClick={() => setEditingItem({...editingItem, isPromoActive: !editingItem.isPromoActive})}
                                className={`w-14 h-8 rounded-full transition-all relative ${editingItem.isPromoActive ? 'bg-emerald-500' : 'bg-gray-200'}`}
                              >
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${editingItem.isPromoActive ? 'left-7' : 'left-1'}`} />
                              </button>
                            </div>
                          </div>
                        </div>
                        {editingItem.isPromoActive && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Date de Début</label>
                              <input
                                type="date"
                                className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                                value={editingItem.promoStartDate || ''}
                                onChange={(e) => setEditingItem({...editingItem, promoStartDate: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Date de Fin</label>
                              <input
                                type="date"
                                className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                                value={editingItem.promoEndDate || ''}
                                onChange={(e) => setEditingItem({...editingItem, promoEndDate: e.target.value})}
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-4 pt-4 border-t border-gray-100">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Galerie d'images</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {(editingItem.gallery || []).map((img: string, index: number) => (
                              <div key={index} className="relative group aspect-video">
                                <img 
                                  src={img} 
                                  className="w-full h-full rounded-2xl object-cover border border-gray-100" 
                                  referrerPolicy="no-referrer"
                                  alt={`Gallery ${index}`}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newGallery = [...(editingItem.gallery || [])];
                                    newGallery.splice(index, 1);
                                    setEditingItem({...editingItem, gallery: newGallery});
                                  }}
                                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                            <label className="aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-600/20 hover:bg-blue-50/30 transition-all group">
                              {uploading === 'gallery-new' ? (
                                <Loader2 size={24} className="text-blue-600 animate-spin" />
                              ) : (
                                <>
                                  <Plus size={24} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 group-hover:text-blue-600 transition-colors">Ajouter</span>
                                </>
                              )}
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleFileUpload(file, 'services/gallery', 'gallery-new', (url) => {
                                      const newGallery = [...(editingItem.gallery || []), url];
                                      setEditingItem({...editingItem, gallery: newGallery});
                                    });
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <div className="flex gap-2">
                            <input
                              className="flex-1 bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                              placeholder="Ou collez l'URL d'une image ici..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const input = e.target as HTMLInputElement;
                                  const url = input.value;
                                  if (url) {
                                    const newGallery = [...(editingItem.gallery || []), getDirectImageUrl(url)];
                                    setEditingItem({...editingItem, gallery: newGallery});
                                    input.value = '';
                                  }
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                                const url = input.value;
                                if (url) {
                                  const newGallery = [...(editingItem.gallery || []), getDirectImageUrl(url)];
                                  setEditingItem({...editingItem, gallery: newGallery});
                                  input.value = '';
                                }
                              }}
                            >
                              Ajouter
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {editType === 'portfolio' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Titre</label>
                          <input
                            className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                            value={editingItem.title}
                            onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Catégorie</label>
                          <input
                            className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                            value={editingItem.category}
                            onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description</label>
                          <textarea
                            rows={3}
                            className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none resize-none"
                            value={editingItem.description}
                            onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Image</label>
                          {editingItem.image && (
                            <div className="mb-2 relative group w-32 h-32">
                              <img 
                                src={editingItem.image} 
                                className="w-full h-full rounded-2xl object-cover border border-gray-100" 
                                referrerPolicy="no-referrer"
                                alt="Preview"
                              />
                            </div>
                          )}
                          <div className="flex gap-2">
                            <input
                              className="flex-1 bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                              value={editingItem.image}
                              onChange={(e) => setEditingItem({...editingItem, image: getDirectImageUrl(e.target.value)})}
                              placeholder="URL de l'image (Directe, Drive, Dropbox...)"
                            />
                            <label className="cursor-pointer bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition-colors flex items-center justify-center min-w-[56px]">
                              {uploading === 'portfolioImage' ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(file, 'portfolio', 'portfolioImage', (url) => setEditingItem({...editingItem, image: url}));
                                }}
                              />
                            </label>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Vidéo (Optionnel)</label>
                          {editingItem.video && (
                            <div className="mb-2 relative group w-full aspect-video max-w-xs">
                              <video 
                                src={editingItem.video} 
                                className="w-full h-full rounded-2xl object-cover border border-gray-100" 
                                controls
                              />
                            </div>
                          )}
                          <div className="flex gap-2">
                            <input
                              className="flex-1 bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                              value={editingItem.video || ''}
                              onChange={(e) => setEditingItem({...editingItem, video: e.target.value})}
                              placeholder="URL de la vidéo (Directe, YouTube, Vimeo...)"
                            />
                            <label className="cursor-pointer bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition-colors flex items-center justify-center min-w-[56px]">
                              {uploading === 'portfolioVideo' ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="video/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(file, 'portfolio/videos', 'portfolioVideo', (url) => setEditingItem({...editingItem, video: url}));
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {editType === 'news' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Titre</label>
                          <input
                            className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                            value={editingItem.title}
                            onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contenu</label>
                          <textarea
                            rows={6}
                            className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none resize-none"
                            value={editingItem.body}
                            onChange={(e) => setEditingItem({...editingItem, body: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Image</label>
                          {editingItem.image && (
                            <div className="mb-2 relative group w-32 h-32">
                              <img 
                                src={editingItem.image} 
                                className="w-full h-full rounded-2xl object-cover border border-gray-100" 
                                referrerPolicy="no-referrer"
                                alt="Preview"
                              />
                            </div>
                          )}
                          <div className="flex gap-2">
                            <input
                              className="flex-1 bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                              value={editingItem.image}
                              onChange={(e) => setEditingItem({...editingItem, image: getDirectImageUrl(e.target.value)})}
                              placeholder="URL de l'image (Directe, Drive, Dropbox...)"
                            />
                            <label className="cursor-pointer bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition-colors flex items-center justify-center min-w-[56px]">
                              {uploading === 'newsImage' ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(file, 'news', 'newsImage', (url) => setEditingItem({...editingItem, image: url}));
                                }}
                              />
                            </label>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Vidéo (Optionnel)</label>
                          {editingItem.video && (
                            <div className="mb-2 relative group w-full aspect-video max-w-xs">
                              <video 
                                src={editingItem.video} 
                                className="w-full h-full rounded-2xl object-cover border border-gray-100" 
                                controls
                              />
                            </div>
                          )}
                          <div className="flex gap-2">
                            <input
                              className="flex-1 bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                              value={editingItem.video || ''}
                              onChange={(e) => setEditingItem({...editingItem, video: e.target.value})}
                              placeholder="URL de la vidéo (Directe, YouTube, Vimeo...)"
                            />
                            <label className="cursor-pointer bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition-colors flex items-center justify-center min-w-[56px]">
                              {uploading === 'newsVideo' ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="video/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(file, 'news/videos', 'newsVideo', (url) => setEditingItem({...editingItem, video: url}));
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end space-x-4">
                    <Button variant="outline" onClick={() => setEditingItem(null)}>Annuler</Button>
                    <Button onClick={handleSaveEdit} isLoading={saving} icon={Save}>Enregistrer les modifications</Button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {activeTab !== 'settings' && totalPages > 1 && (
            <div className="flex items-center justify-center space-x-4 mt-12">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                icon={ChevronLeft}
              >
                Précédent
              </Button>
              <div className="flex items-center space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl font-bold transition-all ${
                      currentPage === page
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                icon={ChevronRight}
              >
                Suivant
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VotingSessionCard({ session: initialSession, onSave, onDelete, onFileUpload, onDeleteFile }: { session: any, onSave: (s: any) => void, onDelete: () => void, onFileUpload: (file: File, path: string, id: string, cb: (url: string) => void) => void, onDeleteFile: (url: string) => void, key?: any }) {
  const [session, setSession] = useState(initialSession);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'candidates' | 'stats' | 'ballots'>('config');
  const [ballots, setBallots] = useState<any[]>([]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    if (activeSubTab === 'ballots' || isExpanded) {
      const unsub = onSnapshot(query(collection(db, 'voting', session.id, 'ballots'), orderBy('timestamp', 'desc')), (snapshot) => {
        setBallots(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return unsub;
    }
  }, [activeSubTab, isExpanded, session.id]);

  const handleCancelBallot = async (ballot: any) => {
    try {
      // 1. Delete ballot doc
      await deleteDoc(doc(db, 'voting', session.id, 'ballots', ballot.id));
      
      // 2. Decrement votes for each candidate in the session doc
      const updatedCandidates = session.candidates.map((c: any) => {
        if (ballot.candidateIds.includes(c.id)) {
          return { ...c, voteCount: Math.max(0, (c.voteCount || 0) - 1) };
        }
        return c;
      });

      const updatedSession = { 
        ...session, 
        candidates: updatedCandidates,
        voterCount: Math.max(0, (session.voterCount || 0) - 1)
      };
      
      setSession(updatedSession);
      await setDoc(doc(db, 'voting', session.id), updatedSession);
    } catch (e) {
      console.error("Error cancelling ballot:", e);
    }
  };

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];
  const chartData = session.candidates.map((c: any) => ({ name: c.name, votes: c.voteCount || 0 }));
  const totalVotes = session.candidates.reduce((sum: number, c: any) => sum + (c.voteCount || 0), 0);

  return (
    <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden transition-all">
      <div className="p-8 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
            session.active ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
          )}>
            <Vote size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900">{session.title}</h3>
            <p className="text-gray-500 font-medium">Fin : {new Date(session.endDate).toLocaleDateString()} | {session.voterCount || 0} votants</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant={isExpanded ? "primary" : "outline"} onClick={() => setIsExpanded(!isExpanded)} icon={isExpanded ? ChevronLeft : Edit2}>
            {isExpanded ? "Fermer" : "Gérer"}
          </Button>
          <Button variant="danger" size="icon" icon={Trash2} onClick={onDelete} />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-50 bg-gray-50/30 p-8 pt-0"
          >
            {/* Sub Tabs */}
            <div className="flex border-b border-gray-100 mb-8 pt-4">
              <button onClick={() => setActiveSubTab('config')} className={cn("px-6 py-4 font-bold text-sm border-b-2 transition-all", activeSubTab === 'config' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400")}>Configuration</button>
              <button onClick={() => setActiveSubTab('candidates')} className={cn("px-6 py-4 font-bold text-sm border-b-2 transition-all", activeSubTab === 'candidates' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400")}>Candidats ({session.candidates.length})</button>
              <button onClick={() => setActiveSubTab('stats')} className={cn("px-6 py-4 font-bold text-sm border-b-2 transition-all", activeSubTab === 'stats' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400")}>Statistiques</button>
              <button onClick={() => setActiveSubTab('ballots')} className={cn("px-6 py-4 font-bold text-sm border-b-2 transition-all", activeSubTab === 'ballots' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400")}>Bulletins ({ballots.length})</button>
            </div>

            {activeSubTab === 'config' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white p-8 rounded-[2.5rem] shadow-sm">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <span className="font-bold">Activer le scrutin</span>
                    <button onClick={() => setSession({...session, active: !session.active})} className={cn("w-12 h-6 rounded-full relative transition-colors", session.active ? "bg-blue-600" : "bg-gray-200")}>
                      <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", session.active ? "left-7" : "left-1")} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-400">Titre</label>
                    <input className="w-full bg-gray-50 rounded-xl p-4 font-bold" value={session.title} onChange={e => setSession({...session, title: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-400">Date de fin</label>
                    <input type="datetime-local" className="w-full bg-gray-50 rounded-xl p-4 font-bold" value={session.endDate?.slice(0, 16) || ""} onChange={e => setSession({...session, endDate: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-400">Max Choix</label>
                      <input type="number" className="w-full bg-gray-50 rounded-xl p-4 font-bold" value={session.maxVotes} onChange={e => setSession({...session, maxVotes: parseInt(e.target.value)})} />
                    </div>
                  </div>

                  {/* Paid Mode Configuration */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                          <DollarSign size={20} />
                        </div>
                        <div>
                          <span className="font-bold text-emerald-900">Mode Challenge Payant</span>
                          <p className="text-[10px] text-emerald-600 font-medium">Les votes coûtent une somme fixe</p>
                        </div>
                      </div>
                      <button onClick={() => setSession({...session, isPaid: !session.isPaid})} className={cn("w-12 h-6 rounded-full relative transition-colors", session.isPaid ? "bg-emerald-600" : "bg-gray-200")}>
                        <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", session.isPaid ? "left-7" : "left-1")} />
                      </button>
                    </div>

                    {session.isPaid && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4 p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100">
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-emerald-700 tracking-widest">Prix par Vote (FCFA)</label>
                           <input 
                             type="number" 
                             className="w-full bg-white rounded-xl p-4 font-bold border-2 border-emerald-100 focus:border-emerald-500 outline-none" 
                             value={session.pricePerVote || 0} 
                             onChange={e => setSession({...session, pricePerVote: parseInt(e.target.value)})} 
                           />
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-gray-400">N° Marchand Moov</label>
                              <input 
                                className="w-full bg-white rounded-lg p-2 text-sm border border-gray-100 font-mono" 
                                placeholder="ex: 95..." 
                                value={session.paymentConfig?.moovNumber || ""} 
                                onChange={e => setSession({...session, paymentConfig: {...(session.paymentConfig || {}), moovNumber: e.target.value}})} 
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-gray-400">N° Marchand MTN</label>
                              <input 
                                className="w-full bg-white rounded-lg p-2 text-sm border border-gray-100 font-mono" 
                                placeholder="ex: 61..." 
                                value={session.paymentConfig?.mtnNumber || ""} 
                                onChange={e => setSession({...session, paymentConfig: {...(session.paymentConfig || {}), mtnNumber: e.target.value}})} 
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-gray-400">N° Marchand Celtiis</label>
                              <input 
                                className="w-full bg-white rounded-lg p-2 text-sm border border-gray-100 font-mono" 
                                placeholder="ex: 40..." 
                                value={session.paymentConfig?.celtiisNumber || ""} 
                                onChange={e => setSession({...session, paymentConfig: {...(session.paymentConfig || {}), celtiisNumber: e.target.value}})} 
                              />
                            </div>
                         </div>
                         <p className="text-[10px] text-gray-400 italic">Note: Ces numéros seront affichés au votant pour le choix du réseau.</p>
                      </motion.div>
                    )}
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-400">Description</label>
                    <textarea className="w-full bg-gray-50 rounded-xl p-4 font-bold min-h-[100px]" value={session.description} onChange={e => setSession({...session, description: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-400">Règlement</label>
                    <textarea className="w-full bg-gray-50 rounded-xl p-4 font-bold min-h-[150px]" value={session.rules} onChange={e => setSession({...session, rules: e.target.value})} />
                  </div>
                </div>
                <div className="lg:col-span-2 flex justify-end pt-8 border-t border-gray-100">
                  <Button 
                    className="px-12 h-16 rounded-[2rem] shadow-xl shadow-blue-600/20"
                    icon={Save}
                    onClick={async () => {
                      try {
                        const sessionRef = doc(db, 'voting', session.id);
                        await setDoc(sessionRef, session);
                        alert("Configuration mise à jour avec succès !");
                      } catch (e) {
                        console.error("Error saving session config:", e);
                        alert("Erreur lors de la sauvegarde.");
                      }
                    }}
                  >
                    Sauvegarder les modifications
                  </Button>
                </div>
              </div>
            )}

            {activeSubTab === 'candidates' && (
              <div className="space-y-6">
                 <div className="flex justify-end">
                    <Button size="sm" icon={Plus} onClick={() => setSession({
                      ...session,
                      candidates: [...session.candidates, { id: Math.random().toString(36).substring(2), name: "Nouveau", description: "", imageUrl: "https://picsum.photos/seed/candidate/400/500", voteCount: 0 }]
                    })}>Ajouter un Candidat</Button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {session.candidates.map((cand: any, idx: number) => (
                      <div key={cand.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center">
                        <div className="relative group mb-6">
                          <img 
                            key={cand.imageUrl}
                            src={cand.imageUrl || "https://picsum.photos/seed/placeholder/400/400"} 
                            className="w-32 h-32 rounded-3xl object-cover shadow-lg border-2 border-gray-100" 
                            referrerPolicy="no-referrer" 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center space-x-2">
                             <button 
                               title="Changer la photo (Upload)"
                               className="p-2 bg-white/20 hover:bg-white/40 rounded-xl text-white transition-colors"
                               onClick={() => document.getElementById(`file-cand-${cand.id}`)?.click()}
                             >
                               <ImageIcon size={20} />
                             </button>
                             {cand.imageUrl?.startsWith('/uploads/') && (
                               <button 
                                 title="Supprimer du serveur"
                                 className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-xl text-red-200 transition-colors"
                                 onClick={() => {
                                   if(confirm("Supprimer définitivement ce fichier du serveur ?")) {
                                      onDeleteFile(cand.imageUrl);
                                      const newCands = [...session.candidates];
                                      newCands[idx].imageUrl = "";
                                      setSession({...session, candidates: newCands});
                                   }
                                 }}
                               >
                                 <Trash2 size={20} />
                               </button>
                             )}
                          </div>
                          {uploadingId === cand.id && (
                            <div className="absolute inset-0 bg-white/80 rounded-3xl flex items-center justify-center">
                              <Loader2 size={24} className="animate-spin text-blue-600" />
                            </div>
                          )}
                          <input 
                            id={`file-cand-${cand.id}`}
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // If already has a local file, delete it first
                                if (cand.imageUrl?.startsWith('/uploads/')) {
                                  onDeleteFile(cand.imageUrl);
                                }
                                setUploadingId(cand.id);
                                onFileUpload(file, 'candidates', cand.id, (url) => {
                                  const newCands = [...session.candidates];
                                  newCands[idx].imageUrl = url;
                                  setSession({...session, candidates: newCands});
                                  setUploadingId(null);
                                });
                              }
                            }}
                          />
                        </div>
                        <div className="w-full space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nom du Candidat</label>
                            <input 
                              className="w-full bg-gray-50 rounded-2xl p-4 font-bold border-2 border-transparent focus:border-blue-600/10 focus:bg-white transition-all" 
                              value={cand.name} 
                              onChange={e => {
                                const newCands = [...session.candidates];
                                newCands[idx].name = e.target.value;
                                setSession({...session, candidates: newCands});
                              }} 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">URL de la Photo (Prévisualisation auto)</label>
                            <input 
                              className="w-full bg-gray-50 rounded-2xl p-4 font-medium text-xs border-2 border-transparent focus:border-blue-600/10 focus:bg-white transition-all" 
                              placeholder="https://..."
                              value={cand.imageUrl || ""} 
                              onChange={e => {
                                let val = e.target.value;
                                // Auto-fix Google Drive links
                                if (val.includes('drive.google.com')) {
                                  const match = val.match(/\/file\/d\/([^\/]+)/) || val.match(/[?&]id=([^&]+)/);
                                  if (match && match[1]) {
                                    val = `https://drive.google.com/uc?export=view&id=${match[1]}`;
                                  }
                                }
                                const newCands = [...session.candidates];
                                newCands[idx].imageUrl = val;
                                setSession({...session, candidates: newCands});
                              }} 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Description (Optionnel)</label>
                            <textarea 
                              className="w-full bg-gray-50 rounded-2xl p-4 font-medium text-sm min-h-[80px] border-2 border-transparent focus:border-blue-600/10 focus:bg-white transition-all" 
                              placeholder="Parcours, ambitions..."
                              value={cand.description || ""} 
                              onChange={e => {
                                const newCands = [...session.candidates];
                                newCands[idx].description = e.target.value;
                                setSession({...session, candidates: newCands});
                              }} 
                            />
                          </div>
                        </div>
                        <div className="mt-6 flex items-center justify-between w-full">
                          <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-black">
                            {cand.voteCount || 0} Voix
                          </div>
                          <Button variant="danger" size="icon" icon={Trash2} onClick={() => {
                            if (cand.imageUrl?.startsWith('/uploads/')) {
                              onDeleteFile(cand.imageUrl);
                            }
                            const newCands = session.candidates.filter((c: any) => c.id !== cand.id);
                            setSession({...session, candidates: newCands});
                          }} />
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {activeSubTab === 'stats' && (
              <div className="bg-gray-900 p-8 rounded-[3rem] text-white">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                    <div className="h-[250px] lg:col-span-2">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                             <XAxis dataKey="name" tick={{fill: '#fff', fontSize: 10}} axisLine={false} />
                             <YAxis tick={{fill: '#fff', fontSize: 10}} axisLine={false} />
                             <Tooltip contentStyle={{backgroundColor: '#1f2937', border: 'none'}} />
                             <Bar dataKey="votes" radius={[8, 8, 0, 0]} barSize={40}>
                                {chartData.map((e: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                             </Bar>
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                    <div className="space-y-4 pt-8 lg:pt-0">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Top Candidats</p>
                       {[...session.candidates].sort((a: any, b: any) => (b.voteCount || 0) - (a.voteCount || 0)).slice(0, 3).map((cand, i) => (
                         <div key={cand.id} className="bg-white/5 p-4 rounded-3xl flex items-center space-x-4">
                           <img src={cand.imageUrl || `https://picsum.photos/seed/${cand.id}/50/50`} className="w-10 h-10 rounded-xl object-cover shadow-lg" referrerPolicy="no-referrer" alt={cand.name} />
                           <div className="flex-1 min-w-0">
                             <h4 className="font-bold text-sm truncate">{cand.name}</h4>
                             <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">{cand.voteCount || 0} Voix</p>
                           </div>
                         </div>
                       ))}
                       <div className="bg-white/5 p-6 rounded-3xl">
                          <span className="text-[10px] uppercase text-blue-400 font-bold">Total Votants</span>
                          <p className="text-4xl font-black">{session.voterCount || 0}</p>
                       </div>
                       <div className="bg-white/5 p-6 rounded-3xl">
                          <span className="text-[10px] uppercase text-emerald-400 font-bold">Total Voix</span>
                          <p className="text-4xl font-black">{totalVotes}</p>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {activeSubTab === 'ballots' && (
              <div className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-8 py-6 text-xs font-black uppercase text-gray-400">Votant</th>
                      <th className="px-8 py-6 text-xs font-black uppercase text-gray-400">Téléphone</th>
                      <th className="px-8 py-6 text-xs font-black uppercase text-gray-400">Choix</th>
                      <th className="px-8 py-6 text-xs font-black uppercase text-gray-400">Date</th>
                      <th className="px-8 py-6 text-xs font-black uppercase text-gray-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {ballots.map(ballot => (
                      <tr key={ballot.id} className="hover:bg-gray-50/50">
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                              {ballot.voterName ? ballot.voterName[0] : "?"}
                            </div>
                            <span className="font-bold text-gray-900">{ballot.voterName}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-sm font-mono text-gray-600">
                          {ballot.voterPhone || "N/A"}
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex flex-wrap gap-2">
                              {ballot.candidateIds?.map((cid: string) => {
                                const cand = session.candidates.find((c: any) => c.id === cid);
                                return (
                                  <div key={cid} className="flex items-center space-x-2 bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">
                                     <img 
                                      src={cand?.imageUrl || `https://picsum.photos/seed/${cid}/50/50`} 
                                      className="w-5 h-5 rounded-md object-cover" 
                                      referrerPolicy="no-referrer"
                                    />
                                     <span className="text-[10px] font-black">{cand?.name || cid}</span>
                                  </div>
                                );
                              })}
                           </div>
                        </td>
                        <td className="px-8 py-6 text-sm text-gray-500">{new Date(ballot.timestamp).toLocaleString()}</td>
                        <td className="px-8 py-6 text-right">
                          <Button 
                            variant="danger" 
                            size="sm" 
                            onClick={() => handleCancelBallot(ballot)}
                            icon={Trash2}
                          >
                            Annuler
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {ballots.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-8 py-12 text-center text-gray-400 italic">Aucun bulletin enregistré.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {isExpanded && (
              <div className="mt-8 flex justify-end space-x-4">
                 <Button variant="outline" onClick={() => setIsExpanded(false)}>Annuler</Button>
                 <Button onClick={() => onSave(session)} icon={Save}>Enregistrer les modifications</Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
