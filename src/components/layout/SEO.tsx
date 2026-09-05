import { useEffect } from 'react';
import { useStore } from '../../store/useStore';

export default function SEO() {
  const { activeTab, selectedProduct, selectedCategory, selectedSubcategory, categories, siteSettings } = useStore();

  useEffect(() => {
    let title = siteSettings.siteName || 'Jersey Mention BD';
    let description = siteSettings.tagLine || 'Premium Authentic Sports Jerseys & Apparel in Bangladesh';
    const baseUrl = window.location.origin;
    let canonicalUrl = window.location.href.split('?')[0];
    let schemas: any[] = [];

    // 1. Organization & Website Default Schema (Always active or on home)
    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": siteSettings.siteName || "Jersey Mention BD",
      "url": baseUrl,
      "logo": `${baseUrl}${siteSettings.logo || '/images/logo.png'}`,
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": siteSettings.contactPhone || "+8801640581442",
        "contactType": "customer service",
        "email": siteSettings.contactEmail || "admin@jerseymentionbd.com"
      },
      "sameAs": [
        siteSettings.facebookUrl,
        siteSettings.instagramUrl,
        siteSettings.youtubeUrl
      ].filter(Boolean)
    };

    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": siteSettings.siteName || "Jersey Mention BD",
      "url": baseUrl,
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${baseUrl}/search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    };

    if (activeTab === 'home' || !activeTab) {
      title = `${siteSettings.siteName} — Premium Football Jerseys & Custom Sports Apparel`;
      description = siteSettings.aboutUsText || description;
      schemas.push(orgSchema, websiteSchema);
    } else if (activeTab === 'product_detail' && selectedProduct) {
      const p = selectedProduct;
      const price = p.salePrice || p.price;
      title = `${p.name} | Buy Online in Bangladesh — ${siteSettings.siteName}`;
      description = p.shortDescription || p.description?.slice(0, 155) || description;
      canonicalUrl = `${baseUrl}/product/${p.slug}`;

      // Product Schema
      const productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": p.name,
        "image": p.images?.map(img => img.startsWith('http') ? img : `${baseUrl}${img}`) || [],
        "description": p.description || p.shortDescription,
        "sku": p.sku,
        "mpn": p.sku,
        "brand": {
          "@type": "Brand",
          "name": p.brandName || "Jersey Mention BD"
        },
        "offers": {
          "@type": "Offer",
          "url": canonicalUrl,
          "priceCurrency": "BDT",
          "price": price,
          "priceValidUntil": "2027-12-31",
          "itemCondition": "https://schema.org/NewCondition",
          "availability": p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "seller": {
            "@type": "Organization",
            "name": siteSettings.siteName
          }
        }
      };

      // Breadcrumb Schema
      const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": baseUrl
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": p.categoryName,
            "item": `${baseUrl}/category/${p.categoryId}`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": p.name,
            "item": canonicalUrl
          }
        ]
      };

      schemas.push(productSchema, breadcrumbSchema);
    } else if (activeTab === 'category_detail' || activeTab === 'club_category') {
      const catSlug = selectedCategory;
      const catObj = categories.find(c => c.slug === catSlug || c.id === catSlug);
      const catName = catObj ? catObj.name : catSlug.replace('-', ' ');
      
      title = `${catName} Football Jerseys & Kits — ${siteSettings.siteName}`;
      description = `Explore premium ${catName} player version jerseys, fan apparel, and retro kits online at ${siteSettings.siteName} with fast delivery in Bangladesh.`;
      canonicalUrl = `${baseUrl}/category/${catSlug}`;

      // Breadcrumb Schema
      const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": baseUrl
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": catName,
            "item": canonicalUrl
          }
        ]
      };

      schemas.push(breadcrumbSchema);
    } else if (activeTab === 'search') {
      title = `Search Results for "${selectedCategory || ''}" — ${siteSettings.siteName}`;
      description = `Browse the search results for "${selectedCategory || ''}" at ${siteSettings.siteName}.`;
    } else {
      // Standard tabs: checkout, tracking, profile, wishlist
      const tabName = activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('_', ' ');
      title = `${tabName} — ${siteSettings.siteName}`;
      description = `${tabName} section of ${siteSettings.siteName}.`;
    }

    // Apply Meta Tags to DOM
    document.title = title;

    // Update Meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // Update Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    // Update Open Graph tags
    const ogTags = {
      'og:title': title,
      'og:description': description,
      'og:url': canonicalUrl,
      'og:type': activeTab === 'product_detail' ? 'product' : 'website'
    };

    Object.entries(ogTags).forEach(([property, value]) => {
      let ogTag = document.querySelector(`meta[property="${property}"]`);
      if (!ogTag) {
        ogTag = document.createElement('meta');
        ogTag.setAttribute('property', property);
        document.head.appendChild(ogTag);
      }
      ogTag.setAttribute('content', value);
    });

    // Remove existing dynamic script tag
    const existingScript = document.getElementById('dynamic-jsonld-schema');
    if (existingScript) {
      existingScript.remove();
    }

    // Append new dynamic JSON-LD schemas
    if (schemas.length > 0) {
      const script = document.createElement('script');
      script.id = 'dynamic-jsonld-schema';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schemas.length === 1 ? schemas[0] : schemas, null, 2);
      document.head.appendChild(script);
    }

  }, [activeTab, selectedProduct, selectedCategory, selectedSubcategory, categories, siteSettings]);

  return null;
}
