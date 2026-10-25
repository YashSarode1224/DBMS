import { useState } from 'react';
import {
    Bot,
    Send,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Terminal,
    Sparkles,
    Cpu,
    RefreshCw
} from 'lucide-react';

export default function OpsCoPilot() {
    const [prompt, setPrompt] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [actions, setActions] = useState([
        { id: '1', action: 'Inspect Doppler frequency shift on STARLINK-1008 at SvalSat', priority: 'critical', status: 'pending' },
        { id: '2', action: 'Re-route science buffer queue from GS-Beta to Wallops Island', priority: 'high', status: 'pending' },
        { id: '3', action: 'Trigger SGP4 TLE orbital re-ingestion from Space-Track catalog', priority: 'medium', status: 'pending' },
        { id: '4', action: 'Optimize antenna slew rate for Canberra DSN high-elevation pass', priority: 'low', status: 'pending' },
    ]);
    const [actionApplied, setActionApplied] = useState<string | null>(null);

    const handleApply = (id: string, actionName: string) => {
        setActions(prev => prev.filter(a => a.id !== id));
        setActionApplied(actionName);
        setTimeout(() => setActionApplied(null), 3000);
    };

    const handleDismiss = (id: string) => {
        setActions(prev => prev.filter(a => a.id !== id));
    };

    const handleRunAnalysis = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            setIsAnalyzing(false);
        }, 1000);
    };

    return (
        <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[rgba(127,178,212,0.24)]">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight text-[#e8f1f8]">
                            Operations Co-Pilot & Diagnostics
                        </h1>
                        <span className="px-2.5 py-0.5 text-[11px] font-mono rounded-full bg-[rgba(10,20,36,0.6)] text-[#e8f1f8] border border-[rgba(127,178,212,0.2)] dark:bg-[rgba(10,20,36,0.8)] dark:text-[#e8f1f8] dark:border-[rgba(127,178,212,0.24)] flex items-center gap-1 font-medium">
                            <Bot className="w-3.5 h-3.5 text-[#7fb2d4]" />
                            LLM + Anomaly Engine Active
                        </span>
                    </div>
                    <p className="text-[#8fa6ba] text-xs sm:text-sm mt-1">
                        Real-time telemetry diagnostics, predictive anomaly detection, and automated corrective actions
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={handleRunAnalysis}
                        disabled={isAnalyzing}
                        className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                        {isAnalyzing ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>{isAnalyzing ? 'Analyzing Fleet...' : 'Run Diagnostics'}</span>
                    </button>
                </div>
            </div>

            {/* Notification alert on action apply */}
            {actionApplied && (
                <div className="p-3.5 rounded-lg bg-[rgba(10,20,36,0.6)] border border-zinc-300 dark:bg-[rgba(10,20,36,0.8)] dark:border-[rgba(127,178,212,0.3)] flex items-center gap-2 text-xs font-mono text-[#e8f1f8] dark:text-[#f2c14e]">
                    <CheckCircle2 className="w-4 h-4 text-[#e8f1f8]" />
                    <span>Action dispatched to satellite bus controller: &ldquo;{actionApplied}&rdquo;</span>
                </div>
            )}

            {/* Main Diagnostics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Reasoning Summary */}
                <div className="hud-card p-5 space-y-4 border border-[rgba(127,178,212,0.24)] bg-[rgba(10,20,36,0.75)] backdrop-blur-md border border-[rgba(127,178,212,0.24)] text-[#e8f1f8] flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-3 border-b border-[rgba(127,178,212,0.24)]">
                            <div className="flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-[#7fb2d4]" />
                                <h3 className="text-sm font-bold text-[#e8f1f8] tracking-wide">
                                    Autonomous Anomaly Diagnosis
                                </h3>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f2c14e]/25 text-[#e8f1f8] dark:text-[#f2c14e] border border-[rgba(127,178,212,0.3)] font-semibold">
                                99.2% Confidence
                            </span>
                        </div>

                        <p className="text-[#8fa6ba] text-xs sm:text-sm leading-relaxed mt-4">
                            Analysis of <span className="text-[#e8f1f8] font-mono font-semibold">30 contact passes</span> and{' '}
                            <span className="text-[#e8f1f8] font-mono font-semibold">10 orbital assets</span> in MySQL shows nominal constellation state.
                            A slight Doppler drift (+24.5 kHz) was resolved on pass #1 between ISS and AWS Ground Station US West.
                        </p>

                        <div className="space-y-2.5 mt-5">
                            <span className="text-[10px] font-mono text-[#8fa6ba] uppercase tracking-wider block font-semibold">
                                Causal Findings & Telemetry Insights
                            </span>

                            {[
                                { title: 'Ground Station S-Band Utilization', desc: 'AWS US West and ESA Europe at 84% capacity. Pass distribution balanced.', status: 'nominal' },
                                { title: 'Keplerian Ephemeris Accuracy', desc: 'SGP4 ephemeris within 0.12 km of reference truth vector across all 10 assets.', status: 'nominal' },
                                { title: 'Battery State of Charge (SoC)', desc: 'Solar array power output nominal (2,800W avg). Battery levels at 92-100%.', status: 'nominal' },
                            ].map((finding, i) => (
                                <div key={i} className="p-3 rounded-lg bg-[rgba(10,20,36,0.65)] border border-[rgba(127,178,212,0.2)] text-[#e8f1f8] border border-[rgba(127,178,212,0.24)] space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-[#e8f1f8]">{finding.title}</span>
                                        <span className="text-[10px] font-mono text-[#e8f1f8] flex items-center gap-1 font-semibold">
                                            <CheckCircle2 className="w-3 h-3" /> Nominal
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-[#8fa6ba] font-sans">{finding.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-[rgba(127,178,212,0.24)] flex items-center justify-between text-xs text-[#8fa6ba] font-mono">
                        <span>MODEL: Aerospace Co-Pilot v3</span>
                        <span className="text-[#e8f1f8] font-semibold">Zero Critical Faults</span>
                    </div>
                </div>

                {/* Suggested Action Triage */}
                <div className="hud-card p-5 space-y-4 border border-[rgba(127,178,212,0.24)] bg-[rgba(10,20,36,0.75)] backdrop-blur-md border border-[rgba(127,178,212,0.24)] text-[#e8f1f8] flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-3 border-b border-[rgba(127,178,212,0.24)]">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                <h3 className="text-sm font-bold text-[#e8f1f8] tracking-wide">
                                    Recommended Action Queue
                                </h3>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[rgba(10,20,36,0.85)] border border-[rgba(127,178,212,0.24)] text-[#e8f1f8] text-[#7fb2d4] dark:text-[#e8f1f8] border border-[rgba(127,178,212,0.24)] font-medium">
                                {actions.length} Pending
                            </span>
                        </div>

                        <div className="space-y-3 mt-4">
                            {actions.length === 0 ? (
                                <div className="text-center py-12 text-[#8fa6ba] font-mono">
                                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#7fb2d4]" />
                                    All recommended actions executed. Fleet state nominal.
                                </div>
                            ) : (
                                actions.map((item) => (
                                    <div
                                        key={item.id}
                                        className="p-3 rounded-lg bg-[rgba(10,20,36,0.65)] border border-[rgba(127,178,212,0.2)] text-[#e8f1f8] border border-[rgba(127,178,212,0.24)] hover:border-[rgba(127,178,212,0.2)] transition-all space-y-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                                                item.priority === 'critical' ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800' :
                                                item.priority === 'high' ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' :
                                                'bg-[rgba(10,20,36,0.6)] text-[#7fb2d4] border border-[rgba(127,178,212,0.2)] dark:bg-[rgba(10,20,36,0.8)] dark:text-[#e8f1f8] dark:border-zinc-400 dark:border-zinc-600/30'
                                            }`}>
                                                {item.priority} Priority
                                            </span>

                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => handleApply(item.id, item.action)}
                                                    className="px-2.5 py-1 rounded bg-[#f2c14e]/20 hover:bg-[#f2c14e]/30 dark:bg-[#f2c14e]/10 dark:hover:bg-[#f2c14e]/20 text-[#e8f1f8] dark:text-[#f2c14e] border border-[rgba(127,178,212,0.3)] dark:border-[rgba(127,178,212,0.3)] text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors font-medium"
                                                >
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    <span>Execute</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDismiss(item.id)}
                                                    className="p-1 rounded text-[#8fa6ba] hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition-colors"
                                                    title="Dismiss"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-xs text-[#e8f1f8] font-medium font-sans">
                                            {item.action}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-[rgba(127,178,212,0.24)] flex items-center justify-between text-xs text-[#8fa6ba] font-mono">
                        <span>Autonomous Safety Interlocks: Active</span>
                    </div>
                </div>
            </div>

            {/* Terminal Command Console */}
            <div className="hud-card p-4 space-y-3 border border-[rgba(127,178,212,0.24)] bg-[rgba(10,20,36,0.75)] backdrop-blur-md border border-[rgba(127,178,212,0.24)] text-[#e8f1f8] font-mono">
                <div className="flex items-center gap-2 pb-2 border-b border-[rgba(127,178,212,0.24)] text-xs text-[#8fa6ba] font-semibold">
                    <Terminal className="w-4 h-4 text-[#7fb2d4]" />
                    <span>OPS CO-PILOT INTERACTIVE QUERY CONSOLE</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[#7fb2d4] text-xs font-bold">&gt;</span>
                    <input
                        type="text"
                        placeholder="Ask Co-Pilot: 'Calculate link budget for Starlink-1007' or 'Verify MySQL DB table count'..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && prompt.trim()) {
                                handleApply('query', `Query evaluated: "${prompt}"`);
                                setPrompt('');
                            }
                        }}
                        className="input flex-1 py-1.5 text-xs font-mono"
                    />
                    <button
                        onClick={() => {
                            if (prompt.trim()) {
                                handleApply('query', `Query evaluated: "${prompt}"`);
                                setPrompt('');
                            }
                        }}
                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 cursor-pointer"
                    >
                        <Send className="w-3 h-3" />
                        <span>Query</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
