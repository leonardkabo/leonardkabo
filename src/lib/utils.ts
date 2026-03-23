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
