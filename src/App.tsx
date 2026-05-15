/**
 * =========================================================================
 * APPLICATION PARALEGAL - BENIN
 * =========================================================================
 * Développé par: Léonard KABO
 * Date de création: 2024 (dernière mise à jour: 2026)
 * Description: Application mobile pour la formation des parajuristes
 * sur les thématiques de santé, droit foncier et violences basées sur le genre.
 * 
 * Signature numérique: "Code 17 puits dans 10 villages en 1995"
 * =========================================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  Users,
  BookOpen, 
  CheckCircle2, 
  ChevronRight, 
  Settings, 
  LogOut, 
  Play, 
  Pause, 
  Download, 
  Award, 
  MessageSquare, 
  ArrowLeft,
  Globe,
  Mic,
  Send,
  Camera,
  FileText,
  Search,
  Library,
  Sparkles,
  Volume2,
  X,
  Key,
  HelpCircle,
  Clock,
  Plus,
  Trash2,
  Edit,
  FilePlus,
  File,
  Video,
  ExternalLink,
  Paperclip,
  Save,
  Image as ImageIcon,
  UserPlus,
  RefreshCw,
  Database as DatabaseIcon,
  Activity,
  Languages,
  ShieldCheck,
  AlertTriangle,
  LocateFixed
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { jsPDF } from 'jspdf';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

import { GlossaryTerm, LegalDocument, CaseStudy, Language, Module, UserProgress, AppSettings, Attachment, User } from './types';
import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

import { Button } from './components/Button';
import { Card } from './components/Card';
import { Input } from './components/Input';
import { Select } from './components/Select';
import { ProgressBar } from './components/ProgressBar';
import { useAppState } from './hooks/useAppState';
import { cn } from './lib/utils';

import { FINAL_EXAM_QUESTIONS } from './data/finalExam';

// Helper for reverse geocoding
const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    // Adding a timeout and cleaner logging
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: {
            'Accept-Language': 'fr' // Prefer French results
        }
    });
    const data = await response.json();
    if (data && data.address) {
      const a = data.address;
      const parts = [];
      
      // Building a descriptive location string
      const landmark = a.tourism || a.amenity || a.historic || a.building || a.shop || a.office;
      const road = a.road || a.pedestrian || a.path;
      const neighborhood = a.neighbourhood || a.suburb || a.quarter || a.village;
      const city = a.city || a.town || a.municipality;

      if (landmark) {
        parts.push(landmark);
      }
      
      if (road) {
        parts.push(road);
      }

      if (neighborhood) {
        parts.push(neighborhood);
      }

      if (city) {
        parts.push(city);
      }
      
      const formatted = parts.slice(0, 3).join(', '); // Keep it concise
      return formatted ? `Près de ${formatted}` : data.display_name;
    }
    return data.display_name || '';
  } catch (err) {
    console.error("Geocoding error:", err);
    return '';
  }
};

// --- Components ---

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// --- Screens ---

const AuthScreen = ({ 
  onRegister, 
  onLogin, 
  onLoginWithGoogle,
  onResetPassword,
  logoUrl,
  isLoading, 
  error 
}: { 
  onRegister: (data: any) => void, 
  onLogin: (phone: string, pass: string) => void,
  onLoginWithGoogle: () => void,
  onResetPassword: (identifier: string) => Promise<boolean>,
  logoUrl?: string,
  isLoading: boolean,
  error: string | null
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password'>('login');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    location: '',
    gender: '',
    birthDate: '',
    educationLevel: '',
    password: '',
    confirmPassword: ''
  });
  const [resetSuccess, setResetSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (mode === 'register') {
      if (!formData.fullName.trim()) {
        setLocalError("Veuillez entrer votre nom complet.");
        return;
      }
      if (!formData.phone && !formData.email) {
        setLocalError("Veuillez renseigner au moins un numéro de téléphone ou un email pour vous inscrire.");
        return;
      }
      if (formData.password.length < 6) {
        setLocalError("Le mot de passe doit faire au moins 6 caractères.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setLocalError("Les mots de passe ne correspondent pas.");
        return;
      }
      onRegister(formData);
    } else if (mode === 'login') {
      const identifier = formData.phone || formData.email;
      if (!identifier) {
        setLocalError("Veuillez entrer votre téléphone ou email.");
        return;
      }
      if (!formData.password) {
        setLocalError("Veuillez entrer votre mot de passe.");
        return;
      }
      onLogin(identifier, formData.password);
    } else if (mode === 'forgot-password') {
      const identifier = formData.phone || formData.email;
      if (!identifier) {
        setLocalError("Veuillez entrer votre téléphone ou email.");
        return;
      }
      const success = await onResetPassword(identifier);
      if (success) {
        setResetSuccess(true);
      }
    }
  };

  const resetMode = mode === 'forgot-password';

  return (
    <div className="min-h-screen p-6 flex flex-col max-w-md mx-auto py-12">
      <div className="mb-8 text-center shrink-0">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden bg-white shadow-sm border border-slate-100 p-2">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo HAI" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          ) : (
            <div className="bg-emerald-100 text-emerald-600 w-full h-full flex items-center justify-center rounded-xl">
              <UserIcon size={32} />
            </div>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {mode === 'login' ? 'Connexion' : mode === 'register' ? 'Inscription' : 'Récupération'}
        </h1>
        <p className="text-slate-500 mt-2">
          {mode === 'login' 
            ? 'Connectez-vous pour retrouver votre progression.' 
            : mode === 'register'
            ? 'Inscrivez-vous pour commencer votre cours en ligne (MOOC) sur le parajuralisme.'
            : 'Entrez votre email ou numéro de téléphone pour recevoir un lien de réinitialisation.'}
        </p>
      </div>

      {resetSuccess ? (
        <div className="bg-emerald-50 text-emerald-700 p-6 rounded-2xl text-center mb-6">
          <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-500" />
          <p className="font-bold text-lg">Vérifiez vos messages</p>
          <p className="text-sm mt-2">Si un compte correspond à cet identifiant, vous recevrez un lien/code pour réinitialiser votre mot de passe.</p>
          <Button variant="outline" className="w-full mt-6" onClick={() => { setResetSuccess(false); setMode('login'); }}>
            Retour à la connexion
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <Input 
              label="Nom complet" 
              placeholder="Ex: Jean Dupont" 
              required 
              value={formData.fullName}
              onChange={e => setFormData({...formData, fullName: e.target.value})}
            />
          )}
          
          <div className="grid grid-cols-1 gap-4">
            <Input 
              label={mode === 'login' || mode === 'forgot-password' ? "Téléphone ou Email" : "Identifiant (Tél ou Email)"} 
              type="text" 
              placeholder={mode === 'register' ? "Ex: +229 ... ou email" : "Votre téléphone ou email"} 
              required={mode === 'register' ? (!formData.email && !formData.phone) : true}
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              helperText={mode === 'register' ? "Utilisez votre numéro de téléphone ou un email au choix." : ""}
            />
            
            {mode === 'register' && (
              <Input 
                label="E-mail ou second numéro (Optionnel)" 
                type="text" 
                placeholder="Autre numéro ou email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                helperText="Ceci facilite la récupération de votre compte."
              />
            )}
          </div>

          {mode === 'register' && (
            <>
              <Input 
                label="Commune / Quartier" 
                placeholder="Ex: Cotonou, Akpakpa" 
                required 
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select 
                  label="Sexe" 
                  options={[
                    { value: 'M', label: 'Masculin' },
                    { value: 'F', label: 'Féminin' }
                  ]} 
                  required
                  value={formData.gender}
                  onChange={e => setFormData({...formData, gender: e.target.value})}
                />
                <Input 
                  label="Date de naissance" 
                  type="date" 
                  required 
                  value={formData.birthDate}
                  onChange={e => setFormData({...formData, birthDate: e.target.value})}
                />
              </div>
              <Select 
                label="Niveau d'instruction" 
                options={[
                  { value: 'aucun', label: 'Aucun' },
                  { value: 'primaire', label: 'Primaire' },
                  { value: 'secondaire', label: 'Secondaire' },
                  { value: 'superieur', label: 'Supérieur' }
                ]} 
                required
                value={formData.educationLevel}
                onChange={e => setFormData({...formData, educationLevel: e.target.value})}
              />
            </>
          )}

          {!resetMode && (
            <Input 
              label="Mot de passe" 
              type="password" 
              placeholder="••••••••" 
              required 
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          )}

          {mode === 'register' && (
            <Input 
              label="Confirmer le mot de passe" 
              type="password" 
              placeholder="••••••••" 
              required 
              value={formData.confirmPassword}
              onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
            />
          )}
          
          {mode === 'login' && (
            <div className="flex justify-end">
              <button 
                type="button"
                onClick={() => setMode('forgot-password')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                Mot de passe oublié ?
              </button>
            </div>
          )}
          
          {(localError || error) && (
            <div className="bg-red-50 border border-red-100 p-3 rounded-xl">
              <p className="text-xs text-red-600 text-center font-medium leading-relaxed">
                {localError || error}
              </p>
            </div>
          )}
          
          <Button type="submit" className="w-full mt-4" isLoading={isLoading}>
            {mode === 'login' ? 'Se connecter' : mode === 'register' ? "S'inscrire" : "Réinitialiser"}
          </Button>

          {mode === 'login' && (
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-50 px-2 text-slate-400 font-bold">Ou Admin</span>
              </div>
            </div>
          )}

          {mode === 'login' && (
            <Button 
              type="button" 
              variant="outline" 
              className="w-full gap-2 border-slate-200 text-slate-600 hover:bg-slate-100" 
              onClick={onLoginWithGoogle}
              isLoading={isLoading}
            >
              <GoogleIcon className="w-4 h-4" />
              Connexion Admin (Google)
            </Button>
          )}
        </form>
      )}

      <div className="mt-8 text-center space-y-4">
        {mode === 'login' && (
          <button 
            onClick={() => setMode('forgot-password')}
            className="block w-full text-sm font-medium text-slate-500 hover:text-emerald-600"
          >
            Mot de passe oublié ?
          </button>
        )}
        
        <button 
          onClick={() => {
            if (mode === 'forgot-password') setMode('login');
            else setMode(mode === 'login' ? 'register' : 'login');
          }}
          className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
        >
          {mode === 'login' 
            ? "Pas encore de compte ? S'inscrire" 
            : mode === 'register'
            ? "Déjà un compte ? Se connecter"
            : "Retour à la connexion"}
        </button>
      </div>
    </div>
  );
};

const LanguageSelectionScreen = ({ onSelect }: { onSelect: (lang: Language) => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-6 flex flex-col max-w-2xl mx-auto text-center py-24"
    >
      <h2 className="text-2xl font-bold mb-8">Choisissez votre langue d'apprentissage</h2>
      <div className="grid gap-4">
        <Card onClick={() => onSelect('fr')} className="flex items-center gap-4 p-6">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <Globe size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-bold">Français</h3>
            <p className="text-xs text-slate-500">Texte + Quiz interactifs</p>
          </div>
          <ChevronRight className="ml-auto text-slate-300" />
        </Card>
        <Card onClick={() => onSelect('fon')} className="flex items-center gap-4 p-6">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
            <Mic size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-bold">Fon</h3>
            <p className="text-xs text-slate-500">Audio uniquement</p>
          </div>
          <ChevronRight className="ml-auto text-slate-300" />
        </Card>
      </div>
    </motion.div>
  );
};

const GlossaryScreen = ({ onBack, glossary }: { onBack: () => void, glossary: GlossaryTerm[] }) => {
  const [search, setSearch] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);

  const filtered = glossary.filter(t => 
    t.term.toLowerCase().includes(search.toLowerCase()) || 
    t.fonTranslation.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-white shrink-0 z-10">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <h2 className="font-bold">Glossaire Juridique</h2>
      </div>

      <div className="p-4 bg-white border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Rechercher un terme..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {filtered.map(term => (
          <Card 
            key={term.id} 
            className="p-4 cursor-pointer hover:border-emerald-500 transition-colors"
            onClick={() => setSelectedTerm(term)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-emerald-700">{term.term}</h3>
                <p className="text-xs font-medium text-orange-600 mt-1 italic">{term.fonTranslation}</p>
              </div>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-bold uppercase">
                {term.category}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <AnimatePresence>
        {selectedTerm && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 z-[60] bg-black/40 flex items-end justify-center p-4"
            onClick={() => setSelectedTerm(null)}
          >
            <motion.div 
              className="bg-white w-full max-w-md rounded-t-3xl p-8 space-y-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedTerm.term}</h2>
                  <p className="text-lg font-semibold text-orange-600 italic">{selectedTerm.fonTranslation}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedTerm(null)}>
                  <X size={24} />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Définition (Français)</h4>
                  <p className="text-sm leading-relaxed text-slate-700">{selectedTerm.definition}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Définition (Fon)</h4>
                    <Volume2 size={16} className="text-orange-400" />
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700">{selectedTerm.fonDefinition}</p>
                </div>
              </div>

              <Button className="w-full py-6 rounded-2xl" onClick={() => setSelectedTerm(null)}>
                J'ai compris
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DocumentsScreen = ({ onBack, documents }: { onBack: () => void, documents: LegalDocument[] }) => {
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(null);

  return (
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-white shrink-0 z-10">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <h2 className="font-bold">Bibliothèque de Modèles</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-24">
        {documents.map(doc => (
          <Card key={doc.id} className="p-5 flex items-start gap-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedDoc(doc)}>
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
              <FileText size={24} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-900 leading-tight">{doc.title}</h3>
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase">{doc.category}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 line-clamp-2">{doc.description}</p>
            </div>
          </Card>
        ))}
      </div>

      <AnimatePresence>
        {selectedDoc && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-white flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setSelectedDoc(null)}>
                  <ArrowLeft size={20} />
                </Button>
                <h2 className="font-bold truncate max-w-[200px]">{selectedDoc.title}</h2>
              </div>
              <div className="flex gap-2">
                {selectedDoc.fileUrl && (
                  <a 
                    href={selectedDoc.fileUrl} 
                    download={selectedDoc.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline" className="gap-2 bg-emerald-50 text-emerald-600 border-emerald-100">
                      <Download size={16} />
                      Modèle
                    </Button>
                  </a>
                )}
                <Button size="sm" className="gap-2">
                  <Download size={16} />
                  PDF
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 flex flex-col">
              {selectedDoc.fileUrl ? (
                <div className="flex-1 flex flex-col gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 truncate max-w-[200px] md:max-w-md">{selectedDoc.fileName}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Document Modèle</p>
                      </div>
                    </div>
                    <a 
                      href={selectedDoc.fileUrl} 
                      download={selectedDoc.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" className="gap-2">
                        <Download size={16} />
                        Télécharger
                      </Button>
                    </a>
                  </div>
                  
                  {selectedDoc.fileUrl.toLowerCase().endsWith('.pdf') ? (
                    <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-inner">
                      <iframe 
                        src={`${selectedDoc.fileUrl}#toolbar=0`} 
                        className="w-full h-full border-none"
                        title={selectedDoc.title}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center p-12 text-center space-y-4">
                      <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300">
                        <FileText size={48} />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-slate-900">Aperçu non disponible</h4>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">Ce type de fichier ne peut pas être prévisualisé directement. Veuillez le télécharger pour le consulter.</p>
                      </div>
                      <a href={selectedDoc.fileUrl} download={selectedDoc.fileName} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="gap-2">
                          <Download size={16} />
                          Télécharger le document
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white p-8 shadow-sm border border-slate-200 rounded-sm min-h-full font-serif text-sm whitespace-pre-wrap leading-relaxed">
                  {selectedDoc.content || "Aucun contenu disponible pour ce modèle."}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ReportingScreen = ({ 
  user, 
  modules, 
  onBack, 
  onComplete,
  saveReport 
}: { 
  user: any, 
  modules: Module[], 
  onBack: () => void,
  onComplete: () => void,
  saveReport: (data: any) => Promise<boolean>
}) => {
  const [reportData, setReportData] = useState<{
    type: string;
    description: string;
    location: string;
    date: string;
    anonymous: boolean;
    audioBlob: Blob | null;
    attachments: File[];
    coordinates: [number, number] | null;
  }>({
    type: '',
    description: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    anonymous: false,
    audioBlob: null,
    attachments: [],
    coordinates: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setReportData(prev => ({
          ...prev,
          coordinates: [lat, lng]
        }));
        
        const address = await reverseGeocode(lat, lng);
        if (address) {
          setReportData(prev => ({ ...prev, location: address }));
        }
        
        setIsLocating(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Impossible de récupérer votre position. Veuillez l'indiquer sur la carte.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleReportSubmit = async () => {
    if (!reportData.type || !reportData.description) {
      alert("Veuillez remplir les champs obligatoires (Type et Description).");
      return;
    }

    setIsSubmitting(true);
    try {
      const reportingModule = modules.find(m => m.isReporting) || modules[modules.length - 1];
      
      const reportPayload = {
        userId: user.phone || user.email,
        moduleId: reportingModule.id,
        type: reportData.type,
        description: reportData.description,
        location: {
          address: reportData.location,
          latitude: reportData.coordinates?.[0],
          longitude: reportData.coordinates?.[1]
        },
        date: reportData.date,
        anonymous: reportData.anonymous,
        // Since we are moving to Firestore directly, handling files requires storage upload first.
        // For now, let's keep the basic data persistence.
      };

      const success = await saveReport(reportPayload);

      if (success) {
        alert("Signalement envoyé avec succès !");
        setReportData({
          type: '',
          description: '',
          location: '',
          date: new Date().toISOString().split('T')[0],
          anonymous: false,
          audioBlob: null,
          attachments: [],
          coordinates: null
        });
        onComplete();
      } else {
        throw new Error("Failed to submit report");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi du signalement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-white shrink-0 z-10">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle size={20} />
          <h2 className="font-bold">Signalement de Cas</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-32">
        <div className="space-y-6">
          <Card className="bg-red-50 border-red-100 p-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <p className="text-xs text-red-800 leading-relaxed font-medium">
                Utilisez cet espace pour signaler des violations de droits ou des situations d'urgence. 
                Vos informations sont sécurisées et traitées avec confidentialité.
              </p>
            </div>
          </Card>

          <Select 
            label="Nature de l'incident" 
            options={[
              { value: '', label: 'Choisir une catégorie...' },
              { value: 'vbg', label: 'Violences Basées sur le Genre (VBG)' },
              { value: 'justice', label: 'Déni de Justice / Corruption' },
              { value: 'sante', label: 'Violation Droit à la Santé' },
              { value: 'foncier', label: 'Conflit Foncier' },
              { value: 'enfance', label: 'Protection de l\'Enfant' },
              { value: 'autre', label: 'Autre cas communautaire' }
            ]}
            value={reportData.type}
            onChange={e => setReportData({...reportData, type: e.target.value})}
            required
          />

          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description détaillée</label>
              <span className={cn("text-[10px] font-bold", reportData.description.length > 0 ? "text-emerald-500" : "text-slate-300")}>
                {reportData.description.length} caractères
              </span>
            </div>
            <textarea 
              className="w-full p-4 bg-white border border-slate-200 rounded-2xl min-h-[140px] text-sm focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all shadow-sm"
              placeholder="Expliquez ce qui s'est passé, qui est impliqué, etc."
              value={reportData.description}
              onChange={e => setReportData({...reportData, description: e.target.value})}
              required
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Témoignage Audio</label>
            <AudioRecorder onRecordingComplete={(blob) => setReportData({...reportData, audioBlob: blob})} />
            {reportData.audioBlob && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Message vocal prêt à l'envoi</p>
                <button 
                  onClick={() => setReportData({...reportData, audioBlob: null})}
                  className="ml-auto text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Localisation GPS</label>
              <button 
                onClick={getCurrentLocation}
                disabled={isLocating}
                className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors"
              >
                <LocateFixed size={12} />
                {isLocating ? "Localisation..." : "Ma position actuelle"}
              </button>
            </div>
            <LocationPicker 
              initialLocation={reportData.coordinates} 
              onLocationSelect={async (lat, lng) => {
                setReportData(prev => ({...prev, coordinates: [lat, lng]}));
                const address = await reverseGeocode(lat, lng);
                if (address) {
                  setReportData(prev => ({...prev, location: address}));
                }
              }} 
            />
            <Input 
              label="Repères géographiques (Enceinte, bâtiment, etc.)" 
              placeholder="Ex: Près de l'église, quartier Akpakpa..." 
              value={reportData.location}
              onChange={e => setReportData({...reportData, location: e.target.value})}
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Fichiers & Multimédia</label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col items-center justify-center p-6 bg-white border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-red-300 hover:bg-red-50 transition-all group">
                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-red-100 group-hover:text-red-500 transition-colors mb-2">
                  <Camera size={20} />
                </div>
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-red-600">Ajouter photos/PDF</span>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,.pdf" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files) {
                      setReportData({
                        ...reportData, 
                        attachments: [...reportData.attachments, ...Array.from(e.target.files)]
                      });
                    }
                  }}
                />
              </label>
              <div className="space-y-2">
                {reportData.attachments.length > 0 ? (
                  reportData.attachments.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl text-[10px] shadow-sm">
                      <div className="flex items-center gap-2 truncate">
                        <ImageIcon size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate max-w-[80px] font-medium">{file.name}</span>
                      </div>
                      <button 
                        className="p-1 hover:bg-red-50 rounded-full text-red-500"
                        onClick={() => setReportData({
                          ...reportData,
                          attachments: reportData.attachments.filter((_, idx) => idx !== i)
                        })}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center p-4 border-2 border-dashed border-slate-100 rounded-2xl">
                    <p className="text-[10px] text-slate-300 font-medium text-center italic leading-tight">
                      Aucun fichier sélectionné
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Date de l'incident" 
              type="date" 
              value={reportData.date}
              onChange={e => setReportData({...reportData, date: e.target.value})}
            />
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Anonymat</label>
              <button 
                onClick={() => setReportData({...reportData, anonymous: !reportData.anonymous})}
                className={cn(
                  "w-full flex items-center justify-between p-3 border rounded-xl transition-all",
                  reportData.anonymous ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"
                )}
              >
                <span className="text-xs font-bold">{reportData.anonymous ? "Anonyme" : "Identifié"}</span>
                {reportData.anonymous ? <ShieldCheck size={16} className="text-emerald-400" /> : <UserIcon size={16} />}
              </button>
            </div>
          </div>

          <Button 
            className="w-full h-16 text-lg font-bold shadow-xl shadow-red-500/20 bg-red-600 hover:bg-red-700 rounded-2xl" 
            onClick={handleReportSubmit}
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Envoi en cours..." : "Transmettre le Signalement"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const CaseStudiesScreen = ({ 
  onBack, 
  progress, 
  caseStudies,
  isSyncing,
  onComplete 
}: { 
  onBack: () => void, 
  progress: UserProgress, 
  caseStudies: CaseStudy[],
  isSyncing: boolean,
  onComplete: (id: string) => void 
}) => {
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null);
  const [userChoice, setUserChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleChoice = (optionId: string) => {
    setUserChoice(optionId);
    setShowFeedback(true);
    const option = selectedCase?.options.find(o => o.id === optionId);
    if (option?.isCorrect && selectedCase) {
      onComplete(selectedCase.id);
    }
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-white shrink-0 z-10">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <h2 className="font-bold">Études de Cas Interactives</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-24">
        {caseStudies.map(cs => {
          const isDone = progress.completedCaseStudies.includes(cs.id);
          return (
            <Card 
              key={cs.id} 
              className="p-5 flex items-start gap-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedCase(cs);
                setUserChoice(null);
                setShowFeedback(false);
              }}
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                isDone ? "bg-emerald-100 text-emerald-600" : "bg-purple-100 text-purple-600"
              )}>
                {isDone ? <CheckCircle2 size={24} /> : <HelpCircle size={24} />}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 leading-tight">{cs.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{cs.description}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedCase && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[60] bg-white flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-white shrink-0">
              <Button variant="ghost" size="icon" onClick={() => setSelectedCase(null)}>
                <ArrowLeft size={20} />
              </Button>
              <h2 className="font-bold truncate">{selectedCase.title}</h2>
              {isSyncing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1 text-[8px] font-bold text-emerald-500 uppercase tracking-tighter bg-emerald-50 px-1.5 py-0.5 rounded-full"
                >
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                  Sauvegarde...
                </motion.div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scénario</h4>
                  {selectedCase.fileUrl && (
                    <a 
                      href={selectedCase.fileUrl} 
                      download={selectedCase.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors"
                    >
                      <Download size={12} />
                      Télécharger
                    </a>
                  )}
                </div>
                
                {selectedCase.fileUrl ? (
                  <div className="space-y-4">
                    {selectedCase.fileUrl.toLowerCase().endsWith('.pdf') ? (
                      <div className="aspect-[3/4] w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <iframe 
                          src={`${selectedCase.fileUrl}#toolbar=0`} 
                          className="w-full h-full border-none"
                          title={selectedCase.title}
                        />
                      </div>
                    ) : (
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300">
                          <FileText size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{selectedCase.fileName}</p>
                          <p className="text-[10px] text-slate-500">Document d'étude de cas</p>
                        </div>
                        <a href={selectedCase.fileUrl} download={selectedCase.fileName} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="gap-2">
                            <Download size={14} />
                            Ouvrir le fichier
                          </Button>
                        </a>
                      </div>
                    )}
                    {selectedCase.scenario && (
                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-500 italic">Note: Le scénario complet est détaillé dans le document ci-dessus.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-slate-700">{selectedCase.scenario || "Aucun scénario disponible."}</p>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Que conseillez-vous ?</h4>
                {selectedCase.options.map(opt => (
                  <button
                    key={opt.id}
                    disabled={showFeedback}
                    onClick={() => handleChoice(opt.id)}
                    className={cn(
                      "w-full p-4 rounded-2xl text-left text-sm transition-all border-2",
                      userChoice === opt.id 
                        ? (opt.isCorrect ? "border-emerald-500 bg-emerald-50" : "border-red-500 bg-red-50")
                        : "border-slate-100 bg-white hover:border-slate-200"
                    )}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>

              {showFeedback && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-6 rounded-3xl border",
                    selectedCase.options.find(o => o.id === userChoice)?.isCorrect 
                      ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                      : "bg-red-50 border-red-100 text-red-800"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {selectedCase.options.find(o => o.id === userChoice)?.isCorrect 
                      ? <CheckCircle2 size={20} /> 
                      : <X size={20} />}
                    <span className="font-bold">
                      {selectedCase.options.find(o => o.id === userChoice)?.isCorrect ? "Correct !" : "Pas tout à fait..."}
                    </span>
                  </div>
                  <p className="text-sm">{selectedCase.options.find(o => o.id === userChoice)?.feedback}</p>
                  
                  {selectedCase.options.find(o => o.id === userChoice)?.isCorrect && (
                    <Button className="w-full mt-6" onClick={() => setSelectedCase(null)}>
                      Continuer
                    </Button>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PerformanceScreen = ({ 
  progress, 
  modules,
  caseStudies,
  onBack 
}: { 
  progress: UserProgress, 
  modules: Module[],
  caseStudies: CaseStudy[],
  onBack: () => void 
}) => {
  const chartData = modules.map(m => ({
    name: `M${m.id}`,
    score: progress.quizScores[m.id] || 0
  }));

  const stats = [
    { label: 'Modules validés', value: progress.completedModules.length, total: modules.length, color: 'emerald' },
    { label: 'Études de cas', value: progress.completedCaseStudies.length, total: caseStudies.length, color: 'purple' },
    { label: 'Score moyen quiz', value: `${Math.round(Object.values(progress.quizScores).reduce((a: number, b: number) => a + b, 0) / (Object.keys(progress.quizScores).length || 1))}%`, color: 'blue' }
  ];

  return (
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-white shrink-0 z-10">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <h2 className="font-bold">Suivi de Performance</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-24">
        <div className="grid grid-cols-1 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} className="p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <h3 className={cn("text-3xl font-bold", `text-${stat.color}-600`)}>{stat.value}</h3>
                {stat.total && <span className="text-slate-400 text-sm">/ {stat.total}</span>}
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <h4 className="text-sm font-bold mb-6">Progression des Quiz</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#10b981' : '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {progress.finalExamScore !== undefined && (
          <Card className="p-6 bg-emerald-900 text-white border-none">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold">Examen Final</h4>
                <p className="text-emerald-300 text-xs">Validé le {new Date(progress.finalExamDate!).toLocaleDateString()}</p>
              </div>
              <Award className="text-yellow-400" size={32} />
            </div>
            <div className="text-5xl font-bold mb-2">{progress.finalExamScore}%</div>
            <p className="text-emerald-100 text-xs">Excellent travail ! Vous avez démontré une maîtrise complète du programme.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

const FinalExamScreen = ({ 
  onBack, 
  onComplete,
  onDownloadCertificate,
  modules
}: { 
  onBack: () => void, 
  onComplete: (score: number) => void,
  onDownloadCertificate: () => void,
  modules: Module[]
}) => {
  const [step, setStep] = useState<'intro' | 'exam' | 'result'>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes

  // Generate random questions from all modules or use dedicated final exam questions
  const [examQuestions] = useState(() => {
    return [...FINAL_EXAM_QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 20);
  });

  useEffect(() => {
    let timer: any;
    if (step === 'exam' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && step === 'exam') {
      handleFinish();
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const handleAnswer = (index: number) => {
    const q = examQuestions[currentQuestion];
    const isMulti = Array.isArray(q.correctAnswer);
    
    if (isMulti) {
      const currentAnswers = (answers[currentQuestion] as unknown as number[]) || [];
      const newAnswers = currentAnswers.includes(index)
        ? currentAnswers.filter(a => a !== index)
        : [...currentAnswers, index];
      
      const updatedAnswers = [...answers];
      updatedAnswers[currentQuestion] = newAnswers as any;
      setAnswers(updatedAnswers);
    } else {
      const updatedAnswers = [...answers];
      updatedAnswers[currentQuestion] = index;
      setAnswers(updatedAnswers);
      
      // Auto-advance for single choice
      if (currentQuestion < examQuestions.length - 1) {
        setTimeout(() => setCurrentQuestion(prev => prev + 1), 300);
      }
    }
  };

  const handleFinish = () => {
    let correct = 0;
    examQuestions.forEach((q, i) => {
      const answer = answers[i];
      if (Array.isArray(q.correctAnswer)) {
        const userAnswer = Array.isArray(answer) ? answer : [];
        const isCorrect = userAnswer.length === q.correctAnswer.length && 
                         userAnswer.every(val => (q.correctAnswer as number[]).includes(val));
        if (isCorrect) correct++;
      } else {
        if (answer === q.correctAnswer) correct++;
      }
    });
    const score = Math.round((correct / examQuestions.length) * 100);
    onComplete(score);
    setStep('result');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (step === 'intro') {
    return (
      <div className="h-full bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mb-6">
          <Award size={40} />
        </div>
        <h2 className="text-2xl font-bold mb-4">Examen Final de Certification</h2>
        <p className="text-slate-500 mb-8 max-w-xs">
          Cet examen comporte 20 questions couvrant l'ensemble de la formation. Vous avez 15 minutes pour terminer.
          {FINAL_EXAM_QUESTIONS.length > 20 && (
             <p className="text-slate-501 mt-2">Note: Les questions sont tirées aléatoirement d'une banque de {FINAL_EXAM_QUESTIONS.length} questions.</p>
          )}
        </p>
        <div className="space-y-3 w-full max-w-xs">
          <Button className="w-full py-6 rounded-2xl" onClick={() => setStep('exam')}>
            Commencer l'examen
          </Button>
          <Button variant="ghost" className="w-full" onClick={onBack}>
            Plus tard
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'result') {
    const score = Math.round((examQuestions.filter((q, i) => {
      const answer = answers[i];
      if (Array.isArray(q.correctAnswer)) {
        const userAnswer = Array.isArray(answer) ? answer : [];
        return userAnswer.length === q.correctAnswer.length && 
               userAnswer.every(val => (q.correctAnswer as number[]).includes(val));
      }
      return answer === q.correctAnswer;
    }).length / examQuestions.length) * 100);

    return (
      <div className="h-full bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
        <div className={cn(
          "w-20 h-20 rounded-3xl flex items-center justify-center mb-6",
          score >= 80 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
        )}>
          {score >= 80 ? <Award size={40} /> : <X size={40} />}
        </div>
        <h2 className="text-3xl font-bold mb-2">{score}%</h2>
        <h3 className="text-xl font-bold mb-4">
          {score >= 80 ? "Félicitations !" : "Presque..."}
        </h3>
        <p className="text-slate-500 mb-8 max-w-xs">
          {score >= 80 
            ? "Vous avez réussi l'examen final. Votre certificat est maintenant disponible."
            : "Vous n'avez pas atteint le score minimum de 80%. Révisez les modules et réessayez plus tard."}
        </p>
        <div className="w-full max-w-xs space-y-3">
          {score >= 80 && (
            <Button className="w-full py-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2" onClick={onDownloadCertificate}>
              <Download size={20} /> Télécharger mon certificat
            </Button>
          )}
          <Button variant="ghost" className="w-full py-6 rounded-2xl" onClick={onBack}>
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-slate-400">Question {currentQuestion + 1}/{examQuestions.length}</span>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold",
          timeLeft < 60 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600"
        )}>
          <Clock size={14} />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="p-8 flex-1 overflow-y-auto space-y-8">
        <h3 className="text-xl font-bold leading-tight text-slate-900">
          {examQuestions[currentQuestion].question}
        </h3>

        <div className="space-y-3">
          {examQuestions[currentQuestion].options.map((opt, i) => {
            const isSelected = Array.isArray(examQuestions[currentQuestion].correctAnswer)
              ? (answers[currentQuestion] as unknown as number[])?.includes(i)
              : answers[currentQuestion] === i;
              
            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className={cn(
                  "w-full p-5 rounded-2xl text-left text-sm transition-all border-2",
                  isSelected 
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900" 
                    : "border-slate-100 bg-white hover:border-slate-200"
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{opt}</span>
                  {isSelected && <CheckCircle2 size={18} className="text-emerald-500" />}
                </div>
              </button>
            );
          })}
        </div>
        {Array.isArray(examQuestions[currentQuestion].correctAnswer) && (
          <p className="text-xs text-slate-500 italic">Cette question peut avoir plusieurs bonnes réponses.</p>
        )}
      </div>

      <div className="p-6 border-t border-slate-100 flex justify-between items-center">
        <Button 
          variant="ghost" 
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion(prev => prev - 1)}
        >
          Précédent
        </Button>
        {currentQuestion === examQuestions.length - 1 ? (
          <Button onClick={handleFinish}>Terminer</Button>
        ) : (
          <Button variant="ghost" onClick={() => setCurrentQuestion(prev => prev + 1)}>Suivant</Button>
        )}
      </div>
    </div>
  );
};
const Dashboard = ({ 
  user, 
  progress, 
  modules,
  caseStudies,
  isSyncing,
  onSelectModule, 
  onOpenSettings,
  onOpenCases,
  onOpenPerformance,
  onOpenExam,
  onDownloadCertificate,
  onForceSync,
  updateLastActivity
}: { 
  user: any, 
  progress: any, 
  modules: Module[],
  caseStudies: CaseStudy[],
  isSyncing: boolean,
  onSelectModule: (m: Module) => void,
  onOpenSettings: () => void,
  onOpenCases: () => void,
  onOpenPerformance: () => void,
  onOpenExam: () => void,
  onDownloadCertificate: () => void,
  onForceSync: () => void,
  updateLastActivity: (activity: string, id: number) => void
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const totalModules = modules.length;
  const completedCount = progress.completedModules.length;
  const percentage = totalModules > 0 ? (completedCount / totalModules) * 100 : 0;
  const isFullyCompleted = progress.finalExamScore !== undefined && progress.finalExamScore >= 80;

  const filteredModules = modules.filter(module => {
    const query = searchQuery.toLowerCase();
    return (
      module.title.toLowerCase().includes(query) ||
      (module.introduction || '').toLowerCase().includes(query) ||
      module.keyNotions?.some(notion => notion.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-8 sticky top-0 z-10 border-b border-slate-100">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tableau de bord</p>
              {isSyncing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1 text-[8px] font-bold text-emerald-500 uppercase tracking-tighter bg-emerald-50 px-1.5 py-0.5 rounded-full"
                >
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                  Synchronisation en cours...
                </motion.div>
              )}
            </div>
            <h1 className="text-2xl font-bold">Bonjour, {user.fullName.split(' ')[0]}</h1>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("text-slate-400", isSyncing && "animate-spin text-emerald-500")}
              onClick={onForceSync}
              title="Forcer la synchronisation"
            >
              <Activity size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onOpenSettings}>
              <Settings size={20} />
            </Button>
          </div>
        </div>
        
        <Card className="bg-emerald-600 text-white border-none p-6 overflow-hidden relative mb-6">
          <div className="relative z-10">
            <p className="text-emerald-100 text-xs font-medium mb-1">Votre progression globale</p>
            <div className="flex items-baseline gap-2 mb-4">
              <h2 className="text-4xl font-bold">{Math.round(percentage)}%</h2>
              <span className="text-emerald-200 text-xs font-medium">({completedCount}/{totalModules} modules)</span>
            </div>
            <div className="h-2.5 w-full bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-1000 ease-out" 
                style={{ width: `${percentage}%` }}
              />
            </div>
            {percentage === 100 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/30 flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 shrink-0">
                  <Award size={18} />
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-bold leading-tight">
                    Félicitations ! Vous avez terminé tous les modules.
                  </p>
                  {isFullyCompleted ? (
                    <Button 
                      size="sm" 
                      className="bg-white text-emerald-600 hover:bg-emerald-50 h-7 text-[10px] font-bold py-0"
                      onClick={onDownloadCertificate}
                    >
                      <Download size={12} className="mr-1" /> Télécharger le certificat
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      className="bg-yellow-400 text-yellow-900 hover:bg-yellow-300 h-7 text-[10px] font-bold py-0"
                      onClick={onOpenExam}
                    >
                      Passer l'examen final
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <Award size={120} />
          </div>
        </Card>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Rechercher un module ou un mot-clé..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Quick Actions / Performance */}
      <div className="px-6 mb-8">
        {/* Resume Activity Card */}
        {progress.lastModuleId > 0 && !searchQuery && (
          (() => {
            const lastModule = modules.find(m => m.id === progress.lastModuleId);
            if (!lastModule) return null;
            const isCompleted = progress.completedModules.includes(lastModule.id);
            
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
              >
                <Card 
                  className="p-4 bg-emerald-50 border-emerald-100 flex items-center gap-4 cursor-pointer hover:bg-emerald-100 transition-colors shadow-sm"
                  onClick={() => onSelectModule(lastModule)}
                >
                  <div className="w-12 h-12 bg-white text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-emerald-50">
                    <Play size={24} fill="currentColor" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Continuer mon cours</span>
                      {isCompleted && <CheckCircle2 size={10} className="text-emerald-500" />}
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 truncate">
                      {lastModule.id}. {lastModule.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 truncate italic">
                      {progress.lastActivity || "Reprendre là où vous vous êtes arrêté"}
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded-full text-emerald-600 shadow-sm border border-emerald-50">
                    <ChevronRight size={16} />
                  </div>
                </Card>
              </motion.div>
            );
          })()
        )}

        <div className="grid grid-cols-2 gap-4">
          <Card 
            className="p-4 bg-purple-50 border-purple-100 cursor-pointer hover:bg-purple-100 transition-colors"
            onClick={onOpenCases}
          >
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-3">
              <HelpCircle size={20} />
            </div>
            <h4 className="font-bold text-sm text-purple-900">Études de Cas</h4>
            <p className="text-[10px] text-purple-600 mt-1">{progress.completedCaseStudies.length} terminées</p>
          </Card>
          
          <Card 
            className="p-4 bg-blue-50 border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors"
            onClick={onOpenPerformance}
          >
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-3">
              <Sparkles size={20} />
            </div>
            <h4 className="font-bold text-sm text-blue-900">Performance</h4>
            <p className="text-[10px] text-blue-600 mt-1">Voir mes stats</p>
          </Card>
        </div>

        {percentage === 100 && progress.finalExamScore === undefined && (
          <Card 
            className="mt-4 p-4 bg-yellow-50 border-yellow-200 cursor-pointer hover:bg-yellow-100 transition-colors flex items-center gap-4"
            onClick={onOpenExam}
          >
            <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center shrink-0">
              <Award size={24} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-yellow-900">Passer l'Examen Final</h4>
              <p className="text-[10px] text-yellow-700 mt-0.5">Obtenez votre certification officielle</p>
            </div>
            <ChevronRight size={18} className="ml-auto text-yellow-400" />
          </Card>
        )}
      </div>

      {/* Modules List */}
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            {searchQuery ? `Résultats (${filteredModules.length})` : "Modules de formation"}
          </h3>
        </div>
        
        {filteredModules.length > 0 ? (
          filteredModules.map((module) => {
            const isCompleted = progress.completedModules.includes(module.id);
            return (
              <Card 
                key={module.id} 
                onClick={() => onSelectModule(module)}
                className="flex items-center gap-4"
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                  isCompleted ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                )}>
                  {isCompleted ? <CheckCircle2 size={20} /> : module.id}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm leading-tight">{module.title}</h4>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                    <div className={cn(
                      "h-full transition-all duration-500 w-full",
                      isCompleted ? "bg-emerald-500" : "bg-slate-300"
                    )} />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-[10px] text-slate-400">
                      {module.isReporting ? "Signalement" : user.preferredLanguage === 'fr' ? "Texte + Quiz" : "Audio"}
                    </p>
                    {module.estimatedDuration && (
                      <>
                        <span className="text-[10px] text-slate-300">•</span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock size={10} />
                          {module.estimatedDuration} min
                        </div>
                      </>
                    )}
                    {module.difficultyLevel && (
                      <>
                        <span className="text-[10px] text-slate-300">•</span>
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                          module.difficultyLevel === 'Débutant' ? "bg-emerald-50 text-emerald-600" :
                          module.difficultyLevel === 'Intermédiaire' ? "bg-blue-50 text-blue-600" :
                          "bg-orange-50 text-orange-600"
                        )}>
                          {module.difficultyLevel}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </Card>
            );
          })
        ) : (
          <div className="py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Search size={32} />
            </div>
            <p className="text-slate-500 font-medium">Aucun module trouvé</p>
            <p className="text-slate-400 text-xs mt-1">Essayez d'autres mots-clés</p>
          </div>
        )}
      </div>
      
    </div>
  );
};

