/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const FCFA_TO_EUR = 1 / 655.957;

export function formatPrice(price: number, currency: string = 'FCFA') {
  if (currency !== 'FCFA') return `${price.toLocaleString()} ${currency}`;
  
  const eurPrice = Math.ceil(price * FCFA_TO_EUR);
  return `${price.toLocaleString()} FCFA (≈${eurPrice}€)`;
}

export function convertToEur(price: number) {
  return Math.ceil(price * FCFA_TO_EUR);
}

export function getDirectImageUrl(url: string) {
  if (!url) return '';
  
  // Google Drive conversion
  // Matches both /file/d/ID/... and ?id=ID formats
  const driveMatch = url.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|docs\.google\.com\/file\/d\/)([^\/\?&]+)/);
  if (driveMatch && driveMatch[1]) {
    // Using lh3.googleusercontent.com/d/ID is more reliable for direct embedding
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }
  
  // Dropbox conversion
  if (url.includes('dropbox.com')) {
    if (url.endsWith('?dl=0')) {
      return url.replace('?dl=0', '?raw=1');
    }
    if (!url.includes('?raw=1') && !url.includes('?dl=1')) {
      return url + (url.includes('?') ? '&raw=1' : '?raw=1');
    }
  }
  
  return url;
}
