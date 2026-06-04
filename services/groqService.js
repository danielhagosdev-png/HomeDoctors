/**
 * groqService.js
 *
 * Calls the Home Doctors proxy server which forwards requests to Groq.
 * The API key lives on the server only — never in this file.
 *
 * HOW TO FIND YOUR DEVICE IP:
 *   Windows: run `ipconfig` → look for IPv4 Address under your Wi-Fi adapter
 *   Mac/Linux: run `ifconfig` → look for inet under en0/wlan0
 *   Then set PROXY_BASE_URL below to http://<that-ip>:3001
 *   (Both your PC running the server AND your phone must be on the same Wi-Fi)
 *
 * For production, replace with your deployed server URL, e.g.:
 *   https://your-app.railway.app
 */

// ─── CONFIG: change this to your machine's local IP ─────────────────────────
// Example: 'http://192.168.1.42:3001'
export const PROXY_BASE_URL = 'http://YOUR_LOCAL_IP:3001';

// Set to true once your server is running and IP is configured above
export const PROXY_ENABLED = false;

// ─── Local fallback (used when PROXY_ENABLED is false) ───────────────────────
import { getLocalResponse } from '../utils/aiResponses';

/**
 * Sends the full conversation history to the proxy and returns the assistant reply.
 *
 * @param {Array<{role:'user'|'assistant', content:string}>} history
 * @returns {Promise<string>} assistant reply text
 */
export async function sendChatMessage(history) {
  // Use local keyword fallback during development / when server is not set up
  if (!PROXY_ENABLED) {
    const lastUserMsg = [...history].reverse().find((m) => m.role === 'user');
    return getLocalResponse(lastUserMsg?.content ?? '');
  }

  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 15_000); // 15s timeout

    const res = await fetch(`${PROXY_BASE_URL}/api/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ messages: history }),
      signal:  controller.signal,
    });

    clearTimeout(timeout);

    const data = await res.json();

    if (!res.ok) {
      // Server returned a structured error message
      throw new Error(data.error ?? `Server error ${res.status}`);
    }

    return data.reply;

  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    // Re-throw so the chat screen can display it
    throw err;
  }
}

/**
 * Check if the proxy server is reachable.
 * Call this on app start or when the user first opens the chat tab.
 */
export async function checkProxyHealth() {
  if (!PROXY_ENABLED) return { ok: false, reason: 'Proxy disabled — using offline mode' };
  try {
    const res = await fetch(`${PROXY_BASE_URL}/health`, { method: 'GET' });
    const data = await res.json();
    return { ok: res.ok && data.status === 'ok' };
  } catch {
    return { ok: false, reason: 'Cannot reach proxy server' };
  }
}
