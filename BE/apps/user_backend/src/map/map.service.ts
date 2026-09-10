import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../libs/prisma/src/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import {
  UpdateLocationDto,
  SubmitDisasterReportDto,
  ApproveReportDto,
} from './map.dto';
import {
  LiveResponderData,
  DisasterAreaData,
  GroupLocationData,
  MapDataResponse,
} from './map.types';

@Injectable()
export class MapService {
  private readonly logger = new Logger(MapService.name);
  private pincodeData: Map<string, any> = new Map();
  /** Sorted list of [numericPincode, centroidLng, centroidLat] for all loaded pincodes */
  private pincodeCentroids: Array<[number, number, number]> = [];

  private normalizePincode(value?: string): string {
    return String(value || '').replace(/\D/g, '').trim();
  }

  constructor(private prisma: PrismaService) {
    this.loadPincodeData();
  }

  private loadPincodeData() {
    try {
      const geojsonPath = path.join(process.cwd(), 'geojsonData', 'data.geojson');
      if (fs.existsSync(geojsonPath)) {
        const data = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'));

        if (data.features) {
          data.features.forEach((feature: any) => {
            // Handle both "Pincode" (capital P) and "pincode" (lowercase)
            const pincode = feature.properties?.Pincode || feature.properties?.pincode;
            if (pincode) {
              const normalizedPincode = this.normalizePincode(String(pincode));
              if (!normalizedPincode) {
                return;
              }

              this.pincodeData.set(normalizedPincode, {
                pincode: normalizedPincode,
                state: feature.properties?.state || feature.properties?.Region || '',
                district: feature.properties?.district || feature.properties?.Division || '',
                circle: feature.properties?.Circle || '',
                office: feature.properties?.Office_Name || '',
                polygon: feature.geometry,
                bbox: this.computeGeometryBoundingBox(feature.geometry),
              });
            }
          });
        }

        // Build sorted centroid index for geographic interpolation of missing pincodes
        const centroids: Array<[number, number, number]> = [];
        for (const [code, data] of this.pincodeData.entries()) {
          const num = parseInt(code, 10);
          if (isNaN(num)) continue;
          const c = this.computePolygonCentroid(data.polygon);
          if (c) centroids.push([num, c.lng, c.lat]);
        }
        // Sort by numeric pincode so binary-search neighbours work
        centroids.sort((a, b) => a[0] - b[0]);
        this.pincodeCentroids = centroids;

        this.logger.log(`Loaded ${this.pincodeData.size} pincode polygons from GeoJSON`);
      } else {
        this.logger.warn('GeoJSON data file not found at: ' + geojsonPath);
      }
    } catch (error) {
      this.logger.error('Error loading pincode data:', error);
    }
  }

  /** Compute the arithmetic centroid of a GeoJSON Polygon or MultiPolygon */
  private computePolygonCentroid(geometry: any): { lng: number; lat: number } | null {
    const pairs = this.extractCoordinatePairs(geometry);
    if (!pairs.length) return null;
    let sumLng = 0;
    let sumLat = 0;
    for (const [lng, lat] of pairs) {
      sumLng += lng;
      sumLat += lat;
    }
    return { lng: sumLng / pairs.length, lat: sumLat / pairs.length };
  }

