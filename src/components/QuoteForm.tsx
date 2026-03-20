/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Mail, User, Building, Briefcase, DollarSign, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import { servicesData } from '../data';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import Button from './ui/Button';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export default function QuoteForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    service: '',
    budget: '',
    description: '',
  });

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const path = 'quotes';
    try {
      // Save to Firestore
      await addDoc(collection(db, path), {
        ...formData,
        status: 'pending',
        createdAt: Date.now(),
      });
      
      // Also notify the backend
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          type: 'devis',
        }),
      }).catch(err => console.error('Backend notification failed:', err));

      setSubmitted(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-12 rounded-[3rem] shadow-2xl shadow-blue-900/10 border border-gray-100 text-center max-w-2xl mx-auto"
      >
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-500/20">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Demande de Devis Reçue !</h2>
        <p className="text-lg text-gray-600 leading-relaxed mb-10">
          Merci {formData.name}. Votre demande de devis a été envoyée avec succès. Je l'étudierai avec soin et vous répondrai sous 48 heures.
        </p>
        <Button
          onClick={() => setSubmitted(false)}
          size="lg"
        >
          Nouvelle Demande
        </Button>
      </motion.div>
    );
  }

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl font-bold text-gray-900 mb-6 tracking-tight"
          >
            Demander un <span className="text-blue-600">Devis Gratuit</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 leading-relaxed"
          >
            Décrivez votre projet et recevez une proposition personnalisée adaptée à vos besoins et à votre budget.
          </motion.p>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto bg-gray-50 p-12 rounded-[3rem] shadow-2xl shadow-blue-900/5 border border-gray-100 space-y-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Informations de Contact</label>
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    required
                    type="text"
                    placeholder="Votre nom complet"
                    className="w-full bg-white border-2 border-transparent focus:border-blue-600/20 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    required
                    type="email"
                    placeholder="votre@email.com"
                    className="w-full bg-white border-2 border-transparent focus:border-blue-600/20 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Entreprise / Organisation (Optionnel)"
                    className="w-full bg-white border-2 border-transparent focus:border-blue-600/20 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Détails du Projet</label>
              <div className="space-y-4">
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    required
                    className="w-full bg-white border-2 border-transparent focus:border-blue-600/20 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all appearance-none"
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  >
                    <option value="">Type de service</option>
                    {servicesData.map(s => (
                      <option key={s.id} value={s.title}>{s.title}</option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    className="w-full bg-white border-2 border-transparent focus:border-blue-600/20 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all appearance-none"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  >
                    <option value="">Budget approximatif</option>
                    <option value="< 100k">Moins de 100 000 FCFA</option>
                    <option value="100k-500k">100 000 - 500 000 FCFA</option>
                    <option value="500k-1M">500 000 - 1 000 000 FCFA</option>
                    <option value="> 1M">Plus de 1 000 000 FCFA</option>
                  </select>
                </div>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-6 text-gray-400" size={18} />
                  <textarea
                    required
                    placeholder="Décrivez brièvement vos besoins..."
                    rows={4}
                    className="w-full bg-white border-2 border-transparent focus:border-blue-600/20 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <Button
            disabled={loading}
            type="submit"
            isLoading={loading}
            icon={Send}
            size="lg"
            className="w-full"
          >
            Envoyer ma Demande de Devis
          </Button>
        </motion.form>
      </div>
    </section>
  );
}
