/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Info, AlertTriangle, BarChart3, Users, Trophy, ChevronRight, Vote, Trash2, Clock } from 'lucide-react';
import { useSiteData } from '../hooks/useSiteData';
import { db } from '../firebase';
import { doc, updateDoc, increment, collection, setDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';
import Button from './ui/Button';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie } from 'recharts';

export default function VotingPage() {
  const { votingSessions, loading } = useSiteData();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [voterName, setVoterName] = useState('');
  const [voterPhone, setVoterPhone] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [votingStep, setVotingStep] = useState<'none' | 'selecting' | 'identity'>('none');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeSessions = useMemo(() => {
    return votingSessions.filter(s => {
      if (!s.active) return false;
      const end = new Date(s.endDate);
      return end > new Date();
    });
  }, [votingSessions]);

  const activeSession = useMemo(() => {
    return activeSessions.find(s => s.id === activeSessionId) || activeSessions[0];
  }, [activeSessions, activeSessionId]);

  // Sync activeSessionId if not set
  useMemo(() => {
    if (!activeSessionId && activeSessions.length > 0) {
      setActiveSessionId(activeSessions[0].id);
    }
  }, [activeSessions, activeSessionId]);

  const alreadyVotedEvents = useMemo(() => {
    const data = localStorage.getItem('voted_session_ids');
    return data ? JSON.parse(data) : [];
  }, []);

  const userHasVoted = hasVoted || (activeSession && alreadyVotedEvents.includes(activeSession.id));

  const handleToggleCandidate = (candidateId: string) => {
    if (!activeSession) return;
    if (selectedCandidates.includes(candidateId)) {
      setSelectedCandidates(selectedCandidates.filter(id => id !== candidateId));
    } else {
      if (selectedCandidates.length < activeSession.maxVotes) {
        setSelectedCandidates([...selectedCandidates, candidateId]);
      }
    }
  };

  const handleSubmitVotes = async () => {
    if (!activeSession || selectedCandidates.length === 0 || !voterName.trim() || !voterPhone.trim()) return;
    
    setSubmitting(true);
    try {
      const sessionRef = doc(db, 'voting', activeSession.id);
      const ballotRef = doc(collection(db, 'voting', activeSession.id, 'ballots'));

      // 1. Create Ballot
      await setDoc(ballotRef, {
        voterName,
        voterPhone,
        candidateIds: selectedCandidates,
        timestamp: serverTimestamp()
      });

      // 2. Update Session Stats
      const updatedCandidates = activeSession.candidates.map(c => {
        if (selectedCandidates.includes(c.id)) {
          return { ...c, voteCount: (c.voteCount || 0) + 1 };
        }
        return c;
      });

      await updateDoc(sessionRef, { 
        candidates: updatedCandidates,
        voterCount: increment(1)
      });

      // Record vote locally
      const updatedVotedIds = [...alreadyVotedEvents, activeSession.id];
      localStorage.setItem('voted_session_ids', JSON.stringify(updatedVotedIds));
      
      setHasVoted(true);
      setVotingStep('none');
    } catch (error) {
      console.error('Error submitting votes:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  if (activeSessions.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-gray-50">
        <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mb-8">
          <Vote size={48} />
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">Aucun Scrutin Actif</h1>
        <p className="text-xl text-gray-500 max-w-lg text-center leading-relaxed">
          Il n'y a aucune campagne de vote active pour le moment. Revenez plus tard pour participer aux prochains événements.
        </p>
      </div>
    );
  }

  if (!activeSession) return null;

  const sortedCandidates = [...activeSession.candidates].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
  const totalVotes = activeSession.candidates.reduce((sum, c) => sum + (c.voteCount || 0), 0);
  const totalVoters = activeSession.voterCount || 0;

  const chartData = activeSession.candidates.map(c => ({
    name: c.name,
    votes: c.voteCount || 0,
    imageUrl: c.imageUrl,
    id: c.id
  })).sort((a, b) => b.votes - a.votes);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

  const ChartTick = (props: any) => {
    const { x, y, payload } = props;
    const item = chartData.find(d => d.name === payload.value);
    if (!item) return null;

    const labelWidth = isMobile ? 120 : 240;

    return (
      <g transform={`translate(${x},${y})`}>
        <foreignObject x={-(labelWidth + 10)} y={isMobile ? "-15" : "-25"} width={labelWidth} height={isMobile ? "30" : "50"}>
          <div className="flex items-center justify-end space-x-2 w-full h-full pr-2 overflow-hidden">
            <div className="text-right min-w-0 flex-1">
              <p className={cn(
                "font-black text-gray-900 leading-none uppercase line-clamp-2",
                isMobile ? "text-[8px]" : "text-[10px]"
              )}>
                {item.name}
              </p>
            </div>
            <div className="flex-shrink-0">
              <img 
                src={item.imageUrl || `https://picsum.photos/seed/${item.id}/60/60`} 
                className={cn(
                  "rounded-lg object-cover border-2 border-white shadow-sm",
                  isMobile ? "w-6 h-6 border-1" : "w-10 h-10 border-2"
                )}
                referrerPolicy="no-referrer"
                alt=""
              />
            </div>
          </div>
        </foreignObject>
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Session Selector if multiple */}
        {activeSessions.length > 1 && (
          <div className="flex flex-wrap gap-4 justify-center mb-12">
            {activeSessions.map(s => (
              <button
                key={s.id}
                onClick={() => {
                  setActiveSessionId(s.id);
                  setHasVoted(false);
                  setSelectedCandidates([]);
                  setVotingStep('none');
                }}
                className={cn(
                  "px-6 py-3 rounded-2xl font-bold transition-all border-2",
                  activeSessionId === s.id 
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20" 
                    : "bg-white border-gray-100 text-gray-500 hover:border-blue-600/20"
                )}
              >
                {s.title}
              </button>
            ))}
          </div>
        )}

        <motion.div 
          key={activeSession.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-xl shadow-blue-600/20">
            <Vote size={12} />
            <span>Système de Vote Officiel</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-gray-900 tracking-tighter mb-6 leading-none">
            {activeSession.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium mb-8">
            {activeSession.description}
          </p>

          {/* Countdown timer */}
          <div className="inline-flex items-center space-x-4 bg-gray-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl">
            <Clock size={20} className="text-blue-400" />
            <span className="text-sm font-bold uppercase tracking-widest opacity-60">Fin du vote dans :</span>
            <CountdownTimer targetDate={activeSession.endDate} />
          </div>
        </motion.div>

        {/* Content Flow */}
        <AnimatePresence mode="wait">
          {votingStep === 'none' ? (
            <motion.div 
              key="stats-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Real-time Dashboard */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl shadow-blue-900/5 border border-gray-100">
                    <div className="flex items-center justify-between mb-12">
                      <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Tendances en Direct</h2>
                        <p className="text-gray-500 font-medium">Aperçu analytique des suffrages exprimés</p>
                      </div>
                      <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl">
                        <BarChart3 size={28} />
                      </div>
                    </div>

                    <div style={{ height: `${Math.max(300, chartData.length * (isMobile ? 50 : 85))}px` }} className="w-full mb-12">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={isMobile ? 120 : 240} 
                            axisLine={false} 
                            tickLine={false}
                            interval={0}
                            tick={<ChartTick />}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#f8fafc' }}
                          />
                          <Bar dataKey="votes" radius={[0, 10, 10, 0]} barSize={32}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                      {sortedCandidates.slice(0, 3).map((cand, i) => (
                        <div key={cand.id} className="bg-white/50 p-6 rounded-[2.5rem] flex items-center space-x-4 border border-blue-50">
                          <div className="relative">
                            <img src={cand.imageUrl || `https://picsum.photos/seed/${cand.id}/80/80`} className="w-16 h-16 rounded-2xl object-cover shadow-lg" referrerPolicy="no-referrer" />
                            <div className={cn(
                              "absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white",
                              i === 0 ? "bg-amber-500" : i === 1 ? "bg-gray-400" : "bg-orange-500"
                            )}>{i + 1}</div>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 leading-tight">{cand.name}</h4>
                            <p className="text-xs text-blue-600 font-black uppercase tracking-widest">{cand.voteCount || 0} Votes</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-blue-50/50 p-8 rounded-[2.5rem] flex flex-col items-center justify-center">
                        <Users size={24} className="text-blue-600 mb-3" />
                        <span className="text-4xl font-black text-blue-600">{totalVoters}</span>
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Total Votants</span>
                      </div>
                      <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] flex flex-col items-center justify-center">
                        <Trophy size={24} className="text-emerald-600 mb-3" />
                        <span className="text-4xl font-black text-emerald-600">{sortedCandidates[0].voteCount || 0}</span>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Leader</span>
                      </div>
                      <div className="bg-purple-50/50 p-8 rounded-[2.5rem] flex flex-col items-center justify-center">
                        <BarChart3 size={24} className="text-purple-600 mb-3" />
                        <span className="text-4xl font-black text-purple-600">
                          {totalVotes > 0 ? Math.round((sortedCandidates[0].voteCount || 0) / totalVotes * 100) : 0}%
                        </span>
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Part de Vote</span>
                      </div>
                    </div>
                  </div>

                  {/* Rules Display */}
                  <div className="bg-gray-900 p-12 rounded-[3.5rem] text-white">
                    <div className="flex items-center space-x-3 mb-6">
                      <Info className="text-blue-400" />
                      <h3 className="text-xl font-bold">Règlement du Scrutin</h3>
                    </div>
                    <div className="prose prose-invert prose-blue max-w-none opacity-80 whitespace-pre-line text-sm">
                      {activeSession.rules}
                    </div>
                  </div>
                </div>

                {/* Rankings List & Vote Action */}
                <div className="space-y-8">
                  {!userHasVoted ? (
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setVotingStep('selecting')}
                      className="bg-blue-600 p-10 rounded-[3rem] text-white shadow-2xl shadow-blue-600/30 cursor-pointer group overflow-hidden relative"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150" />
                      <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                          <Vote size={32} />
                        </div>
                        <h3 className="text-3xl font-black mb-2">Participer au Vote</h3>
                        <p className="opacity-80 font-medium mb-8">Faites entendre votre voix dès maintenant !</p>
                        <div className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center space-x-3">
                          <span>Voter Maintenant</span>
                          <ChevronRight size={18} />
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="bg-emerald-50 border-2 border-emerald-200 p-8 rounded-[3rem] text-center">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check size={32} />
                      </div>
                      <h3 className="text-xl font-black text-emerald-900 mb-2">Vote Enregistré</h3>
                      <p className="text-emerald-700 font-medium text-sm">Merci pour votre participation ! Votre bulletin a été comptabilisé avec succès.</p>
                    </div>
                  )}

                  <div className="space-y-6">
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight ml-4">Classement Général</h3>
                    {sortedCandidates.map((candidate, idx) => (
                      <div 
                        key={candidate.id}
                        className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-gray-100 flex items-center space-x-4 group transition-transform"
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg",
                          idx === 0 ? "bg-amber-100 text-amber-600 shadow-amber-200/50" : 
                          idx === 1 ? "bg-gray-100 text-gray-600 shadow-gray-200/50" :
                          idx === 2 ? "bg-orange-100 text-orange-600 shadow-orange-200/50" :
                          "bg-blue-50 text-blue-400 shadow-blue-100/50"
                        )}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0 flex items-center space-x-4">
                          <img 
                            src={candidate.imageUrl || `https://picsum.photos/seed/${candidate.id}/100/100`} 
                            className="w-12 h-12 rounded-xl object-cover border-2 border-gray-50 group-hover:scale-110 transition-transform" 
                            alt={candidate.name}
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-gray-900 truncate">{candidate.name}</h4>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                              {candidate.voteCount || 0} Voix
                            </p>
                          </div>
                        </div>
                        <div className="h-2 w-20 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${totalVotes > 0 ? (candidate.voteCount / totalVotes * 100) : 0}%` }}
                            className="h-full bg-blue-600"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : votingStep === 'selecting' ? (
            <motion.div
              key="selecting-view"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="max-w-6xl mx-auto"
            >
              <div className="flex items-center justify-between mb-12">
                <Button variant="ghost" icon={() => <ChevronRight className="rotate-180" />} onClick={() => setVotingStep('none')}>Retour aux résultats</Button>
                <div className="text-center">
                   <h2 className="text-3xl font-black text-gray-900">Choisissez vos candidats</h2>
                   <p className="text-gray-500 font-medium">Sélectionnez jusqu'à {activeSession.maxVotes} candidat(s)</p>
                </div>
                <div className="w-24" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
                {activeSession.candidates.map((candidate) => (
                  <motion.div
                    key={candidate.id}
                    whileHover={{ y: -10 }}
                    onClick={() => handleToggleCandidate(candidate.id)}
                    className={cn(
                      "relative bg-white rounded-[3.5rem] overflow-hidden cursor-pointer transition-all border-4",
                      selectedCandidates.includes(candidate.id) 
                        ? "border-blue-600 shadow-2xl shadow-blue-600/20" 
                        : "border-transparent shadow-xl shadow-blue-900/5 hover:shadow-2xl"
                    )}
                  >
                    <div className="aspect-[4/5] relative">
                      <img 
                        src={candidate.imageUrl || `https://picsum.photos/seed/${candidate.id}/800/1000`} 
                        alt={candidate.name}
                        className="w-full h-full object-cover transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      {selectedCandidates.includes(candidate.id) && (
                        <div className="absolute top-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                          <Check size={24} strokeWidth={4} />
                        </div>
                      )}
                      <div className="absolute bottom-8 left-8 right-8 text-white">
                        <h3 className="text-2xl font-black tracking-tight mb-2 leading-none">{candidate.name}</h3>
                        <p className="text-sm opacity-80 line-clamp-2 font-medium">{candidate.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="sticky bottom-8 left-0 right-0 flex justify-center z-50">
                <div className="bg-white/95 backdrop-blur-xl p-4 rounded-[3rem] shadow-2xl border border-gray-100 flex items-center space-x-6 min-w-[320px] lg:min-w-[600px] justify-between">
                  <div className="pl-6">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest block">Sélection</span>
                    <span className="text-xl font-black text-gray-900">{selectedCandidates.length} / {activeSession.maxVotes}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" className="rounded-full px-6" onClick={() => setSelectedCandidates([])} disabled={selectedCandidates.length === 0}>Effacer</Button>
                    <Button onClick={() => setVotingStep('identity')} disabled={selectedCandidates.length === 0} className="rounded-full px-12 h-14" icon={ChevronRight}>Continuer</Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="identity-view"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white p-16 rounded-[4rem] shadow-2xl shadow-blue-900/10 text-center border border-gray-100">
                <Button variant="ghost" className="mb-6" icon={() => <ChevronRight className="rotate-180" />} onClick={() => setVotingStep('selecting')}>Retour à la sélection</Button>
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <Users size={40} />
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-4">Informations Votant</h2>
                <p className="text-gray-500 font-medium mb-12">
                  Ces informations sont strictement confidentielles et réservées à l'administration pour valider le scrutin.
                </p>
                
                <div className="space-y-6">
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Nom Complet</label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border-4 border-transparent focus:border-blue-600/20 focus:bg-white rounded-[2rem] py-6 px-10 outline-none transition-all text-xl font-bold font-mono text-gray-900 placeholder:text-gray-300"
                      placeholder="Jean Dupont"
                      value={voterName}
                      onChange={(e) => setVoterName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Numéro de Téléphone</label>
                    <input
                      type="tel"
                      className="w-full bg-gray-50 border-4 border-transparent focus:border-blue-600/20 focus:bg-white rounded-[2rem] py-6 px-10 outline-none transition-all text-xl font-bold font-mono text-gray-900 placeholder:text-gray-300"
                      placeholder="+229 XX XX XX XX"
                      value={voterPhone}
                      onChange={(e) => setVoterPhone(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full h-20 rounded-[2rem] text-xl font-black uppercase tracking-widest shadow-xl shadow-blue-600/30"
                    disabled={!voterName.trim() || !voterPhone.trim() || submitting}
                    isLoading={submitting}
                    onClick={handleSubmitVotes}
                    icon={Vote}
                  >
                    Confirmer & Voter
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex items-center space-x-3 text-2xl font-black tabular-nums">
      <div className="flex flex-col items-center">
        <span>{timeLeft.days}</span>
        <span className="text-[8px] uppercase tracking-tighter opacity-40 -mt-1">j</span>
      </div>
      <span className="opacity-20">:</span>
      <div className="flex flex-col items-center">
        <span>{timeLeft.hours.toString().padStart(2, '0')}</span>
        <span className="text-[8px] uppercase tracking-tighter opacity-40 -mt-1">h</span>
      </div>
      <span className="opacity-20">:</span>
      <div className="flex flex-col items-center">
        <span>{timeLeft.minutes.toString().padStart(2, '0')}</span>
        <span className="text-[8px] uppercase tracking-tighter opacity-40 -mt-1">m</span>
      </div>
      <span className="opacity-20">:</span>
      <div className="flex flex-col items-center">
        <span>{timeLeft.seconds.toString().padStart(2, '0')}</span>
        <span className="text-[8px] uppercase tracking-tighter opacity-40 -mt-1">s</span>
      </div>
    </div>
  );
}
