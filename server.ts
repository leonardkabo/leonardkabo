/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: path.join(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- Server Configuration ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Configured' : 'Missing');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Configured' : 'Missing');
console.log('---------------------------');

// Function to create transporter (allows re-initialization if needed)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

let transporter = createTransporter();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post('/api/contact', async (req, res) => {
    const { name, email, message, type, service, phone, company, budget, description } = req.body;
    
    console.log(`New ${type} request from ${name} (${email})`);

    // Prepare email content
    const subject = `[EbounLéonard.cloud] Nouvelle demande de ${type}: ${name}`;
    let text = `Vous avez reçu une nouvelle demande de ${type} depuis votre site web.\n\n`;
    text += `Nom: ${name}\n`;
    text += `Email: ${email}\n`;
    if (phone) text += `Téléphone: ${phone}\n`;
    if (service) text += `Service: ${service}\n`;
    if (company) text += `Entreprise: ${company}\n`;
    if (budget) text += `Budget: ${budget}\n`;
    if (description) text += `Description: ${description}\n`;
    if (message) text += `Message: ${message}\n`;
    text += `\nDate de réception: ${new Date().toLocaleString('fr-FR')}`;

    try {
      // Re-initialize transporter if it was created with empty env vars
      if (!(transporter.options as any).auth?.user && process.env.EMAIL_USER) {
        transporter = createTransporter();
      }

      // Only attempt to send if credentials are provided
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        console.log('Attempting to send email to leonardkabo32@gmail.com...');
        const info = await transporter.sendMail({
          from: `"Site Web Eboun Léonard" <${process.env.EMAIL_USER}>`,
          to: 'leonardkabo32@gmail.com',
          subject: subject,
          text: text,
          replyTo: email,
        });
        console.log('Email notification sent successfully:', info.messageId);
      } else {
        console.warn('Email credentials not configured (EMAIL_USER or EMAIL_PASS missing). Skipping email notification.');
      }
      
      res.json({ success: true, message: 'Demande reçue avec succès' });
    } catch (error: any) {
      console.error('CRITICAL: Error sending email notification:');
      console.error('Error Code:', error.code);
      console.error('Error Message:', error.message);
      if (error.response) console.error('SMTP Response:', error.response);
      
      // We still return success to the user because the data is saved in Firestore
      res.json({ success: true, message: 'Demande reçue (erreur notification email)' });
    }
  });

  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    // Simple mock authentication
    if (username === 'admin' && password === 'leonard2026') {
      res.json({ success: true, token: 'mock-admin-token' });
    } else {
      res.status(401).json({ success: false, message: 'Identifiants incorrects' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
