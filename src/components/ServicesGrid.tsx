/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { useSiteData } from '../hooks/useSiteData';
import { ArrowRight, Camera, Code, Bot, Palette, Mic } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from './ui/Button';
import { formatPrice } from '../lib/utils';

const iconMap: Record<string, any> = {
  'multimedia': Camera,
  'web-dev': Code,
  'automation': Bot,
  'design': Palette,
  'com-journalism': Mic,
};

export default function ServicesGrid() {
  const { services, loading } = useSiteData();

  if (loading) return null;

  return (
    <section className="py-24 bg-gradient-to-b from-blue-50 to-sky-100 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-sky-400/20 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 bg-blue-100 border border-blue-200 rounded-full"
          >
            Nos Services
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight"
          >
            Mes Domaines d'Expertise
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 leading-relaxed"
          >
            Des solutions complètes pour booster votre image et votre productivité. 
            Découvrez comment nous pouvons transformer votre vision en réalité.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const categoryId = service.categoryId || service.category?.id;
            const Icon = iconMap[categoryId] || Code;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={`/services/${service.slug}`}
                  className="group block h-full relative bg-white rounded-[2.5rem] border border-blue-100 hover:border-blue-500/50 shadow-xl shadow-blue-900/5 hover:shadow-blue-600/10 hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col"
                >
                  {/* Service Image - Minimal strip (~10% of height) */}
                  <div className="relative h-14 overflow-hidden shrink-0">
                    <img 
                      src={service.thumbnail || `https://picsum.photos/seed/${service.id}/800/600`} 
                      alt={service.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent" />
                    
                    <div className={`absolute top-1/2 left-6 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-sm text-blue-600 shadow-sm transition-transform duration-500 group-hover:scale-110`}>
                      <Icon size={16} />
                    </div>

                    {service.isPromoActive && (
                      <span className="absolute top-1/2 right-6 -translate-y-1/2 bg-emerald-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                        Promo
                      </span>
                    )}
                  </div>

                  <div className="p-8 flex-1 flex flex-col">
                    <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">
                      {service.title}
                    </h3>
                    
                    <p className="text-slate-600 mb-8 leading-relaxed line-clamp-2">
                      {service.shortDesc}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          {service.isPromoActive ? 'Offre Spéciale' : 'À partir de'}
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-xl font-black ${service.isPromoActive ? 'text-emerald-600' : 'text-slate-900'} group-hover:text-blue-600 transition-colors`}>
                            {formatPrice(service.isPromoActive ? service.promoPrice : service.pricing?.basePrice, service.pricing?.currency)}
                          </span>
                          {service.isPromoActive && service.pricing?.basePrice && (
                            <span className="text-sm text-slate-400 line-through font-medium">
                              {service.pricing.basePrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {service.isPromoActive && service.pricing?.basePrice && service.promoPrice && (
                        <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-[10px] font-bold">
                          -{Math.round(((service.pricing.basePrice - service.promoPrice) / service.pricing.basePrice) * 100)}%
                        </div>
                      )}

                      <div
                        className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg shadow-transparent group-hover:shadow-blue-600/20"
                      >
                        <ArrowRight size={20} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-20 text-center">
          <Button
            to="/services"
            variant="ghost"
            icon={ArrowRight}
            className="flex-row-reverse group text-slate-600 hover:bg-blue-100"
          >
            <span className="mr-2 group-hover:mr-4 transition-all">Voir tous les services en détail</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
