import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import axios from 'axios';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ORIGIN_SERVER_URL from environment
const ORIGIN_URL = process.env.ORIGIN_SERVER_URL || '';

if (!ORIGIN_URL) {
  console.warn('WARNING: ORIGIN_SERVER_URL is not set. Proxy functionality will fail.');
}

// Media file extensions that should be redirected
const MEDIA_EXTENSIONS = ['.ts', '.mkv', '.mp4', '.avi', '.m3u8', '.mp3', '.aac', '.wav'];

/**
 * Core Logic: Proxy and Redirect Handler
 */
app.all('*', async (req: Request, res: Response, next) => {
  const url = req.url;
  const method = req.method;
  
  // Skip internal vite paths or public assets if we are in dev/prod
  if (url.startsWith('/@vite') || url.startsWith('/src') || url.startsWith('/node_modules')) {
    return next();
  }

  // Determine if it's a media request
  const hasMediaExtension = MEDIA_EXTENSIONS.some(ext => {
      // Check path ending or query params that might look like a stream
      const pathname = url.split('?')[0];
      return pathname.toLowerCase().endsWith(ext);
  });

  if (hasMediaExtension) {
    // 302 Redirect for media files to save Vercel bandwidth
    const targetUrl = `${ORIGIN_URL}${url}`;
    console.log(`[Redirect] ${url} -> ${targetUrl}`);
    return res.redirect(302, targetUrl);
  }

  // List of specific PHP API endpoints or XML/M3U types to proxy
  // Alternatively, proxy everything else that isn't a known static asset
  const isApiRequest = url.includes('.php') || url.includes('.xml') || url.includes('.m3u') || url.includes('/api/');

  if (isApiRequest && ORIGIN_URL) {
    try {
      const targetUrl = `${ORIGIN_URL}${url}`;
      console.log(`[Proxy] ${method} ${url} -> ${targetUrl}`);

      // Forward headers (carefully)
      const headers = { ...req.headers };
      delete headers.host;
      delete headers.connection;

      const response = await axios({
        method,
        url: targetUrl,
        data: req.body,
        headers,
        validateStatus: () => true, // Don't throw on error codes
        responseType: 'arraybuffer' // Handle potential binary responses like M3U
      });

      // Send response back
      res.status(response.status);
      
      // Copy response headers
      Object.entries(response.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          res.setHeader(key, value);
        }
      });

      return res.send(response.data);
    } catch (error: any) {
      console.error(`Proxy error: ${error.message}`);
      return res.status(500).json({ error: 'Proxy initialization failed', message: error.message });
    }
  }

  // If it's not a proxy/redirect path, let it pass to Vite/Express static
  next();
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`IPTV Proxy server running on http://localhost:${PORT}`);
    console.log(`Origin: ${ORIGIN_URL}`);
  });
}

startServer();
