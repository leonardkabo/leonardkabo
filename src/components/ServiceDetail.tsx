/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSiteData } from '../hooks/useSiteData';
import { CONFIG } from '../data';
import { motion } from 'motion/react';
import { Check, ArrowLeft, Calendar, FileText, Star, Clock, ShieldCheck, Zap, Tag } from 'lucide-react';
import { cn, formatPrice } from '../lib/utils';
import Button from './ui/Button';

export default function ServiceDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { services, loading } = useSiteData();
  const service = services.find(s => s.slug === slug);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-3xl font-bold mb-4">Service non trouvé</h2>
        <Link to="/services" className="text-blue-600 font-bold hover:underline">
          Retour aux services
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          icon={ArrowLeft}
          className="mb-12"
        >
          Retour
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={cn(
                'inline-flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6',
                `bg-${service.category.color}-50 text-${service.category.color}-600`
              )}>
                <span>{service.category.name}</span>
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                {service.title}
              </h1>
              <p className="text-2xl text-blue-600/60 font-medium mb-8">
                {service.tagline}
              </p>
              
              <div className="aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-900/10 border-8 border-white mb-12">
                <img
                  src={service.thumbnail}
                  alt={service.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed">
                <p className="text-xl mb-8">
                  {service.description?.main}
                </p>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Points Forts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                  {service.description?.highlights.map((h, i) => (
                    <div key={i} className="flex items-center space-x-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check size={18} />
                      </div>
                      <span className="font-medium text-gray-700">{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {service.gallery && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900">Galerie</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {service.gallery.map((img, i) => (
                      <div key={i} className="aspect-square rounded-2xl overflow-hidden shadow-lg border-4 border-white">
                        <img src={img} alt={`${service.title} ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Metrics */}
            {service.metrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center">
                  <div className="text-3xl font-black text-blue-600 mb-1">{service.metrics.completedProjects}+</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Projets Finis</div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center">
                  <div className="text-3xl font-black text-emerald-600 mb-1">{service.metrics.satisfactionRate}%</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Satisfaction</div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center">
                  <div className="text-3xl font-black text-amber-600 mb-1">{service.metrics.averageRating}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Note Moyenne</div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center">
                  <div className="text-3xl font-black text-purple-600 mb-1">{service.metrics.deliveryOnTime}%</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ponctualité</div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Pricing & Booking */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/20 border border-gray-100 sticky top-32">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">Forfaits Disponibles</h3>
              
              <div className="space-y-6 mb-10">
                {service.isPromoActive && service.promoPrice && (
                  <div className="p-6 rounded-3xl border-2 border-emerald-500 bg-emerald-50/30 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-2xl uppercase tracking-widest">
                      Offre Spéciale
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-emerald-900">Tarif Promotionnel</h4>
                        <p className="text-xs text-emerald-600 mt-1">
                          {service.promoStartDate && service.promoEndDate 
                            ? `Du ${new Date(service.promoStartDate).toLocaleDateString()} au ${new Date(service.promoEndDate).toLocaleDateString()}`
                            : 'Profitez de cette offre limitée'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-emerald-600">
                          {formatPrice(service.promoPrice, CONFIG.currency)}
                        </div>
                        <div className="text-xs text-emerald-400 line-through">
                          À partir de {service.pricing?.packages[0]?.price.toLocaleString()} {CONFIG.currency}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {service.pricing?.packages.map((pkg: any, i: number) => (
                  <div
                    key={i}
                    className={cn(
                      'p-6 rounded-3xl border-2 transition-all cursor-pointer hover:scale-[1.02]',
                      pkg.popular 
                        ? 'border-blue-600 bg-blue-50/30' 
                        : 'border-gray-100 bg-gray-50/50 hover:border-blue-200'
                    )}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-gray-900">{pkg.name}</h4>
                        {pkg.duration && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                            <Clock size={12} />
                            <span>{pkg.duration}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-blue-600">
                          {formatPrice(pkg.price, CONFIG.currency)}
                        </div>
                        {pkg.badge && (
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                            {pkg.badge}
                          </span>
                        )}
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {pkg.features.map((f, fi) => (
                        <li key={fi} className="flex items-center space-x-2 text-sm text-gray-600">
                          <Check size={14} className="text-blue-600" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Button
                  to="/rendez-vous"
                  icon={Calendar}
                  size="lg"
                  className="w-full"
                >
                  Prendre RDV
                </Button>
                <Button
                  to="/devis"
                  variant="outline"
                  icon={FileText}
                  size="lg"
                  className="w-full"
                >
                  Demander un Devis
                </Button>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-100 grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  <span>Paiement Sécurisé</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Zap size={16} className="text-amber-500" />
                  <span>Livraison Rapide</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
