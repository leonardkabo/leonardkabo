/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Bell, Share2, Globe } from 'lucide-react';
import { useSiteData } from '../hooks/useSiteData';
import { cn } from '../lib/utils';

export default function CountdownOverlay() {
  const { settings } = useSiteData();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    if (!settings.countdown?.targetDate) return;

    const calculateTimeLeft = () => {
      const target = new Date(settings.countdown!.targetDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false
      };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [settings.countdown?.targetDate]);

  if (!settings.countdown?.active || timeLeft.isExpired) return null;

  const timeUnits = [
    { label: 'Jours', value: timeLeft.days },
    { label: 'Heures', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Secondes', value: timeLeft.seconds },
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-600/5 -skew-x-12 transform translate-x-1/2" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full text-center relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center justify-center space-x-3 mb-12">
          {settings.logoImage ? (
            <img src={settings.logoImage} alt={settings.logoText} className="h-12 w-auto" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/20">
              {settings.logoText.charAt(0)}
            </div>
          )}
          <span className="text-2xl font-black text-gray-900 tracking-tighter">{settings.logoText}</span>
        </div>

        <div className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-8 shadow-xl shadow-blue-600/20 animate-pulse">
          <Clock size={14} />
          <span>{settings.countdown.title}</span>
        </div>

        <h1 className="text-5xl sm:text-7xl font-black text-gray-900 leading-[0.9] mb-8 tracking-tighter">
          Bientôt <span className="text-blue-600">Disponible</span>
        </h1>

        <p className="text-xl text-gray-600 mb-16 leading-relaxed max-w-2xl mx-auto font-medium">
          {settings.countdown.message}
        </p>

        {/* Countdown Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-16">
          {timeUnits.map((unit, idx) => (
            <motion.div
              key={unit.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-5xl md:text-6xl font-black text-blue-600 mb-2 tabular-nums relative z-10">
                {String(unit.value).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] relative z-10">
                {unit.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Info & Social */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-sm font-bold text-gray-400 uppercase tracking-widest">
          <div className="flex items-center space-x-2">
            <Globe size={16} className="text-blue-600" />
            <span>Heure du Bénin (UTC+1)</span>
          </div>
          <div className="flex items-center space-x-2">
            <Bell size={16} className="text-blue-600" />
            <span>Inscrivez-vous pour l'alerte</span>
          </div>
          <div className="flex items-center space-x-2">
            <Share2 size={16} className="text-blue-600" />
            <span>Partager l'événement</span>
          </div>
        </div>
      </motion.div>

      {/* Floating Decorative Elements */}
      <div className="absolute top-1/4 left-10 w-4 h-4 bg-blue-600 rounded-full animate-bounce" />
      <div className="absolute bottom-1/4 right-10 w-6 h-6 bg-emerald-600 rounded-full animate-pulse" />
      <div className="absolute top-1/2 right-20 w-3 h-3 bg-amber-600 rounded-full animate-ping" />
    </div>
  );
}
