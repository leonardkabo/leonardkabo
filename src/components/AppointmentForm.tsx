/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Calendar, Clock, User, Mail, Phone, MessageSquare, Send, CheckCircle2, Briefcase, AlertCircle } from 'lucide-react';
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

const schema = yup.object({
  name: yup.string().required('Le nom est requis').min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: yup.string().email('Email invalide').required('L\'email est requis'),
  phone: yup.string().required('Le téléphone est requis').matches(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/, 'Numéro de téléphone invalide'),
  service: yup.string().required('Le service est requis'),
  date: yup.string().required('La date est requise'),
  time: yup.string().required('L\'heure est requise'),
  message: yup.string().default(''),
}).required();

type FormData = yup.InferType<typeof schema>;

export default function AppointmentForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submittedName, setSubmittedName] = useState('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: yupResolver(schema) as any,
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

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setSubmittedName(data.name);
    
    const path = 'appointments';
    try {
      // Save to Firestore
      await addDoc(collection(db, path), {
        ...data,
        status: 'pending',
        createdAt: Date.now(),
      });
      
      // Also notify the backend
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          type: 'rendez-vous',
        }),
      }).catch(err => console.error('Backend notification failed:', err));

      setSubmitted(true);
      reset();
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
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/20">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Demande Reçue !</h2>
        <p className="text-lg text-gray-600 leading-relaxed mb-10">
          Merci {submittedName}. Votre demande de rendez-vous a été enregistrée avec succès. Vous recevrez une confirmation par email sous peu.
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
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl font-bold text-gray-900 mb-8 tracking-tight"
            >
              Prendre un <br />
              <span className="text-blue-600">Rendez-vous</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 leading-relaxed mb-12 max-w-md"
            >
              Réservez une session de consultation ou planifiez votre projet directement. Je reviendrai vers vous pour confirmer le créneau.
            </motion.p>
            
            <div className="space-y-8">
              <div className="flex items-start space-x-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
                  <Calendar size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">Disponibilité Flexible</h4>
                  <p className="text-gray-500">Du Lundi au Vendredi, de 09h à 18h.</p>
                </div>
              </div>
              <div className="flex items-start space-x-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 shrink-0">
                  <Clock size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">Réponse Rapide</h4>
                  <p className="text-gray-500">Confirmation sous 24 heures ouvrées.</p>
                </div>
              </div>
            </div>
          </div>

          <motion.form
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-blue-900/10 border border-gray-100 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Nom Complet</label>
                <div className="relative">
                  <User className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.name ? 'text-red-400' : 'text-gray-400'}`} size={18} />
                  <input
                    {...register('name')}
                    type="text"
                    placeholder="Votre nom"
                    className={`w-full bg-gray-50 border-2 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all ${errors.name ? 'border-red-100 focus:border-red-200 bg-red-50/30' : 'border-transparent focus:border-blue-600/20 focus:bg-white'}`}
                  />
                </div>
                {errors.name && <p className="text-xs text-red-500 flex items-center mt-1 ml-1"><AlertCircle size={12} className="mr-1" /> {errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
                <div className="relative">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.email ? 'text-red-400' : 'text-gray-400'}`} size={18} />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="votre@email.com"
                    className={`w-full bg-gray-50 border-2 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all ${errors.email ? 'border-red-100 focus:border-red-200 bg-red-50/30' : 'border-transparent focus:border-blue-600/20 focus:bg-white'}`}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 flex items-center mt-1 ml-1"><AlertCircle size={12} className="mr-1" /> {errors.email.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Téléphone</label>
                <div className="relative">
                  <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.phone ? 'text-red-400' : 'text-gray-400'}`} size={18} />
                  <input
                    {...register('phone')}
                    type="tel"
                    placeholder="+229 01 65 45 87 78"
                    className={`w-full bg-gray-50 border-2 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all ${errors.phone ? 'border-red-100 focus:border-red-200 bg-red-50/30' : 'border-transparent focus:border-blue-600/20 focus:bg-white'}`}
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500 flex items-center mt-1 ml-1"><AlertCircle size={12} className="mr-1" /> {errors.phone.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Service</label>
                <div className="relative">
                  <Briefcase className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.service ? 'text-red-400' : 'text-gray-400'}`} size={18} />
                  <select
                    {...register('service')}
                    className={`w-full bg-gray-50 border-2 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all appearance-none ${errors.service ? 'border-red-100 focus:border-red-200 bg-red-50/30' : 'border-transparent focus:border-blue-600/20 focus:bg-white'}`}
                  >
                    <option value="">Choisir un service</option>
                    {servicesData.map(s => (
                      <option key={s.id} value={s.title}>{s.title}</option>
                    ))}
                  </select>
                </div>
                {errors.service && <p className="text-xs text-red-500 flex items-center mt-1 ml-1"><AlertCircle size={12} className="mr-1" /> {errors.service.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Date</label>
                <div className="relative">
                  <Calendar className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.date ? 'text-red-400' : 'text-gray-400'}`} size={18} />
                  <input
                    {...register('date')}
                    type="date"
                    className={`w-full bg-gray-50 border-2 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all ${errors.date ? 'border-red-100 focus:border-red-200 bg-red-50/30' : 'border-transparent focus:border-blue-600/20 focus:bg-white'}`}
                  />
                </div>
                {errors.date && <p className="text-xs text-red-500 flex items-center mt-1 ml-1"><AlertCircle size={12} className="mr-1" /> {errors.date.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Heure</label>
                <div className="relative">
                  <Clock className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.time ? 'text-red-400' : 'text-gray-400'}`} size={18} />
                  <input
                    {...register('time')}
                    type="time"
                    className={`w-full bg-gray-50 border-2 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all ${errors.time ? 'border-red-100 focus:border-red-200 bg-red-50/30' : 'border-transparent focus:border-blue-600/20 focus:bg-white'}`}
                  />
                </div>
                {errors.time && <p className="text-xs text-red-500 flex items-center mt-1 ml-1"><AlertCircle size={12} className="mr-1" /> {errors.time.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Message (Optionnel)</label>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-6 text-gray-400" size={18} />
                <textarea
                  {...register('message')}
                  placeholder="Dites-moi en plus sur votre projet..."
                  rows={4}
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600/20 focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all resize-none"
                />
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
              Confirmer le Rendez-vous
            </Button>
          </motion.form>
        </div>
      </div>
    </section>
  );
}
