/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Rocket, MessageSquare, BookOpen, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SITE_TITLE } from '../constants';
import Button from './ui/Button';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-600/5 -skew-x-12 transform translate-x-1/2" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 shadow-lg shadow-blue-600/20">
              <Star size={14} fill="currentColor" />
              <span>Producteur Multimédia | Journaliste | Développeur Web | Activiste DSSR</span>
            </div>
            
            <h1 className="text-6xl sm:text-7xl font-bold text-gray-900 leading-[1.1] mb-6 tracking-tight">
              Eboun Léonard <br />
              <span className="text-blue-600">KABO</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-xl">
              Expert en transformation numérique, je mets mes compétences au service du changement social et de la performance numérique. De la production multimédia haute définition à la conception d'outils d'automatisation intelligents.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button
                to="/services"
                icon={Rocket}
                size="lg"
              >
                Explorer mes Services
              </Button>
              <Button
                to="/contact"
                variant="outline"
                icon={MessageSquare}
                size="lg"
              >
                Me Contacter
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative max-w-md lg:ml-auto"
          >
            <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-900/10 border-8 border-white transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <img
                src="/profile.jpg"
                alt="Eboun Léonard KABO"
                className="w-full aspect-[4/5] object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Floating Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="absolute -bottom-6 -left-6 z-20 bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-xl">
                  5+
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 leading-none">Ans d'Expertise</div>
                  <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Expérience Pro</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute -top-6 -right-6 z-20 bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 font-bold text-xl">
                  2
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 leading-none">Livres Publiés</div>
                  <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Auteur Engagé</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
