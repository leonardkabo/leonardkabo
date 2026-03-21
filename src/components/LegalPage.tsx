/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';

interface LegalPageProps {
  title: string;
  content: string;
}

export default function LegalPage({ title, content }: LegalPageProps) {
  return (
    <div className="pt-32 pb-20 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-8 tracking-tight">{title}</h1>
          <div className="prose prose-blue max-w-none text-gray-600 leading-relaxed">
            {content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4">{paragraph}</p>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
