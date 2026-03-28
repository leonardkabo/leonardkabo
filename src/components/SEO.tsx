/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Helmet } from 'react-helmet-async';
import { SITE_NAME, SITE_TITLE } from '../constants';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

export default function SEO({ 
  title, 
  description, 
  keywords, 
  image, 
  url, 
  type = 'website' 
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | ${SITE_TITLE}`;
  const defaultDescription = "Expert en transformation numérique, journalisme et innovation sociale. Découvrez les services et réalisations de Léonard KABO.";
  const metaDescription = description || defaultDescription;
  const metaKeywords = keywords || "Léonard KABO, Leonard Kabo, transformation numérique, journalisme, innovation sociale, multimédia, Bénin, expert numérique";
  const siteUrl = url || window.location.href;
  const metaImage = image || "https://picsum.photos/seed/leonard/1200/630";

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <link rel="canonical" href={siteUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={siteUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={siteUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": type === 'article' ? 'BlogPosting' : 'Person',
          "name": SITE_NAME,
          "url": siteUrl,
          "image": metaImage,
          "description": metaDescription,
          "jobTitle": SITE_TITLE,
          "sameAs": [
            "https://linkedin.com/in/leonardkabo",
            "https://x.com/leonardkabo1",
            "https://facebook.com/leonardkabo1"
          ]
        })}
      </script>
    </Helmet>
  );
}
