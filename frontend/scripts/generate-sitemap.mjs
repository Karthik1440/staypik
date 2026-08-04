import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.staypik.in';
const TODAY = new Date().toISOString().split('T')[0];

const staticRoutes = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/login', priority: '0.5', changefreq: 'monthly' },
  { path: '/terms-privacy', priority: '0.3', changefreq: 'monthly' },
  { path: '/saved', priority: '0.4', changefreq: 'monthly' },
];

// Default fallback property IDs if backend/API is unreachable during static build
const defaultPropertyIds = [1, 2, 3, 4, 5, 6];

async function generateSitemap() {
  let propertyIds = defaultPropertyIds;

  try {
    const apiUrl = process.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    const response = await fetch(`${apiUrl}/rentals/properties/`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        propertyIds = data.map((item) => item.id);
      }
    }
  } catch (err) {
    console.log('Using default property IDs for sitemap generation (API offline during build)');
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n`;

  xml += `  <!-- Static Public Routes -->\n`;
  for (const route of staticRoutes) {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}${route.path}</loc>\n`;
    xml += `    <lastmod>${TODAY}</lastmod>\n`;
    xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
    xml += `    <priority>${route.priority}</priority>\n`;
    xml += `  </url>\n\n`;
  }

  xml += `  <!-- Property Listing Pages -->\n`;
  for (const id of propertyIds) {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}/property/${id}</loc>\n`;
    xml += `    <lastmod>${TODAY}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n\n`;
  }

  xml += `</urlset>\n`;

  const outputPath = path.resolve(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf8');
  console.log(`Successfully generated sitemap.xml with ${staticRoutes.length + propertyIds.length} URLs at ${outputPath}`);
}

generateSitemap();
