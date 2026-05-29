import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import axios from 'axios';

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

      // Forward client headers cleanly (especially User-Agent, X-Forwarded-For, etc.) to avoid bot blocks
      const headers = { ...req.headers };
      delete headers.host;
      delete headers.connection;
      delete headers['accept-encoding']; // Let axios handle decompression transparently for string rewriting

      const response = await axios({
        method,
        url: targetUrl,
        data: req.body,
        headers,
        validateStatus: () => true, // Proceed even for non-200 responses so we can proxy them back
        responseType: 'arraybuffer' // Grab as raw binary array buffer
      });

      // Send status code back
      res.status(response.status);
      
      // Copy standard response headers (skipping conflicting headers or previous CORS policies)
      Object.entries(response.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          const lowerKey = key.toLowerCase();
          if (
            lowerKey !== 'content-length' && 
            lowerKey !== 'transfer-encoding' &&
            !lowerKey.startsWith('access-control-')
          ) {
            res.setHeader(key, value);
          }
        }
      });

      // Always enforce permissive, wildcard CORS headers to solve client player blocks
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Access-Control-Expose-Headers', '*');

      let responseData = response.data;
      const contentType = (response.headers['content-type'] || '').toString().toLowerCase();

      // Intercept and rewrite references inside XML, text, M3U playlist, or typical IPTV player payload files
      const isTextOrPlaylist = contentType.includes('text') || 
                               contentType.includes('json') || 
                               contentType.includes('mpegurl') || 
                               contentType.includes('xml') ||
                               url.includes('.php') || 
                               url.includes('.m3u') || 
                               url.includes('.xml');

      if (isTextOrPlaylist && responseData) {
        let text = Buffer.from(responseData).toString('utf8');
        
        // Find current hostname of Vercel gateway
        const proto = (req.headers['x-forwarded-proto'] || 'https') as string;
        const host = req.headers.host || 'localhost:3000';
        const proxyBaseUrl = `${proto}://${host}`;

        // Clean trailing slashes from the origin URL to avoid potential double slashes
        const cleanOrigin = ORIGIN_URL.replace(/\/+$/, '');
        
        // Overwrite origin references inside payload body to make them route via local proxy domain
        text = text.replaceAll(cleanOrigin, proxyBaseUrl);

        // Also handle variant forms of protocol just in case there's an http mismatch
        const cleanOriginNoProto = cleanOrigin.replace(/^https?:\/\//i, '');
        text = text.replaceAll(`http://${cleanOriginNoProto}`, proxyBaseUrl);
        text = text.replaceAll(`https://${cleanOriginNoProto}`, proxyBaseUrl);

        responseData = Buffer.from(text, 'utf8');
        res.setHeader('Content-Length', Buffer.byteLength(text, 'utf8'));
      } else {
        // Untouched responses maintain their content length
        if (response.headers['content-length']) {
          res.setHeader('Content-Length', response.headers['content-length'] as string);
        }
      }

      return res.send(responseData);
    } catch (error: any) {
      console.error(`Proxy error: ${error.message}`);
      return res.status(500).json({ error: 'Proxy initialization failed', message: error.message });
    }
  }

  // If it's not a proxy/redirect path, let it pass to Vite/Express static
  next();
});

// Root route handler for the web player iframe
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Web Player</title>
        <style>
            body, html {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                overflow: hidden;
                background-color: #000;
            }
            iframe {
                width: 100%;
                height: 100%;
                border: none;
            }
        </style>
    </head>
    <body>
        <iframe src="https://sjstore-replayer.hf.space/" allowfullscreen allow="autoplay; encrypted-media; fullscreen;"></iframe>
    </body>
    </html>
  `);
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import('vite');
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

if (process.env.NODE_ENV !== "production") {
  startServer();
}

export default app;