const LocationPicker = ({ onLocationSelect, initialLocation }: { onLocationSelect: (lat: number, lng: number) => void, initialLocation: [number, number] | null }) => {
  const [position, setPosition] = useState<[number, number] | null>(initialLocation);

  useEffect(() => {
    if (initialLocation) {
      setPosition(initialLocation);
    }
  }, [initialLocation]);

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  const ChangeView = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
      map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
  };

  return (
    <div className="h-[200px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner group transition-all focus-within:border-red-400">
      <MapContainer center={position || [6.3654, 2.4333]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapEvents />
        {position && (
          <>
            <ChangeView center={position} />
            <Marker position={position} />
          </>
        )}
      </MapContainer>
      {!position && (
        <div className="absolute inset-0 bg-slate-900/10 pointer-events-none flex items-center justify-center">
          <p className="text-[10px] font-bold text-slate-600 bg-white/90 px-3 py-1.5 rounded-full shadow-sm">
            Cliquez sur la carte pour marquer le lieu
          </p>
        </div>
      )}
    </div>
  );
};

const AudioRecorder = ({ onRecordingComplete }: { onRecordingComplete: (blob: Blob) => void }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording", err);
      alert("L'accès au microphone est nécessaire pour l'enregistrement vocal.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full">
      {!isRecording ? (
        <button 
          onClick={startRecording}
          className="w-full group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-red-300 hover:bg-red-50 transition-all shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
              <Mic size={20} />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-700">Enregistrer un témoignage</p>
              <p className="text-[10px] text-slate-400 font-medium">Appuyez pour commencer</p>
            </div>
          </div>
          <div className="w-8 h-8 flex items-center justify-center text-slate-300 group-hover:text-red-400 transition-colors">
            <div className="w-2 h-2 bg-slate-300 rounded-full group-hover:bg-red-400" />
          </div>
        </button>
      ) : (
        <button 
          onClick={stopRecording}
          className="w-full flex items-center justify-between p-4 bg-red-600 border border-red-500 rounded-2xl animate-pulse shadow-lg shadow-red-500/30"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full animate-ping" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-white">Enregistrement en cours...</p>
              <p className="text-[10px] text-red-100 font-bold tracking-widest">{formatTime(recordingTime)}</p>
            </div>
          </div>
          <div className="p-2 bg-white/20 rounded-full text-white">
            <Pause size={16} />
          </div>
        </button>
      )}
    </div>
  );
};

