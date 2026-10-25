/**
 * useSatellitePositions - Hook for fetching and updating satellite positions from MySQL backend.
 */
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { coreOrbitsClient } from '../api/client';

export interface SatellitePosition {
    id: number;
    name: string;
    norad_id?: string;
    latitude: number;
    longitude: number;
    altitude_km: number;
    velocity_kms?: number;
    inclination?: number;
    status?: 'active' | 'standby' | 'degraded';
    solar_power_w?: number;
    battery_pct?: number;
}

export interface GroundStation {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    elevation_m?: number;
    status?: 'online' | 'busy' | 'offline';
    capabilities?: string[];
}

export interface PassRecord {
    id: number;
    satellite_id: number;
    satellite_name?: string;
    station_id: number;
    station_name: string;
    aos: string;
    los: string;
    max_elevation_deg: number;
    duration_seconds: number;
    is_scheduled: boolean;
    priority: string;
}

interface UseSatellitePositionsOptions {
    constellationId?: number;
    pollInterval?: number; // milliseconds
    enabled?: boolean;
}

// Fallback seed positions if API is unreachable
const fallbackSatellites: SatellitePosition[] = [
    { id: 1, name: 'ISS (ZARYA)', norad_id: '25544', latitude: 45.2, longitude: -86.5, altitude_km: 420, inclination: 51.6, velocity_kms: 7.69, status: 'active', solar_power_w: 120000, battery_pct: 95 },
    { id: 2, name: 'STARLINK-1007', norad_id: '44713', latitude: -25.8, longitude: 122.6, altitude_km: 550, inclination: 53.0, velocity_kms: 7.59, status: 'active', solar_power_w: 3200, battery_pct: 98 },
    { id: 3, name: 'STARLINK-1008', norad_id: '44714', latitude: -25.9, longitude: 123.7, altitude_km: 550, inclination: 53.0, velocity_kms: 7.59, status: 'active', solar_power_w: 3200, battery_pct: 97 },
    { id: 4, name: 'STARLINK-1009', norad_id: '44715', latitude: -26.0, longitude: 124.8, altitude_km: 550, inclination: 53.0, velocity_kms: 7.59, status: 'active', solar_power_w: 3100, battery_pct: 96 },
    { id: 5, name: 'GPS IIF-12', norad_id: '40730', latitude: 4.3, longitude: 168.1, altitude_km: 20180, inclination: 55.0, velocity_kms: 3.88, status: 'active', solar_power_w: 2900, battery_pct: 100 },
    { id: 6, name: 'ONEWEB-0045', norad_id: '48925', latitude: -38.3, longitude: -175.5, altitude_km: 1235, inclination: 87.4, velocity_kms: 7.24, status: 'active', solar_power_w: 2400, battery_pct: 94 },
    { id: 7, name: 'PLANET DOVE-123', norad_id: '49123', latitude: -68.2, longitude: 135.2, altitude_km: 504, inclination: 97.5, velocity_kms: 7.60, status: 'active', solar_power_w: 450, battery_pct: 91 },
    { id: 8, name: 'SPIRE LEMUR-89', norad_id: '49189', latitude: 49.5, longitude: 45.1, altitude_km: 511, inclination: 85.0, velocity_kms: 7.61, status: 'active', solar_power_w: 350, battery_pct: 88 },
];

export function useSatellitePositions(options: UseSatellitePositionsOptions = {}) {
    const {
        constellationId,
        pollInterval = 8000,
        enabled = true,
    } = options;

    const [positions, setPositions] = useState<SatellitePosition[]>(fallbackSatellites);

    // Fetch satellite list from Core Orbits
    const { data: rawSatellites, isLoading, error } = useQuery({
        queryKey: ['satellites', constellationId],
        queryFn: async () => {
            const url = constellationId
                ? `/satellites?constellation_id=${constellationId}`
                : '/satellites';
            const response = await coreOrbitsClient.get(url);
            const data = response.data;
            if (Array.isArray(data)) return data;
            if (data?.data && Array.isArray(data.data)) return data.data;
            if (data?.items && Array.isArray(data.items)) return data.items;
            return [];
        },
        enabled,
        refetchInterval: pollInterval * 2,
    });

    // Update positions via individual position endpoints or orbit simulation
    useEffect(() => {
        let isMounted = true;

        async function updatePositions() {
            if (!rawSatellites || !Array.isArray(rawSatellites) || rawSatellites.length === 0) {
                return;
            }

            try {
                // Fetch live SGP4 positions concurrently
                const positionPromises = rawSatellites.map(async (sat: Record<string, unknown>) => {
                    const satId = sat.id as number;
                    let incl = 51.6;
                    if (sat.tle_data && typeof sat.tle_data === 'object') {
                        const line2 = (sat.tle_data as Record<string, string>).line2;
                        if (line2 && line2.length > 16) {
                            const parsed = parseFloat(line2.slice(8, 16));
                            if (!isNaN(parsed)) incl = parsed;
                        }
                    }

                    try {
                        const posRes = await coreOrbitsClient.get(`/satellites/${satId}/position`);
                        const pos = posRes.data;
                        return {
                            id: satId,
                            name: (sat.name as string) || `SAT-${satId}`,
                            norad_id: sat.norad_id as string | undefined,
                            latitude: pos.latitude,
                            longitude: pos.longitude,
                            altitude_km: Math.round(pos.altitude_km || 550),
                            velocity_kms: pos.velocity?.speed_kms ? parseFloat(pos.velocity.speed_kms.toFixed(2)) : 7.6,
                            inclination: incl,
                            status: (sat.health_status as 'active' | 'standby' | 'degraded') || 'active',
                            solar_power_w: Math.round(2500 + Math.random() * 500),
                            battery_pct: Math.round(92 + Math.random() * 7),
                        } as SatellitePosition;
                    } catch {
                        // Fallback position calculation from ID
                        const angle = (Date.now() / 15000 + satId * 0.7) % (Math.PI * 2);
                        return {
                            id: satId,
                            name: (sat.name as string) || `SAT-${satId}`,
                            norad_id: sat.norad_id as string | undefined,
                            latitude: Math.sin(angle) * incl * 0.9,
                            longitude: ((angle * 180) / Math.PI + satId * 40) % 360 - 180,
                            altitude_km: 550,
                            velocity_kms: 7.6,
                            inclination: incl,
                            status: 'active',
                            solar_power_w: 3000,
                            battery_pct: 95,
                        } as SatellitePosition;
                    }
                });

                const updated = await Promise.all(positionPromises);
                if (isMounted && updated.length > 0) {
                    setPositions(updated);
                }
            } catch (err) {
                console.warn('Error updating satellite positions:', err);
            }
        }

        updatePositions();
        const timer = setInterval(updatePositions, pollInterval);
        return () => {
            isMounted = false;
            clearInterval(timer);
        };
    }, [rawSatellites, pollInterval]);

    return {
        positions,
        isLoading,
        error,
        satellites: rawSatellites || [],
    };
}

