import { useState } from 'react';
import {
    Radio,
    Plus,
    MapPin,
    CheckCircle2,
    Search,
    Copy,
    Check
} from 'lucide-react';
import { useGroundStations } from '../hooks/useSatellitePositions';

export default function GroundStations() {
    const { data: stations = [], isLoading } = useGroundStations();
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const filteredStations = stations.filter(station =>
        station.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCopy = (id: number, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1500);
    };

    return (
        <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[rgba(127,178,212,0.24)]">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight text-[#e8f1f8]">
                            Ground Station Network
                        </h1>
                        <span className="px-2.5 py-0.5 text-[11px] font-mono rounded-full bg-[rgba(10,20,36,0.6)] text-[#e8f1f8] border border-[rgba(127,178,212,0.2)] dark:bg-[rgba(10,20,36,0.8)] dark:text-[#e8f1f8] dark:border-[rgba(127,178,212,0.24)] font-medium">
                            6 Terrestrial Nodes Active
                        </span>
                    </div>
                    <p className="text-[#8fa6ba] text-xs sm:text-sm mt-1">
                        Global telemetry tracking, commanding (TT&C), and high-throughput RF/laser downlinks
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Ground Node</span>
                    </button>
                </div>
            </div>

            {/* Quick Metrics Banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="hud-card p-3 border border-[rgba(127,178,212,0.24)] bg-[rgba(10,20,36,0.75)] backdrop-blur-md border border-[rgba(127,178,212,0.24)] text-[#e8f1f8]">
                    <span className="text-[10px] font-mono uppercase text-[#8fa6ba] font-semibold">TOTAL NODES</span>
                    <p className="text-2xl font-bold font-mono text-[#e8f1f8] mt-1">
                        {stations.length || 6}
                    </p>
                    <span className="text-[11px] text-[#e8f1f8] flex items-center gap-1 mt-0.5 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> 100% Operational
                    </span>
                </div>

                <div className="hud-card p-3 border border-[rgba(127,178,212,0.24)] bg-[rgba(10,20,36,0.75)] backdrop-blur-md border border-[rgba(127,178,212,0.24)] text-[#e8f1f8]">
                    <span className="text-[10px] font-mono uppercase text-[#8fa6ba] font-semibold">SUPPORTED BANDS</span>
                    <p className="text-2xl font-bold font-mono text-[#e8f1f8] mt-1">
                        S / X / Ka
                    </p>
                    <span className="text-[11px] text-[#8fa6ba]">2.2 to 26.5 GHz</span>
                </div>

                <div className="hud-card p-3 border border-[rgba(127,178,212,0.24)] bg-[rgba(10,20,36,0.75)] backdrop-blur-md border border-[rgba(127,178,212,0.24)] text-[#e8f1f8]">
                    <span className="text-[10px] font-mono uppercase text-[#8fa6ba] font-semibold">MIN ELEVATION MASK</span>
                    <p className="text-2xl font-bold font-mono text-[#e8f1f8] mt-1">
                        5.0° - 10.0°
                    </p>
                    <span className="text-[11px] text-[#8fa6ba]">Atmospheric horizon</span>
                </div>

                <div className="hud-card p-3 border border-[rgba(127,178,212,0.24)] bg-[rgba(10,20,36,0.75)] backdrop-blur-md border border-[rgba(127,178,212,0.24)] text-[#e8f1f8]">
                    <span className="text-[10px] font-mono uppercase text-[#8fa6ba] font-semibold">NETWORK LATENCY</span>
                    <p className="text-2xl font-bold font-mono text-[#e8f1f8] mt-1">
                        12.4 ms
                    </p>
                    <span className="text-[11px] text-[#8fa6ba]">Fiber backhaul</span>
                </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8fa6ba]" />
                    <input
                        type="text"
                        placeholder="Search ground stations by name or region..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input w-full pl-9 py-2 text-xs"
                    />
                </div>
            </div>

            {/* Ground Stations Cards Grid */}
            {isLoading && stations.length === 0 ? (
                <div className="text-center py-16 text-[#8fa6ba] font-mono">
                    <Radio className="w-8 h-8 mx-auto mb-2 animate-pulse text-[#7fb2d4]" />
                    Querying ground antennas from MySQL...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredStations.map((station) => (
                        <div
                            key={station.id}
                            className="hud-card p-5 flex flex-col justify-between border border-[rgba(127,178,212,0.24)] hover:border-zinc-400 dark:hover:border-zinc-600 group transition-all bg-[rgba(10,20,36,0.75)] backdrop-blur-md border border-[rgba(127,178,212,0.24)] text-[#e8f1f8]"
                        >
                            <div>
                                {/* Top: Icon, Name, Status Badge */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-[rgba(10,20,36,0.85)] border border-[rgba(127,178,212,0.24)] text-[#e8f1f8] border border-[rgba(127,178,212,0.24)] flex items-center justify-center group-hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
                                            <Radio className="w-5 h-5 text-[#e8f1f8]" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-[#e8f1f8] group-hover:text-black dark:group-hover:text-white transition-colors">
                                                {station.name}
                                            </h3>
                                            <div className="flex items-center gap-1 text-[11px] font-mono text-[#8fa6ba] mt-0.5">
                                                <MapPin className="w-3 h-3 text-[#7fb2d4]" />
                                                <span>Node ID: GS-0{station.id}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#f2c14e]/25 text-[#e8f1f8] dark:text-[#f2c14e] border border-[rgba(127,178,212,0.3)] flex items-center gap-1 font-semibold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#f2c14e]" />
                                        ONLINE
                                    </span>
                                </div>

                                {/* Coordinates & Elevation */}
                                <div className="p-2.5 rounded-lg bg-[rgba(10,20,36,0.65)] border border-[rgba(127,178,212,0.2)] text-[#e8f1f8] border border-[rgba(127,178,212,0.24)] font-mono text-xs space-y-1 mb-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[#8fa6ba] text-[10px]">COORDINATES:</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[#e8f1f8] font-semibold">
                                                {station.latitude.toFixed(2)}°, {station.longitude.toFixed(2)}°
                                            </span>
                                            <button
                                                onClick={() => handleCopy(station.id, `${station.latitude}, ${station.longitude}`)}
                                                className="text-[#8fa6ba] hover:text-[#e8f1f8] dark:hover:text-white cursor-pointer"
                                                title="Copy coordinates"
                                            >
                                                {copiedId === station.id ? (
                                                    <Check className="w-3 h-3 text-[#e8f1f8]" />
                                                ) : (
                                                    <Copy className="w-3 h-3" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[#8fa6ba] text-[10px]">ALTITUDE MSL:</span>
                                        <span className="text-[#e8f1f8] font-medium">
                                            {station.elevation_m || 15} meters
                                        </span>
                                    </div>
                                </div>

                                {/* Supported Frequencies Chips */}
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-mono text-[#8fa6ba] uppercase font-semibold block">
                                        RF Capabilities
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(station.capabilities || ['S-band', 'X-band', 'Ka-band']).map((cap) => (
                                            <span
                                                key={cap}
                                                className="px-2 py-0.5 rounded text-[10px] font-mono bg-[rgba(10,20,36,0.85)] border border-[rgba(127,178,212,0.24)] text-[#e8f1f8] text-[#7fb2d4] dark:text-[#e8f1f8] border border-[rgba(127,178,212,0.24)] font-medium"
                                            >
                                                {cap}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Card Action */}
                            <div className="pt-3 mt-4 border-t border-[rgba(127,178,212,0.24)] flex items-center justify-between text-xs">
                                <span className="text-[#8fa6ba] font-mono text-[11px]">
                                    Cost: $2.50 / min
                                </span>
                                <button className="btn-secondary text-xs py-1 px-2.5 cursor-pointer">
                                    Ping Antenna
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
