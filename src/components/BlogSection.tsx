/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { ArrowRight, Clock, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from './ui/Button';
import { useSiteData } from '../hooks/useSiteData';

export default function BlogSection() {
  const { news, loading } = useSiteData();

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold text-gray-900 mb-6 tracking-tight"
            >
              Dernières <span className="text-blue-600">Actualités</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-gray-600 leading-relaxed"
            >
              Restez informé des dernières tendances en transformation numérique, journalisme et innovation sociale.
            </motion.p>
          </div>
          
          <Button
            to="/livres"
            variant="ghost"
            icon={ArrowRight}
            className="flex-row-reverse"
          >
            <span className="mr-2">Voir tous les articles</span>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-50 rounded-[2.5rem] h-96" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {news.slice(0, 3).map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-gray-50 rounded-[2.5rem] p-8 border border-transparent hover:border-blue-600/10 hover:bg-white hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 flex flex-col h-full"
              >
                {post.image && (
                  <div className="aspect-video rounded-3xl overflow-hidden mb-6">
                    <img 
                      src={post.image} 
                      alt={post.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                
                <div className="flex items-center space-x-4 mb-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <div className="flex items-center space-x-1">
                    <Clock size={14} />
                    <span>{post.readTime || '5 min'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User size={14} />
                    <span>{post.author || 'Léonard Kabo'}</span>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed mb-8 line-clamp-3 flex-grow">
                  {post.body}
                </p>
                
                <Link 
                  to={`/blog/${post.id}`}
                  className="inline-flex items-center space-x-2 text-blue-600 font-bold group/btn"
                >
                  <span>Lire la suite</span>
                  <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
