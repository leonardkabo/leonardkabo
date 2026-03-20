/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link } from 'react-router-dom';
import { useSiteData } from '../hooks/useSiteData';
import { Linkedin, Twitter, Facebook, MessageCircle, Mail, Phone, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

export default function Footer() {
  const { settings, loading } = useSiteData();

  const navLinks = [
    { name: 'Accueil', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Réalisations', href: '/portfolio' },
    { name: 'Devis', href: '/devis' },
    { name: 'Contact', href: '/contact' },
  ];

  if (loading) return null;

  return (
    <footer className="bg-gray-900 text-white pt-24 pb-12 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-blue-600/5 -skew-y-6 transform -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 lg:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-8 group">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
                {settings.logoText.charAt(0)}
              </div>
              <span className="text-xl font-bold tracking-tight">
                {settings.logoText.split('.')[0]}<span className="text-blue-600">.{settings.logoText.split('.')[1] || ''}</span>
              </span>
            </Link>
            <p className="text-gray-400 leading-relaxed mb-8">
              {settings.siteTitle}
            </p>
            <div className="flex space-x-4">
              <motion.a 
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                href={settings.socialLinks.linkedin} 
                className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all"
              >
                <Linkedin size={20} />
              </motion.a>
              <motion.a 
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                href={settings.socialLinks.twitter} 
                className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-blue-400 hover:text-white transition-all"
              >
                <Twitter size={20} />
              </motion.a>
              <motion.a 
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                href={settings.socialLinks.facebook} 
                className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-blue-700 hover:text-white transition-all"
              >
                <Facebook size={20} />
              </motion.a>
              <motion.a 
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                href={settings.socialLinks.whatsapp} 
                className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-emerald-600 hover:text-white transition-all"
              >
                <MessageCircle size={20} />
              </motion.a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-8">Navigation</h4>
            <ul className="space-y-4">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <motion.div
                    whileHover={{ x: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Link to={link.href} className="text-gray-400 hover:text-blue-600 transition-colors">
                      {link.name}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-8">Contact</h4>
            <ul className="space-y-6">
              <li className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-blue-600 shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Email</div>
                  <a href="mailto:leonardkabo32@gmail.com" className="text-gray-300 hover:text-blue-600 transition-colors">
                    leonardkabo32@gmail.com
                  </a>
                </div>
              </li>
              <li className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-emerald-600 shrink-0">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">WhatsApp</div>
                  <a href={settings.socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-blue-600 transition-colors">
                    +229 65 45 87 78
                  </a>
                </div>
              </li>
              <li className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-blue-600 shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Téléphone</div>
                  <a href="tel:+2290165458778" className="text-gray-300 hover:text-blue-600 transition-colors">
                    +229 01 65 45 87 78
                  </a>
                </div>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-8">Localisation</h4>
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-red-600 shrink-0">
                <MapPin size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Adresse</div>
                <p className="text-gray-300">
                  Parakou, Bénin <br />
                  Quartier Dépôt
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} {settings.siteName}. Tous droits réservés.
          </p>
          <div className="flex space-x-8 text-sm text-gray-500">
            <Link to="/mentions-legales" className="hover:text-blue-600 transition-colors">Mentions Légales</Link>
            <Link to="/confidentialite" className="hover:text-blue-600 transition-colors">Confidentialité</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
