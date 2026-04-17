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
    <div className="bg-blue-600 text-white py-2 relative z-[100] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center overflow-hidden whitespace-nowrap group">
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: "-100%" }}
            transition={{ 
              repeat: Infinity, 
              duration: 20, 
              ease: "linear" 
            }}
            className="flex items-center space-x-12"
          >
            {activeSessions.map(session => (
              <Link 
                key={session.id}
                to="/vote"
                className="flex items-center space-x-3 hover:text-blue-100 transition-colors"
              >
                <div className="bg-white/20 p-1 rounded-md">
                  <Vote size={14} />
                </div>
                <span className="text-sm font-black tracking-tight uppercase">
                  Vote en cours : {session.title}
                </span>
                <Sparkles size={14} className="text-amber-300 animate-pulse" />
                <span className="text-xs font-medium bg-white/10 px-2 py-0.5 rounded-full">
                  Participez maintenant
                </span>
                <ChevronRight size={14} />
              </Link>
            ))}
            
            {/* Duplicate for seamless loop */}
            {activeSessions.map(session => (
              <Link 
                key={`${session.id}-loop`}
                to="/vote"
                className="flex items-center space-x-3 hover:text-blue-100 transition-colors"
              >
                <div className="bg-white/20 p-1 rounded-md">
                  <Vote size={14} />
                </div>
                <span className="text-sm font-black tracking-tight uppercase">
                  Vote en cours : {session.title}
                </span>
                <Sparkles size={14} className="text-amber-300 animate-pulse" />
                <span className="text-xs font-medium bg-white/10 px-2 py-0.5 rounded-full">
                  Participez maintenant
                </span>
                <ChevronRight size={14} />
              </Link>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
