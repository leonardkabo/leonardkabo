/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ServicePackage {
    name: string;
    price: number;
    duration?: string;
    features: string[];
    popular?: boolean;
    badge?: string;
}

export interface ServiceAddOn {
    name: string;
    price: number;
}

export interface ServiceCategory {
    id: string;
    name: string;
    color: string;
    icon: string;
    priority: number;
}

export interface Service {
    id: string;
    category: ServiceCategory;
    title: string;
    slug: string;
    tagline: string;
    shortDesc: string;
    thumbnail: string;
    gallery?: string[];
    pricing: {
        basePrice?: number;
        currency?: string;
        vatIncluded?: boolean;
        packages: ServicePackage[];
        addOns?: ServiceAddOn[];
    };
    description?: {
        main: string;
        highlights: string[];
    };
    metrics?: {
        completedProjects: number;
        satisfactionRate: number;
        averageRating: number;
        deliveryOnTime: number;
    };
}

export interface PortfolioItem {
    id: number;
    title: string;
    category: string;
    image: string;
    description: string;
    technologies: string[];
}

export interface Appointment {
    id?: string;
    name: string;
    email: string;
    phone: string;
    service: string;
    date: string;
    time: string;
    message?: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    createdAt: number;
}

export interface QuoteRequest {
    id?: string;
    name: string;
    email: string;
    company?: string;
    service: string;
    budget?: string;
    description: string;
    status: 'pending' | 'responded';
    createdAt: number;
}
