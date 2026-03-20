import React from 'react';
import { motion } from 'motion/react';
import { Calendar, FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from './ui/Button';

export default function BookingCTA() {
  return (
    <section className="py-24 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-gray-900 tracking-tight"
          >
            Prêt à démarrer votre projet ?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 mt-4 max-w-2xl mx-auto"
          >
            Choisissez l'option qui vous convient le mieux pour commencer notre collaboration.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Appointment CTA */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="group relative bg-white p-10 rounded-[3rem] shadow-xl shadow-blue-900/5 border border-gray-100 hover:border-blue-600/20 transition-all"
          >
            <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
              <Calendar size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Prendre Rendez-vous</h3>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Réservez une consultation gratuite de 30 minutes pour discuter de vos besoins et objectifs.
            </p>
            <Button
              to="/rendez-vous"
              icon={ArrowRight}
              className="flex-row-reverse"
            >
              <span className="mr-2">Réserver maintenant</span>
            </Button>
          </motion.div>

          {/* Quote CTA */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="group relative bg-white p-10 rounded-[3rem] shadow-xl shadow-blue-900/5 border border-gray-100 hover:border-blue-600/20 transition-all"
          >
            <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-emerald-600/20 group-hover:scale-110 transition-transform">
              <FileText size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Demander un Devis</h3>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Vous avez un projet précis en tête ? Obtenez une estimation détaillée et personnalisée.
            </p>
            <Button
              to="/devis"
              variant="success"
              icon={ArrowRight}
              className="flex-row-reverse"
            >
              <span className="mr-2">Obtenir un devis</span>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
