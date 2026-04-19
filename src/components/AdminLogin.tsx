/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, LogIn, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Button from './ui/Button';

export default function AdminLogin() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (user.email === 'leonardkabo32@gmail.com') {
          navigate('/admin/dashboard');
          return;
        }
        
        // Check if user is in team
        const userDoc = await getDoc(doc(db, 'users', user.email!));
        if (userDoc.exists()) {
          navigate('/admin/dashboard');
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email?.toLowerCase();
      
      if (!email) throw new Error('No email found');

      // Check for superadmin or team member
      const isSuperAdmin = email === 'leonardkabo32@gmail.com';
      const userDoc = await getDoc(doc(db, 'users', email));
      
      if (!isSuperAdmin && !userDoc.exists()) {
        setError('Accès refusé. Vous n\'êtes pas autorisé à accéder à cet espace.');
        await auth.signOut();
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Une erreur est survenue lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-gray-100"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/20">
            <Lock size={32} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Espace Admin</h2>
          <p className="text-gray-500 mt-2">Accès réservé à Eboun Léonard KABO</p>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center space-x-3 text-sm font-medium">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            isLoading={loading}
            variant="outline"
            size="lg"
            className="w-full"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6 mr-3" referrerPolicy="no-referrer" />
            <span>Se connecter avec Google</span>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
