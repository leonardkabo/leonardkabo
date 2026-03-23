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

    // Specific messages for user confirmation
    const confirmationMessages: Record<string, string> = {
      'contact': "Nous avons bien reçu votre message. Notre équipe vous répondra dans les plus brefs délais.",
      'rendez-vous': "Votre demande de rendez-vous a bien été enregistrée. Nous reviendrons vers vous très prochainement pour confirmer le créneau horaire.",
      'devis': "Votre demande de devis a été transmise avec succès. Nous étudions votre projet avec attention et vous enverrons une proposition personnalisée sous 48 heures."
    };

    const userMessage = confirmationMessages[type] || "Nous avons bien reçu votre demande et nous reviendrons vers vous rapidement.";

    try {
      // Re-initialize transporter if it was created with empty env vars
      if (!(transporter.options as any).auth?.user && process.env.EMAIL_USER) {
        transporter = createTransporter();
      }

      // Only attempt to send if credentials are provided
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        console.log(`Attempting to send email for ${type} to admin and user...`);
        
        // 1. Notify Admin
        await transporter.sendMail({
          from: `"Site Web Eboun Léonard" <${process.env.EMAIL_USER}>`,
          to: 'leonardkabo32@gmail.com',
          subject: subject,
          text: text,
          replyTo: email,
        });
        console.log('Admin notification sent successfully');

        // 2. Send confirmation to User (HTML format)
        await transporter.sendMail({
          from: `"Eboun Léonard KABO" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: `Confirmation de votre demande - Eboun Léonard KABO`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #2563eb;">Bonjour ${name},</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                ${userMessage}
              </p>
              <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
                <h3 style="margin-top: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Récapitulatif de votre demande (${type})</h3>
                <p style="margin-bottom: 5px;"><strong>Service:</strong> ${service || 'Contact général'}</p>
                <p style="margin-bottom: 0;"><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
              </div>
              <p style="font-size: 14px; color: #6b7280;">
                Ceci est un message automatique, merci de ne pas y répondre directement.
              </p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
              <p style="font-size: 14px; font-weight: bold; color: #111827; margin-bottom: 5px;">Eboun Léonard KABO</p>
              <p style="font-size: 12px; color: #9ca3af; margin-top: 0;">Producteur Multimédia | Journaliste | Développeur Web</p>
            </div>
          `,
        });
        console.log('User confirmation email sent successfully');
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
