/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { useSiteData } from '../hooks/useSiteData';
import { Clock, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NewsList() {
  const { news, loading } = useSiteData();

  if (loading) {
    return (
      <div className="pt-32 pb-20 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-gray-200 rounded-xl w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-96 bg-gray-200 rounded-[2.5rem]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Toutes les <span className="text-blue-600">Actualités</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            Découvrez mes derniers articles, réflexions et actualités sur le numérique et l'innovation sociale.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white rounded-[2.5rem] p-8 border border-gray-100 hover:border-blue-600/10 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 flex flex-col h-full"
            >
              {(item.video || item.image) && (
                <div className="aspect-video rounded-3xl overflow-hidden mb-6 relative group/media">
                  {item.video ? (
                    <div className="w-full h-full relative">
                      <video 
                        src={item.video} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        muted
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover/media:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-blue-600 shadow-xl">
                          <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-current border-b-[8px] border-b-transparent ml-1" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
              )}
              
              <div className="flex items-center space-x-4 mb-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <div className="flex items-center space-x-1">
                  <Clock size={14} />
                  <span>{item.readTime || '5 min'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User size={14} />
                  <span>{item.author || 'Léonard Kabo'}</span>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors line-clamp-2">
                {item.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed mb-8 line-clamp-3 flex-grow">
                {item.body}
              </p>
              
              <Link 
                to={`/blog/${item.id}`}
                className="inline-flex items-center space-x-2 text-blue-600 font-bold group/btn"
              >
                <span>Lire la suite</span>
                <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
}
