/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { useParams, Link } from 'react-router-dom';
import { useSiteData } from '../hooks/useSiteData';
import { Clock, User, Calendar, ArrowLeft, Share2 } from 'lucide-react';
import Button from './ui/Button';
import SEO from './SEO';

export default function NewsDetail() {
  const { id } = useParams();
  const { news, loading } = useSiteData();
  const item = news.find(n => n.id === id);

  if (loading) {
    return (
      <div className="pt-32 pb-20 bg-white min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-gray-200 rounded-xl w-3/4" />
            <div className="h-64 bg-gray-200 rounded-[3rem]" />
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="pt-32 pb-20 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Article non trouvé</h1>
          <p className="text-gray-600 mb-8">L'article que vous recherchez n'existe pas ou a été déplacé.</p>
          <Link to="/livres">
            <Button icon={ArrowLeft}>Retour aux actualités</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 bg-white min-h-screen">
      <SEO 
        title={item.title} 
        description={item.body?.substring(0, 160)} 
        image={item.image}
        type="article"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <Link 
            to="/livres"
            className="inline-flex items-center space-x-2 text-gray-500 hover:text-blue-600 font-bold transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Retour aux actualités</span>
          </Link>

          <div className="space-y-6">
            <h1 className="text-5xl font-bold text-gray-900 leading-tight tracking-tight">
              {item.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-8">
              <div className="flex items-center space-x-2">
                <User size={16} className="text-blue-600" />
                <span>{item.author || 'Léonard Kabo'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar size={16} className="text-blue-600" />
                <span>{new Date(item.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock size={16} className="text-blue-600" />
                <span>{item.readTime || '5 min'} de lecture</span>
              </div>
            </div>
          </div>

          {item.video ? (
            <div className="aspect-video rounded-[3rem] overflow-hidden shadow-2xl shadow-blue-900/10 bg-black">
              <video 
                src={item.video} 
                className="w-full h-full object-contain"
                controls
              />
            </div>
          ) : item.image && (
            <div className="aspect-video rounded-[3rem] overflow-hidden shadow-2xl shadow-blue-900/10">
              <img 
                src={item.image} 
                alt={item.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          <div className="prose prose-xl prose-blue max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
            {item.body}
          </div>

          <div className="pt-12 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Partager :</span>
              <div className="flex space-x-2">
                <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all">
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
