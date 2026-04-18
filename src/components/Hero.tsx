/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Rocket, MessageSquare, Star } from 'lucide-react';
import { useSiteData } from '../hooks/useSiteData';
import Button from './ui/Button';
import { cn } from '../lib/utils';

export default function Hero() {
  const { hero, loading } = useSiteData();

  if (loading) return null;

  return (
    <section className="relative pt-16 pb-20 overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-600/5 -skew-x-12 transform translate-x-1/2" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 shadow-lg shadow-blue-600/20">
              <Star size={14} fill="currentColor" />
              <span>{hero.badge}</span>
            </div>
            
            <h1 className="text-6xl sm:text-8xl font-black text-gray-900 leading-[0.9] mb-8 tracking-tighter">
              {hero.title} <br />
              <span className="text-blue-600">{hero.subtitle}</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 leading-relaxed max-w-2xl font-medium">
              {hero.description}
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button
                to={hero.ctaLink}
                icon={Rocket}
                size="lg"
              >
                {hero.ctaText}
              </Button>
              <Button
                to={hero.secondaryCtaLink}
                variant="outline"
                icon={MessageSquare}
                size="lg"
              >
                {hero.secondaryCtaText}
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex justify-center lg:justify-end"
          >
            <div className="relative z-10 w-full max-w-[400px] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-900/10 border-8 border-white transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <img
                src={hero.profileImage}
                alt={hero.title + " " + hero.subtitle}
                fetchPriority="high"
                className="w-full aspect-[4/5] object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Floating Stats */}
            <div className="absolute inset-0 z-20 pointer-events-none">
              {hero.stats?.map((stat: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + (idx * 0.2) }}
                  className={cn(
                    "absolute bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl shadow-blue-900/10 border border-white/50 pointer-events-auto min-w-[220px]",
                    idx === 0 ? "-top-10 left-1/2 -translate-x-1/2 rotate-[-2deg]" : "-bottom-10 left-1/2 -translate-x-1/2 rotate-[2deg]"
                  )}
                >
                  <div className="flex items-center space-x-4">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner",
                      stat.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                    )}>
                      {stat.value}
                    </div>
                    <div>
                      <div className="text-sm font-black text-gray-900 leading-none mb-1">{stat.label}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">{stat.sublabel}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
