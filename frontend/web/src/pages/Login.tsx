import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { AxiosError } from "axios";
import {
  Shield,
  Eye,
  Settings,
  PlayCircle,
  Loader2,
  HardDrive,
  Globe,
  Lock,
  User
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin@demo.constellation-hub.local");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      const response = await api.login(formData);
      const { access_token } = response.data;

      localStorage.setItem("token", access_token);
      localStorage.setItem(
        "user_role",
        username.includes("admin")
          ? "admin"
          : username.includes("ops")
            ? "operator"
            : "viewer",
      );

      navigate("/");
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>;
      console.error(error);
      setError(error.response?.data?.detail || "Authentication failed. Check credentials or backend status.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: "viewer" | "ops" | "admin") => {
    if (role === "viewer") {
      setUsername("viewer@demo.constellation-hub.local");
      setPassword("viewer123");
    } else if (role === "ops") {
      setUsername("ops@demo.constellation-hub.local");
      setPassword("ops123");
    } else if (role === "admin") {
      setUsername("admin@demo.constellation-hub.local");
      setPassword("admin123");
    }
  };

  const handleSeedDemo = async () => {
    setSeedLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.seedDemo();
      setSuccess("Demo data initialized successfully into MySQL 8.0!");
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>;
      console.error(error);
      setError("Failed to seed demo data. Ensure backend is listening.");
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#02050b] text-[#e8f1f8] flex items-center justify-center p-4 transition-colors">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-0 hud-card border border-[rgba(127,178,212,0.24)] overflow-hidden shadow-aero bg-[rgba(10,20,36,0.75)] backdrop-blur-md border border-[rgba(127,178,212,0.24)] text-[#e8f1f8]">
        {/* Left Side: Brand & Mission Info */}
        <div className="p-8 md:p-10 flex flex-col justify-between bg-gradient-to-br from-[rgba(6,13,24,0.95)] via-[rgba(10,20,36,0.9)] to-[#02050b] border-b md:border-b-0 md:border-r border-[rgba(127,178,212,0.24)]">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[rgba(10,20,36,0.8)] dark:bg-[#f2c14e] text-white flex items-center justify-center shadow-sm">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#e8f1f8]">
                  Constellation Hub
                </h1>
                <span className="text-[10px] font-mono tracking-widest text-[#e8f1f8] uppercase font-semibold">
                  FLEET OPERATIONS PLATFORM
                </span>
              </div>
            </div>

            <p className="text-[#8fa6ba] text-xs sm:text-sm mb-6 leading-relaxed">
              Unified command & telemetry plane for Low Earth Orbit and Medium Earth Orbit satellite constellations.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[#e8f1f8] text-xs p-2.5 rounded-lg bg-[#f2c14e] dark:bg-[#f2c14e]/[0.03] border border-[rgba(127,178,212,0.2)] dark:border-white/5 shadow-xs">
                <div className="p-1.5 rounded bg-[rgba(10,20,36,0.85)] border border-[rgba(127,178,212,0.24)] text-[#e8f1f8] border border-[rgba(127,178,212,0.24)]">
                  <PlayCircle className="w-4 h-4 text-[#e8f1f8]" />
                </div>
                <div>
                  <span className="font-semibold block text-[#e8f1f8]">Interactive 3D Earth Globe</span>
                  <span className="text-[11px] text-[#8fa6ba]">WebGL Three.js with real SGP4 orbit tracks</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[#e8f1f8] text-xs p-2.5 rounded-lg bg-[#f2c14e] dark:bg-[#f2c14e]/[0.03] border border-[rgba(127,178,212,0.2)] dark:border-white/5 shadow-xs">
                <div className="p-1.5 rounded bg-[rgba(10,20,36,0.6)] border border-zinc-300 dark:bg-[rgba(10,20,36,0.8)] dark:border-[rgba(127,178,212,0.3)]">
                  <HardDrive className="w-4 h-4 text-[#e8f1f8]" />
                </div>
                <div>
                  <span className="font-semibold block text-[#e8f1f8]">MySQL 8.0 Server Database</span>
                  <span className="text-[11px] text-[#8fa6ba]">10 Satellites, 6 Stations, 30 Passes</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[#e8f1f8] text-xs p-2.5 rounded-lg bg-[#f2c14e] dark:bg-[#f2c14e]/[0.03] border border-[rgba(127,178,212,0.2)] dark:border-white/5 shadow-xs">
                <div className="p-1.5 rounded bg-[rgba(10,20,36,0.85)] border border-[rgba(127,178,212,0.24)] text-[#e8f1f8] border border-[rgba(127,178,212,0.24)]">
                  <Shield className="w-4 h-4 text-[#e8f1f8]" />
                </div>
                <div>
                  <span className="font-semibold block text-[#e8f1f8]">Role-Based Access Control</span>
                  <span className="text-[11px] text-[#8fa6ba]">Bcrypt password hashing & JWT bearer auth</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-[rgba(127,178,212,0.24)] flex items-center justify-between text-[11px] font-mono text-[#8fa6ba]">
            <span>DBMS Academic Project</span>
            <span className="text-[#e8f1f8] flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f2c14e]" /> Port 3306
            </span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 md:p-10 bg-[rgba(10,20,36,0.75)] backdrop-blur-md border border-[rgba(127,178,212,0.24)] text-[#e8f1f8] flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#e8f1f8] tracking-wide">
                Operator Sign In
              </h2>
              <p className="text-[#8fa6ba] text-xs mt-0.5">
                Authenticate with your credentials or select a quick demo role
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-xs font-mono">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-[rgba(10,20,36,0.6)] border border-zinc-300 dark:bg-[rgba(10,20,36,0.8)] dark:border-[rgba(127,178,212,0.3)] rounded-lg text-[#e8f1f8] dark:text-[#f2c14e] text-xs font-mono">
                {success}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-semibold text-[#8fa6ba] mb-1 uppercase tracking-wider">
                  Username / Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8fa6ba] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input w-full pl-9 py-2 text-xs"
                    placeholder="operator@demo.constellation-hub.local"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-semibold text-[#8fa6ba] mb-1 uppercase tracking-wider">
                  Access Key / Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8fa6ba] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input w-full pl-9 py-2 text-xs"
                    placeholder="Enter password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary text-xs py-2.5 mt-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Sign In →</span>
                )}
              </button>
            </form>
          </div>

          {/* Quick Demo Credentials Access */}
          <div className="mt-6 pt-5 border-t border-[rgba(127,178,212,0.24)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-semibold text-[#8fa6ba] uppercase tracking-wider">
                Quick Role Autofill
              </span>
              <button
                onClick={handleSeedDemo}
                disabled={seedLoading}
                className="text-[11px] font-mono text-[#7fb2d4] hover:text-black dark:hover:text-white dark:hover:text-[#e8f1f8] flex items-center gap-1 cursor-pointer disabled:opacity-50 font-medium"
              >
                {seedLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <PlayCircle className="w-3 h-3" />
                )}
                <span>Reseed DB</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin("admin")}
                className="p-2 rounded-lg bg-[rgba(10,20,36,0.65)] border border-[rgba(127,178,212,0.2)] text-[#e8f1f8] hover:bg-[rgba(10,20,36,0.6)] dark:hover:bg-zinc-800 border border-[rgba(127,178,212,0.24)] hover:border-zinc-400 dark:hover:border-zinc-600 text-center transition-all cursor-pointer group"
              >
                <Shield className="w-4 h-4 text-[#7fb2d4] mx-auto mb-1 transition-colors" />
                <span className="block text-[10px] font-mono font-medium text-[#e8f1f8] group-hover:text-black dark:group-hover:text-white">
                  Admin
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("ops")}
                className="p-2 rounded-lg bg-[rgba(10,20,36,0.65)] border border-[rgba(127,178,212,0.2)] text-[#e8f1f8] hover:bg-[rgba(10,20,36,0.6)] dark:hover:bg-zinc-800 border border-[rgba(127,178,212,0.24)] hover:border-zinc-400 dark:hover:border-zinc-600 text-center transition-all cursor-pointer group"
              >
                <Settings className="w-4 h-4 text-[#7fb2d4] mx-auto mb-1 transition-colors" />
                <span className="block text-[10px] font-mono font-medium text-[#e8f1f8] group-hover:text-black dark:group-hover:text-white">
                  Operator
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("viewer")}
                className="p-2 rounded-lg bg-[rgba(10,20,36,0.65)] border border-[rgba(127,178,212,0.2)] text-[#e8f1f8] hover:bg-[rgba(10,20,36,0.6)] dark:hover:bg-zinc-800 border border-[rgba(127,178,212,0.24)] hover:border-zinc-400 dark:hover:border-zinc-600 text-center transition-all cursor-pointer group"
              >
                <Eye className="w-4 h-4 text-[#7fb2d4] mx-auto mb-1 transition-colors" />
                <span className="block text-[10px] font-mono font-medium text-[#e8f1f8] group-hover:text-black dark:group-hover:text-white">
                  Viewer
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
