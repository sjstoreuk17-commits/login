/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Shield, Zap, Info, Server, ExternalLink, CheckCircle } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-blue-500/30">
      <nav className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold tracking-tight text-lg">IPTV Relay Proxy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-widest">Server Active</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <header className="mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-white to-neutral-500 bg-clip-text text-transparent"
          >
            Vercel Serverless IPTV Gateway
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-neutral-400 max-w-2xl leading-relaxed"
          >
            A high-performance reverse proxy designed for API relay and media redirection. 
            Optimized for bandwidth efficiency.
          </motion.p>
        </header>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-blue-500/50 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold">API Relay Mode</h3>
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed mb-4">
              Requests for <code className="text-blue-300">.php</code>, <code className="text-blue-300">.xml</code>, 
              and <code className="text-blue-300">.m3u</code> are fetched from the origin server and 
              returned via this proxy with full CORS support.
            </p>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Zero config needed for players
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-blue-500/50 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-4">
              <Server className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold">Stream Redirection</h3>
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed mb-4">
              Requests for <code className="text-emerald-300">.ts</code>, <code className="text-emerald-300">.m3u8</code>, 
              and other media formats are automatically redirected (HTTP 302) to save your Vercel bandwidth quota.
            </p>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Direct player-to-origin connection
            </div>
          </motion.div>
        </div>

        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8"
        >
          <div className="flex items-start gap-4">
            <div className="bg-neutral-800 p-2 rounded-lg mt-1">
              <Info className="w-5 h-5 text-neutral-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-4">How to Configure</h2>
              <div className="space-y-4">
                <p className="text-neutral-400">
                  To finalize your deployment, add the following environment variable in your Vercel Dashboard:
                </p>
                <div className="bg-black p-4 rounded-xl border border-neutral-800 font-mono text-sm overflow-x-auto">
                  <span className="text-neutral-500"># On Vercel Dashboard Settings</span><br/>
                  <span className="text-blue-400">ORIGIN_SERVER_URL</span>=<span className="text-emerald-400">"http://your-iptv-server.com"</span>
                </div>
                <div className="pt-4 flex gap-4">
                  <a 
                    href="https://vercel.com/dashboard" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
                  >
                    Vercel Dashboard <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      <footer className="border-t border-neutral-800 mt-20 py-8 text-center text-neutral-500 text-sm">
        <p>© 2026 IPTV Serverless Proxy Gateway</p>
      </footer>
    </div>
  );
}
