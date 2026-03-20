/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { motion } from 'motion/react';
import { MapPin } from 'lucide-react';

// Default coordinates for Parakou, Bénin
const DEFAULT_CENTER: [number, number] = [9.3372, 2.6288];

// Custom marker icon to avoid Leaflet's default icon issues in Vite
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function MapSection() {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);

  useEffect(() => {
    // Listen for map settings changes in Firestore
    const unsub = onSnapshot(doc(db, 'settings', 'mapConfig'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.mapLat && data.mapLng) {
          setCenter([data.mapLat, data.mapLng]);
        }
      }
    });

    return () => unsub();
  }, []);

  return (
    <section className="py-24 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6 tracking-tight">
                Venez me <span className="text-blue-600">Rencontrer</span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                Mon siège social est situé au cœur de Parakou. N'hésitez pas à passer pour discuter de vos projets numériques ou de mes initiatives sociales.
              </p>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-white shadow-lg flex items-center justify-center text-blue-600 shrink-0">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Adresse</h4>
                    <p className="text-gray-500">Parakou, Bénin, Quartier Dépôt</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          
          <div className="lg:col-span-2 h-[500px] rounded-[3rem] overflow-hidden shadow-2xl shadow-blue-900/10 border-8 border-white relative z-0">
            <MapContainer 
              center={center} 
              zoom={15} 
              scrollWheelZoom={false}
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={center} icon={customIcon}>
                <Popup>
                  <div className="text-center p-2">
                    <h4 className="font-bold text-gray-900">Siège de Léonard Kabo</h4>
                    <p className="text-xs text-gray-500">Parakou, Bénin</p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
