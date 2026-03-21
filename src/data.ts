/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const CONFIG = {
    currency: 'FCFA',
    defaultDuration: 'À convenir',
    vatRate: 0.18, // 18% TVA
    deliveryTime: {
        standard: '48-72h',
        express: '24h',
        premium: '12h'
    }
};

export const SERVICE_CATEGORIES = {
    MULTIMEDIA: {
        id: 'multimedia',
        name: 'Production Multimédia',
        color: 'blue',
        icon: 'Camera',
        priority: 1
    },
    WEB_DEV: {
        id: 'web-dev',
        name: 'Développement Web',
        color: 'indigo',
        icon: 'Code',
        priority: 2
    },
    AUTOMATION: {
        id: 'automation',
        name: 'Automatisation & IA',
        color: 'green',
        icon: 'Bot',
        priority: 3
    },
    DESIGN: {
        id: 'design',
        name: 'Design Graphique',
        color: 'purple',
        icon: 'Palette',
        priority: 4
    },
    COMMUNICATION: {
        id: 'com-journalism',
        name: 'Communication',
        color: 'red',
        icon: 'Mic',
        priority: 5
    }
} as const;

export const servicesData = [
    {
        id: SERVICE_CATEGORIES.MULTIMEDIA.id,
        category: SERVICE_CATEGORIES.MULTIMEDIA,
        title: "Production Multimédia de Prestige",
        slug: "production-multimedia-de-prestige",
        tagline: "Capturer l'invisible, immortaliser l'instant",
        shortDesc: "Prises de vue professionnelle, photo et vidéo pour tous vos évènements marquants.",
        thumbnail: "https://picsum.photos/seed/multimedia/800/600",
        gallery: [
            "https://picsum.photos/seed/multimedia1/800/600",
            "https://picsum.photos/seed/multimedia2/800/600",
            "https://picsum.photos/seed/multimedia3/800/600"
        ],
        pricing: {
            basePrice: 50000,
            currency: CONFIG.currency,
            vatIncluded: false,
            packages: [
                {
                    name: "Mariage",
                    price: 65000,
                    duration: "2 journées",
                    features: [
                        "Cérémonie complète",
                        "Album photo luxe", 
                        "Vidéo 4K montée",
                        "Livraison 48h"
                    ],
                    popular: true,
                    badge: "MEILLEUR CHOIX"
                },
                {
                    name: "Baptême",
                    price: 50000,
                    duration: "1 journée",
                    features: [
                        "Cérémonie religieuse",
                        "Photos retouchées",
                        "Montage vidéo",
                        "Livraison rapide"
                    ],
                    popular: false
                }
            ],
            addOns: [
                { name: "Toile de luxe", price: 10000 },
                { name: "Carte d'invitation", price: 10000 }
            ]
        },
        description: {
            main: "L'image est le seul souvenir tangible de vos moments précieux. Nous transformons vos émotions en chefs-d'œuvre visuels.",
            highlights: [
                "Matériel professionnel Full Frame",
                "Livraison express 48-72h",
                "Équipe expérimentée",
                "Post-production incluse"
            ]
        },
        metrics: {
            completedProjects: 150,
            satisfactionRate: 98,
            averageRating: 4.9,
            deliveryOnTime: 100
        }
    },
    {
        id: SERVICE_CATEGORIES.WEB_DEV.id,
        category: SERVICE_CATEGORIES.WEB_DEV,
        title: "Développement Web & Applications",
        slug: "developpement-web-applications",
        tagline: "Solutions robustes, évolutives et centrées utilisateur",
        shortDesc: "Conception de sites vitrines et applications web sur mesure haute performance.",
        thumbnail: "https://picsum.photos/seed/webdev/800/600",
        pricing: {
            basePrice: 150000,
            currency: CONFIG.currency,
            vatIncluded: false,
            packages: [
                {
                    name: "Site Vitrine",
                    price: 150000,
                    duration: "1-2 semaines",
                    features: [
                        "Jusqu'à 5 pages",
                        "Design responsive",
                        "SEO optimisé",
                        "Formulaire contact"
                    ],
                    popular: false
                },
                {
                    name: "E-commerce",
                    price: 350000,
                    duration: "3-4 semaines",
                    features: [
                        "Boutique complète",
                        "Paiement Mobile Money",
                        "Gestion stocks",
                        "Formation incluse"
                    ],
                    popular: true,
                    badge: "TOP VENTE"
                }
            ]
        }
    },
    {
        id: SERVICE_CATEGORIES.AUTOMATION.id,
        category: SERVICE_CATEGORIES.AUTOMATION,
        title: "Automatisation & IA",
        slug: "automatisation-ia",
        tagline: "L'era de l'efficacité",
        shortDesc: "Gagnez du temps avec des outils qui travaillent pour vous 24h/24.",
        thumbnail: "https://picsum.photos/seed/automation/800/600",
        pricing: {
            basePrice: 25000,
            packages: [
                {
                    name: "Assistant WhatsApp",
                    price: 150000,
                    features: ["Réponses IA", "Liaison Google Sheets", "Capture prospects"]
                },
                {
                    name: "CRM Automatisé",
                    price: 250000,
                    features: ["Automatisation ventes", "Email & SMS", "Relances intelligentes"]
                }
            ]
        }
    },
    {
        id: SERVICE_CATEGORIES.DESIGN.id,
        category: SERVICE_CATEGORIES.DESIGN,
        title: "Design Graphique",
        slug: "design-graphique",
        tagline: "Visual Storytelling",
        shortDesc: "Identité visuelle, logos et supports marketing percutants.",
        thumbnail: "https://picsum.photos/seed/design/800/600",
        pricing: {
            basePrice: 20000,
            packages: [
                {
                    name: "Logo & Branding",
                    price: 20000,
                    features: ["Logo professionnel", "Charte graphique", "Carte de visite"]
                },
                {
                    name: "Design Digital",
                    price: 5000,
                    features: ["Posts réseaux sociaux", "Bannières web", "Affiches"]
                }
            ]
        }
    },
    {
        id: SERVICE_CATEGORIES.COMMUNICATION.id,
        category: SERVICE_CATEGORIES.COMMUNICATION,
        title: "Com & Journalisme",
        slug: "com-journalisme",
        tagline: "L'info, notre métier",
        shortDesc: "Rédaction web, animation radio et gestion de communication institutionnelle.",
        thumbnail: "https://picsum.photos/seed/journalism/800/600",
        pricing: {
            basePrice: 15000,
            packages: [
                {
                    name: "Articles SEO",
                    price: 15000,
                    features: ["Article 1000 mots", "Optimisation SEO", "Recherche incluse"]
                },
                {
                    name: "Community Management",
                    price: 100000,
                    features: ["Gestion réseaux sociaux", "Stratégie contenu", "Rapports mensuels"]
                }
            ]
        }
    }
];

export const portfolioItems = [
    {
        id: 1,
        title: "Plateforme Digitale HAI",
        category: "web",
        image: "https://picsum.photos/seed/hai/800/600",
        description: "Conception d'une plateforme de suivi pour l'ONG Health Access Initiative.",
        technologies: ["HTML/CSS", "JavaScript", "PHP", "MySQL"]
    },
    {
        id: 2,
        title: "Identité Visuelle Pro",
        category: "design",
        image: "https://picsum.photos/seed/branding/800/600",
        description: "Charte graphique complète pour un programme de santé communautaire.",
        technologies: ["Photoshop", "Illustrator", "InDesign"]
    },
    {
        id: 3,
        title: "Reportage Mariage Prestige",
        category: "media",
        image: "https://picsum.photos/seed/wedding/800/600",
        description: "Production de contenus audiovisuels pour événements.",
        technologies: ["Premiere Pro", "After Effects", "Photoshop"]
    }
];
