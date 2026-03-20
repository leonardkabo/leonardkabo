/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, FileText, LogOut, Trash2, Check, X, Clock, User, Mail, Phone, MessageSquare, Settings, MapPin, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import Button from './ui/Button';

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
  const [activeTab, setActiveTab] = useState<'appointments' | 'quotes' | 'settings'>('appointments');
  const [loading, setLoading] = useState(true);
  const [mapConfig, setMapConfig] = useState({ lat: 9.3372, lng: 2.6288 });
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
        navigate('/admin/login');
      } else {
        setUser(user);
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const qAppointments = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'));
    const unsubscribeAppointments = onSnapshot(qAppointments, (snapshot) => {
      setAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'appointments'));

    const qQuotes = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
    const unsubscribeQuotes = onSnapshot(qQuotes, (snapshot) => {
      setQuotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'quotes'));

    // Fetch map settings
    getDoc(doc(db, 'settings', 'mapConfig')).then((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMapConfig({ lat: data.mapLat, lng: data.mapLng });
      }
    });

    return () => {
      unsubscribeAppointments();
      unsubscribeQuotes();
    };
  }, [user]);

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

  const currentItems = activeTab === 'appointments' ? appointments : quotes;
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
            variant={activeTab === 'settings' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('settings')}
            icon={Settings}
          >
            Paramètres
          </Button>
        </div>

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
                {appointments.length === 0 ? (
                  <div className="bg-white p-20 rounded-[3rem] text-center border border-gray-100">
                    <Calendar size={48} className="mx-auto text-gray-200 mb-6" />
                    <p className="text-gray-400 font-medium">Aucun rendez-vous pour le moment.</p>
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
                {quotes.length === 0 ? (
                  <div className="bg-white p-20 rounded-[3rem] text-center border border-gray-100">
                    <FileText size={48} className="mx-auto text-gray-200 mb-6" />
                    <p className="text-gray-400 font-medium">Aucune demande de devis pour le moment.</p>
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
            ) : (
              <motion.div
                key="settings-tab"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white p-12 rounded-[3rem] shadow-sm border border-gray-100"
              >
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
                  isLoading={savingSettings}
                  icon={Save}
                >
                  Enregistrer les Coordonnées
                </Button>
              </motion.div>
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
