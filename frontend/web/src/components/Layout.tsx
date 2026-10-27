import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Satellite,
  Radio,
  Calendar,
  Bot,
  Globe,
  Database,
  Cpu,
  ShieldCheck,
  LogOut,
  User,
  Clock,
  HardDrive,
  Sun,
  Moon,
  Sparkles
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/", label: "Mission Overview", icon: Globe, badge: "3D Earth" },
  { path: "/satellites", label: "Fleet Satellites", icon: Satellite, badge: "10 Assets" },
  { path: "/ground-stations", label: "Ground Stations", icon: Radio, badge: "6 Nodes" },
  { path: "/scheduling", label: "Pass Scheduling", icon: Calendar, badge: "30 Passes" },
  { path: "/ops-copilot", label: "Ops Co-Pilot", icon: Bot, badge: "AI Ready" },
  { path: "/tle-admin", label: "TLE Ephemeris", icon: Database, badge: "NORAD" },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [utcTime, setUtcTime] = useState("");

  // Live UTC Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const userToken = localStorage.getItem("token");
  const userRole = localStorage.getItem("user_role") || "admin";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    window.location.reload();
  };

  // The landing page '/' is a full-viewport interactive globe experience
  // without the outer sidebar and header encroaching on the 3D canvas
  if (location.pathname === "/") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#02050b] text-[#e8f1f8] font-sans antialiased selection:bg-[#f2c14e] selection:text-[#02050b]">
      {/* Top Navigation Bar - styled after Interactive Globe HTML Reference */}
      <header className="h-14 bg-[rgba(10,20,36,0.78)] backdrop-blur-md border-b border-[rgba(127,178,212,0.24)] px-4 lg:px-6 flex items-center justify-between z-30 sticky top-0 transition-colors">
        {/* Left: Brand & Telemetry Chips */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#7fb2d4] text-[#02050b] flex items-center justify-center font-bold shadow-sm transition-transform group-hover:scale-105">
              <Globe className="w-5 h-5 text-[#02050b]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-[#e8f1f8]">
                Constellation Hub
              </span>
              <span className="px-1.5 py-0.2 text-[10px] font-mono rounded border border-[rgba(127,178,212,0.3)] bg-[rgba(10,20,36,0.6)] text-[#8fa6ba]">
                v2.4
              </span>
            </div>
          </Link>

          {/* Quick System Status Chips from Reference */}
          <div className="hidden md:flex items-center gap-2 ml-2 pl-3 border-l border-[rgba(127,178,212,0.2)] text-xs">
            <span className="chip live mono text-xs py-1 px-3">
              <i className="dot" />
              <span>10 satellites synced</span>
            </span>
            <Link
              to="/ops-copilot"
              className="chip mono text-xs py-1 px-3 text-[#7fb2d4] hover:border-[#7fb2d4] transition-all cursor-pointer flex items-center gap-1.5"
              title="Open Ops Co-Pilot & MySQL 8.0 Studio"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>MySQL 8.0 Live</span>
            </Link>
            <span className="chip mono text-xs py-1 px-3 text-[#8fa6ba] hidden lg:inline-flex">
              <Cpu className="w-3.5 h-3.5 text-[#7fb2d4]" />
              <span>Port 3306</span>
            </span>
          </div>
        </div>

        {/* Right: Mission Time Clock & Operator Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* UTC Mission Clock */}
          <div className="chip mono text-xs py-1 px-3 flex items-center gap-1.5 text-[#e8f1f8] font-medium tracking-wide">
            <Clock className="w-3.5 h-3.5 text-[#7fb2d4]" />
            <span>{utcTime || "--:--:-- UTC"}</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="chip text-xs py-1 px-2.5 hover:border-[#7fb2d4] transition-all cursor-pointer text-[#8fa6ba] hover:text-[#e8f1f8]"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            aria-label="Toggle Theme"
          >
            {theme === "light" ? (
              <Moon className="w-3.5 h-3.5 text-[#7fb2d4]" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-[#f2c14e]" />
            )}
          </button>

          {/* User Profile / Auth */}
          {userToken ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[rgba(127,178,212,0.2)]">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[rgba(10,20,36,0.72)] border border-[rgba(127,178,212,0.24)]">
                <div className="w-5 h-5 rounded-full bg-[#f2c14e] text-[#02050b] flex items-center justify-center text-[10px] font-bold">
                  {userRole.slice(0, 1).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-[#e8f1f8] capitalize">
                  {userRole}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-[#8fa6ba] hover:text-[#f2c14e] hover:bg-[rgba(127,178,212,0.1)] transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn-primary text-xs py-1.5 px-3.5 font-bold"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main Workspace: Left Sidebar + Central Hero Stage */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation & Live Telemetry Panel */}
        <aside className="w-72 bg-[rgba(6,13,24,0.95)] backdrop-blur-xl border-r border-[rgba(127,178,212,0.24)] flex flex-col justify-between shrink-0 overflow-y-auto transition-colors z-20">
          <div className="p-3 space-y-4">
            {/* Command Modules Section */}
            <div>
              <div className="px-2 py-1 text-[10px] font-mono tracking-widest text-[#8fa6ba] uppercase font-semibold">
                Command Modules
              </div>

              <nav className="space-y-1 mt-1.5">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`
                        group relative flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer
                        ${
                          isActive
                            ? "bg-[rgba(127,178,212,0.18)] text-[#e8f1f8] border-l-2 border-[#f2c14e] font-semibold shadow-xs"
                            : "text-[#8fa6ba] hover:bg-[rgba(127,178,212,0.1)] hover:text-[#e8f1f8] border-l-2 border-transparent"
                        }
                      `}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive
                              ? "text-[#f2c14e]"
                              : "text-[#7fb2d4] group-hover:text-[#e8f1f8]"
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                          isActive
                            ? "bg-[#f2c14e] text-[#02050b] font-bold"
                            : "bg-[rgba(10,20,36,0.7)] text-[#8fa6ba] border border-[rgba(127,178,212,0.2)] group-hover:text-[#e8f1f8]"
                        }`}
                      >
                        {item.badge}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Fleet Telemetry Live Stats in Sidebar */}
            <div className="pt-3 border-t border-[rgba(127,178,212,0.2)] space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono tracking-widest text-[#8fa6ba] uppercase font-semibold">
                  Fleet Telemetry Stats
                </span>
                <span className="chip live mono text-[9px] py-0.5 px-2">
                  <i className="dot" /> LIVE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Metric 1 */}
                <div className="p-2.5 rounded-xl bg-[rgba(10,20,36,0.72)] border border-[rgba(127,178,212,0.24)] space-y-1">
                  <div className="flex items-center justify-between text-[#8fa6ba] text-[10px]">
                    <span>ORBITAL ASSETS</span>
                    <Satellite className="w-3 h-3 text-[#7fb2d4]" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono font-bold text-base text-[#e8f1f8]">10</span>
                    <span className="text-[10px] font-mono font-semibold text-[#7fb2d4]">+10.0%</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#8fa6ba] block">LEO / MEO Catalog</span>
                </div>

                {/* Metric 2 */}
                <div className="p-2.5 rounded-xl bg-[rgba(10,20,36,0.72)] border border-[rgba(127,178,212,0.24)] space-y-1">
                  <div className="flex items-center justify-between text-[#8fa6ba] text-[10px]">
                    <span>GROUND NODES</span>
                    <Radio className="w-3 h-3 text-[#6fd6e8]" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono font-bold text-base text-[#e8f1f8]">6</span>
                    <span className="text-[10px] font-mono font-semibold text-[#6fd6e8]">100% Net</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#8fa6ba] block">S / X / Ka Global</span>
                </div>

                {/* Metric 3 */}
                <div className="p-2.5 rounded-xl bg-[rgba(10,20,36,0.72)] border border-[rgba(127,178,212,0.24)] space-y-1">
                  <div className="flex items-center justify-between text-[#8fa6ba] text-[10px]">
                    <span>CONTACT PASSES</span>
                    <Calendar className="w-3 h-3 text-[#f2c14e]" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono font-bold text-base text-[#e8f1f8]">30</span>
                    <span className="text-[10px] font-mono font-semibold text-[#f2c14e]">Next 12m</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#8fa6ba] block">AOS / LOS Horizon</span>
                </div>

                {/* Metric 4 */}
                <div className="p-2.5 rounded-xl bg-[rgba(10,20,36,0.72)] border border-[rgba(127,178,212,0.24)] space-y-1">
                  <div className="flex items-center justify-between text-[#8fa6ba] text-[10px]">
                    <span>AI EFFICIENCY</span>
                    <Sparkles className="w-3 h-3 text-[#f2c14e]" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono font-bold text-base text-[#e8f1f8]">98.4%</span>
                    <span className="text-[10px] font-mono font-semibold text-[#f2c14e]">+4.2%</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#8fa6ba] block">Zero Conflicts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Database Health Card */}
          <div className="p-3 border-t border-[rgba(127,178,212,0.2)] space-y-2 mt-auto">
            <div className="p-2.5 rounded-xl bg-[rgba(10,20,36,0.72)] border border-[rgba(127,178,212,0.24)] text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono tracking-wider text-[#8fa6ba] uppercase font-semibold">
                  DBMS CONNECTION
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#f2c14e] font-semibold">
                  <span className="dot" />
                  CONNECTED
                </span>
              </div>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#8fa6ba]">ENGINE:</span>
                  <span className="font-semibold text-[#f2c14e]">MySQL 8.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8fa6ba]">DATABASE:</span>
                  <span className="text-[#e8f1f8]">constellation_hub</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8fa6ba]">ORBIT PROP:</span>
                  <span className="text-[#6fd6e8] font-medium">SGP4 Active</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1 text-[11px] text-[#8fa6ba]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#7fb2d4]" />
                <span>Auth: Secure JWT Bearer</span>
              </div>
              <span className="font-mono text-[10px]">Academic Demo</span>
            </div>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <main className="flex-1 overflow-y-auto bg-[#02050b] transition-colors relative">
          {children}
        </main>
      </div>
    </div>
  );
}
