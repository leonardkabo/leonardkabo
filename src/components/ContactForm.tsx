/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'motion/react';
import { Send, CheckCircle2, AlertCircle, User, Mail, MessageSquare } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useSiteData } from '../hooks/useSiteData';
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
  subject: yup.string().required('Le sujet est requis'),
  message: yup.string().required('Le message est requis').min(10, 'Le message doit contenir au moins 10 caractères'),
}).required();

type FormData = yup.InferType<typeof schema>;

export default function ContactForm() {
  const { settings } = useSiteData();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedName, setSubmittedName] = useState('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: yupResolver(schema) as any,
  });

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      operationType,
      path,
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
      }
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    setError("Une erreur est survenue lors de l'envoi. Veuillez réessayer.");
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    setSubmittedName(data.name);
    
    const path = 'contacts';
    try {
      // Save to Firestore
      await addDoc(collection(db, path), {
        ...data,
        status: 'unread',
        createdAt: Date.now(),
      });
      
      // Notify the backend
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          type: 'contact',
        }),
      }).catch(err => console.error('Backend notification failed:', err));

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      reset();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
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
        <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Message Envoyé !</h2>
        <p className="text-lg text-gray-600 leading-relaxed mb-10">
          {settings.successMessages?.contact ? (
            settings.successMessages.contact.replace('{name}', submittedName)
          ) : (
            <>
              Merci <strong>{submittedName}</strong>, votre message a bien été transmis. 
              Un email de confirmation vous a été envoyé et nous vous répondrons très prochainement.
            </>
          )}
        </p>
        <Button onClick={() => setSubmitted(false)} variant="outline" size="lg">
          Envoyer un autre message
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-[3rem] shadow-2xl shadow-blue-900/10 border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-5">
          <div className="md:col-span-2 bg-blue-600 p-12 text-white">
            <h3 className="text-3xl font-bold mb-6">Contactez-moi</h3>
            <p className="text-blue-100 mb-12 leading-relaxed">
              Une question, un projet ou simplement envie de discuter ? 
              N'hésitez pas à m'envoyer un message.
            </p>
            
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-blue-200 uppercase tracking-widest mb-1">Email</div>
                  <div className="font-medium">leonardkabo32@gmail.com</div>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 p-12">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest mb-2 ml-1">Nom Complet</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                      <User size={18} />
                    </div>
                    <input
                      {...register('name')}
                      className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-2xl outline-none transition-all ${errors.name ? 'border-red-100 focus:border-red-500' : 'border-transparent focus:border-blue-600 focus:bg-white'}`}
                      placeholder="Votre nom"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-500 flex items-center font-medium">
                      <AlertCircle size={14} className="mr-1" /> {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest mb-2 ml-1">Email</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                      <Mail size={18} />
                    </div>
                    <input
                      {...register('email')}
                      className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-2xl outline-none transition-all ${errors.email ? 'border-red-100 focus:border-red-500' : 'border-transparent focus:border-blue-600 focus:bg-white'}`}
                      placeholder="votre@email.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-500 flex items-center font-medium">
                      <AlertCircle size={14} className="mr-1" /> {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest mb-2 ml-1">Sujet</label>
                  <input
                    {...register('subject')}
                    className={`w-full px-4 py-4 bg-gray-50 border-2 rounded-2xl outline-none transition-all ${errors.subject ? 'border-red-100 focus:border-red-500' : 'border-transparent focus:border-blue-600 focus:bg-white'}`}
                    placeholder="Sujet de votre message"
                  />
                  {errors.subject && (
                    <p className="mt-2 text-sm text-red-500 flex items-center font-medium">
                      <AlertCircle size={14} className="mr-1" /> {errors.subject.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest mb-2 ml-1">Message</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                      <MessageSquare size={18} />
                    </div>
                    <textarea
                      {...register('message')}
                      rows={5}
                      className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-2xl outline-none transition-all resize-none ${errors.message ? 'border-red-100 focus:border-red-500' : 'border-transparent focus:border-blue-600 focus:bg-white'}`}
                      placeholder="Votre message..."
                    />
                  </div>
                  {errors.message && (
                    <p className="mt-2 text-sm text-red-500 flex items-center font-medium">
                      <AlertCircle size={14} className="mr-1" /> {errors.message.message}
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center space-x-3 text-red-600"
                >
                  <AlertCircle size={20} />
                  <p className="text-sm font-medium">{error}</p>
                </motion.div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                isLoading={loading}
                disabled={loading}
                icon={Send}
              >
                Envoyer le message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
