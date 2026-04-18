/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp, increment } from 'firebase/firestore';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export default function VisitorTracker() {
  const location = useLocation();

  useEffect(() => {
    // 1. Get or create session ID
    let sessionId = sessionStorage.getItem('v_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      sessionStorage.setItem('v_session_id', sessionId);
    }

    const today = new Date().toISOString().split('T')[0];
    const sessionDocRef = doc(db, 'analytics', 'realtime', 'sessions', sessionId);
    const dayDocRef = doc(db, 'analytics', 'history', 'days', today);

    // 2. Track new visit for today
    const trackDailyVisit = async () => {
      const lastCounted = sessionStorage.getItem('v_counted_today');
      if (lastCounted !== today) {
        try {
          await setDoc(dayDocRef, { 
            visits: increment(1),
            date: today
          }, { merge: true });
          sessionStorage.setItem('v_counted_today', today);
        } catch (err) {
          console.error('Error tracking daily visit:', err);
        }
      }
    };

    // 3. Heartbeat for real-time tracking
    const sendHeartbeat = async () => {
      try {
        await setDoc(sessionDocRef, {
          lastSeen: serverTimestamp(),
          path: location.pathname,
          device: navigator.userAgent.substring(0, 100)
        }, { merge: true });
      } catch (err) {
        // Silently fail if rules prevent it or offline
      }
    };

    trackDailyVisit();
    sendHeartbeat();
    
    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [location.pathname]);

  return null;
}
