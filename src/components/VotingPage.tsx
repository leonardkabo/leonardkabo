/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Info, AlertTriangle, BarChart3, Users, Trophy, ChevronRight, Vote, Trash2 } from 'lucide-react';
import { useSiteData } from '../hooks/useSiteData';
import { db } from '../firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { cn } from '../lib/utils';
import Button from './ui/Button';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie } from 'recharts';

export default function VotingPage() {
  const { voting, loading } = useSiteData();
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Check if user has already voted in this session (simple local storage check for demo)
  const sessionId = useMemo(() => {
    const id = localStorage.getItem('voting_session_id');
    if (id) return id;
    const newId = Math.random().toString(36).substring(2);
    localStorage.setItem('voting_session_id', newId);
    return newId;
  }, []);

  const alreadyVotedEvents = useMemo(() => {
    const data = localStorage.getItem('voted_events');
    return data ? JSON.parse(data) : [];
  }, []);

  const userHasVoted = hasVoted || (voting && alreadyVotedEvents.includes(voting.title));

  const handleToggleCandidate = (candidateId: string) => {
    if (selectedCandidates.includes(candidateId)) {
      setSelectedCandidates(selectedCandidates.filter(id => id !== candidateId));
    } else {
      if (voting && selectedCandidates.length < voting.maxVotes) {
        setSelectedCandidates([...selectedCandidates, candidateId]);
      }
    }
  };

  const handleSubmitVotes = async () => {
    if (!voting || selectedCandidates.length === 0) return;
    
    setSubmitting(true);
    try {
      const voteRef = doc(db, 'voting', 'active');
      const updatedCandidates = voting.candidates.map(c => {
        if (selectedCandidates.includes(c.id)) {
          return { ...c, voteCount: (c.voteCount || 0) + 1 };
        }
        return c;
      });

      await updateDoc(voteRef, { candidates: updatedCandidates });

      // Record vote locally
      const updatedVotedEvents = [...alreadyVotedEvents, voting.title];
      localStorage.setItem('voted_events', JSON.stringify(updatedVotedEvents));
      
      setHasVoted(true);
    } catch (error) {
      console.error('Error submitting votes:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  if (!voting || !voting.active) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-gray-50">
        <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mb-8">
          <Vote size={48} />
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">Aucun Vote en Cours</h1>
        <p className="text-xl text-gray-500 max-w-lg text-center leading-relaxed">
          Le système de vote est actuellement désactivé. Revenez plus tard pour participer aux prochains scrutins officiels.
        </p>
      </div>
    );
  }

  const sortedCandidates = [...voting.candidates].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
  const totalVotes = voting.candidates.reduce((sum, c) => sum + (c.voteCount || 0), 0);

  const chartData = voting.candidates.map(c => ({
    name: c.name,
    votes: c.voteCount || 0
  })).sort((a, b) => b.votes - a.votes);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-xl shadow-blue-600/20">
            <Vote size={12} />
            <span>Système de Vote Officiel</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-gray-900 tracking-tighter mb-6 leading-none">
            {voting.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
            {voting.description}
          </p>
        </motion.div>

        {userHasVoted ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Real-time Dashboard */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:col-span-2 space-y-8"
            >
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

                <div className="h-[400px] w-full mb-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#1e293b' }} />
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50/50 p-8 rounded-[2.5rem] flex flex-col items-center justify-center">
                    <Users size={24} className="text-blue-600 mb-3" />
                    <span className="text-4xl font-black text-blue-600">{totalVotes}</span>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Total Votes</span>
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
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Majorité</span>
                  </div>
                </div>
              </div>

              {/* Rules Display (Even after voting) */}
              <div className="bg-gray-900 p-12 rounded-[3.5rem] text-white">
                <div className="flex items-center space-x-3 mb-6">
                  <Info className="text-blue-400" />
                  <h3 className="text-xl font-bold">Règlement du Scrutin</h3>
                </div>
                <div className="prose prose-invert prose-blue max-w-none opacity-80 whitespace-pre-line">
                  {voting.rules}
                </div>
              </div>
            </motion.div>

            {/* Rankings List */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-black text-gray-900 tracking-tight ml-4">Classement Général</h3>
              {sortedCandidates.map((candidate, idx) => (
                <div 
                  key={candidate.id}
                  className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-gray-100 flex items-center space-x-4 group hover:scale-[1.02] transition-transform"
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
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">{candidate.name}</h4>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                      {candidate.voteCount || 0} Suffrages
                    </p>
                  </div>
                  <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${totalVotes > 0 ? (candidate.voteCount / totalVotes * 100) : 0}%` }}
                      className="h-full bg-blue-600"
                    />
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            {/* Rules Overlay */}
            <div className="bg-amber-50 border border-amber-200 p-8 rounded-[2.5rem] mb-12 flex items-start space-x-6">
              <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-amber-900 mb-2">Instructions de Vote</h3>
                <p className="text-amber-800/80 font-medium leading-relaxed">
                  Vous pouvez sélectionner jusqu'à <span className="font-black text-amber-900 underline decoration-amber-400 decoration-4 underline-offset-4">{voting.maxVotes} candidat(s)</span>. 
                  Une fois votre vote validé, vous ne pourrez plus modifier vos choix. Consultez le règlement complet ci-dessous avant de procéder.
                </p>
              </div>
            </div>

            {/* Candidates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {voting.candidates.map((candidate) => (
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
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {selectedCandidates.includes(candidate.id) && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"
                      >
                        <Check size={24} strokeWidth={4} />
                      </motion.div>
                    )}

                    <div className="absolute bottom-8 left-8 right-8 text-white">
                      <h3 className="text-2xl font-black tracking-tight mb-2 leading-none">{candidate.name}</h3>
                      <p className="text-sm opacity-80 line-clamp-2 font-medium">
                        {candidate.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Submit Action */}
            <div className="sticky bottom-8 left-0 right-0 flex justify-center z-50 px-4">
              <motion.div 
                layout
                className="bg-white/90 backdrop-blur-xl p-4 rounded-[3rem] shadow-2xl border border-gray-100 flex items-center space-x-6 min-w-[320px] lg:min-w-[600px] justify-between"
              >
                <div className="pl-6">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest block">Sélection</span>
                  <span className="text-xl font-black text-gray-900">
                    {selectedCandidates.length} / {voting.maxVotes} Candidats
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline"
                    className="rounded-full px-6"
                    onClick={() => setSelectedCandidates([])}
                    disabled={selectedCandidates.length === 0 || submitting}
                    icon={Trash2}
                  >
                    Effacer
                  </Button>
                  <Button
                    onClick={handleSubmitVotes}
                    disabled={selectedCandidates.length === 0 || submitting}
                    isLoading={submitting}
                    className="rounded-full px-12 h-14"
                    icon={Vote}
                  >
                    Confirmer mon Vote
                  </Button>
                </div>
              </motion.div>
            </div>

            {/* Rules at bottom */}
            <div className="bg-gray-100 p-12 rounded-[3.5rem] mt-24">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-8">Règlement Complet</h3>
              <div className="prose prose-blue max-w-none text-gray-600 font-medium whitespace-pre-line leading-relaxed">
                {voting.rules}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
