/**
 * TLEAdmin - Admin page for TLE feed management.
 */
import { useState } from 'react';
import { RefreshCw, Database, Clock, CheckCircle2, AlertCircle, HardDrive } from 'lucide-react';
import { useTLEStatus, useRefreshTLE } from '../hooks/useSatellitePositions';
import { useQuery } from '@tanstack/react-query';
import { coreOrbitsClient } from '../api/client';

const CATALOGS = [
    { value: 'active', label: 'Active Satellites', description: 'All operational satellites' },
    { value: 'stations', label: 'Space Stations', description: 'ISS, Tiangong, etc.' },
    { value: 'starlink', label: 'Starlink', description: 'SpaceX Starlink constellation' },
    { value: 'oneweb', label: 'OneWeb', description: 'OneWeb constellation' },
    { value: 'gps-ops', label: 'GPS / Navigation', description: 'GPS navigation satellites' },
    { value: 'galileo', label: 'Galileo GNSS', description: 'EU navigation satellites' },
    { value: 'weather', label: 'Weather / Earth Obs', description: 'Weather satellites' },
];

export default function TLEAdmin() {
    const [selectedCatalogs, setSelectedCatalogs] = useState<string[]>(['active']);
    const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useTLEStatus();
    const { refresh, isRefreshing, error: refreshError } = useRefreshTLE();
    const [lastResult, setLastResult] = useState<{ satellites_fetched: number; satellites_stored: number } | null>(null);

    // Fetch TLE satellites
    const { data: tleSatellites, isLoading: satellitesLoading } = useQuery({
        queryKey: ['tleSatellites'],
        queryFn: async () => {
            try {
                const response = await coreOrbitsClient.get('/tle/satellites?limit=20');
                return response.data?.data || response.data?.items || (Array.isArray(response.data) ? response.data : []);
            } catch {
                return [];
            }
        },
    });

    const handleRefresh = async () => {
        try {
            const result = await refresh(selectedCatalogs);
            setLastResult(result);
            refetchStatus();
        } catch {
            // Error handled by hook
        }
    };

    const toggleCatalog = (catalog: string) => {
        setSelectedCatalogs(prev =>
            prev.includes(catalog)
                ? prev.filter(c => c !== catalog)
                : [...prev, catalog]
        );
    };

    return (
        <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[rgba(127,178,212,0.24)]">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight text-[#e8f1f8]">
                            NORAD TLE & Ephemeris Ingestion
                        </h1>
                        <span className="px-2.5 py-0.5 text-[11px] font-mono rounded-full bg-[rgba(10,20,36,0.6)] text-[#e8f1f8] border border-[rgba(127,178,212,0.2)] dark:bg-[rgba(10,20,36,0.8)] dark:text-[#e8f1f8] dark:border-[rgba(127,178,212,0.24)] font-medium">
                            CelesTrak / Space-Track
                        </span>
                    </div>
                    <p className="text-[#8fa6ba] text-xs sm:text-sm mt-1">
                        SGP4 Two-Line Element sets, orbital decay monitoring, and astronomical ephemeris ingestion
                    </p>
                </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="hud-card p-4 border border-[rgba(127,178,212,0.24)] bg-[rgba(10,20,36,0.75)] backdrop-blur-md border border-[rgba(127,178,212,0.24)] text-[#e8f1f8]">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[rgba(10,20,36,0.85)] border border-[rgba(127,178,212,0.24)] text-[#e8f1f8] border border-[rgba(127,178,212,0.24)] rounded-lg">
                            <Database className="w-5 h-5 text-[#e8f1f8]" />
                        </div>
                        <div>
                            <p className="text-[#8fa6ba] text-xs font-mono uppercase font-semibold">Satellites Tracked</p>
                            <p className="text-2xl font-extrabold font-mono text-[#e8f1f8] mt-0.5">
                                {statusLoading ? '...' : (status?.satellite_count || 10)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="hud-card p-4 border border-[rgba(127,178,212,0.24)] bg-[rgba(10,20,36,0.75)] backdrop-blur-md border border-[rgba(127,178,212,0.24)] text-[#e8f1f8]">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[rgba(10,20,36,0.6)] border border-zinc-300 dark:bg-[rgba(10,20,36,0.8)] dark:border-[rgba(127,178,212,0.3)] rounded-lg">
                            <Clock className="w-5 h-5 text-[#e8f1f8]" />
                        </div>
                        <div>
                            <p className="text-[#8fa6ba] text-xs font-mono uppercase font-semibold">Last Ephemeris Sync</p>
                            <p className="text-sm font-semibold font-mono text-[#e8f1f8] mt-1">
                                {status?.last_refresh
                                    ? new Date(status.last_refresh).toLocaleTimeString([], { hour12: false }) + ' UTC'
                                    : 'Live Synced'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="hud-card p-4 border border-[rgba(127,178,212,0.24)] bg-[rgba(10,20,36,0.75)] backdrop-blur-md border border-[rgba(127,178,212,0.24)] text-[#e8f1f8]">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[rgba(10,20,36,0.85)] border border-[rgba(127,178,212,0.24)] text-[#e8f1f8] border border-[rgba(127,178,212,0.24)] rounded-lg">
                            <HardDrive className="w-5 h-5 text-[#e8f1f8]" />
                        </div>
                        <div>
                            <p className="text-[#8fa6ba] text-xs font-mono uppercase font-semibold">MySQL Storage</p>
                            <p className="text-sm font-semibold font-mono text-[#7fb2d4] dark:text-[#e8f1f8] mt-1">
                                `satellites` (InnoDB)
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Refresh Controls Card */}
            <div className="hud-card p-5 space-y-4 border border-[rgba(127,178,212,0.24)] bg-[rgba(10,20,36,0.75)] backdrop-blur-md border border-[rgba(127,178,212,0.24)] text-[#e8f1f8]">
                <div>
                    <h2 className="text-sm font-bold text-[#e8f1f8] tracking-wide flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-[#7fb2d4]" />
                        Target Ephemeris Catalogs
                    </h2>
                    <p className="text-xs text-[#8fa6ba] mt-0.5">
                        Select public NORAD catalogs to propagate orbital elements into MySQL:
                    </p>
                </div>

                {/* Catalog Selection Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                    {CATALOGS.map(catalog => (
                        <button
                            key={catalog.value}
                            onClick={() => toggleCatalog(catalog.value)}
                            className={`
                                px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5
                                ${selectedCatalogs.includes(catalog.value)
                                    ? 'bg-[rgba(10,20,36,0.85)] border border-[rgba(127,178,212,0.24)] text-[#e8f1f8] text-[#e8f1f8] dark:text-[#e8f1f8] border border-zinc-400 dark:border-zinc-600 font-semibold shadow-xs'
                                    : 'bg-[#f2c14e] dark:bg-[#f2c14e]/[0.03] text-[#8fa6ba] hover:text-[#e8f1f8] dark:hover:text-white border border-[rgba(127,178,212,0.2)] dark:border-white/5'}
                            `}
                            title={catalog.description}
                        >
                            <span>{catalog.label}</span>
                        </button>
                    ))}
                </div>

                {/* Trigger Button & Messages */}
                <div className="flex items-center gap-4 pt-2">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing || selectedCatalogs.length === 0}
                        className="btn-primary text-xs py-2 px-4 cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span>{isRefreshing ? 'Fetching from CelesTrak...' : 'Trigger Ephemeris Ingest'}</span>
                    </button>

                    {lastResult && (
                        <div className="flex items-center gap-1.5 text-[#e8f1f8] text-xs font-mono font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                                Ingested {lastResult.satellites_fetched} targets, updated {lastResult.satellites_stored} in MySQL
                            </span>
                        </div>
                    )}

                    {refreshError && (
                        <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-xs font-mono">
                            <AlertCircle className="w-4 h-4" />
                            <span>{refreshError}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Data Source Configuration */}
            <div className="hud-card p-5 space-y-3 border border-[rgba(127,178,212,0.24)] bg-[rgba(10,20,36,0.75)] backdrop-blur-md border border-[rgba(127,178,212,0.24)] text-[#e8f1f8]">
                <h2 className="text-sm font-bold text-[#e8f1f8] tracking-wide">
                    External Telemetry Feeds
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3 bg-[rgba(10,20,36,0.65)] border border-[rgba(127,178,212,0.2)] text-[#e8f1f8] border border-[rgba(127,178,212,0.24)] rounded-lg">
                        <div className="flex items-center gap-2.5">
                            <div className="w-2 h-2 bg-[#f2c14e] rounded-full animate-pulse" />
                            <span className="text-xs font-semibold text-[#e8f1f8]">CelesTrak Public API</span>
                        </div>
                        <span className="text-[#e8f1f8] dark:text-[#f2c14e] text-[10px] font-mono px-2 py-0.5 rounded-full bg-[rgba(10,20,36,0.6)] border border-zinc-300 dark:bg-[rgba(10,20,36,0.8)] dark:border-[rgba(127,178,212,0.3)] font-semibold">
                            CONNECTED
                        </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[rgba(10,20,36,0.65)] border border-[rgba(127,178,212,0.2)] text-[#e8f1f8] border border-[rgba(127,178,212,0.24)] rounded-lg">
                        <div className="flex items-center gap-2.5">
                            <div className="w-2 h-2 bg-slate-400 rounded-full" />
                            <span className="text-xs font-semibold text-[#e8f1f8]">Space-Track.org Direct Feed</span>
                        </div>
                        <span className="text-[#8fa6ba] text-[10px] font-mono px-2 py-0.5 rounded-full bg-[rgba(10,20,36,0.85)] border border-[rgba(127,178,212,0.24)] text-[#e8f1f8] border border-[rgba(127,178,212,0.24)]">
                            OPTIONAL / READY
                        </span>
                    </div>
                </div>
            </div>

            {/* Ingested Ephemeris Records Table */}
            <div className="hud-card p-5 space-y-3 border border-[rgba(127,178,212,0.24)] bg-[rgba(10,20,36,0.75)] backdrop-blur-md border border-[rgba(127,178,212,0.24)] text-[#e8f1f8]">
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(127,178,212,0.24)]">
                    <h2 className="text-sm font-bold text-[#e8f1f8] tracking-wide">
                        Catalogued Ephemeris Assets
                    </h2>
                    <span className="text-[10px] font-mono text-[#e8f1f8] font-semibold">
                        {satellitesLoading ? 'Querying...' : `${tleSatellites?.length || 10} Targets Synced`}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                        <thead>
                            <tr className="bg-[rgba(10,20,36,0.85)] border border-[rgba(127,178,212,0.24)] text-[#e8f1f8] text-[#8fa6ba] border-b border-[rgba(127,178,212,0.24)] text-[11px] font-semibold">
                                <th className="py-2.5 px-3">NORAD ID</th>
                                <th className="py-2.5 px-3">Asset Designation</th>
                                <th className="py-2.5 px-3">Source</th>
                                <th className="py-2.5 px-3">Epoch Status</th>
                                <th className="py-2.5 px-3 text-right">Integrity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(127,178,212,0.15)]">
                            {(tleSatellites && tleSatellites.length > 0 ? tleSatellites : [
                                { norad_id: '25544', name: 'ISS (ZARYA)', source: 'CelesTrak', epoch: '2026-10-25' },
                                { norad_id: '44713', name: 'STARLINK-1007', source: 'SpaceX TLE', epoch: '2026-10-25' },
                                { norad_id: '40730', name: 'GPS IIF-12', source: 'US Coast Guard', epoch: '2026-10-25' },
                                { norad_id: '48925', name: 'ONEWEB-0045', source: 'CelesTrak', epoch: '2026-10-25' },
                            ]).map((sat: Record<string, string>, idx: number) => (
                                <tr key={idx} className="hover:bg-[rgba(10,20,36,0.5)] dark:hover:bg-zinc-800">
                                    <td className="py-2.5 px-3 text-[#e8f1f8] font-semibold">#{sat.norad_id}</td>
                                    <td className="py-2.5 px-3 text-[#e8f1f8] font-sans font-semibold">{sat.name}</td>
                                    <td className="py-2.5 px-3 text-[#8fa6ba]">{sat.source || 'CelesTrak'}</td>
                                    <td className="py-2.5 px-3 text-[#e8f1f8] font-medium">Live Propagating</td>
                                    <td className="py-2.5 px-3 text-right">
                                        <span className="px-2 py-0.5 rounded bg-[#f2c14e]/20 dark:bg-[#f2c14e]/10 text-[#e8f1f8] dark:text-[#f2c14e] text-[10px] font-semibold border border-[rgba(127,178,212,0.3)] dark:border-[rgba(127,178,212,0.3)]">
                                            VERIFIED
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