  /**
   * For a pincode not present in GeoJSON, find the geographically interpolated
   * coordinates by looking at numerically adjacent known pincodes that are also
   * geographically close to each other, averaging their centroids, then running
   * point-in-polygon on that estimate.
   *
   * Key difference from the old ±8 numeric fallback: we filter neighbours by
   * geographic distance so that numerically adjacent but geographically distant
   * pincodes (different cities/states) don't pollute the average.
   */
  private resolveByInterpolation(missingCode: string): any | null {
    const target = parseInt(missingCode, 10);
    if (isNaN(target) || !this.pincodeCentroids.length) return null;

    // Binary search: find insertion point in sorted centroid array
    let lo = 0;
    let hi = this.pincodeCentroids.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.pincodeCentroids[mid][0] < target) lo = mid + 1;
      else hi = mid;
    }

    // Collect up to K candidates on each side by numeric proximity
    const K = 5;
    const candidates: Array<[number, number]> = []; // [lng, lat]
    for (let i = lo - 1; i >= Math.max(0, lo - K); i--) {
      const [, lng, lat] = this.pincodeCentroids[i];
      candidates.push([lng, lat]);
    }
    for (let i = lo; i < Math.min(this.pincodeCentroids.length, lo + K); i++) {
      const [, lng, lat] = this.pincodeCentroids[i];
      candidates.push([lng, lat]);
    }
    if (!candidates.length) return null;

    // Compute the median centroid of candidates (robust to outliers)
    const medLng = candidates.map(([l]) => l).sort((a, b) => a - b)[Math.floor(candidates.length / 2)];
    const medLat = candidates.map(([, l]) => l).sort((a, b) => a - b)[Math.floor(candidates.length / 2)];

    // Filter to only candidates within 30 km of the median (removes cross-city numeric accidents)
    const kmPerDeg = 111.32;
    const close = candidates.filter(([lng, lat]) => {
      const dlat = (lat - medLat) * kmPerDeg;
      const dlng = (lng - medLng) * kmPerDeg * Math.cos((medLat * Math.PI) / 180);
      return Math.hypot(dlat, dlng) <= 30;
    });

    const pool = close.length >= 2 ? close : candidates; // fall back to all if filtering too aggressive

    // Average centroid of the pool
    const interpLng = pool.reduce((s, [l]) => s + l, 0) / pool.length;
    const interpLat = pool.reduce((s, [, l]) => s + l, 0) / pool.length;

    // Run point-in-polygon on that interpolated point
    const hit = this.findPincodeByCoordinates(interpLat, interpLng);
    if (hit) {
      this.logger.log(
        `Pincode ${missingCode} not in GeoJSON — interpolated to (${interpLat.toFixed(4)}, ${interpLng.toFixed(4)}) → resolved to ${hit.data.pincode}`,
      );
      return hit.data;
    }

    // Last resort: the single numerically nearest known pincode (closest index)
    const nearestIdx = lo > 0 ? lo - 1 : 0;
    const nearest = this.pincodeCentroids[nearestIdx];
    if (nearest) {
      const nearestData = this.pincodeData.get(String(nearest[0]).padStart(missingCode.length, '0'));
      if (nearestData) {
        this.logger.log(
          `Pincode ${missingCode} interpolation returned nothing — falling back to nearest known ${nearestData.pincode}`,
        );
        return nearestData;
      }
    }

    return null;
  }

  private extractCoordinatePairs(geometry: any): Array<[number, number]> {
    const pairs: Array<[number, number]> = [];

    const walk = (node: any) => {
      if (!Array.isArray(node)) return;
      if (
        node.length >= 2 &&
        typeof node[0] === 'number' &&
        typeof node[1] === 'number'
      ) {
        pairs.push([node[0], node[1]]);
        return;
      }
      node.forEach(walk);
    };

    walk(geometry?.coordinates);
    return pairs;
  }

  private computeGeometryBoundingBox(geometry: any): {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
  } | null {
    const pairs = this.extractCoordinatePairs(geometry);
    if (!pairs.length) return null;

    let minLng = Number.POSITIVE_INFINITY;
    let minLat = Number.POSITIVE_INFINITY;
    let maxLng = Number.NEGATIVE_INFINITY;
    let maxLat = Number.NEGATIVE_INFINITY;

    pairs.forEach(([lng, lat]) => {
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    });

    return {
      minLng,
      minLat,
      maxLng,
      maxLat,
    };
  }

  private pointOnSegment(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): boolean {
    const eps = 1e-10;
    const cross = (py - y1) * (x2 - x1) - (px - x1) * (y2 - y1);
    if (Math.abs(cross) > eps) return false;

    const dot = (px - x1) * (px - x2) + (py - y1) * (py - y2);
    return dot <= eps;
  }

  private pointInRing(lng: number, lat: number, ring: number[][]): boolean {
    let inside = false;

    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i]?.[0];
      const yi = ring[i]?.[1];
      const xj = ring[j]?.[0];
      const yj = ring[j]?.[1];

      if (
        typeof xi !== 'number' ||
        typeof yi !== 'number' ||
        typeof xj !== 'number' ||
        typeof yj !== 'number'
      ) {
        continue;
      }

      if (this.pointOnSegment(lng, lat, xi, yi, xj, yj)) {
        return true;
      }

      const intersects =
        yi > lat !== yj > lat &&
        lng < ((xj - xi) * (lat - yi)) / ((yj - yi) || Number.EPSILON) + xi;

      if (intersects) inside = !inside;
    }

    return inside;
  }

  private polygonContainsPoint(geometry: any, lng: number, lat: number): boolean {
    if (!geometry?.type || !geometry?.coordinates) return false;

    if (geometry.type === 'Polygon') {
      const rings: number[][][] = geometry.coordinates;
      if (!rings.length || !this.pointInRing(lng, lat, rings[0])) return false;

      for (let i = 1; i < rings.length; i += 1) {
        if (this.pointInRing(lng, lat, rings[i])) return false;
      }

      return true;
    }

    if (geometry.type === 'MultiPolygon') {
      const polygons: number[][][][] = geometry.coordinates;
      return polygons.some((poly) => this.polygonContainsPoint({ type: 'Polygon', coordinates: poly }, lng, lat));
    }

    return false;
  }

  private bboxContainsPoint(
    bbox: { minLng: number; minLat: number; maxLng: number; maxLat: number } | null,
    lng: number,
    lat: number,
  ): boolean {
    if (!bbox) return false;
    return lng >= bbox.minLng && lng <= bbox.maxLng && lat >= bbox.minLat && lat <= bbox.maxLat;
  }

  private toPlanarKm(lng: number, lat: number, refLat: number): { x: number; y: number } {
    const kmPerDegLat = 111.32;
    const kmPerDegLng = 111.32 * Math.cos((refLat * Math.PI) / 180);
    return {
      x: lng * kmPerDegLng,
      y: lat * kmPerDegLat,
    };
  }

  private pointToSegmentDistanceKm(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): number {
    const refLat = (py + y1 + y2) / 3;
    const p = this.toPlanarKm(px, py, refLat);
    const a = this.toPlanarKm(x1, y1, refLat);
    const b = this.toPlanarKm(x2, y2, refLat);

    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const apx = p.x - a.x;
    const apy = p.y - a.y;
    const ab2 = abx * abx + aby * aby;

    if (ab2 <= Number.EPSILON) {
      return Math.hypot(p.x - a.x, p.y - a.y);
    }

    const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
    const projX = a.x + t * abx;
    const projY = a.y + t * aby;
    return Math.hypot(p.x - projX, p.y - projY);
  }

  private ringDistanceKm(lng: number, lat: number, ring: number[][]): number {
    let best = Number.POSITIVE_INFINITY;
    for (let i = 0; i < ring.length; i += 1) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      if (!a || !b) continue;

      const x1 = a[0];
      const y1 = a[1];
      const x2 = b[0];
      const y2 = b[1];
      if (
        typeof x1 !== 'number' ||
        typeof y1 !== 'number' ||
        typeof x2 !== 'number' ||
        typeof y2 !== 'number'
      ) {
        continue;
      }

      const d = this.pointToSegmentDistanceKm(lng, lat, x1, y1, x2, y2);
      if (d < best) best = d;
    }

    return best;
  }

  private polygonDistanceKm(geometry: any, lng: number, lat: number): number {
    if (!geometry?.type || !geometry?.coordinates) return Number.POSITIVE_INFINITY;
    if (this.polygonContainsPoint(geometry, lng, lat)) return 0;

    if (geometry.type === 'Polygon') {
      const rings: number[][][] = geometry.coordinates;
      let best = Number.POSITIVE_INFINITY;
      rings.forEach((ring) => {
        const d = this.ringDistanceKm(lng, lat, ring);
        if (d < best) best = d;
      });
      return best;
    }

    if (geometry.type === 'MultiPolygon') {
      const polygons: number[][][][] = geometry.coordinates;
      let best = Number.POSITIVE_INFINITY;
      polygons.forEach((poly) => {
        const d = this.polygonDistanceKm({ type: 'Polygon', coordinates: poly }, lng, lat);
        if (d < best) best = d;
      });
      return best;
    }

    return Number.POSITIVE_INFINITY;
  }

  private findPincodeByCoordinates(latitude?: number, longitude?: number): {
    data: any;
    method: 'contains' | 'nearest';
    distanceKm?: number;
  } | null {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    const lng = longitude as number;
    const lat = latitude as number;

    for (const data of this.pincodeData.values()) {
      if (!this.bboxContainsPoint(data.bbox || null, lng, lat)) {
        continue;
      }

      if (this.polygonContainsPoint(data.polygon, lng, lat)) {
        return { data, method: 'contains' };
      }
    }

    let best: { data: any; distanceKm: number } | null = null;
    for (const data of this.pincodeData.values()) {
      const distanceKm = this.polygonDistanceKm(data.polygon, lng, lat);
      if (!Number.isFinite(distanceKm)) continue;

      if (!best || distanceKm < best.distanceKm) {
        best = { data, distanceKm };
      }
    }

    if (!best) return null;

    if (best.distanceKm <= 20) {
      return { data: best.data, method: 'nearest', distanceKm: best.distanceKm };
    }

    return null;
  }

  private resolvePincodeInfo(
    requestedPincode?: string,
    latitude?: number,
    longitude?: number,
  ): {
    info: any | null;
    resolvedPincode?: string;
    message?: string;
  } {
    const normalizedRequested = this.normalizePincode(requestedPincode);
    const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

    // Step 1: If the user explicitly typed a pincode and it exists in our dataset, ALWAYS
    // use it. The user knows their pincode — GPS can be inaccurate at boundaries.
    const exact = normalizedRequested ? this.pincodeData.get(normalizedRequested) : null;
    if (exact) {
      return { info: exact, resolvedPincode: exact.pincode };
    }

    // Step 2: Typed pincode not in dataset — fall back to GPS coordinate lookup
    const byCoordinates = hasCoordinates
      ? this.findPincodeByCoordinates(latitude, longitude)
      : null;

    // Step 3: GPS point-in-polygon hit
    if (byCoordinates?.method === 'contains') {
      const coordPincode = byCoordinates.data.pincode;
      const message = normalizedRequested
        ? `Pincode ${normalizedRequested} not in map data — resolved to ${coordPincode} via GPS location.`
        : undefined;
      return { info: byCoordinates.data, resolvedPincode: coordPincode, message };
    }

    // Step 4: GPS "nearest" fallback (point fell outside all polygons)
    if (byCoordinates?.method === 'nearest' && byCoordinates.distanceKm !== undefined) {
      return {
        info: byCoordinates.data,
        resolvedPincode: byCoordinates.data.pincode,
        message: `Using nearest mapped pincode ${byCoordinates.data.pincode} (~${byCoordinates.distanceKm.toFixed(1)} km) based on GPS.`,
      };
    }

    // Step 5: No GPS — interpolate from geographic neighbours of the typed pincode.
    if (normalizedRequested) {
      const interpolated = this.resolveByInterpolation(normalizedRequested);
      if (interpolated) {
        return {
          info: interpolated,
          resolvedPincode: interpolated.pincode,
          message: `Pincode ${normalizedRequested} not in map data — geographic interpolation used nearest area ${interpolated.pincode}.`,
        };
      }
    }

    // Step 6: nothing worked — return null
    this.logger.warn(
      `resolvePincodeInfo: no polygon resolved for pincode="${normalizedRequested}", coords=${hasCoordinates ? `${latitude},${longitude}` : 'none'}`,
    );
    return { info: null, resolvedPincode: normalizedRequested || undefined };
  }

  /**
   * Find nearby pincode if exact match is not found
   * Searches for pincodes within ±8 range (e.g., 141002 will search 140994-141010)
   */
  private findNearbyPincode(targetPincode: string): any | null {
    const normalizedTarget = this.normalizePincode(targetPincode);
    if (!normalizedTarget) return null;

    // First try exact match
    if (this.pincodeData.has(normalizedTarget)) {
      return this.pincodeData.get(normalizedTarget);
    }

    // Parse the pincode as a number
    const targetNum = parseInt(normalizedTarget, 10);
    if (isNaN(targetNum)) {
      return null;
    }

    // Search for nearby pincodes (within ±8 range)
    const searchRange = 8;
    let closestPincode: { pincode: string; distance: number; data: any } | null = null;

    for (let offset = 1; offset <= searchRange; offset++) {
      // Check lower pincode (e.g., 141001 if searching for 141002)
      const lowerPincode = String(targetNum - offset).padStart(normalizedTarget.length, '0');
      if (this.pincodeData.has(lowerPincode)) {
        if (!closestPincode || offset < closestPincode.distance) {
          closestPincode = {
            pincode: lowerPincode,
            distance: offset,
            data: this.pincodeData.get(lowerPincode),
          };
        }
      }

      // Check higher pincode (e.g., 141003 if searching for 141002)
      const higherPincode = String(targetNum + offset).padStart(normalizedTarget.length, '0');
      if (this.pincodeData.has(higherPincode)) {
        if (!closestPincode || offset < closestPincode.distance) {
          closestPincode = {
            pincode: higherPincode,
            distance: offset,
            data: this.pincodeData.get(higherPincode),
          };
        }
      }

      // If we found a match, return it (prioritize closest)
      if (closestPincode && closestPincode.distance === offset) {
        this.logger.log(
          `Pincode ${normalizedTarget} not found, using nearby ${closestPincode.pincode} (distance: ${closestPincode.distance})`,
        );
        return closestPincode.data;
      }
    }

    return null;
  }

  async updateResponderLocation(
    responderId: string,
    dto: UpdateLocationDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verify responder exists
      const responder = await this.prisma.responder.findUnique({
        where: { id: responderId },
      });

      if (!responder) {
        throw new HttpException('Responder not found', HttpStatus.NOT_FOUND);
      }

      // Update responder's base location
      await this.prisma.responder.update({
        where: { id: responderId },
        data: {
          location_lat: dto.latitude,
          location_lng: dto.longitude,
        },
      });

      // Store location in tracking table
      await this.prisma.responderLocation.create({
        data: {
          responder_id: responderId,
          latitude: dto.latitude,
          longitude: dto.longitude,
          accuracy: dto.accuracy,
          status: dto.status,
          battery_level: dto.battery_level,
        },
      });

      return {
        success: true,
        message: 'Location updated successfully',
      };
    } catch (error) {
      this.logger.error('Error updating location:', error);
      throw new HttpException(
        'Failed to update location',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async submitDisasterReport(
    responderId: string,
    dto: SubmitDisasterReportDto,
  ): Promise<{ success: boolean; report_id: string; message?: string }> {
    try {
      // Get polygon if pincode is provided
      let polygon: any = undefined;
      let pincodeMessage: string | undefined = undefined;

      const resolved = this.resolvePincodeInfo(dto.pincode, dto.latitude, dto.longitude);
      if (resolved.info) {
        polygon = resolved.info.polygon;
        pincodeMessage = resolved.message;
      } else if (dto.pincode) {
        this.logger.warn(`No pincode data found for ${this.normalizePincode(dto.pincode)} or nearby areas`);
      }

      // Create disaster report (auto-approved for demo)
      const report = await this.prisma.disasterReport.create({
        data: {
          responder_id: responderId,
          pincode: resolved.resolvedPincode || this.normalizePincode(dto.pincode) || dto.pincode,
          city: dto.city,
          village: dto.village,
          latitude: dto.latitude,
          longitude: dto.longitude,
          severity: dto.severity,
          water_level: dto.water_level,
          affected_population: dto.affected_population,
          stuck_people_found: dto.stuck_people_found || false,
          resources_needed: dto.resources_needed?.join(', '),
          notes: dto.notes,
          images: dto.images ? JSON.stringify(dto.images) : null,
          polygon: polygon || undefined,
          status: 'approved', // Auto-approve for immediate visibility
          approved_at: new Date(),
        },
      });

      return {
        success: true,
        report_id: report.id,
        ...(pincodeMessage && { message: pincodeMessage }),
      };
    } catch (error) {
      this.logger.error('Error submitting disaster report:', error);
      throw new HttpException(
        'Failed to submit report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getLiveMapData(): Promise<MapDataResponse> {
    try {
      // Get all active responders with their latest location
      const responders = await this.prisma.responder.findMany({
        where: { isActive: true },
        include: {
          ngo: true,
          government: true,
          volunteer: true,
        },
      });

      const liveResponders: LiveResponderData[] = [];

      for (const responder of responders) {
        const latestLocation = await this.prisma.responderLocation.findFirst({
          where: { responder_id: responder.id },
          orderBy: { timestamp: 'desc' },
        });

        if (latestLocation) {
          let responderName = 'Unknown';
          let responderType = 'unknown';

          if (responder.ngo) {
            responderName = responder.ngo.ngo_name;
            responderType = 'ngo';
          } else if (responder.government) {
            responderName = responder.government.agency_name;
            responderType = 'government';
          } else if (responder.volunteer) {
            responderName = responder.volunteer.group_name;
            responderType = 'volunteer';
          }

          liveResponders.push({
            responder_id: responder.id,
            responder_name: responderName,
            responder_type: responderType,
            latitude: latestLocation.latitude,
            longitude: latestLocation.longitude,
            status: latestLocation.status,
            battery_level: latestLocation.battery_level ?? undefined,
            last_updated: latestLocation.timestamp.toISOString(),
          });
        }
      }

      // Get all approved disaster reports
      const reports = await this.prisma.disasterReport.findMany({
        where: { status: 'approved' },
        orderBy: { createdAt: 'desc' },
      });

      const disasterAreas: DisasterAreaData[] = reports.map((report) => ({
        report_id: report.id,
        pincode: report.pincode ?? undefined,
        city: report.city ?? undefined,
        severity: report.severity,
        affected_population: report.affected_population ?? undefined,
        polygon: report.polygon,
        status: report.status,
        submitted_by: report.responder_id || 'Unknown',
        timestamp: report.createdAt.toISOString(),
      }));

      // Get all active group locations
      const groupLocations = await this.prisma.groupLocation.findMany({
        include: {
          group: {
            include: {
              ngo: { select: { ngo_name: true } },
              government: { select: { agency_name: true } },
              volunteer: { select: { group_name: true } },
              resourceAllocations: { include: { inventoryItem: { select: { item: true } } } },
              assignments: {
                where: { status: 'active' },
                orderBy: { assigned_at: 'desc' },
                take: 1,
              },
            },
          },
        },
      });

      const liveGroupLocations: GroupLocationData[] = groupLocations
        .filter((loc) => loc.group.is_active)
        .map((loc) => {
          const g = loc.group;
          const orgName =
            g.ngo?.ngo_name || g.government?.agency_name || g.volunteer?.group_name || 'Unknown';
          const activeAssignment = g.assignments[0] || null;
          return {
            group_id: g.id,
            group_name: g.group_name,
            org_name: orgName,
            creator_type: g.creator_type,
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy,
            status: loc.status,
            battery_level: loc.battery_level,
            last_updated: loc.timestamp.toISOString(),
            resources: g.resourceAllocations.map((r) => r.inventoryItem.item),
            active_assignment: activeAssignment
              ? {
                assignment_id: activeAssignment.id,
                disaster_report_id: activeAssignment.disaster_report_id,
                assigned_at: activeAssignment.assigned_at.toISOString(),
              }
              : null,
          };
        });

      return {
        success: true,
        responders: liveResponders,
        disaster_areas: disasterAreas,
        group_locations: liveGroupLocations,
      };
    } catch (error) {
      this.logger.error('Error fetching live map data:', error);
      throw new HttpException(
        'Failed to fetch map data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getPendingReports() {
    try {
      const reports = await this.prisma.disasterReport.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        reports,
      };
    } catch (error) {
      this.logger.error('Error fetching pending reports:', error);
      throw new HttpException(
        'Failed to fetch pending reports',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async approveOrRejectReport(
    reportId: string,
    adminId: string,
    dto: ApproveReportDto,
  ) {
    try {
      const report = await this.prisma.disasterReport.update({
        where: { id: reportId },
        data: {
          status: dto.status,
          approved_by: adminId,
          approved_at: new Date(),
        },
      });

      return {
        success: true,
        message: `Report ${dto.status}`,
        report,
      };
    } catch (error) {
      this.logger.error('Error approving/rejecting report:', error);
      throw new HttpException(
        'Failed to update report status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async submitUserSOS(userId: string, data: { latitude?: number; longitude?: number; notes?: string }) {
    try {
      // Get user info for location fallback
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Use provided location or fall back to user's home location or address
      const latitude = data.latitude || user.home_location_lat || null;
      const longitude = data.longitude || user.home_location_lng || null;

      // Create SOS incident report
      const report = await this.prisma.disasterReport.create({
        data: {
          user_id: userId,
          is_sos: true,
          severity: 'SEVERE', // SOS is always severe
          pincode: user.pincode,
          city: user.city,
          latitude,
          longitude,
          stuck_people_found: true, // Assume person needs help
          affected_population: 1,
          notes: data.notes || 'Emergency SOS - Immediate assistance needed',
          status: 'pending',
        },
      });

      this.logger.log(`SOS report created by user ${userId}: ${report.id}`);

      return {
        success: true,
        message: 'SOS alert sent successfully. Help is on the way!',
        report,
      };
    } catch (error) {
      this.logger.error('Error submitting user SOS:', error);
      throw new HttpException(
        'Failed to submit SOS alert',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async submitUserIncidentReport(userId: string, dto: any) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Resolve pincode: typed/stored pincode takes priority if it exists in dataset.
      // GPS is only used as fallback when the typed pincode isn't in our map data.
      let polygonData: any = null;
      const requestedPincode = this.normalizePincode(dto.pincode) || this.normalizePincode(user.pincode);
      const resolved = this.resolvePincodeInfo(requestedPincode, dto.latitude, dto.longitude);
      const effectivePincode = resolved.resolvedPincode || requestedPincode;
      if (resolved.info) {
        polygonData = resolved.info.polygon;
      }

      const report = await this.prisma.disasterReport.create({
        data: {
          user_id: userId,
          is_sos: false,
          pincode: effectivePincode || dto.pincode || user.pincode,
          city: dto.city || user.city,
          village: dto.village,
          latitude: dto.latitude,
          longitude: dto.longitude,
          severity: dto.severity || 'MODERATE',
          water_level: dto.water_level,
          affected_population: dto.affected_population || 0,
          stuck_people_found: dto.stuck_people_found || false,
          resources_needed: dto.resources_needed?.join(','),
          notes: dto.notes,
          images: dto.images ? JSON.stringify(dto.images) : null,
          polygon: polygonData || undefined,
          status: 'pending',
        },
      });

      this.logger.log(`User incident report created by ${userId}: ${report.id}`);

      return {
        success: true,
        message: 'Incident reported successfully',
        report,
      };
    } catch (error) {
      this.logger.error('Error submitting user incident report:', error);
      throw new HttpException(
        'Failed to submit incident report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserReports(userId: string) {
    try {
      // Get all reports (incidents + SOS) for the user
      const reports = await this.prisma.disasterReport.findMany({
        where: { user_id: userId },
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        incidents: reports, // Frontend expects "incidents" field
        total: reports.length,
      };
    } catch (error) {
      this.logger.error('Error fetching user reports:', error);
      throw new HttpException(
        'Failed to fetch your reports',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllIncidentsWithGroups() {
    try {
      // Get all incidents (both user and responder submitted)
      const incidents = await this.prisma.disasterReport.findMany({
        where: {
          status: {
            in: ['pending', 'approved'],
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Get active groups working on incidents
      const groups = await this.prisma.group.findMany({
        where: { is_active: true },
        include: {
          ngo: true,
          government: true,
          volunteer: true,
        },
      });

      // Group incidents by city and pincode
      const groupedIncidents = incidents.reduce((acc, incident) => {
        const city = incident.city || 'Unknown';
        const pincode = incident.pincode || 'N/A';
        const key = `${city}-${pincode}`;

        if (!acc[key]) {
          acc[key] = {
            city,
            pincode,
            incidents: [],
            activeGroups: [],
          };
        }

        acc[key].incidents.push(incident);

        // Note: Groups don't have location fields in schema
        // For now, show all active groups for each area
        // TODO: Add location tracking to Group model if needed
        acc[key].activeGroups = groups;

        return acc;
      }, {});

      return {
        success: true,
        total: incidents.length,
        groupedIncidents: Object.values(groupedIncidents),
        allGroups: groups,
      };
    } catch (error) {
      this.logger.error('Error fetching all incidents:', error);
      throw new HttpException(
        'Failed to fetch incidents',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