/**
 * useGroundStations - Hook for fetching ground stations from MySQL backend.
 */
export function useGroundStations(options: { enabled?: boolean } = {}) {
    const { enabled = true } = options;

    return useQuery<GroundStation[]>({
        queryKey: ['groundStations'],
        queryFn: async () => {
            const baseUrl = import.meta.env.VITE_GROUND_SCHEDULER_URL || 'http://localhost:8003';
            try {
                const response = await fetch(`${baseUrl}/ground-stations`);
                if (!response.ok) throw new Error('Failed to fetch ground stations');
                const data = await response.json();
                const list = data.data || data.items || (Array.isArray(data) ? data : []);
                return list.map((item: Record<string, unknown>) => ({
                    id: item.id as number,
                    name: item.name as string,
                    latitude: item.latitude as number,
                    longitude: item.longitude as number,
                    elevation_m: (item.elevation_m as number) || 15,
                    status: (item.status as 'online' | 'busy' | 'offline') || 'online',
                    capabilities: (item.capabilities as string[]) || ['S-band', 'X-band'],
                }));
            } catch {
                return [
                    { id: 1, name: 'AWS Ground Station - US West', latitude: 45.8, longitude: -119.7, elevation_m: 190, status: 'online' },
                    { id: 2, name: 'ESA Ground Station - Europe', latitude: 50.8, longitude: 4.3, elevation_m: 100, status: 'online' },
                    { id: 3, name: 'JAXA Ground Station - Asia', latitude: 35.6, longitude: 139.7, elevation_m: 40, status: 'online' },
                    { id: 4, name: 'Svalbard (SvalSat) - Norway', latitude: 78.2, longitude: 15.4, elevation_m: 490, status: 'online' },
                    { id: 5, name: 'Wallops Island - NASA US', latitude: 37.9, longitude: -75.4, elevation_m: 5, status: 'online' },
                    { id: 6, name: 'Canberra DSN - Australia', latitude: -35.4, longitude: 148.9, elevation_m: 650, status: 'online' },
                ];
            }
        },
        enabled,
        staleTime: 60000,
    });
}

/**
 * usePasses - Hook for fetching contact passes from MySQL backend.
 */
export function usePasses(options: { enabled?: boolean } = {}) {
    const { enabled = true } = options;

    return useQuery<PassRecord[]>({
        queryKey: ['passes'],
        queryFn: async () => {
            const baseUrl = import.meta.env.VITE_GROUND_SCHEDULER_URL || 'http://localhost:8003';
            try {
                const response = await fetch(`${baseUrl}/passes`);
                if (!response.ok) throw new Error('Failed to fetch passes');
                const data = await response.json();
                const list = data.data || data.items || (Array.isArray(data) ? data : []);
                return list.map((item: Record<string, unknown>) => ({
                    id: item.id as number,
                    satellite_id: item.satellite_id as number,
                    satellite_name: (item.satellite_name as string) || `SAT-${item.satellite_id}`,
                    station_id: item.station_id as number,
                    station_name: (item.station_name as string) || `GS-${item.station_id}`,
                    aos: item.aos as string,
                    los: item.los as string,
                    max_elevation_deg: (item.max_elevation_deg as number) || 45,
                    duration_seconds: (item.duration_seconds as number) || 480,
                    is_scheduled: Boolean(item.is_scheduled),
                    priority: (item.priority as string) || 'medium',
                }));
            } catch {
                return [];
            }
        },
        enabled,
        staleTime: 30000,
    });
}

/**
 * useTLEStatus - Hook for TLE feed status.
 */
export function useTLEStatus() {
    return useQuery({
        queryKey: ['tleStatus'],
        queryFn: async () => {
            const response = await coreOrbitsClient.get('/tle/status');
            return response.data;
        },
        staleTime: 30000,
    });
}

/**
 * useRefreshTLE - Mutation hook for triggering TLE refresh.
 */
export function useRefreshTLE() {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async (catalogs?: string[]) => {
        setIsRefreshing(true);
        setError(null);

        try {
            const response = await coreOrbitsClient.post('/tle/refresh', {
                catalogs: catalogs || ['active'],
            });
            return response.data;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Refresh failed';
            setError(message);
            throw err;
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    return { refresh, isRefreshing, error };
}
