import { useState } from 'react';
import {
    Satellite,
    Plus,
    Search,
    RefreshCw,
    X
} from 'lucide-react';
import { useSatellitePositions, SatellitePosition } from '../hooks/useSatellitePositions';

export default function Satellites() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRegime, setFilterRegime] = useState<'all' | 'leo' | 'meo' | 'polar'>('all');
    const [selectedSatellite, setSelectedSatellite] = useState<SatellitePosition | null>(null);
    const { positions: satellites, isLoading } = useSatellitePositions();

    const filteredSatellites = satellites.filter(sat => {
        const matchesQuery = sat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (sat.norad_id && sat.norad_id.includes(searchQuery));
        if (!matchesQuery) return false;

        if (filterRegime === 'meo') return sat.altitude_km > 5000;
        if (filterRegime === 'polar') return (sat.inclination || 0) > 80;
        if (filterRegime === 'leo') return sat.altitude_km <= 5000 && (sat.inclination || 0) <= 80;
        return true;
    });

    return (
        <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[rgba(127,178,212,0.24)]">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight text-[#e8f1f8]">
                            Orbital Asset Fleet Registry
                        </h1>
                        <span className="px-2.5 py-0.5 text-[11px] font-mono rounded-full bg-[rgba(10,20,36,0.6)] text-[#e8f1f8] border border-[rgba(127,178,212,0.2)] dark:bg-[rgba(10,20,36,0.8)] dark:text-[#e8f1f8] dark:border-[rgba(127,178,212,0.24)] font-medium">
                            MySQL 8.0 Synchronized
                        </span>
                    </div>
                    <p className="text-[#8fa6ba] text-xs sm:text-sm mt-1">
                        SGP4 Two-Line Element (TLE) tracking, Keplerian orbital dynamics, and health telemetry
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button className="btn-secondary text-xs flex items-center gap-1.5 cursor-pointer">
                        <RefreshCw className="w-3.5 h-3.5 text-[#7fb2d4]" />
                        <span>Sync Ephemeris</span>
                    </button>
                    <button className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Deploy Satellite</span>
                    </button>
                </div>
            </div>

            {/* Quick Filter & Search Bar */}
            <div className="hud-card p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-[rgba(127,178,212,0.24)] bg-[rgba(10,20,36,0.75)] backdrop-blur-md border border-[rgba(127,178,212,0.24)] text-[#e8f1f8]">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8fa6ba]" />
                        <input
                            type="text"
                            placeholder="Search by satellite name or NORAD ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input w-full pl-9 py-2 text-xs"
                        />
                    </div>
                </div>

                {/* Regime Filter Chips */}
                <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    {[
                        { key: 'all', label: 'All Orbits', count: satellites.length },
                        { key: 'leo', label: 'LEO (< 2,000km)', count: satellites.filter(s => s.altitude_km <= 5000 && (s.inclination || 0) <= 80).length },
                        { key: 'meo', label: 'MEO (GPS/Nav)', count: satellites.filter(s => s.altitude_km > 5000).length },
                        { key: 'polar', label: 'Polar (> 80°)', count: satellites.filter(s => (s.inclination || 0) > 80).length },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilterRegime(tab.key as typeof filterRegime)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                                filterRegime === tab.key
                                    ? 'bg-[rgba(10,20,36,0.85)] border border-[rgba(127,178,212,0.24)] text-[#e8f1f8] text-[#e8f1f8] dark:text-[#e8f1f8] border border-zinc-400 dark:border-zinc-600 font-semibold shadow-xs'
                                    : 'bg-[#f2c14e] dark:bg-[#f2c14e]/[0.03] text-[#8fa6ba] hover:text-[#e8f1f8] dark:hover:text-white border border-[rgba(127,178,212,0.2)] dark:border-white/5'
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 dark:bg-black/40 text-[#7fb2d4] dark:text-[#e8f1f8] font-semibold">
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Satellites Table */}
            <div className="hud-card p-0 overflow-hidden border border-[rgba(127,178,212,0.24)] bg-[rgba(10,20,36,0.75)] backdrop-blur-md border border-[rgba(127,178,212,0.24)] text-[#e8f1f8]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-[rgba(10,20,36,0.85)] border border-[rgba(127,178,212,0.24)] text-[#e8f1f8] border-b border-[rgba(127,178,212,0.24)] text-[#8fa6ba] font-mono text-[11px] uppercase tracking-wider font-semibold">
                                <th className="py-3.5 px-4">Satellite Asset</th>
                                <th className="py-3.5 px-4">NORAD ID</th>
                                <th className="py-3.5 px-4">Orbit Regime</th>
                                <th className="py-3.5 px-4">Altitude (km)</th>
                                <th className="py-3.5 px-4">Velocity (km/s)</th>
                                <th className="py-3.5 px-4">Inclination</th>
                                <th className="py-3.5 px-4">Power / Battery</th>
                                <th className="py-3.5 px-4">Health Status</th>
                                <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(127,178,212,0.15)]">
                            {isLoading && satellites.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-12 text-[#8fa6ba] font-mono">
                                        <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-[#7fb2d4]" />
                                        Propagating orbits from MySQL database...
                                    </td>
                                </tr>
                            ) : filteredSatellites.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-12 text-[#8fa6ba] font-mono">
                                        No satellites match the selected filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredSatellites.map((sat) => (
                                    <tr key={sat.id} className="table-row group">
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[rgba(10,20,36,0.85)] border border-[rgba(127,178,212,0.24)] text-[#e8f1f8] border border-[rgba(127,178,212,0.24)] flex items-center justify-center group-hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
                                                    <Satellite className="w-4 h-4 text-[#e8f1f8]" />
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-[#e8f1f8] block group-hover:text-black dark:group-hover:text-white transition-colors">
                                                        {sat.name}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-[#8fa6ba]">
                                                        Asset #{sat.id} · Bus Rev 3.2
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-3.5 px-4 font-mono text-[#e8f1f8] font-medium">
                                            <span className="px-2 py-0.5 rounded bg-[rgba(10,20,36,0.5)] dark:bg-[#f2c14e]/[0.04] border border-[rgba(127,178,212,0.2)] dark:border-white/10">
                                                {sat.norad_id || '25544'}
                                            </span>
                                        </td>

                                        <td className="py-3.5 px-4">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-[rgba(10,20,36,0.6)] text-[#7fb2d4] border border-[rgba(127,178,212,0.2)] dark:bg-[rgba(10,20,36,0.8)] dark:text-[#e8f1f8] dark:border-zinc-400 dark:border-zinc-600/30">
                                                {sat.altitude_km > 5000 ? 'MEO Orbit' : (sat.inclination || 0) > 80 ? 'Polar SSO' : 'LEO Equatorial'}
                                            </span>
                                        </td>

                                        <td className="py-3.5 px-4 font-mono font-semibold text-[#e8f1f8]">
                                            {sat.altitude_km.toLocaleString()} km
                                        </td>

                                        <td className="py-3.5 px-4 font-mono text-[#e8f1f8] font-semibold">
                                            {sat.velocity_kms ? `${sat.velocity_kms} km/s` : '7.60 km/s'}
                                        </td>

                                        <td className="py-3.5 px-4 font-mono text-[#8fa6ba]">
                                            {sat.inclination || 51.6}°
                                        </td>

                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-14 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 dark:bg-[rgba(10,20,36,0.8)] overflow-hidden">
                                                    <div
                                                        className="h-full bg-[#f2c14e] rounded-full"
                                                        style={{ width: `${sat.battery_pct || 95}%` }}
                                                    />
                                                </div>
                                                <span className="font-mono text-[10px] text-[#e8f1f8] font-semibold">
                                                    {sat.battery_pct || 95}%
                                                </span>
                                            </div>
                                        </td>

                                        <td className="py-3.5 px-4">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#f2c14e]/25 text-[#e8f1f8] dark:text-[#f2c14e] border border-[rgba(127,178,212,0.3)] flex items-center gap-1 w-max font-medium">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#f2c14e]" />
                                                Active Nominal
                                            </span>
                                        </td>

                                        <td className="py-3.5 px-4 text-right">
                                            <button
                                                onClick={() => setSelectedSatellite(sat)}
                                                className="btn-hud text-xs py-1 px-2.5 cursor-pointer font-medium"
                                            >
                                                Inspect HUD
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Satellite Telemetry Detail Modal */}
            {selectedSatellite && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="hud-card max-w-xl w-full p-6 space-y-6 border border-[rgba(127,178,212,0.24)] shadow-2xl relative bg-[rgba(10,20,36,0.75)] backdrop-blur-md border border-[rgba(127,178,212,0.24)] text-[#e8f1f8]">
                        <div className="flex items-center justify-between pb-3 border-b border-[rgba(127,178,212,0.24)]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[rgba(10,20,36,0.85)] border border-[rgba(127,178,212,0.24)] text-[#e8f1f8] border border-[rgba(127,178,212,0.24)] flex items-center justify-center">
                                    <Satellite className="w-5 h-5 text-[#e8f1f8]" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[#e8f1f8]">
                                        {selectedSatellite.name}
                                    </h3>
                                    <span className="text-xs font-mono text-[#e8f1f8] font-semibold">
                                        NORAD Catalog #{selectedSatellite.norad_id || '25544'} · ID: {selectedSatellite.id}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedSatellite(null)}
                                className="p-1 rounded-md text-[#8fa6ba] hover:text-[#e8f1f8] dark:hover:text-white hover:bg-[rgba(10,20,36,0.5)] dark:hover:bg-[#f2c14e]/10 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Telemetry Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                            <div className="p-3 rounded-lg bg-[rgba(10,20,36,0.65)] border border-[rgba(127,178,212,0.2)] text-[#e8f1f8] border border-[rgba(127,178,212,0.24)]">
                                <span className="text-[#8fa6ba] text-[10px] block font-sans">LATITUDE</span>
                                <span className="text-[#e8f1f8] font-bold text-sm">
                                    {selectedSatellite.latitude.toFixed(4)}°
                                </span>
                            </div>
                            <div className="p-3 rounded-lg bg-[rgba(10,20,36,0.65)] border border-[rgba(127,178,212,0.2)] text-[#e8f1f8] border border-[rgba(127,178,212,0.24)]">
                                <span className="text-[#8fa6ba] text-[10px] block font-sans">LONGITUDE</span>
                                <span className="text-[#e8f1f8] font-bold text-sm">
                                    {selectedSatellite.longitude.toFixed(4)}°
                                </span>
                            </div>
                            <div className="p-3 rounded-lg bg-[rgba(10,20,36,0.65)] border border-[rgba(127,178,212,0.2)] text-[#e8f1f8] border border-[rgba(127,178,212,0.24)]">
                                <span className="text-[#8fa6ba] text-[10px] block font-sans">ALTITUDE</span>
                                <span className="text-[#e8f1f8] font-bold text-sm">
                                    {selectedSatellite.altitude_km} km
                                </span>
                            </div>
                            <div className="p-3 rounded-lg bg-[rgba(10,20,36,0.65)] border border-[rgba(127,178,212,0.2)] text-[#e8f1f8] border border-[rgba(127,178,212,0.24)]">
                                <span className="text-[#8fa6ba] text-[10px] block font-sans">ORBITAL SPEED</span>
                                <span className="text-[#e8f1f8] font-bold text-sm">
                                    {selectedSatellite.velocity_kms || 7.6} km/s
                                </span>
                            </div>
                            <div className="p-3 rounded-lg bg-[rgba(10,20,36,0.65)] border border-[rgba(127,178,212,0.2)] text-[#e8f1f8] border border-[rgba(127,178,212,0.24)]">
                                <span className="text-[#8fa6ba] text-[10px] block font-sans">INCLINATION</span>
                                <span className="text-[#e8f1f8] font-bold text-sm">
                                    {selectedSatellite.inclination || 51.6}°
                                </span>
                            </div>
                            <div className="p-3 rounded-lg bg-[rgba(10,20,36,0.65)] border border-[rgba(127,178,212,0.2)] text-[#e8f1f8] border border-[rgba(127,178,212,0.24)]">
                                <span className="text-[#8fa6ba] text-[10px] block font-sans">SOLAR POWER</span>
                                <span className="text-amber-600 dark:text-amber-400 font-bold text-sm">
                                    {selectedSatellite.solar_power_w || 2800} W
                                </span>
                            </div>
                        </div>

                        {/* Two-Line Element (TLE) Box */}
                        <div className="p-3 rounded-lg bg-[rgba(6,13,24,0.95)] border border-[rgba(127,178,212,0.24)] font-mono text-[11px] space-y-1">
                            <span className="text-[#8fa6ba] text-[10px] block font-sans">
                                TWO-LINE ELEMENT (TLE) EPHEMERIS
                            </span>
                            <div className="text-[#e8f1f8] select-all overflow-x-auto whitespace-pre">
                                1 {selectedSatellite.norad_id || '25544'}U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9021
                            </div>
                            <div className="text-[#e8f1f8] select-all overflow-x-auto whitespace-pre">
                                2 {selectedSatellite.norad_id || '25544'}  {selectedSatellite.inclination || '51.6400'} 208.9163 0006703 280.7808  79.2154 15.49815776    29
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(127,178,212,0.24)]">
                            <button
                                onClick={() => setSelectedSatellite(null)}
                                className="btn-secondary text-xs cursor-pointer"
                            >
                                Close HUD
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
