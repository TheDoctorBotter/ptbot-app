/**
 * Point-in-Texas Verification Utility
 *
 * Uses the ray-casting algorithm to determine if a geographic coordinate
 * falls within the Texas state boundary polygon. No external dependencies.
 *
 * Privacy: This module performs a pure geometric computation.
 * It does NOT store or transmit coordinates.
 */

import { TEXAS_BOUNDARY, TEXAS_BOUNDING_BOX } from '../geo/texasBoundary';

/**
 * Determines whether a point (latitude, longitude) is inside the Texas boundary.
 *
 * Uses the ray-casting algorithm: cast a ray from the point to the right
 * and count how many polygon edges it crosses. Odd = inside, even = outside.
 *
 * @param latitude  - WGS84 latitude  (e.g. 30.2672 for Austin)
 * @param longitude - WGS84 longitude (e.g. -97.7431 for Austin)
 * @returns true if the point is inside the Texas boundary polygon
 */
export function isPointInTexas(latitude: number, longitude: number): boolean {
  // Fast bounding-box rejection
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

/**
 * Ray-casting point-in-polygon algorithm.
 *
 * @param x - test point X (longitude)
 * @param y - test point Y (latitude)
 * @param polygon - array of [x, y] (i.e. [longitude, latitude]) vertices
 * @returns true if (x, y) is inside the polygon
 */
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

    // Check if the ray from (x, y) going right crosses edge (i, j)
    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}
