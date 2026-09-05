console.log('[Server] Script file loaded, importing dependencies...');
import './server/polyfill';
import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';
import routes from './server/routes';
import { authenticateToken, errorHandler } from './server/middleware';
import { connectMongoDB } from './server/mongodb';
import { fileURLToPath } from 'url';

console.log('[Server] Imports resolved, preparing startup...');

const _filename = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url);
const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(_filename);


async function startServer() {
  // Connect to MongoDB Atlas
  await connectMongoDB();

  const app = express();
  const PORT = process.env.PORT || 3000;

  const allowedOrigins = new Set(
    (process.env.FRONTEND_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
      .split(',').map((origin) => origin.trim()).filter(Boolean)
  );
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      
      // Automatically allow same-origin requests if APP_URL is defined
      try {
        const originUrl = new URL(origin);
        if (process.env.APP_URL) {
          const appUrl = new URL(process.env.APP_URL);
          if (originUrl.host === appUrl.host) {
            return callback(null, true);
          }
        }
        if (originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1') {
          return callback(null, true);
        }
      } catch (e) {}

      // Return false instead of throwing an Error to prevent 500 server crashes.
      // Standard browser behavior will handle same-origin or cross-origin headers.
      return callback(null, false);
    },
    credentials: true
  }));
  app.use(compression());
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self'; frame-src 'self';");
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  app.use('/uploads', express.static(path.join(_dirname, '..', 'public', 'uploads')));

  // Attach Token Auth Middleware globally
  app.use(authenticateToken);

  // Healthcheck endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Jersey Mention BD API',
      timestamp: new Date().toISOString()
    });
  });

  // API Routes
  app.use('/api', routes);

  // Centralized Error Handler
  app.use(errorHandler);

  // Sitemap generation
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const host = req.get('host');
      const protocol = req.protocol;
      const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
      
      const { ProductModel, CategoryModel } = await import('./server/mongodb');
      const categories = await CategoryModel.find({ isActive: true } as any).select('slug').lean();
      const products = await ProductModel.find({ status: 'active' } as any).select('slug').lean();

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

      // Static pages
      const staticPaths = ['', '/shop', '/clubs', '/track-order', '/wishlist', '/profile'];
      for (const p of staticPaths) {
        xml += `  <url>\n    <loc>${baseUrl}${p}</loc>\n    <changefreq>daily</changefreq>\n    <priority>${p === '' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
      }

      // Categories
      for (const cat of categories) {
        xml += `  <url>\n    <loc>${baseUrl}/category/${cat.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
      }

      // Products
      for (const prod of products) {
        xml += `  <url>\n    <loc>${baseUrl}/product/${prod.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
      }

      xml += `</urlset>`;
      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (err) {
      res.status(500).send('Error generating sitemap');
    }
  });

  // Serve static assets or Vite dev server
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = _dirname;
    app.use(express.static(distPath, {
      maxAge: '1y',
      etag: true,
      setHeaders: (res, filepath) => {
        if (filepath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (typeof PORT === 'string' && !isNaN(Number(PORT))) {
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`[Jersey Mention BD Server] Running at http://0.0.0.0:${PORT}`);
    });
  } else if (typeof PORT === 'number') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Jersey Mention BD Server] Running at http://0.0.0.0:${PORT}`);
    });
  } else {
    app.listen(PORT, () => {
      console.log(`[Jersey Mention BD Server] Running at ${PORT}`);
    });
  }
}

startServer().catch((err) => {
  console.error('[Fatal Startup Error]:', err);
  process.exit(1);
});
