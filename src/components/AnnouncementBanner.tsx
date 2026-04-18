/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { useSiteData } from '../hooks/useSiteData';
import { Vote, ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AnnouncementBanner() {
  const { votingSessions } = useSiteData();
  
  const activeSessions = votingSessions.filter(s => {
    if (!s.active) return false;
    const now = new Date();
    const end = new Date(s.endDate);
    return end > now;
  });

  if (activeSessions.length === 0) return null;

  return (
    <section className="bg-gray-100 border-b border-gray-200 py-1">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center bg-white rounded-full border border-gray-200 shadow-sm overflow-hidden h-10">
          {/* Stable Label */}
          <div className="bg-blue-600 px-4 h-full flex items-center space-x-2 shrink-0 relative z-10">
            <div className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </div>
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] whitespace-nowrap">
              Vote en cours
            </span>
            <div className="absolute right-[-8px] top-0 bottom-0 w-4 bg-blue-600 [clip-path:polygon(0_0,0_100%,100%_50%)]" />
          </div>

          {/* Ticker Content */}
          <div className="flex-1 overflow-hidden relative">
            <motion.div 
              initial={{ x: "0%" }}
              animate={{ x: "-50%" }}
              transition={{ 
                repeat: Infinity, 
                duration: 30, 
                ease: "linear" 
              }}
              className="flex items-center whitespace-nowrap pl-8"
            >
              <div className="flex items-center space-x-16 pr-16 border-r border-gray-100">
                {activeSessions.map(session => (
                  <Link 
                    key={session.id}
                    to="/vote"
                    className="flex items-center space-x-3 text-gray-900 group"
                  >
                    <span className="text-sm font-bold group-hover:text-blue-600 transition-colors">
                      {session.title}
                    </span>
                    <Sparkles size={14} className="text-amber-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full tracking-widest">
                      Voter maintenant
                    </span>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
              
              {/* Duplicate for seamless loop */}
              <div className="flex items-center space-x-16 pl-16">
                {activeSessions.map(session => (
                  <Link 
                    key={`${session.id}-loop`}
                    to="/vote"
                    className="flex items-center space-x-3 text-gray-900 group"
                  >
                    <span className="text-sm font-bold group-hover:text-blue-600 transition-colors">
                      {session.title}
                    </span>
                    <Sparkles size={14} className="text-amber-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full tracking-widest">
                      Voter maintenant
                    </span>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
