/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Calendar, FileText, LogOut, Trash2, Check, X, Clock, User, Mail, Phone, MessageSquare, Settings, MapPin, Save, ChevronLeft, ChevronRight, Layout, Briefcase, Image as ImageIcon, Plus, Edit2, Globe, Search, TrendingUp, Users, DollarSign, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, setDoc, getDoc, addDoc } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, Cell, PieChart, Pie } from 'recharts';
import Button from './ui/Button';
import { servicesData as staticServices, portfolioItems as staticPortfolio } from '../data';
import { SITE_NAME, SITE_TITLE, CONTACT_EMAIL, SOCIAL_LINKS } from '../constants';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

const ITEMS_PER_PAGE = 5;

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'appointments' | 'quotes' | 'content' | 'services' | 'portfolio' | 'news' | 'settings'>('appointments');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit States
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editType, setEditType] = useState<'service' | 'portfolio' | 'news' | null>(null);
  const [siteSettings, setSiteSettings] = useState<any>({
    siteName: SITE_NAME,
    siteTitle: SITE_TITLE,
    contactEmail: CONTACT_EMAIL,
    socialLinks: SOCIAL_LINKS,
    logoText: 'L. KABO',
    logoImage: '/favicon.svg'
  });
  
  const [heroContent, setHeroContent] = useState<any>({
    badge: "Producteur Multimédia | Journaliste | Développeur Web | Activiste DSSR",
    title: "Eboun Léonard",
    subtitle: "KABO",
    description: "Expert en transformation numérique, je mets mes compétences au service du changement social et de la performance numérique.",
    ctaText: "Explorer mes Services",
    ctaLink: "/services",
    secondaryCtaText: "Me Contacter",
    secondaryCtaLink: "/contact",
    profileImage: "/profile.jpg",
    stats: []
  });

  const [mapConfig, setMapConfig] = useState({ lat: 9.3372, lng: 2.6288 });
  const [saving, setSaving] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user || user.email !== 'leonardkabo32@gmail.com') {
        console.log('User not authorized or not logged in:', user?.email);
        navigate('/admin/login');
      } else {
        console.log('User logged in as admin:', user.email, 'Verified:', user.emailVerified);
        setUser(user);
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    // Real-time listeners
    const unsubAppointments = onSnapshot(query(collection(db, 'appointments'), orderBy('createdAt', 'desc')), (snapshot) => {
      setAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'appointments'));

    const unsubQuotes = onSnapshot(query(collection(db, 'quotes'), orderBy('createdAt', 'desc')), (snapshot) => {
      setQuotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'quotes'));

    const unsubServices = onSnapshot(query(collection(db, 'services'), orderBy('priority', 'asc')), (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'services'));

    const unsubPortfolio = onSnapshot(collection(db, 'portfolio'), (snapshot) => {
      setPortfolio(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'portfolio'));

    const unsubNews = onSnapshot(query(collection(db, 'news'), orderBy('createdAt', 'desc')), (snapshot) => {
      setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'news'));

    // Fetch single docs
    onSnapshot(doc(db, 'settings', 'site'), (docSnap) => {
      if (docSnap.exists()) setSiteSettings(docSnap.data());
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/site'));

    onSnapshot(doc(db, 'sections', 'hero'), (docSnap) => {
      if (docSnap.exists()) setHeroContent(docSnap.data());
    }, (error) => handleFirestoreError(error, OperationType.GET, 'sections/hero'));

    getDoc(doc(db, 'settings', 'mapConfig')).then((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMapConfig({ lat: data.mapLat, lng: data.mapLng });
      }
    });

    return () => {
      unsubAppointments();
      unsubQuotes();
      unsubServices();
      unsubPortfolio();
      unsubNews();
    };
  }, [user]);

  const handleSaveSiteSettings = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'site'), siteSettings);
      alert('Paramètres du site enregistrés !');
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'settings/site'); }
    setSaving(false);
  };

  const handleSaveHero = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'sections', 'hero'), heroContent);
      alert('Contenu Hero enregistré !');
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'sections/hero'); }
    setSaving(false);
  };

  const handleAddService = async () => {
    const title = prompt('Titre du service ?');
    if (!title) return;
    try {
      await addDoc(collection(db, 'services'), {
        title,
        slug: title.toLowerCase().replace(/ /g, '-'),
        categoryId: 'multimedia',
        priority: services.length + 1,
        shortDesc: 'Description courte...',
        tagline: 'Slogan...',
        thumbnail: 'https://picsum.photos/seed/service/800/600'
      });
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, 'services'); }
  };

  const handleAddPortfolio = async () => {
    const title = prompt('Titre du projet ?');
    if (!title) return;
    try {
      await addDoc(collection(db, 'portfolio'), {
        title,
        category: 'web',
        image: 'https://picsum.photos/seed/portfolio/800/600',
        description: 'Description du projet...',
        technologies: ['React', 'Firebase']
      });
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, 'portfolio'); }
  };

  const handleAddNews = async () => {
    const title = prompt('Titre de l\'article ?');
    if (!title) return;
    try {
      await addDoc(collection(db, 'news'), {
        title,
        body: 'Contenu de l\'article...',
        author: 'L. KABO',
        readTime: '5 min',
        createdAt: Date.now(),
        image: 'https://picsum.photos/seed/news/800/600'
      });
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
      alert('Élément mis à jour !');
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, `${editType}/${editingItem.id}`); }
    setSaving(false);
  };

  const initializeData = async () => {
    if (!window.confirm('Voulez-vous initialiser la base de données avec les données par défaut ?')) return;
    setSaving(true);
    try {
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
          gallery: s.gallery || []
        });
      }
      // Initialize Portfolio
      for (const p of staticPortfolio) {
        await addDoc(collection(db, 'portfolio'), {
          title: p.title,
          category: p.category,
          image: p.image,
          description: p.description,
          technologies: p.technologies
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
      alert('Données initialisées avec succès !');
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
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${id}`);
    }
  };

  const deleteItem = async (collectionName: string, id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
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
      alert('Paramètres de la carte mis à jour !');
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
      return { name: day, visitors: (appts + qts) * 5 + 10, activity: appts + qts }; // Mocking visitors based on activity
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

  const currentItems = activeTab === 'appointments' ? filteredAppointments : filteredQuotes;
  const totalPages = Math.ceil(currentItems.length / ITEMS_PER_PAGE);
  const paginatedItems = currentItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

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
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.estimatedRevenue.toLocaleString()} FCFA</div>
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
          <Button
            variant={activeTab === 'appointments' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('appointments')}
            icon={Calendar}
          >
            Rendez-vous ({appointments.length})
          </Button>
          <Button
            variant={activeTab === 'quotes' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('quotes')}
            icon={FileText}
          >
            Devis ({quotes.length})
          </Button>
          <Button
            variant={activeTab === 'content' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('content')}
            icon={Layout}
          >
            Contenu
          </Button>
          <Button
            variant={activeTab === 'services' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('services')}
            icon={Briefcase}
          >
            Services ({services.length})
          </Button>
          <Button
            variant={activeTab === 'portfolio' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('portfolio')}
            icon={ImageIcon}
          >
            Portfolio ({portfolio.length})
          </Button>
          <Button
            variant={activeTab === 'news' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('news')}
            icon={FileText}
          >
            Actualités ({news.length})
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('settings')}
            icon={Settings}
          >
            Paramètres
          </Button>
        </div>

        {/* Search Bar */}
        {(activeTab === 'appointments' || activeTab === 'quotes') && (
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
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              item.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' :
                              item.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                              'bg-amber-50 text-amber-600'
                            }`}>
                              {item.status}
                            </div>
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                              {new Date(item.createdAt).toLocaleDateString()}
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
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              item.status === 'responded' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {item.status}
                            </div>
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                              {new Date(item.createdAt).toLocaleDateString()}
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
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Image Logo (URL)</label>
                      <input
                        className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                        value={siteSettings.logoImage}
                        onChange={(e) => setSiteSettings({...siteSettings, logoImage: e.target.value})}
                      />
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
                          <img src={s.thumbnail} className="w-16 h-16 rounded-2xl object-cover" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-bold text-gray-900">{s.title}</h4>
                              {s.isPromoActive && (
                                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Promo</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{s.categoryId}</p>
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
                      <img src={p.image} className="w-full h-48 rounded-2xl object-cover" />
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-gray-900">{p.title}</h4>
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
                        <img src={n.image} className="w-16 h-16 rounded-2xl object-cover" />
                        <div>
                          <h4 className="font-bold text-gray-900">{n.title}</h4>
                          <p className="text-sm text-gray-500">{new Date(n.createdAt).toLocaleDateString()}</p>
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
            ) : (
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
              </motion.div>
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
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Image (URL)</label>
                          <input
                            className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                            value={editingItem.thumbnail}
                            onChange={(e) => setEditingItem({...editingItem, thumbnail: e.target.value})}
                          />
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
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Image (URL)</label>
                          <input
                            className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                            value={editingItem.image}
                            onChange={(e) => setEditingItem({...editingItem, image: e.target.value})}
                          />
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
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Image (URL)</label>
                          <input
                            className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-600/20 outline-none"
                            value={editingItem.image}
                            onChange={(e) => setEditingItem({...editingItem, image: e.target.value})}
                          />
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