const ModuleDetail = ({ 
  module, 
  user, 
  progress, 
  isSyncing,
  onBack, 
  onComplete,
  onNext
}: { 
  module: Module, 
  user: any, 
  progress: any, 
  isSyncing: boolean,
  onBack: () => void,
  onComplete: (score?: number) => void,
  onNext?: () => void 
}) => {
  const [view, setView] = useState<'content' | 'quiz' | 'reporting'>('content');
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number | number[]>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioFinished, setAudioFinished] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setAudioFinished(false);
    setAudioCurrentTime(0);
    setAudioPlaying(false);
  }, [module.id]);

  // Reporting form state
  const [reportData, setReportData] = useState<{
    type: string;
    description: string;
    location: string;
    date: string;
    anonymous: boolean;
    audioBlob: Blob | null;
    attachments: File[];
    coordinates: [number, number] | null;
  }>({
    type: '',
    description: '',
    location: '',
    date: '',
    anonymous: false,
    audioBlob: null,
    attachments: [],
    coordinates: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReportSubmit = async () => {
    if (!reportData.type || !reportData.description) {
      alert("Veuillez remplir les champs obligatoires.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('id', Math.random().toString(36).substr(2, 9));
      formData.append('userId', user.phone || user.email);
      formData.append('moduleId', module.id.toString());
      formData.append('type', reportData.type);
      formData.append('description', reportData.description);
      formData.append('location', JSON.stringify({
        address: reportData.location,
        latitude: reportData.coordinates?.[0],
        longitude: reportData.coordinates?.[1]
      }));
      formData.append('date', reportData.date);
      formData.append('anonymous', reportData.anonymous.toString());

      if (reportData.audioBlob) {
        formData.append('audio', reportData.audioBlob, 'report-audio.webm');
      }

      reportData.attachments.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await fetch('/api/reports', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        alert("Signalement envoyé avec succès !");
        onComplete();
      } else {
        throw new Error("Failed to submit report");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi du signalement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuizSubmit = () => {
    if (!module.quiz) return;
    let correct = 0;
    module.quiz.forEach(q => {
      const answer = quizAnswers[q.id];
      if (Array.isArray(q.correctAnswer)) {
        const userAnswer = Array.isArray(answer) ? (answer as number[]) : [];
        const isCorrect = userAnswer.length === q.correctAnswer.length && 
                         userAnswer.every(val => (q.correctAnswer as number[]).includes(val));
        if (isCorrect) correct++;
      } else {
        if (answer === q.correctAnswer) correct++;
      }
    });
    const score = (correct / module.quiz.length) * 100;
    setQuizSubmitted(true);
    if (score >= 80) {
      onComplete(score);
    }
  };

  const downloadCourse = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(module.title, 20, 20);
    doc.setFontSize(12);
    doc.text(`MOOC Droit & Parajuralisme - Module ${module.id}`, 20, 30);
    
    let y = 50;
    if (module.introduction) {
      doc.setFontSize(14);
      doc.text('Introduction', 20, y);
      y += 10;
      doc.setFontSize(10);
      const splitIntro = doc.splitTextToSize(module.introduction, 170);
      doc.text(splitIntro, 20, y);
      y += splitIntro.length * 5 + 10;
    }

    if (module.content) {
      doc.setFontSize(14);
      doc.text('Contenu du cours', 20, y);
      y += 10;
      doc.setFontSize(10);
      const splitContent = doc.splitTextToSize(module.content, 170);
      doc.text(splitContent, 20, y);
    }

    doc.save(`Cours_Module_${module.id}.pdf`);
  };

  useEffect(() => {
    if (audioRef.current && audioCurrentTime > 0 && !audioPlaying) {
      audioRef.current.currentTime = audioCurrentTime;
    }
  }, [view]);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (audioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setAudioPlaying(!audioPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleAudioEnded = () => {
    setAudioPlaying(false);
    setAudioFinished(true);
  };

  const markdownComponents = {
    img: ({ node, ...props }: any) => (
      <div className="my-6">
        <img 
          {...props} 
          className="max-w-full h-auto rounded-3xl mx-auto block shadow-xl border-4 border-white" 
          referrerPolicy="no-referrer"
        />
        {props.title && <span className="text-center text-[10px] font-bold text-slate-400 mt-2 italic block">{props.title}</span>}
      </div>
    ),
    video: ({ src, title }: any) => (
      <div className="my-8 space-y-3">
        <div className="aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
          <video src={src} controls className="w-full h-full" referrerPolicy="no-referrer" />
        </div>
        {title && <span className="text-center text-[10px] font-bold text-slate-400 italic block">Vidéo: {title}</span>}
      </div>
    ),
    p: ({ node, children, ...props }: any) => {
      const childrenArray = React.Children.toArray(children);
      if (childrenArray.length === 1 && typeof childrenArray[0] === 'string') {
        const text = childrenArray[0] as string;
        const videoMatch = text.match(/@\[video\]\((.*?)\)/i) || text.match(/<video src="(.*?)".*?>/i);
        if (videoMatch) {
          return <markdownComponents.video src={videoMatch[1]!} />;
        }
      }
      
      return <div {...props} className="leading-relaxed mb-4 text-sm text-slate-700">{children}</div>;
    },
    a: ({ node, ...props }: any) => {
      const isVideo = props.href?.match(/\.(mp4|webm|ogg)$/i);
      if (isVideo) {
        return <markdownComponents.video src={props.href} title={props.children} />;
      }
      return <a {...props} className="text-emerald-600 hover:underline font-bold underline-offset-2" target="_blank" rel="noopener noreferrer" />;
    }
  };

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-4 shrink-0 bg-white z-10">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <h2 className="font-bold text-sm truncate">{module.title}</h2>
        {isSyncing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1 text-[8px] font-bold text-emerald-500 uppercase tracking-tighter bg-emerald-50 px-1.5 py-0.5 rounded-full"
          >
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
            Sauvegarde...
          </motion.div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={downloadCourse} title="Télécharger le cours">
            <Download size={18} />
          </Button>
          {progress.completedModules.includes(module.id) && (
            <div className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shrink-0">
              <CheckCircle2 size={12} /> Validé
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24">
        {view === 'content' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {/* Common Header Info */}
            <div className="space-y-6">
              {user.preferredLanguage === 'fr' && (
                <div className="flex flex-wrap gap-2">
                  {module.estimatedDuration && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                      <Clock size={12} />
                      {module.estimatedDuration} minutes
                    </div>
                  )}
                  {module.difficultyLevel && (
                    <div className={cn(
                      "text-[10px] font-bold px-3 py-1.5 rounded-full",
                      module.difficultyLevel === 'Débutant' ? "bg-emerald-50 text-emerald-600" :
                      module.difficultyLevel === 'Intermédiaire' ? "bg-blue-50 text-blue-600" :
                      "bg-orange-50 text-orange-600"
                    )}>
                      Niveau {module.difficultyLevel}
                    </div>
                  )}
                </div>
              )}

              {/* Objectives Banner */}
              {user.preferredLanguage === 'fr' && (
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Award size={18} className="text-emerald-600" />
                    <h3 className="text-emerald-900 font-bold text-sm">Objectifs pédagogiques</h3>
                  </div>
                  <ul className="space-y-2">
                    {module.objectives?.map((obj, i) => (
                      <li key={i} className="text-xs text-emerald-800 flex gap-2 items-start">
                        <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" /> 
                        <span className="leading-tight font-medium">{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Fon Specific Audio Player Section */}
              {user.preferredLanguage !== 'fr' && module.audioUrl && (
                <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 shadow-lg shadow-orange-200/20 space-y-6 relative overflow-hidden group">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-orange-200/20 rounded-full blur-2xl group-hover:bg-orange-200/40 transition-all duration-500" />
                  
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shrink-0 shadow-inner">
                      {audioPlaying ? <div className="flex gap-0.5 items-end h-6">
                        <div className="w-1 bg-orange-500 rounded-full animate-[bounce_0.6s_infinite]" style={{height: '60%'}} />
                        <div className="w-1 bg-orange-500 rounded-full animate-[bounce_0.8s_infinite]" style={{height: '100%'}} />
                        <div className="w-1 bg-orange-500 rounded-full animate-[bounce_0.5s_infinite]" style={{height: '40%'}} />
                        <div className="w-1 bg-orange-500 rounded-full animate-[bounce_1s_infinite]" style={{height: '80%'}} />
                      </div> : <Volume2 size={24} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-orange-950">Traduction Parallèle (Fon)</h4>
                      <p className="text-[10px] text-orange-700 font-medium italic">Écoutez la version audio pour mieux comprendre</p>
                    </div>
                  </div>

                  <audio 
                    ref={audioRef} 
                    src={module.audioUrl} 
                    onEnded={handleAudioEnded}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    className="hidden"
                  />

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Button 
                        className="w-12 h-12 rounded-xl shadow-md bg-orange-600 hover:bg-orange-700 shrink-0"
                        onClick={toggleAudio}
                      >
                        {audioPlaying ? <Pause size={20} /> : <Play size={20} />}
                      </Button>
                      <div className="flex-1 space-y-2">
                        <div className="h-1.5 w-full bg-orange-200/50 rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const ratio = x / rect.width;
                          if (audioRef.current) audioRef.current.currentTime = ratio * audioDuration;
                        }}>
                          <div 
                            className="h-full bg-orange-500 transition-all duration-300" 
                            style={{ width: `${(audioCurrentTime / audioDuration) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-orange-700/60 tabular-nums">
                          <span>{formatTime(audioCurrentTime)}</span>
                          <span>-{formatTime(audioDuration - audioCurrentTime)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Common Learning Content */}
              <div className="space-y-8">
                {user.preferredLanguage === 'fr' && module.keyNotions && module.keyNotions.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shrink-0 shadow-sm border border-blue-50">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h3 className="text-blue-900 font-bold text-xs mb-2 uppercase tracking-wider">Concept clés à retenir</h3>
                      <div className="flex flex-wrap gap-2">
                        {module.keyNotions.map((notion, i) => (
                          <span key={i} className="text-[10px] font-bold bg-white text-blue-700 px-3 py-1.5 rounded-full border border-blue-100 shadow-sm">
                            {notion}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {module.videoUrl && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Video size={14} /> Tutoriel Vidéo
                    </h3>
                    <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                      <video 
                        src={module.videoUrl} 
                        controls 
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                )}
                
                {user.preferredLanguage === 'fr' && (
                  <div className="markdown-body p-2 prose prose-slate prose-sm max-w-none">
                    <Markdown 
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {module.content || ''}
                    </Markdown>
                  </div>
                )}

                {module.attachments && (user.preferredLanguage === 'fr' ? module.attachments.length > 0 : module.attachments.some(a => ['image', 'video'].includes(a.type))) && (
                  <div className="space-y-4 pt-8 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Library size={18} className="text-slate-400" />
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Matériel complémentaire</h4>
                    </div>
                    <div className="grid gap-3">
                      {module.attachments
                        .filter(att => user.preferredLanguage === 'fr' || ['image', 'video'].includes(att.type))
                        .map(att => (
                        <a 
                          key={att.id} 
                          href={att.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-100 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group lg:hover:-translate-y-1"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-inner">
                              {att.type === 'audio' ? <Volume2 size={24} /> : att.type === 'video' ? <Video size={24} /> : att.type === 'image' ? <ImageIcon size={24} /> : <FileText size={24} />}
                            </div>
                            <div>
                                <span className="block text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{att.name}</span>
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter truncate max-w-[150px]">
                                    {att.type.toUpperCase()} • {att.url.startsWith('http') ? 'LIEN DISTANT' : 'FICHIER SERVEUR'}
                                </span>
                            </div>
                          </div>
                          <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                            <Download size={18} />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-8 flex flex-col gap-3">
                  {user.preferredLanguage === 'fr' && module.quiz && module.quiz.length > 0 && (
                    <Button className="w-full h-16 text-lg font-bold shadow-xl shadow-emerald-500/20 rounded-2xl" onClick={() => setView('quiz')}>
                      Passer au Quiz d'évaluation
                    </Button>
                  )}
                  {user.preferredLanguage !== 'fr' && module.quiz && module.quiz.length > 0 && (
                    <Button 
                      className={cn(
                        "w-full h-16 text-lg font-bold rounded-2xl transition-all shadow-xl",
                        audioFinished ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" : "bg-slate-300 cursor-not-allowed shadow-none"
                      )} 
                      onClick={() => {
                        if (audioFinished) setView('quiz');
                      }}
                      disabled={!audioFinished}
                    >
                      {audioFinished ? "Passer au Quiz d'évaluation" : "Fini l'audio d'abord"}
                    </Button>
                  )}
                  {module.isReporting && (
                    <Button variant="outline" className="w-full h-16 text-lg font-bold border-red-200 text-red-600 hover:bg-red-50 rounded-2xl border-2" onClick={() => setView('reporting')}>
                      Effectuer un Signalement
                    </Button>
                  )}
                  {(user.preferredLanguage !== 'fr' || (!module.quiz || module.quiz.length === 0)) && !module.isReporting && (
                    <Button 
                      className={cn(
                        "w-full h-16 text-lg font-bold text-white rounded-2xl transition-all shadow-xl",
                        user.preferredLanguage !== 'fr' && !audioFinished 
                          ? "bg-slate-300 cursor-not-allowed shadow-none" 
                          : "bg-slate-900 hover:bg-black shadow-slate-900/20"
                      )} 
                      onClick={() => {
                        if (user.preferredLanguage !== 'fr' && !audioFinished) return;
                        onComplete();
                      }}
                      disabled={user.preferredLanguage !== 'fr' && !audioFinished}
                    >
                      {user.preferredLanguage !== 'fr' && !audioFinished 
                        ? "Veuillez terminer l'écoute" 
                        : "Marquer comme terminé"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'quiz' && module.quiz && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 mb-4">
              <p className="text-xs text-emerald-800 font-medium italic">
                Répondez à toutes les questions. Pour les questions à choix multiples, sélectionnez toutes les bonnes réponses.
              </p>
            </div>
            {module.quiz.map((q, qIdx) => (
              <div key={q.id} className="space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <h3 className="font-bold text-lg">{qIdx + 1}. {q.question}</h3>
                  {Array.isArray(q.correctAnswer) && (
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-black uppercase tracking-wider shrink-0 shadow-sm border border-blue-200">
                      Multi-choix
                    </span>
                  )}
                </div>
                <div className="grid gap-3">
                  {q.options.map((opt, oIdx) => {
                    const isMulti = Array.isArray(q.correctAnswer);
                    const isSelected = isMulti
                      ? (quizAnswers[q.id] as number[])?.includes(oIdx)
                      : quizAnswers[q.id] === oIdx;
                    
                    const isCorrect = isMulti
                      ? (q.correctAnswer as number[]).includes(oIdx)
                      : q.correctAnswer === oIdx;

                    return (
                      <button
                        key={oIdx}
                        disabled={quizSubmitted}
                        onClick={() => {
                          if (isMulti) {
                            const current = (quizAnswers[q.id] as number[]) || [];
                            const next = current.includes(oIdx) 
                              ? current.filter(i => i !== oIdx) 
                              : [...current, oIdx];
                            setQuizAnswers({ ...quizAnswers, [q.id]: next });
                          } else {
                            setQuizAnswers({ ...quizAnswers, [q.id]: oIdx });
                          }
                        }}
                        className={cn(
                          "p-4 rounded-xl border text-left transition-all relative flex items-center gap-3",
                          isSelected 
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-medium ring-1 ring-emerald-500/20 shadow-sm" 
                            : "border-slate-200 hover:border-slate-300 bg-white shadow-sm hover:shadow-md",
                          quizSubmitted && isCorrect && "border-emerald-500 bg-emerald-100 ring-2 ring-emerald-500/30",
                          quizSubmitted && isSelected && !isCorrect && "border-red-500 bg-red-50 ring-2 ring-red-500/30",
                          !isSelected && quizSubmitted && isCorrect && "bg-emerald-50 ring-2 ring-emerald-200"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 flex items-center justify-center shrink-0 transition-all",
                          isMulti ? "rounded-md" : "rounded-full",
                          isSelected ? "bg-emerald-500 border-emerald-500" : "border-2 border-slate-200"
                        )}>
                          {isSelected && <CheckCircle2 size={12} className="text-white" />}
                        </div>
                        <span className="flex-1">{opt}</span>
                        {quizSubmitted && isCorrect && <span className="text-[8px] font-bold text-emerald-600 uppercase bg-white px-1.5 py-0.5 rounded border border-emerald-200">Bonne réponse</span>}
                      </button>
                    );
                  })}
                </div>
                {Array.isArray(q.correctAnswer) && (
                  <p className="text-[10px] text-slate-400 font-medium italic ml-1">Plusieurs réponses peuvent être correctes.</p>
                )}
              </div>
            ))}
            
            {!quizSubmitted ? (
              <Button 
                className="w-full" 
                onClick={handleQuizSubmit}
                disabled={Object.keys(quizAnswers).length < module.quiz.length}
              >
                Soumettre les réponses
              </Button>
            ) : (
              <div className="space-y-4">
                <div className={cn(
                   "p-4 rounded-2xl text-center font-bold",
                   (progress.quizScores[module.id] || 0) >= 80 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                )}>
                  Score: {Math.round(progress.quizScores[module.id] || 0)}%
                  {(progress.quizScores[module.id] || 0) < 80 && " - Échec (80% requis)"}
                </div>
                
                {(progress.quizScores[module.id] || 0) >= 80 ? (
                  <>
                    {onNext && (
                      <Button className="w-full h-14 text-base font-bold shadow-lg" onClick={onNext}>
                        Passer au module suivant
                      </Button>
                    )}
                    <Button variant="outline" className="w-full" onClick={onBack}>
                      Retour au menu
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" onClick={() => {
                      setQuizSubmitted(false);
                      setQuizAnswers({});
                    }}>
                      Réessayer
                    </Button>
                    <Button className="w-full" onClick={onBack}>
                      Retour au menu
                    </Button>
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}

        {view === 'reporting' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {user.preferredLanguage === 'fr' ? (
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-sm text-slate-600">Remplissez ce formulaire pour signaler un cas communautaire. Votre signalement sera traité par HAI.</p>
                </div>

                <Select 
                  label="Type de problème" 
                  options={[
                    { value: 'justice', label: 'Justice' },
                    { value: 'sante', label: 'Santé' },
                    { value: 'foncier', label: 'Foncier' },
                    { value: 'enfance', label: 'Enfance' },
                    { value: 'vbg', label: 'VBG' },
                    { value: 'autre', label: 'Autre' }
                  ]}
                  value={reportData.type}
                  onChange={e => setReportData({...reportData, type: e.target.value})}
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Description du cas</label>
                  <textarea 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl min-h-[120px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Décrivez la situation en détail..."
                    value={reportData.description}
                    onChange={e => setReportData({...reportData, description: e.target.value})}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Enregistrement audio (Optionnel)</label>
                  <AudioRecorder onRecordingComplete={(blob) => setReportData({...reportData, audioBlob: blob})} />
                  {reportData.audioBlob && (
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 size={12} /> Audio enregistré avec succès
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Localisation précise (Map)</label>
                  <LocationPicker 
                    initialLocation={reportData.coordinates} 
                    onLocationSelect={async (lat, lng) => {
                      setReportData(prev => ({...prev, coordinates: [lat, lng]}));
                      const address = await reverseGeocode(lat, lng);
                      if (address) {
                        setReportData(prev => ({...prev, location: address}));
                      }
                    }} 
                  />
                  <Input 
                    label="Adresse ou repères" 
                    placeholder="Quartier, ville, point de repère..." 
                    value={reportData.location}
                    onChange={e => setReportData({...reportData, location: e.target.value})}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Pièces jointes (Images, PDF)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col items-center justify-center p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-emerald-300 hover:bg-emerald-50 transition-all">
                      <Paperclip size={20} className="text-slate-400 mb-1" />
                      <span className="text-[10px] font-bold text-slate-500">Ajouter des fichiers</span>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*,.pdf" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files) {
                            setReportData({
                              ...reportData, 
                              attachments: [...reportData.attachments, ...Array.from(e.target.files)]
                            });
                          }
                        }}
                      />
                    </label>
                    <div className="space-y-1">
                      {reportData.attachments.map((file, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-lg text-[10px]">
                          <span className="truncate max-w-[80px]">{file.name}</span>
                          <button onClick={() => setReportData({
                            ...reportData,
                            attachments: reportData.attachments.filter((_, idx) => idx !== i)
                          })}>
                            <X size={12} className="text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Input 
                  label="Date de l'incident" 
                  type="date" 
                  value={reportData.date}
                  onChange={e => setReportData({...reportData, date: e.target.value})}
                />

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <input 
                    type="checkbox" 
                    id="anon" 
                    className="w-5 h-5 accent-emerald-500"
                    checked={reportData.anonymous}
                    onChange={e => setReportData({...reportData, anonymous: e.target.checked})}
                  />
                  <label htmlFor="anon" className="text-sm font-medium text-slate-600">Soumettre anonymement</label>
                </div>

                <Button 
                  className="w-full h-14 text-lg" 
                  onClick={handleReportSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Envoi en cours..." : "Envoyer le signalement"}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                  <p className="text-sm text-red-800 font-bold">Signalement vocal (Fon)</p>
                  <p className="text-xs text-red-600">Enregistrez votre message pour signaler une situation.</p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Enregistrement audio</label>
                  <AudioRecorder onRecordingComplete={(blob) => setReportData({...reportData, audioBlob: blob, type: 'audio_fon'})} />
                  {reportData.audioBlob && (
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 size={12} /> Audio enregistré
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Localisation (Map)</label>
                  <LocationPicker 
                    initialLocation={reportData.coordinates} 
                    onLocationSelect={async (lat, lng) => {
                      setReportData(prev => ({...prev, coordinates: [lat, lng]}));
                      const address = await reverseGeocode(lat, lng);
                      if (address) {
                        setReportData(prev => ({...prev, location: address}));
                      }
                    }} 
                  />
                  {reportData.location && (
                    <div className="p-3 bg-red-50 rounded-xl border border-red-100 italic text-[10px] text-red-700 font-medium">
                      Position : {reportData.location}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Photos (Optionnel)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col items-center justify-center p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer">
                      <Camera size={20} className="text-slate-400 mb-1" />
                      <span className="text-[10px] font-bold text-slate-500">Prendre une photo</span>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files) {
                            setReportData({
                              ...reportData, 
                              attachments: [...reportData.attachments, ...Array.from(e.target.files)]
                            });
                          }
                        }}
                      />
                    </label>
                    <div className="space-y-1">
                      {reportData.attachments.map((file, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-lg text-[10px]">
                          <span className="truncate max-w-[80px]">{file.name}</span>
                          <button onClick={() => setReportData({
                            ...reportData,
                            attachments: reportData.attachments.filter((_, idx) => idx !== i)
                          })}>
                            <X size={12} className="text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full h-16 text-xl bg-red-500 hover:bg-red-600" 
                  onClick={handleReportSubmit}
                  disabled={isSubmitting || !reportData.audioBlob}
                >
                  {isSubmitting ? "Envoi..." : "Envoyer le signalement"}
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

// =========================================================================
// MON DASHBOARD D'ADMINISTRATION - PAR LEONARD KABO
// C'est ici que je gère tous les utilisateurs et leurs progrès.
// =========================================================================
const AdminDashboard = ({ 
  onBack, 
  modules, 
  glossary,
  legalDocuments,
  caseStudies,
  settings,
  allUsers,
  allProgress,
  onSaveModule,
  onDeleteModule,
  onSaveGlossaryTerm,
  onDeleteGlossaryTerm,
  onSaveLegalDocument,
  onDeleteLegalDocument,
  onSaveCaseStudy,
  onDeleteCaseStudy,
  onDeleteUser,
  onSaveUser,
  onSaveSettings,
  onUploadFile,
  onFetchFiles,
  onDeleteFile
}: { 
  onBack: () => void, 
  modules: Module[],
  glossary: GlossaryTerm[],
  legalDocuments: LegalDocument[],
  caseStudies: CaseStudy[],
  settings: AppSettings,
  allUsers: User[],
  allProgress: Record<string, UserProgress>,
  onSaveModule: (m: Module) => Promise<boolean>,
  onDeleteModule: (id: number) => Promise<boolean>,
  onSaveGlossaryTerm: (t: GlossaryTerm) => Promise<boolean>,
  onDeleteGlossaryTerm: (id: string) => Promise<boolean>,
  onSaveLegalDocument: (d: LegalDocument) => Promise<boolean>,
  onDeleteLegalDocument: (id: string) => Promise<boolean>,
  onSaveCaseStudy: (c: CaseStudy) => Promise<boolean>,
  onDeleteCaseStudy: (id: string) => Promise<boolean>,
  onDeleteUser: (phone: string) => Promise<boolean>,
  onSaveUser: (userData: any) => Promise<boolean>,
  onSaveSettings: (s: AppSettings) => Promise<boolean>,
  onUploadFile: (file: File) => Promise<{ url: string, name: string }>,
  onFetchFiles: () => Promise<any[]>,
  onDeleteFile: (filename: string) => Promise<boolean>
}) => {
  // Gestion de l'onglet actif dans le dashboard
  const [view, setView] = useState<'users' | 'modules' | 'glossary' | 'documents' | 'cases' | 'settings' | 'reports' | 'media' | 'database'>('users');
  
  // Les états pour les formulaires d'édition
  const [reports, setReports] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [dbStats, setDbStats] = useState<any>({
    users: 0,
    modules: 0,
    progress: 0,
    reports: 0,
    glossary: 0,
    documents: 0,
    cases: 0,
    dbSize: 'Varying',
    lastBackup: new Date().toISOString()
  });
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdownAtCursor = (text: string) => {
    if (!editingModule) return;
    const textarea = contentRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const content = editingModule.content || '';
      const newContent = content.substring(0, start) + text + content.substring(end);
      setEditingModule({ ...editingModule, content: newContent });
    } else {
      setEditingModule({ ...editingModule, content: (editingModule.content || '') + "\n" + text });
    }
  };
  const [editingTerm, setEditingTerm] = useState<GlossaryTerm | null>(null);
  const [editingDoc, setEditingDoc] = useState<LegalDocument | null>(null);
  const [editingCase, setEditingCase] = useState<CaseStudy | null>(null);
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [selectedUserProgress, setSelectedUserProgress] = useState<any | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    id: '',
    fullName: '',
    phone: '',
    email: '',
    location: '',
    gender: 'M',
    birthDate: '',
    educationLevel: '',
    password: '',
    isAdmin: false
  });

  useEffect(() => {
    if (editingUser) {
      setNewUser({
        id: editingUser.id || '',
        fullName: editingUser.fullName || '',
        phone: editingUser.phone || '',
        email: editingUser.email || '',
        location: editingUser.location || '',
        gender: editingUser.gender || 'M',
        birthDate: editingUser.birthDate || '',
        educationLevel: editingUser.educationLevel || '',
        password: editingUser.password || '',
        isAdmin: !!editingUser.isAdmin
      });
      setShowUserForm(true);
    } else {
      setNewUser({
        id: '',
        fullName: '',
        phone: '',
        email: '',
        location: '',
        gender: 'M',
        birthDate: '',
        educationLevel: '',
        password: '',
        isAdmin: false
      });
    }
  }, [editingUser]);

  useEffect(() => {
    // Reports real-time listener
    const unsubscribeReports = onSnapshot(collection(db, 'reports'), (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'reports'));

    return () => unsubscribeReports();
  }, []);

  useEffect(() => {
    // Update dbStats automatically from lists
    setDbStats((prev: any) => ({
      ...prev,
      users: allUsers.length,
      modules: modules.length,
      progress: Object.keys(allProgress).length,
      reports: reports.length,
      glossary: glossary.length,
      documents: legalDocuments.length,
      cases: caseStudies.length
    }));
  }, [allUsers.length, modules.length, allProgress, reports.length, glossary.length, legalDocuments.length, caseStudies.length]);

  useEffect(() => {
    if (view === 'media') {
      onFetchFiles().then(setFiles);
    }
  }, [view, onFetchFiles]);

  const handleDeleteFile = async (filename: string) => {
    if (confirm("Supprimer ce fichier définitivement ?")) {
      const ok = await onDeleteFile(filename);
      if (ok) setFiles(files.filter(f => f.name !== filename));
    }
  };

  const handleDeleteUser = async (phone: string) => {
    if (confirm("Supprimer cet utilisateur ?")) {
      await onDeleteUser(phone);
    }
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingModule) {
      const ok = await onSaveModule(editingModule);
      if (ok) {
        alert("Module enregistré !");
        setEditingModule(null);
      }
    }
  };

  const handleSaveTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTerm) {
      const ok = await onSaveGlossaryTerm(editingTerm);
      if (ok) {
        alert("Terme enregistré !");
        setEditingTerm(null);
      }
    }
  };

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDoc) {
      const ok = await onSaveLegalDocument(editingDoc);
      if (ok) {
        alert("Document enregistré !");
        setEditingDoc(null);
      }
    }
  };

  const handleSaveCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCase) {
      const ok = await onSaveCaseStudy(editingCase);
      if (ok) {
        alert("Étude de cas enregistrée !");
        setEditingCase(null);
      }
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onSaveUser(newUser);
    if (ok) {
      alert(editingUser ? "Utilisateur mis à jour !" : "Utilisateur créé !");
      setShowUserForm(false);
      setEditingUser(null);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { url } = await onUploadFile(file);
        setLocalSettings({ ...localSettings, logoUrl: url });
      } catch (err) {
        alert("Erreur lors de l'upload");
      }
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { url } = await onUploadFile(file);
        setLocalSettings({ ...localSettings, directorSignatureUrl: url });
      } catch (err) {
        alert("Erreur lors de l'upload");
      }
    }
  };

  const handleModuleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'video' | 'pdf' | 'image') => {
    const file = e.target.files?.[0];
    if (file && editingModule) {
      try {
        const { url, name } = await onUploadFile(file);
        const newAttachment: Attachment = { id: Date.now().toString(), name, url, type };
        
        const updatedModule = { 
          ...editingModule, 
          attachments: [...(editingModule.attachments || []), newAttachment] 
        };

        if (type === 'audio') updatedModule.audioUrl = url;
        if (type === 'video') updatedModule.videoUrl = url;

        setEditingModule(updatedModule);
      } catch (err) {
        alert("Erreur lors de l'upload");
      }
    }
  };

  const handleDocFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingDoc) {
      try {
        const { url, name } = await onUploadFile(file);
        setEditingDoc({ ...editingDoc, fileUrl: url, fileName: name });
      } catch (err) {
        alert("Erreur lors de l'upload");
      }
    }
  };

  const handleCaseFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingCase) {
      try {
        const { url, name } = await onUploadFile(file);
        setEditingCase({ ...editingCase, fileUrl: url, fileName: name });
      } catch (err) {
        alert("Erreur lors de l'upload");
      }
    }
  };

  const handleDeleteAttachment = (id: string) => {
    if (!editingModule) return;
    const attToDelete = editingModule.attachments?.find(a => a.id === id);
    const newAttachments = editingModule.attachments?.filter(a => a.id !== id) || [];
    
    let newModule = { ...editingModule, attachments: newAttachments };
    
    if (attToDelete) {
      if (attToDelete.type === 'audio' && editingModule.audioUrl === attToDelete.url) {
        newModule.audioUrl = '';
      }
      if (attToDelete.type === 'video' && editingModule.videoUrl === attToDelete.url) {
        newModule.videoUrl = '';
      }
    }
    
    setEditingModule(newModule);
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h2 className="font-bold">Espace Administration</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Temps réel activé</p>
            </div>
          </div>
        </div>
        {view === 'settings' && (
          <Button size="sm" className="gap-2" onClick={() => onSaveSettings(localSettings)}>
            <Save size={16} /> Enregistrer
          </Button>
        )}
      </div>

      <div className="flex border-b border-slate-100 bg-white overflow-x-auto no-scrollbar">
        <button 
          className={cn("px-6 py-4 text-sm font-bold transition-colors whitespace-nowrap", view === 'users' ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-400")}
          onClick={() => setView('users')}
        >
          Utilisateurs
        </button>
        <button 
          className={cn("px-6 py-4 text-sm font-bold transition-colors whitespace-nowrap", view === 'modules' ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-400")}
          onClick={() => setView('modules')}
        >
          Modules
        </button>
        <button 
          className={cn("px-6 py-4 text-sm font-bold transition-colors whitespace-nowrap", view === 'glossary' ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-400")}
          onClick={() => setView('glossary')}
        >
          Glossaire
        </button>
        <button 
          className={cn("px-6 py-4 text-sm font-bold transition-colors whitespace-nowrap", view === 'documents' ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-400")}
          onClick={() => setView('documents')}
        >
          Documents
        </button>
        <button 
          className={cn("px-6 py-4 text-sm font-bold transition-colors whitespace-nowrap", view === 'cases' ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-400")}
          onClick={() => setView('cases')}
        >
          Cas
        </button>
        <button 
          className={cn("px-6 py-4 text-sm font-bold transition-colors whitespace-nowrap", view === 'reports' ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-400")}
          onClick={() => setView('reports')}
        >
          Signalements
        </button>
        <button 
          className={cn("px-6 py-4 text-sm font-bold transition-colors whitespace-nowrap", view === 'media' ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-400")}
          onClick={() => setView('media')}
        >
          Médiathèque
        </button>
        <button 
          className={cn("px-6 py-4 text-sm font-bold transition-colors whitespace-nowrap", view === 'settings' ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-400")}
          onClick={() => setView('settings')}
        >
          Paramètres
        </button>
        <button 
          className={cn("px-6 py-4 text-sm font-bold transition-colors whitespace-nowrap", view === 'database' ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-400")}
          onClick={() => setView('database')}
        >
          Base de données
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24">
        {view === 'reports' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-500 uppercase tracking-wider text-xs">Signalements reçus ({reports.length})</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-emerald-600 h-8 gap-2"
                onClick={() => {
                  fetch('/api/reports')
                    .then(res => res.json())
                    .then(data => {
                      if (Array.isArray(data)) setReports(data);
                    })
                    .catch(err => console.error("Error refreshing reports:", err));
                }}
              >
                <Sparkles size={14} /> Actualiser
              </Button>
            </div>
            {(!Array.isArray(reports) || reports.length === 0) ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                <MessageSquare size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-medium">Aucun signalement pour le moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map(report => (
                  <Card key={report.id} className="p-6 space-y-4 overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          report.type === 'justice' ? "bg-blue-100 text-blue-600" :
                          report.type === 'sante' ? "bg-red-100 text-red-600" :
                          "bg-emerald-100 text-emerald-600"
                        )}>
                          <HelpCircle size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 capitalize">{report.type}</h4>
                          <p className="text-[10px] text-slate-400">
                            {new Date(report.createdAt).toLocaleString('fr-FR')} • {report.anonymous ? "Anonyme" : `Par ${report.userId}`}
                          </p>
                        </div>
                      </div>
                      <div className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        report.status === 'pending' ? "bg-yellow-100 text-yellow-700" :
                        report.status === 'resolved' ? "bg-emerald-100 text-emerald-700" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {report.status}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-sm text-slate-700 leading-relaxed">{report.description}</p>
                    </div>

                    {report.audioUrl && (
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <Volume2 size={18} className="text-emerald-600" />
                        <audio src={report.audioUrl} controls className="h-8 flex-1" />
                      </div>
                    )}

                    {report.location && (report.location.latitude || report.location.address) && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                          <Globe size={14} /> Localisation
                        </p>
                        {report.location.address && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            {report.location.address}
                          </p>
                        )}
                        {report.location.latitude && report.location.longitude && (
                          <div className="h-[150px] w-full rounded-xl overflow-hidden border border-slate-200">
                            <MapContainer center={[report.location.latitude, report.location.longitude]} zoom={15} style={{ height: '100%', width: '100%' }}>
                              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                              <Marker position={[report.location.latitude, report.location.longitude]} />
                            </MapContainer>
                          </div>
                        )}
                      </div>
                    )}

                    {report.attachments && Array.isArray(report.attachments) && report.attachments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                          <Paperclip size={14} /> Pièces jointes ({report.attachments.length})
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {report.attachments.map((att: any) => (
                            <a 
                              key={att.id} 
                              href={att.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 bg-white border border-slate-100 rounded-lg hover:border-emerald-200 transition-all group"
                            >
                              {att.type === 'pdf' ? <FileText size={14} className="text-red-400" /> : <ImageIcon size={14} className="text-blue-400" />}
                              <span className="text-[10px] font-medium truncate flex-1">{att.name}</span>
                              <ExternalLink size={12} className="text-slate-300 group-hover:text-emerald-500" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'media' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-500 uppercase tracking-wider text-xs">Fichiers sur le serveur ({Array.isArray(files) ? files.length : 0})</h3>
            </div>
            {(!Array.isArray(files) || files.length === 0) ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                <File size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-medium">Aucun fichier trouvé</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {files.map(file => (
                  <Card key={file.name} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                        {file.name.match(/\.(mp3|wav|ogg)$/i) ? <Volume2 size={20} /> : 
                         file.name.match(/\.(mp4|webm)$/i) ? <Video size={20} /> : 
                         <FileText size={20} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={file.url} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-emerald-500 transition-colors">
                        <Download size={18} />
                      </a>
                      <button onClick={() => handleDeleteFile(file.name)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'database' && dbStats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 bg-white border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <DatabaseIcon size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Taille de la base</p>
                    <h4 className="text-xl font-bold">{dbStats.dbSize}</h4>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-1/4" />
                </div>
              </Card>
              <Card className="p-6 bg-white border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Utilisateurs</p>
                    <h4 className="text-xl font-bold">{dbStats.users}</h4>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-1/2" />
                </div>
              </Card>
            </div>

            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">Statistiques des tables</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Synchronisation 10s active</span>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Modules de formation', value: dbStats.modules, icon: <BookOpen size={16} />, color: 'bg-indigo-500' },
                  { label: 'Progressions enregistrées', value: dbStats.progress, icon: <Activity size={16} />, color: 'bg-emerald-500' },
                  { label: 'Signalements reçus', value: dbStats.reports, icon: <MessageSquare size={16} />, color: 'bg-red-500' },
                  { label: 'Termes du glossaire', value: dbStats.glossary, icon: <Languages size={16} />, color: 'bg-orange-500' },
                  { label: 'Documents juridiques', value: dbStats.documents, icon: <FileText size={16} />, color: 'bg-blue-500' },
                  { label: 'Études de cas', value: dbStats.cases, icon: <HelpCircle size={16} />, color: 'bg-purple-500' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", item.color)}>
                        {item.icon}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  <span>Dernière mise à jour système</span>
                  <span>{new Date(dbStats.lastBackup).toLocaleString('fr-FR')}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-emerald-900 text-white border-none">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 className="font-bold">Sécurité & Intégrité</h4>
                  <p className="text-xs text-emerald-200">La base de données est sauvegardée automatiquement et cryptée sur le serveur.</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {view === 'settings' && (
          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">Identité Visuelle</h3>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                  {localSettings.logoUrl ? (
                    <img src={localSettings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon size={32} className="text-slate-300" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-xs text-slate-500">Logo de l'organisation (utilisé pour les certificats)</p>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs" />
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">Informations</h3>
              <Input 
                label="Nom de l'organisation" 
                value={localSettings.organizationName} 
                onChange={e => setLocalSettings({...localSettings, organizationName: e.target.value})} 
              />
              <Input 
                label="Email de contact" 
                value={localSettings.contactEmail} 
                onChange={e => setLocalSettings({...localSettings, contactEmail: e.target.value})} 
              />
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">Direction & Signature</h3>
              <Input 
                label="Nom du Directeur Exécutif" 
                value={localSettings.directorName || ''} 
                onChange={e => setLocalSettings({...localSettings, directorName: e.target.value})} 
                placeholder="Ex: Leonard Kabo"
              />
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Image de la signature</label>
                <div className="flex items-center gap-6">
                  <div className="w-32 h-16 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden">
                    {localSettings.directorSignatureUrl ? (
                      <img src={localSettings.directorSignatureUrl} alt="Signature" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <Edit size={24} className="text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input type="file" accept="image/*" onChange={handleSignatureUpload} className="text-xs" />
                    <p className="text-[10px] text-slate-400 mt-1">Format PNG transparent recommandé</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {view === 'users' && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button className="w-full gap-2" onClick={() => { setEditingUser(null); setShowUserForm(true); }}>
                <UserPlus size={18} /> Créer un utilisateur
              </Button>
            </div>

            {showUserForm && (
              <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">{editingUser ? "Modifier l'utilisateur" : "Nouvel Utilisateur"}</h3>
                    <Button variant="ghost" size="icon" onClick={() => { setShowUserForm(false); setEditingUser(null); }}>
                      <X size={20} />
                    </Button>
                  </div>
                  <form onSubmit={handleSaveUser} className="space-y-4">
                    <Input label="Nom complet" value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} required />
                    <div className="grid grid-cols-2 gap-4">
                      <Input 
                        label="Téléphone" 
                        value={newUser.phone} 
                        onChange={e => setNewUser({...newUser, phone: e.target.value})} 
                        required={!newUser.email}
                      />
                      <Input 
                        label="Email" 
                        type="email"
                        value={newUser.email} 
                        onChange={e => setNewUser({...newUser, email: e.target.value})} 
                        required={!newUser.phone}
                      />
                    </div>
                    <Input label="Localisation" value={newUser.location} onChange={e => setNewUser({...newUser, location: e.target.value})} required />
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Genre</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input type="radio" name="gender" value="M" checked={newUser.gender === 'M'} onChange={e => setNewUser({...newUser, gender: e.target.value})} /> M
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" name="gender" value="F" checked={newUser.gender === 'F'} onChange={e => setNewUser({...newUser, gender: e.target.value})} /> F
                        </label>
                      </div>
                    </div>
                    <Input label="Date de naissance" type="date" value={newUser.birthDate} onChange={e => setNewUser({...newUser, birthDate: e.target.value})} required />
                    <Input label="Niveau d'études" value={newUser.educationLevel} onChange={e => setNewUser({...newUser, educationLevel: e.target.value})} required />
                    <Input label="Mot de passe" type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
                    <div className="flex items-center gap-2 py-2">
                      <input 
                        type="checkbox" 
                        id="isAdmin" 
                        checked={newUser.isAdmin} 
                        onChange={e => setNewUser({...newUser, isAdmin: e.target.checked})} 
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <label htmlFor="isAdmin" className="text-sm font-medium text-slate-700">Rôle Administrateur</label>
                    </div>
                    <Button type="submit" className="w-full">
                      {editingUser ? "Enregistrer les modifications" : "Créer l'utilisateur"}
                    </Button>
                  </form>
                </Card>
              </div>
            )}

            <div className="grid gap-4">
              {Array.isArray(allUsers) && allUsers.length > 0 ? (
                allUsers.map(u => {
                const userProgress = (allProgress[(u as any).id || u.phone || ""] || {}) as UserProgress;
                const completedModules = Array.isArray(userProgress.completedModules) ? userProgress.completedModules : [];
                const progressPercent = modules.length > 0 ? Math.round((completedModules.length / modules.length) * 100) : 0;
                const lastActivity = userProgress.lastActivity;
                const lastModuleId = userProgress.lastModuleId;
                const lastUpdated = userProgress.lastUpdated;

                return (
                  <Card key={(u as any).id || u.phone} className="p-4 flex justify-between items-center bg-white shadow-sm border-slate-100">
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-2">
                        {!u.isAdmin && (
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <span className={cn(
                              "px-2 py-0.5 text-[9px] font-black rounded-full text-center",
                              progressPercent === 100 ? "bg-emerald-500 text-white" : 
                              progressPercent > 0 ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-500"
                            )}>
                              {progressPercent}%
                            </span>
                            {lastModuleId && (
                              <span className="px-1 py-0.5 bg-slate-100 text-slate-500 text-[7px] font-bold rounded text-center">
                                M{lastModuleId}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">{u.fullName}</p>
                          {lastActivity ? (
                            <p className="text-[8px] text-emerald-600 font-medium truncate italic -mt-0.5">
                              {lastActivity}
                            </p>
                          ) : (
                            <p className="text-[8px] text-slate-400 font-medium truncate italic -mt-0.5">
                              Aucune activité récente
                            </p>
                          )}
                        </div>
                        {u.isAdmin && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[8px] font-bold uppercase rounded shrink-0">Admin</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-slate-500 truncate">{u.phone || u.email || 'Pas de contact'} • {u.location}</p>
                        {lastUpdated ? (
                          <span className="text-[8px] text-slate-300 font-medium whitespace-nowrap">
                            • Mis à jour: {new Date(lastUpdated).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : null}
                      </div>
                      
                      {!u.isAdmin && (
                        <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-1000 ease-out",
                              progressPercent === 100 ? "bg-emerald-500" : "bg-blue-500"
                            )}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {!u.isAdmin && (
                        <Button variant="ghost" size="icon" className="text-blue-500" onClick={() => setSelectedUserProgress({ ...u, ...userProgress })}>
                          <Activity size={18} />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="text-slate-400" onClick={() => setEditingUser(u)}>
                        <Edit size={18} />
                      </Button>
                      {!u.isAdmin && (
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => {
                          if (confirm(`Voulez-vous vraiment supprimer l'utilisateur ${u.fullName} ?`)) {
                            onDeleteUser((u as any).id || u.phone || "");
                          }
                        }}>
                          <Trash2 size={18} />
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })
              ) : (
                <Card className="p-8 text-center text-slate-500">
                  <UserIcon size={48} className="mx-auto mb-2 opacity-20" />
                  <p>Aucun utilisateur trouvé</p>
                  <p className="text-xs mt-1">Les utilisateurs inscrits apparaîtront ici.</p>
                </Card>
              )}
            </div>

            {selectedUserProgress && (
              <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
                <Card className="w-full max-w-lg p-6 space-y-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-bold text-lg">{selectedUserProgress.fullName}</h3>
                      <p className="text-xs text-slate-500">{selectedUserProgress.phone || selectedUserProgress.email || 'Pas de contact'} • Progression détaillée</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedUserProgress(null)}>
                      <X size={20} />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Modules complétés</p>
                      <p className="text-2xl font-black text-slate-900">{selectedUserProgress.completedModules?.length || 0} / {modules.length}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Score Examen Final</p>
                      <p className="text-2xl font-black text-slate-900">{selectedUserProgress.finalExamScore || '--'}%</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400">État des modules</h4>
                    <div className="space-y-2">
                      {modules.map(m => {
                        const isCompleted = selectedUserProgress.completedModules?.includes(m.id);
                        const score = selectedUserProgress.quizScores?.[m.id];
                        return (
                          <div key={m.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center",
                                isCompleted ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                              )}>
                                {isCompleted ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                              </div>
                              <span className="text-xs font-medium text-slate-700 truncate max-w-[200px]">
                                {m.id}. {m.title}
                              </span>
                            </div>
                            {isCompleted && score !== undefined && (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                                Quiz: {score}%
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <Button className="w-full" onClick={() => setSelectedUserProgress(null)}>Fermer</Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {view === 'modules' && !editingModule && (
          <div className="space-y-4">
            <Button className="w-full gap-2 mb-4" onClick={() => setEditingModule({ id: modules.length + 1, title: 'Nouveau Module', quiz: [], objectives: [], keyNotions: [], attachments: [] })}>
              <Plus size={18} /> Ajouter un module
            </Button>
            {modules.map(m => (
              <Card key={m.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm">Module {m.id}: {m.title}</p>
                  <p className="text-[10px] text-slate-400">{m.isReporting ? "Signalement" : "Cours"}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setEditingModule(m)}>
                    <Edit size={18} />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => onDeleteModule(m.id)}>
                    <Trash2 size={18} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {view === 'glossary' && !editingTerm && (
          <div className="space-y-4">
            <Button className="w-full gap-2 mb-4" onClick={() => setEditingTerm({ id: Date.now().toString(), term: '', definition: '', fonTranslation: '', fonDefinition: '', category: 'Général' })}>
              <Plus size={18} /> Ajouter un terme
            </Button>
            {glossary.map(t => (
              <Card key={t.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm">{t.term}</p>
                  <p className="text-[10px] text-slate-400">{t.fonTranslation} • {t.category}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setEditingTerm(t)}>
                    <Edit size={18} />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => onDeleteGlossaryTerm(t.id)}>
                    <Trash2 size={18} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {view === 'documents' && !editingDoc && (
          <div className="space-y-4">
            <Button className="w-full gap-2 mb-4" onClick={() => setEditingDoc({ id: Date.now().toString(), title: '', description: '', category: 'Contrat', content: '' })}>
              <Plus size={18} /> Ajouter un document
            </Button>
            {legalDocuments.map(d => (
              <Card key={d.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm">{d.title}</p>
                  <p className="text-[10px] text-slate-400">{d.category}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setEditingDoc(d)}>
                    <Edit size={18} />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => onDeleteLegalDocument(d.id)}>
                    <Trash2 size={18} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {view === 'cases' && !editingCase && (
          <div className="space-y-4">
            <Button className="w-full gap-2 mb-4" onClick={() => setEditingCase({ id: Date.now().toString(), title: '', description: '', scenario: '', options: [] })}>
              <Plus size={18} /> Ajouter une étude de cas
            </Button>
            {caseStudies.map(c => (
              <Card key={c.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm">{c.title}</p>
                  <p className="text-[10px] text-slate-400">{c.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setEditingCase(c)}>
                    <Edit size={18} />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => onDeleteCaseStudy(c.id)}>
                    <Trash2 size={18} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {editingTerm && (
          <Card className="p-6">
            <form onSubmit={handleSaveTerm} className="space-y-4">
              <h3 className="font-bold mb-4">Édition Terme Glossaire</h3>
              <Input label="Terme (Français)" value={editingTerm.term} onChange={e => setEditingTerm({...editingTerm, term: e.target.value})} />
              <Input label="Traduction (Fon)" value={editingTerm.fonTranslation} onChange={e => setEditingTerm({...editingTerm, fonTranslation: e.target.value})} />
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Définition (Français)</label>
                <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl min-h-[80px] text-sm" value={editingTerm.definition} onChange={e => setEditingTerm({...editingTerm, definition: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Définition (Fon)</label>
                <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl min-h-[80px] text-sm" value={editingTerm.fonDefinition} onChange={e => setEditingTerm({...editingTerm, fonDefinition: e.target.value})} />
              </div>
              <Select label="Catégorie" value={editingTerm.category} options={[{value:'Civil', label:'Civil'}, {value:'Pénal', label:'Pénal'}, {value:'Foncier', label:'Foncier'}, {value:'Procédure', label:'Procédure'}, {value:'Général', label:'Général'}]} onChange={e => setEditingTerm({...editingTerm, category: e.target.value as GlossaryTerm['category']})} />
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">Enregistrer</Button>
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setEditingTerm(null)}>Annuler</Button>
              </div>
            </form>
          </Card>
        )}

        {editingDoc && (
          <Card className="p-6">
            <form onSubmit={handleSaveDoc} className="space-y-4">
              <h3 className="font-bold mb-4">Édition Document Modèle</h3>
              <Input label="Titre" value={editingDoc.title} onChange={e => setEditingDoc({...editingDoc, title: e.target.value})} />
              <Input label="Description" value={editingDoc.description} onChange={e => setEditingDoc({...editingDoc, description: e.target.value})} />
              <Select label="Catégorie" value={editingDoc.category} options={[{value:'Contrat', label:'Contrat'}, {value:'Lettre', label:'Lettre'}, {value:'Formulaire', label:'Formulaire'}, {value:'Procédure', label:'Procédure'}]} onChange={e => setEditingDoc({...editingDoc, category: e.target.value as LegalDocument['category']})} />
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contenu du modèle</label>
                <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl min-h-[300px] text-sm font-serif" value={editingDoc.content} onChange={e => setEditingDoc({...editingDoc, content: e.target.value})} />
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fichier Modèle (PDF/Autre)</label>
                <input type="file" onChange={handleDocFileUpload} className="text-xs w-full" />
                {editingDoc.fileUrl && (
                  <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-bold">
                    <FileText size={12} />
                    <span className="truncate">{editingDoc.fileName}</span>
                    <button type="button" onClick={() => setEditingDoc({...editingDoc, fileUrl: undefined, fileName: undefined})} className="text-red-500 ml-2">Supprimer</button>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">Enregistrer</Button>
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setEditingDoc(null)}>Annuler</Button>
              </div>
            </form>
          </Card>
        )}

        {editingCase && (
          <Card className="p-6">
            <form onSubmit={handleSaveCase} className="space-y-4">
              <h3 className="font-bold mb-4">Édition Étude de Cas</h3>
              <Input label="Titre" value={editingCase.title} onChange={e => setEditingCase({...editingCase, title: e.target.value})} />
              <Input label="Description courte" value={editingCase.description} onChange={e => setEditingCase({...editingCase, description: e.target.value})} />
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scénario complet</label>
                <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl min-h-[120px] text-sm" value={editingCase.scenario} onChange={e => setEditingCase({...editingCase, scenario: e.target.value})} />
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fichier Complémentaire (PDF/Autre)</label>
                <input type="file" onChange={handleCaseFileUpload} className="text-xs w-full" />
                {editingCase.fileUrl && (
                  <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-bold">
                    <FileText size={12} />
                    <span className="truncate">{editingCase.fileName}</span>
                    <button type="button" onClick={() => setEditingCase({...editingCase, fileUrl: undefined, fileName: undefined})} className="text-red-500 ml-2">Supprimer</button>
                  </div>
                )}
              </div>
              
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Options de réponse</h4>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditingCase({...editingCase, options: [...editingCase.options, { id: Date.now().toString(), text: '', isCorrect: false, feedback: '' }]})}>
                    <Plus size={14} className="mr-1" /> Ajouter
                  </Button>
                </div>
                {editingCase.options.map((opt, idx) => (
                  <div key={opt.id} className="p-4 bg-slate-50 rounded-xl space-y-3 relative">
                    <button type="button" onClick={() => setEditingCase({...editingCase, options: editingCase.options.filter(o => o.id !== opt.id)})} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                    <Input label={`Option ${idx + 1}`} value={opt.text} onChange={e => {
                      const newOpts = [...editingCase.options];
                      newOpts[idx].text = e.target.value;
                      setEditingCase({...editingCase, options: newOpts});
                    }} />
                    <Input label="Feedback" value={opt.feedback} onChange={e => {
                      const newOpts = [...editingCase.options];
                      newOpts[idx].feedback = e.target.value;
                      setEditingCase({...editingCase, options: newOpts});
                    }} />
                    <div className="flex items-center gap-2">
                      <input type="radio" name="correctCase" checked={opt.isCorrect} onChange={() => {
                        const newOpts = editingCase.options.map((o, i) => ({...o, isCorrect: i === idx}));
                        setEditingCase({...editingCase, options: newOpts});
                      }} />
                      <span className="text-xs font-bold">Réponse correcte</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">Enregistrer</Button>
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setEditingCase(null)}>Annuler</Button>
              </div>
            </form>
          </Card>
        )}

        {editingModule && (
          <div className="space-y-6">
            <Card className="p-6">
              <form onSubmit={handleSaveModule} className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">Édition Module {editingModule.id}</h3>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="isReporting" 
                      checked={editingModule.isReporting} 
                      onChange={e => setEditingModule({...editingModule, isReporting: e.target.checked})}
                    />
                    <label htmlFor="isReporting" className="text-xs font-bold">Signalement</label>
                  </div>
                </div>
                
                <Input 
                  label="Titre" 
                  value={editingModule.title} 
                  onChange={e => setEditingModule({...editingModule, title: e.target.value})} 
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Durée estimée (min)" 
                    type="number"
                    value={editingModule.estimatedDuration?.toString() || ''} 
                    onChange={e => setEditingModule({...editingModule, estimatedDuration: parseInt(e.target.value) || 0})} 
                  />
                  <Select 
                    label="Niveau de difficulté" 
                    value={editingModule.difficultyLevel || 'Débutant'} 
                    options={[
                      { value: 'Débutant', label: 'Débutant' },
                      { value: 'Intermédiaire', label: 'Intermédiaire' },
                      { value: 'Avancé', label: 'Avancé' }
                    ]} 
                    onChange={e => setEditingModule({...editingModule, difficultyLevel: e.target.value as any})} 
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Introduction</label>
                  <textarea 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl min-h-[80px] text-sm"
                    value={editingModule.introduction}
                    onChange={e => setEditingModule({...editingModule, introduction: e.target.value})}
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Objectifs pédagogiques</h4>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditingModule({...editingModule, objectives: [...(editingModule.objectives || []), '']})}>
                      <Plus size={14} className="mr-1" /> Ajouter
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {editingModule.objectives?.map((obj, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input 
                          className="flex-1 text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg"
                          value={obj}
                          onChange={e => {
                            const newObjs = [...(editingModule.objectives || [])];
                            newObjs[idx] = e.target.value;
                            setEditingModule({...editingModule, objectives: newObjs});
                          }}
                          placeholder={`Objectif ${idx + 1}`}
                        />
                        <button 
                          type="button" 
                          onClick={() => setEditingModule({...editingModule, objectives: editingModule.objectives?.filter((_, i) => i !== idx)})}
                          className="text-red-500 p-2"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Notions clés</h4>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditingModule({...editingModule, keyNotions: [...(editingModule.keyNotions || []), '']})}>
                      <Plus size={14} className="mr-1" /> Ajouter
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {editingModule.keyNotions?.map((notion, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input 
                          className="flex-1 text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg"
                          value={notion}
                          onChange={e => {
                            const newNotions = [...(editingModule.keyNotions || [])];
                            newNotions[idx] = e.target.value;
                            setEditingModule({...editingModule, keyNotions: newNotions});
                          }}
                          placeholder={`Notion ${idx + 1}`}
                        />
                        <button 
                          type="button" 
                          onClick={() => setEditingModule({...editingModule, keyNotions: editingModule.keyNotions?.filter((_, i) => i !== idx)})}
                          className="text-red-500 p-2"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contenu (Markdown)</label>
                    <div className="flex gap-1">
                      <button 
                        type="button" 
                        onClick={() => insertMarkdownAtCursor("**Texte en gras**")}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold"
                        title="Gras"
                      >B</button>
                      <button 
                        type="button" 
                        onClick={() => insertMarkdownAtCursor("*Texte en italique*")}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] italic"
                        title="Italique"
                      >I</button>
                      <button 
                        type="button" 
                        onClick={() => insertMarkdownAtCursor("# Nouveau Titre\n")}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold"
                        title="Titre"
                      >H</button>
                      <button 
                        type="button" 
                        onClick={() => insertMarkdownAtCursor("\n- Liste à puces\n")}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px]"
                        title="Liste"
                      >•</button>
                    </div>
                  </div>
                  <textarea 
                    ref={contentRef}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl min-h-[200px] text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={editingModule.content}
                    onChange={e => setEditingModule({...editingModule, content: e.target.value})}
                    placeholder="Tapez votre contenu ici... Utilisez ![alt](url) pour les images ou @[video](url) pour les vidéos."
                  />
                  <p className="text-[9px] text-slate-400 italic">Astuce: Vous pouvez insérer des images et vidéos en utilisant les boutons "Insérer" ci-dessous.</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Médias & Fichiers</h4>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Audio (Fon)</label>
                      <div className="flex flex-col gap-2">
                        <input type="file" accept="audio/*" onChange={e => handleModuleFileUpload(e, 'audio')} className="text-[10px]" />
                        <div className="relative">
                          <input 
                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-emerald-500 outline-none"
                            placeholder="URL..."
                            value={editingModule.audioUrl || ''}
                            onChange={e => setEditingModule({...editingModule, audioUrl: e.target.value})}
                          />
                          <Globe size={12} className="absolute left-3 top-2.5 text-slate-400" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vidéo du cours</label>
                      <div className="flex flex-col gap-2">
                        <input type="file" accept="video/*" onChange={e => handleModuleFileUpload(e, 'video')} className="text-[10px]" />
                        <div className="relative">
                          <input 
                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-emerald-500 outline-none"
                            placeholder="URL..."
                            value={editingModule.videoUrl || ''}
                            onChange={e => setEditingModule({...editingModule, videoUrl: e.target.value})}
                          />
                          <Video size={12} className="absolute left-3 top-2.5 text-slate-400" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Images (Contenu)</label>
                      <div className="flex flex-col gap-2">
                        <input type="file" accept="image/*" onChange={e => handleModuleFileUpload(e, 'image')} className="text-[10px]" />
                        <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100 flex items-center gap-2">
                           <ImageIcon size={14} className="text-emerald-500" />
                           <span className="text-[9px] text-emerald-800 font-bold uppercase">Ajouter au texte</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Documents & Fichiers joint (PDF/Image)</label>
                      <button 
                        type="button"
                        onClick={() => {
                          const url = prompt("Veuillez entrer l'URL du fichier :");
                          if (url) {
                            const name = prompt("Nom du fichier :", "Document externe") || "Document externe";
                            const type = url.match(/\.(mp3|wav|ogg)$/i) ? 'audio' : url.match(/\.(mp4|webm)$/i) ? 'video' : 'pdf';
                            const newAtt: Attachment = { id: Date.now().toString(), name, url, type };
                            setEditingModule({...editingModule, attachments: [...(editingModule.attachments || []), newAtt]});
                          }
                        }}
                        className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 hover:underline"
                      >
                        <Plus size={10} /> Ajouter via URL
                      </button>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <Paperclip size={14} className="text-slate-400 ml-1" />
                      <input type="file" accept=".pdf,image/*" onChange={e => handleModuleFileUpload(e, 'pdf')} className="text-[10px] flex-1 bg-transparent border-none outline-none" />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editingModule.attachments?.map(att => (
                        <div key={att.id} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-[10px] shadow-sm group">
                          {att.type === 'audio' ? <Volume2 size={12} className="text-blue-500" /> : att.type === 'video' ? <Video size={12} className="text-slate-500" /> : att.type === 'image' ? <ImageIcon size={12} className="text-orange-500" /> : <FileText size={12} className="text-emerald-500" />}
                          <span className="truncate max-w-[120px] font-medium">{att.name}</span>
                          
                          {(att.type === 'image' || att.type === 'video') && (
                            <button 
                              type="button"
                              onClick={() => {
                                const md = att.type === 'image' 
                                  ? `\n![${att.name}](${att.url})\n`
                                  : `\n@[video](${att.url})\n`;
                                insertMarkdownAtCursor(md);
                              }}
                              className="text-[9px] font-bold text-emerald-600 px-1.5 py-0.5 bg-emerald-50 rounded hidden group-hover:block"
                            >
                              Insérer
                            </button>
                          )}

                          <button 
                            type="button"
                            onClick={() => handleDeleteAttachment(att.id)} 
                            className="text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Quiz ({editingModule.quiz?.length || 0} questions)</h4>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditingModule({...editingModule, quiz: [...(editingModule.quiz || []), { id: Date.now().toString(), question: 'Nouvelle question', options: ['Option 1', 'Option 2'], correctAnswer: [0] }]})}>
                      <Plus size={14} className="mr-1" /> Ajouter
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    {editingModule.quiz?.map((q, idx) => (
                      <div key={q.id} className="p-4 bg-slate-50 rounded-xl space-y-3 relative">
                        <button 
                          type="button"
                          className="absolute top-2 right-2 text-red-500"
                          onClick={() => setEditingModule({...editingModule, quiz: editingModule.quiz?.filter(item => item.id !== q.id)})}
                        >
                          <Trash2 size={14} />
                        </button>
                        <div className="flex justify-between items-center mb-2">
                           <div className="flex-1">
                             <Input 
                               label={`Question ${idx + 1}`} 
                               value={q.question} 
                               onChange={e => {
                                 const newQuiz = [...(editingModule.quiz || [])];
                                 newQuiz[idx].question = e.target.value;
                                 setEditingModule({...editingModule, quiz: newQuiz});
                               }}
                             />
                           </div>
                           <div className="flex items-center gap-2 ml-4 self-end h-10 px-3 bg-white rounded-lg border border-slate-200">
                             <input 
                               type="checkbox" 
                               id={`isMulti-${q.id}`}
                               checked={Array.isArray(q.correctAnswer)}
                               onChange={(e) => {
                                 const newQuiz = [...(editingModule.quiz || [])];
                                 if (e.target.checked) {
                                   newQuiz[idx].correctAnswer = [newQuiz[idx].correctAnswer as number];
                                 } else {
                                   newQuiz[idx].correctAnswer = Array.isArray(newQuiz[idx].correctAnswer) ? newQuiz[idx].correctAnswer[0] : newQuiz[idx].correctAnswer;
                                 }
                                 setEditingModule({...editingModule, quiz: newQuiz});
                               }}
                             />
                             <label htmlFor={`isMulti-${q.id}`} className="text-[10px] font-bold text-slate-500 uppercase">Plusieurs réponses</label>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt, oIdx) => {
                            const isMulti = Array.isArray(q.correctAnswer);
                            const isSelected = isMulti 
                              ? (q.correctAnswer as number[]).includes(oIdx)
                              : q.correctAnswer === oIdx;

                            return (
                              <div key={oIdx} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100">
                                <input 
                                  type={isMulti ? "checkbox" : "radio"} 
                                  name={`correct-${q.id}`} 
                                  checked={isSelected}
                                  onChange={() => {
                                    const newQuiz = [...(editingModule.quiz || [])];
                                    if (isMulti) {
                                      const current = (newQuiz[idx].correctAnswer as number[]) || [];
                                      const next = current.includes(oIdx)
                                        ? current.filter(v => v !== oIdx)
                                        : [...current, oIdx];
                                      newQuiz[idx].correctAnswer = next;
                                    } else {
                                      newQuiz[idx].correctAnswer = oIdx;
                                    }
                                    setEditingModule({...editingModule, quiz: newQuiz});
                                  }}
                                />
                                <input 
                                  className="flex-1 text-xs p-2 border-none bg-transparent outline-none"
                                  value={opt}
                                  onChange={e => {
                                    const newQuiz = [...(editingModule.quiz || [])];
                                    newQuiz[idx].options[oIdx] = e.target.value;
                                    setEditingModule({...editingModule, quiz: newQuiz});
                                  }}
                                />
                              </div>
                            );
                          })}
                          <button 
                            type="button"
                            className="text-[10px] text-emerald-600 font-bold"
                            onClick={() => {
                              const newQuiz = [...(editingModule.quiz || [])];
                              newQuiz[idx].options.push(`Option ${newQuiz[idx].options.length + 1}`);
                              setEditingModule({...editingModule, quiz: newQuiz});
                            }}
                          >
                            + Ajouter option
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-6">
                  <Button type="submit" className="flex-1">Enregistrer tout le module</Button>
                  <Button variant="ghost" className="flex-1" onClick={() => setEditingModule(null)}>Annuler</Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

const SettingsScreen = ({ 
  user, 
  progress, 
  modules,
  settings,
  onUpdateLanguage, 
  onLogout, 
  onBack,
  onOpenAdmin,
  onDownloadCertificate,
  onChangePassword
}: { 
  user: any, 
  progress: any, 
  modules: Module[],
  settings: AppSettings,
  onUpdateLanguage: (l: Language) => void, 
  onLogout: () => void, 
  onBack: () => void,
  onOpenAdmin: () => void,
  onDownloadCertificate: () => void,
  onChangePassword: (pass: string) => Promise<boolean>
}) => {
  const isFullyCompleted = progress.finalExamScore !== undefined && progress.finalExamScore >= 80;
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setMessage({ text: 'Le mot de passe doit faire au moins 4 caractères', type: 'error' });
      return;
    }
    setIsChanging(true);
    const success = await onChangePassword(newPassword);
    setIsChanging(false);
    if (success) {
      setMessage({ text: 'Mot de passe modifié avec succès !', type: 'success' });
      setNewPassword('');
      setTimeout(() => {
        setShowPasswordChange(false);
        setMessage(null);
      }, 2000);
    } else {
      setMessage({ text: 'Erreur lors de la modification', type: 'error' });
    }
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-white shrink-0 z-10">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <h2 className="font-bold">Paramètres & Profil</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">
        <Card className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 overflow-hidden">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <UserIcon size={28} />
            )}
          </div>
          <div>
            <h3 className="font-bold">{user.fullName}</h3>
            <p className="text-xs text-slate-500">{user.phone || user.email || 'Pas de contact'} • {user.location}</p>
          </div>
        </Card>

        {user.isAdmin && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Administration</h4>
            <Card className="p-0 overflow-hidden">
              <button 
                onClick={onOpenAdmin}
                className="w-full p-5 flex items-center justify-between bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Settings size={20} className="text-emerald-600" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-emerald-900">Tableau de bord Admin</p>
                    <p className="text-[10px] text-emerald-600">Gérer les utilisateurs et le contenu</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-emerald-400" />
              </button>
            </Card>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Préférences</h4>
          <Card className="p-0 overflow-hidden">
            <button 
              onClick={() => onUpdateLanguage(user.preferredLanguage === 'fr' ? 'fon' : 'fr')}
              className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Globe size={20} className="text-slate-400" />
                <div className="text-left">
                  <p className="text-sm font-medium">Langue d'apprentissage</p>
                  <p className="text-xs text-emerald-600 font-bold">{user.preferredLanguage === 'fr' ? 'Français' : 'Fon'}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </button>
          </Card>
        </div>

        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Formation</h4>
          <Card className="p-6 space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-slate-500">Modules validés</p>
                <p className="text-2xl font-bold">{progress.completedModules.length} / {modules.length}</p>
              </div>
              <Award size={32} className={cn(isFullyCompleted ? "text-emerald-500" : "text-slate-200")} />
            </div>
            
            {user.preferredLanguage === 'fr' ? (
              isFullyCompleted ? (
                <Button className="w-full gap-2" onClick={onDownloadCertificate}>
                  <Download size={18} /> Télécharger le certificat
                </Button>
              ) : (
                <p className="text-[10px] text-slate-400 text-center italic">
                  Le certificat sera disponible une fois tous les modules validés.
                </p>
              )
            ) : (
              isFullyCompleted ? (
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-center">
                  <p className="text-xs text-orange-800 font-medium mb-3">
                    Félicitations ! Vous avez écouté tous les modules.
                  </p>
                  <p className="text-[10px] text-orange-700 leading-relaxed mb-4">
                    Veuillez passer au siège de {settings.organizationName} pour l'examen final afin d'obtenir votre certificat physique.
                  </p>
                  <Button variant="outline" size="sm" className="w-full border-orange-200 text-orange-700">
                    Contacter HAI sur WhatsApp
                  </Button>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 text-center italic">
                  Écoutez tous les modules pour être éligible à l'examen.
                </p>
              )
            )}
          </Card>
        </div>

        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sécurité</h4>
          <Card className="p-4 space-y-4">
            {!showPasswordChange ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => setShowPasswordChange(true)}
              >
                <Key size={14} className="mr-2" /> Changer le mot de passe
              </Button>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-3">
                <Input 
                  label="Nouveau mot de passe" 
                  type="password" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 4 caractères"
                  autoFocus
                />
                {message && (
                  <p className={cn("text-[10px] font-bold", message.type === 'success' ? "text-emerald-600" : "text-red-600")}>
                    {message.text}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button type="submit" size="sm" className="flex-1" disabled={isChanging}>
                    {isChanging ? "Action..." : "Valider"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowPasswordChange(false)} className="flex-1">
                    Annuler
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>

        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Système</h4>
          <Card className="p-0 overflow-hidden">
            <div className="p-5 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center gap-3">
                <Download size={20} className="text-slate-400" />
                <div className="text-left">
                  <p className="text-sm font-medium">Mode Hors-Ligne</p>
                  <p className="text-[10px] text-slate-500">Contenu disponible sans internet</p>
                </div>
              </div>
              <div className="w-10 h-6 bg-emerald-500 rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
            <button 
              onClick={() => alert("Cache vidé avec succès")}
              className="w-full p-5 flex items-center gap-3 hover:bg-slate-50 transition-colors"
            >
              <X size={20} className="text-slate-400" />
              <p className="text-sm font-medium">Vider le cache</p>
            </button>
          </Card>
        </div>

        <Button variant="outline" className="w-full text-red-500 border-red-100 hover:bg-red-50" onClick={onLogout}>
          <LogOut size={18} className="mr-2" /> Déconnexion
        </Button>
      </div>
    </div>
  );
};

// --- Main App ---

// =========================================================================
// MON APPLICATION PRINCIPALE
// Développé avec passion par Léonard KABO.
// C'est ici que tout se passe (navigation, écrans, etc.)
// =========================================================================
export default function App() {
  // Mes hooks personnalisés pour gérer les données et Firebase
  const { 
    user, 
    users,
    allProgress,
    progress, 
    modules,
    glossary,
    legalDocuments,
    caseStudies,
    settings,
    isLoading,
    error,
    registerUser, 
    login,
    loginWithGoogle,
    sendPasswordReset,
    setLanguage, 
    completeModule, 
    markAudioListened,
    completeCaseStudy,
    setFinalExamScore,
    updateLastActivity,
    logout,
    deleteUser,
    saveUser,
    saveModule,
    deleteModule,
    saveGlossaryTerm,
    deleteGlossaryTerm,
    saveLegalDocument,
    deleteLegalDocument,
    saveCaseStudy,
    deleteCaseStudy,
    saveSettings,
    changePassword,
    uploadFile,
    saveReport,
    fetchFiles,
    deleteFile,
    isSyncing,
    forceSync
  } = useAppState();

  const generateCertificate = () => {
    if (!user) return;
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 297;
    const pageHeight = 210;

    // Background
    doc.setFillColor(245, 252, 250);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Decorative Border
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(1.5);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
    
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    
    // Corners
    const cornerSize = 15;
    doc.setLineWidth(2);
    // Top Left
    doc.line(8, 8, 8 + cornerSize, 8);
    doc.line(8, 8, 8, 8 + cornerSize);
    // Top Right
    doc.line(pageWidth - 8, 8, pageWidth - 8 - cornerSize, 8);
    doc.line(pageWidth - 8, 8, pageWidth - 8, 8 + cornerSize);
    // Bottom Left
    doc.line(8, pageHeight - 8, 8 + cornerSize, pageHeight - 8);
    doc.line(8, pageHeight - 8, 8, pageHeight - 8 - cornerSize);
    // Bottom Right
    doc.line(pageWidth - 8, pageHeight - 8, pageWidth - 8 - cornerSize, pageHeight - 8);
    doc.line(pageWidth - 8, pageHeight - 8, pageWidth - 8, pageHeight - 8 - cornerSize);

    // Logo
    if (settings.logoUrl) {
      try {
        doc.addImage(settings.logoUrl, 'PNG', pageWidth/2 - 15, 18, 30, 30);
      } catch (e) {
        console.error("Could not add logo to PDF", e);
      }
    }

    // Header
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(38);
    doc.text("CERTIFICAT D'ACHÈVEMENT", pageWidth/2, 65, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    doc.text('Le présent document est fièrement décerné à', pageWidth/2, 80, { align: 'center' });
    
    // User Name with auto font size
    let nameSize = 34;
    const name = user.fullName.toUpperCase();
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    
    // Shrink font size if name is too long
    const nameWidth = doc.getTextWidth(name);
    if (nameWidth > 200) {
      nameSize = (200 / nameWidth) * nameSize;
    }
    doc.setFontSize(nameSize);
    doc.text(name, pageWidth/2, 100, { align: 'center' });
    
    // Content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    doc.setTextColor(71, 85, 105);
    const contentText = 'Pour avoir suivi avec succès le cours en ligne (MOOC) de';
    doc.text(contentText, pageWidth/2, 118, { align: 'center' });
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(15, 23, 42);
    doc.text('DROIT ET PARAJURALISME AU BÉNIN', pageWidth/2, 132, { align: 'center' });

    // Disclaimer
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    const disclaimerText = "Ce certificat certifie le suivi avec succès du cours en ligne mais";
    const disclaimerText2 = "ne confère pas au détenteur le droit de se réclamer parajuriste.";
    doc.text(disclaimerText, pageWidth/2, 142, { align: 'center' });
    doc.text(disclaimerText2, pageWidth/2, 147, { align: 'center' });

    // Organization info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(71, 85, 105);
    doc.text(`Propulsé par ${settings.organizationName}`, pageWidth/2, 158, { align: 'center' });
    
    // Footer - Info Left
    const date = new Date().toLocaleDateString('fr-FR');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Délivrée le : ${date}`, 25, 185);
    doc.text(`Identifiant de vérification : ${Math.random().toString(36).substr(2, 12).toUpperCase()}`, 25, 190);
    doc.text("Ce document certifie qu'il a suivi avec succès le cours en ligne (MOOC).", 25, 195);
    
    // Footer - Signature Right
    const sigX = 225;
    const sigY = 175;
    
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('Le Directeur Exécutif HAI', sigX, 165, { align: 'center' });
    
    // Signature Line
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.line(sigX - 35, 188, sigX + 35, 188);

    if (settings.directorSignatureUrl) {
      try {
        doc.addImage(settings.directorSignatureUrl, 'PNG', sigX - 25, 168, 50, 20);
      } catch (e) {
        console.error("Could not add signature to PDF", e);
      }
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(settings.directorName || 'Directeur HAI', sigX, 195, { align: 'center' });

    doc.save(`Certificat_HAI_${user.fullName.replace(/\s/g, '_')}.pdf`);
  };

  const [currentScreen, setCurrentScreen] = useState<'main' | 'module' | 'settings' | 'glossary' | 'documents' | 'reporting' | 'cases' | 'performance' | 'exam' | 'admin'>('main');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  useEffect(() => {
    if (user && !localStorage.getItem('paralegal_intro_seen')) {
      localStorage.setItem('paralegal_intro_seen', 'true');
    }
  }, [user]);

  const handleRegister = (data: any) => {
    registerUser(data);
  };

  const handleLogin = (phone: string, pass: string) => {
    login(phone, pass);
  };

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('paralegal_intro_seen', 'true');
  };

  const handleModuleSelect = (m: Module) => {
    setSelectedModule(m);
    updateLastActivity(`Lecture du module: ${m.title}`, m.id);
    setCurrentScreen('module');
  };

  if (!user) {
    return (
      <AuthScreen 
        onRegister={handleRegister} 
        onLogin={handleLogin} 
        onLoginWithGoogle={loginWithGoogle}
        onResetPassword={sendPasswordReset}
        logoUrl={settings.logoUrl}
        isLoading={isLoading} 
        error={error} 
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-slate-50 min-h-screen shadow-2xl shadow-slate-200 relative overflow-x-hidden">
      <AnimatePresence mode="wait">
        {currentScreen === 'main' && (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Dashboard 
              user={user} 
              progress={progress} 
              modules={modules}
              caseStudies={caseStudies}
              isSyncing={isSyncing}
              onSelectModule={handleModuleSelect}
              onOpenSettings={() => setCurrentScreen('settings')}
              onOpenCases={() => setCurrentScreen('cases')}
              onOpenPerformance={() => setCurrentScreen('performance')}
              onOpenExam={() => setCurrentScreen('exam')}
              onDownloadCertificate={generateCertificate}
              onForceSync={forceSync}
              updateLastActivity={updateLastActivity}
            />
          </motion.div>
        )}

        {currentScreen === 'module' && selectedModule && (
          <motion.div 
            key="module"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-white max-w-2xl mx-auto shadow-2xl"
          >
            <ModuleDetail 
              module={selectedModule}
              user={user}
              progress={progress}
              isSyncing={isSyncing}
              onBack={() => setCurrentScreen('main')}
              onNext={(() => {
                const currentIndex = modules.findIndex(m => m.id === selectedModule.id);
                if (currentIndex !== -1 && currentIndex < modules.length - 1) {
                  return () => handleModuleSelect(modules[currentIndex + 1]);
                }
                return undefined;
              })()}
              onComplete={(score) => {
                if (user.preferredLanguage === 'fr') {
                  completeModule(selectedModule.id, score);
                } else {
                  markAudioListened(selectedModule.id);
                }
              }}
            />
          </motion.div>
        )}

        {currentScreen === 'settings' && (
          <motion.div 
            key="settings"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-slate-50 max-w-2xl mx-auto shadow-2xl overflow-y-auto"
          >
            <SettingsScreen 
              user={user}
              progress={progress}
              modules={modules}
              settings={settings}
              onUpdateLanguage={setLanguage}
              onLogout={logout}
              onBack={() => setCurrentScreen('main')}
              onOpenAdmin={() => setCurrentScreen('admin')}
              onDownloadCertificate={generateCertificate}
              onChangePassword={changePassword}
            />
          </motion.div>
        )}

        {currentScreen === 'glossary' && (
          <motion.div 
            key="glossary"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-slate-50 max-w-2xl mx-auto shadow-2xl overflow-y-auto"
          >
            <GlossaryScreen onBack={() => setCurrentScreen('main')} glossary={glossary} />
          </motion.div>
        )}

        {currentScreen === 'documents' && (
          <motion.div 
            key="documents"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-slate-50 max-w-2xl mx-auto shadow-2xl overflow-y-auto"
          >
            <DocumentsScreen onBack={() => setCurrentScreen('main')} documents={legalDocuments} />
          </motion.div>
        )}

        {currentScreen === 'reporting' && (
          <motion.div 
            key="reporting"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-slate-50 max-w-2xl mx-auto shadow-2xl overflow-hidden"
          >
            <ReportingScreen 
              user={user}
              modules={modules}
              onBack={() => setCurrentScreen('main')}
              onComplete={() => {
                setCurrentScreen('main');
              }}
              saveReport={saveReport}
            />
          </motion.div>
        )}

        {currentScreen === 'cases' && (
          <motion.div 
            key="cases"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-slate-50 max-w-2xl mx-auto shadow-2xl overflow-y-auto"
          >
            <CaseStudiesScreen 
              onBack={() => setCurrentScreen('main')} 
              progress={progress}
              caseStudies={caseStudies}
              isSyncing={isSyncing}
              onComplete={completeCaseStudy}
            />
          </motion.div>
        )}

        {currentScreen === 'performance' && (
          <motion.div 
            key="performance"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-slate-50 max-w-2xl mx-auto shadow-2xl overflow-y-auto"
          >
            <PerformanceScreen 
              progress={progress}
              modules={modules}
              caseStudies={caseStudies}
              onBack={() => setCurrentScreen('main')}
            />
          </motion.div>
        )}

        {currentScreen === 'exam' && (
          <motion.div 
            key="exam"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white max-w-2xl mx-auto overflow-y-auto"
          >
            <FinalExamScreen 
              onBack={() => setCurrentScreen('main')}
              onComplete={setFinalExamScore}
              onDownloadCertificate={generateCertificate}
              modules={modules}
            />
          </motion.div>
        )}

        {currentScreen === 'admin' && (
          <motion.div 
            key="admin"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-slate-50 max-w-2xl mx-auto shadow-2xl"
          >
            <AdminDashboard 
              onBack={() => setCurrentScreen('settings')}
              modules={modules}
              glossary={glossary}
              legalDocuments={legalDocuments}
              caseStudies={caseStudies}
              settings={settings}
              allUsers={users}
              allProgress={allProgress}
              onSaveModule={saveModule}
              onDeleteModule={deleteModule}
              onSaveGlossaryTerm={saveGlossaryTerm}
              onDeleteGlossaryTerm={deleteGlossaryTerm}
              onSaveLegalDocument={saveLegalDocument}
              onDeleteLegalDocument={deleteLegalDocument}
              onSaveCaseStudy={saveCaseStudy}
              onDeleteCaseStudy={deleteCaseStudy}
              onDeleteUser={deleteUser}
              onSaveUser={saveUser}
              onSaveSettings={saveSettings}
              onUploadFile={uploadFile}
              onFetchFiles={fetchFiles}
              onDeleteFile={deleteFile}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation (Mini) */}
      {['main', 'reporting'].includes(currentScreen) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-[calc(672px-3rem)] bg-slate-900 text-white rounded-2xl p-2 flex justify-around items-center shadow-xl z-20">
          <button className={cn("p-3 transition-colors", currentScreen === 'main' ? "text-emerald-400" : "text-slate-400 hover:text-white")} onClick={() => setCurrentScreen('main')} title="Cours">
            <BookOpen size={24} />
          </button>
          <button className={cn("p-3 transition-colors", currentScreen === 'glossary' ? "text-emerald-400" : "text-slate-400 hover:text-white")} onClick={() => setCurrentScreen('glossary')} title="Glossaire">
            <Library size={24} />
          </button>
          <button className={cn("p-3 transition-colors", currentScreen === 'reporting' ? "text-red-400 scale-110" : "text-slate-400 hover:text-white")} onClick={() => setCurrentScreen('reporting')} title="Signalement">
            <AlertTriangle size={24} />
          </button>
          <button className={cn("p-3 transition-colors", currentScreen === 'documents' ? "text-emerald-400" : "text-slate-400 hover:text-white")} onClick={() => setCurrentScreen('documents')} title="Modèles">
            <FileText size={24} />
          </button>
          <button className={cn("p-3 transition-colors", currentScreen === 'settings' ? "text-emerald-400" : "text-slate-400 hover:text-white")} onClick={() => setCurrentScreen('settings')} title="Mon Profil">
            <UserIcon size={24} />
          </button>
        </div>
      )}
    </div>
  );
}
