/**
 * POST /api/verify-texas
 *
 * Vercel Serverless Function — verifies whether a lat/lng coordinate
 * falls within the state of Texas using a point-in-polygon check.
 *
 * Request:  { latitude: number, longitude: number }
 * Response: { inTexas: boolean }
 *
 * Security:
 * - Does NOT store coordinates
 * - Validates input types server-side
 * - Basic rate-limit protection via in-memory counter
 * - HTTPS enforced by Vercel
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TEXAS_BOUNDARY, TEXAS_BOUNDING_BOX } from '../lib/geo/texasBoundary';

// ---------- lightweight in-memory rate limiter ----------

const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT = 30;         // max requests per IP per window

const hits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

// ---------- point-in-polygon (ray-casting) ----------

function isPointInPolygon(
  x: number,
  y: number,
  polygon: [number, number][]
): boolean {
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

function checkInTexas(latitude: number, longitude: number): boolean {
  if (
    latitude < TEXAS_BOUNDING_BOX.minLat ||
    latitude > TEXAS_BOUNDING_BOX.maxLat ||
    longitude < TEXAS_BOUNDING_BOX.minLng ||
    longitude > TEXAS_BOUNDING_BOX.maxLng
  ) {
    return false;
  }

  return isPointInPolygon(longitude, latitude, TEXAS_BOUNDARY);
}

// ---------- handler ----------

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  // Parse & validate body
  const { latitude, longitude } = req.body ?? {};

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({
      error: 'Invalid request. Expected { latitude: number, longitude: number }.',
    });
  }

  if (
    latitude < -90 || latitude > 90 ||
    longitude < -180 || longitude > 180
  ) {
    return res.status(400).json({
      error: 'Coordinates out of valid range.',
    });
  }

  // Perform check
  const inTexas = checkInTexas(latitude, longitude);

  return res.status(200).json({ inTexas });
}
