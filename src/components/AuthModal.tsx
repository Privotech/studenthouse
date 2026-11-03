"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Database,
  Building,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  UserPlus,
} from "lucide-react";
import { evaluatePasswordStrength, PasswordScore } from "@/lib/auth-security";
import { AgeZone, PlayerState } from "@/types/naijaplay";
import { sounds } from "@/lib/audio";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: Partial<PlayerState> & { email: string; username: string }) => void;
  defaultTab?: "signin" | "register";
}

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara", "Diaspora / International"
];

const CRESTS = [
  { id: "Scholar", label: "Scholar", desc: "Academic Excellence & Research" },
  { id: "Vanguard", label: "Vanguard", desc: "Leadership, Strategy & Vision" },
  { id: "Falcon", label: "Falcon", desc: "Speed, Agility & Sharp Focus" },
  { id: "Apex", label: "Apex", desc: "High Achievement & Mastery" },
  { id: "Atlas", label: "Atlas", desc: "Global Scope & Resilience" },
  { id: "Summit", label: "Summit", desc: "Peak Performance & Innovation" },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  defaultTab = "signin",
}) => {
  const [tab, setTab] = useState<"signin" | "register">(defaultTab);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);

  // Sign In Form State
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Form State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regAge, setRegAge] = useState<number>(20);
  const [regSchool, setRegSchool] = useState("");
  const [regState, setRegState] = useState("Lagos");
  const [regCrest, setRegCrest] = useState("Scholar");

  // Real-time password analysis computed pure on render
  const passwordAnalysis: PasswordScore = evaluatePasswordStrength(regPassword);

  // Fetch NeonDB status on mount
  useEffect(() => {
    if (isOpen) {
      fetch("/api/auth/status")
        .then((res) => res.json())
        .then((data) => setDbStatus(data))
        .catch(() => setDbStatus(null));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate age zone based on chosen age (6-30)
  const calculateAgeZone = (age: number): AgeZone => {
    if (age >= 25) return "SENIOR";
    if (age >= 18) return "YOUTH";
    if (age >= 13) return "TEEN";
    return "JUNIOR";
  };

  const currentZone = calculateAgeZone(regAge);

  const getZoneDescription = (zone: AgeZone) => {
    switch (zone) {
      case "JUNIOR":
        return "Junior Zone (Ages 6–12) · Foundational Academics & Logic Drills";
      case "TEEN":
        return "Teen Zone (Ages 13–17) · WAEC/JAMB Prep, STEM & Coding Labs";
      case "YOUTH":
        return "Youth Zone (Ages 18–24) · Higher Ed, AI Systems, Career Skills";
      case "SENIOR":
        return "Senior Zone (Ages 25–30) · Professional Specialization & Leadership";
    }
  };

  // Quick Demo Account Pre-fill
  const fillDemoAccount = () => {
    setLoginIdentifier("chisom_vanguard");
    setLoginPassword("Naija2026!");
    setErrorMessage(null);
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: loginIdentifier,
          password: loginPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        sounds.playWrong();
        setErrorMessage(data.error || "Authentication failed. Check credentials.");
        setIsLoading(false);
        return;
      }

      sounds.playCorrect();
      setSuccessMessage(data.message);

      // Store session token in localStorage for client persistence
      if (data.sessionToken) {
        localStorage.setItem("np_session_token", data.sessionToken);
      }

      setTimeout(() => {
        onAuthSuccess({
          displayName: data.user.display_name,
          avatarInitials: data.user.avatar_initials,
          avatarCrest: data.user.avatar_crest,
          ageZone: data.user.age_zone,
          age: data.user.age,
          level: data.user.level,
          xp: data.user.xp,
          streakDays: data.user.streak_days,
          school: data.user.school,
          state: data.user.state,
          email: data.user.email,
          username: data.user.username,
        });
        onClose();
      }, 700);
    } catch {
      setErrorMessage("Network error connecting to authentication server.");
      setIsLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!passwordAnalysis.isValid) {
      setErrorMessage("Password must satisfy minimum security complexity requirements.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail,
          username: regUsername,
          password: regPassword,
          displayName: regName,
          age: regAge,
          school: regSchool,
          state: regState,
          avatarCrest: regCrest,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        sounds.playWrong();
        setErrorMessage(data.error || "Registration rejected.");
        setIsLoading(false);
        return;
      }

      sounds.playTrophy();
      setSuccessMessage(data.message);

      if (data.sessionToken) {
        localStorage.setItem("np_session_token", data.sessionToken);
      }

      setTimeout(() => {
        onAuthSuccess({
          displayName: data.user.display_name,
          avatarInitials: data.user.avatar_initials,
          avatarCrest: data.user.avatar_crest,
          ageZone: data.user.age_zone,
          age: data.user.age,
          level: data.user.level,
          xp: data.user.xp,
          streakDays: data.user.streak_days,
          school: data.user.school,
          state: data.user.state,
          email: data.user.email,
          username: data.user.username,
        });
        onClose();
      }, 800);
    } catch {
      setErrorMessage("Network error during registration.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-700 bg-[#0c121e] shadow-2xl overflow-hidden my-8">
        {/* Header with Security Badge */}
        <div className="border-b border-slate-800 bg-slate-900/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-display">
                  NaijaPlay Security & Identity
                </h3>
                <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400">
                  Neon PostgreSQL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                PBKDF2-HMAC-SHA256 Encryption · Brute-Force Rate Limiter · Age-Tiers 6–30
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-2">
          <button
            type="button"
            onClick={() => {
              setTab("signin");
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              tab === "signin"
                ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
            Sign In to Account
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("register");
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              tab === "register"
                ? "bg-emerald-600 text-white shadow-sm border border-emerald-500"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-white" />
            Register / Create Account
          </button>
        </div>

        {/* Error / Success Notifications */}
        <div className="px-6 pt-4">
          {errorMessage && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-semibold">{errorMessage}</p>
                {passwordAnalysis.feedback.length > 0 && tab === "register" && (
                  <ul className="mt-1 list-disc list-inside text-[11px] text-rose-300/80 space-y-0.5">
                    {passwordAnalysis.feedback.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <p className="font-semibold">{successMessage}</p>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="px-6 pb-6">
          {tab === "signin" ? (
            /* SIGN IN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Quick Demo Pre-Fill Banner */}
              <div className="flex items-center justify-between rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-3 text-xs">
                <div>
                  <p className="font-semibold text-emerald-300">Verified Test Account Available</p>
                  <p className="text-[11px] text-slate-400">Chisom Okafor (UNILAG) · Level 14 · 4,850 XP</p>
                </div>
                <button
                  type="button"
                  onClick={fillDemoAccount}
                  className="rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 px-2.5 py-1 text-xs font-mono font-bold text-emerald-200 transition-colors"
                >
                  Quick Fill
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address or Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. chisom_vanguard or chisom.okafor@naijaplay.ng"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Account Password
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">100k Iteration Hash</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Verifying Credentials with NeonDB...</span>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Sign In with PostgreSQL Security</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* REGISTER / CREATE ACCOUNT FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Legal / Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Amina Bello"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Unique Username
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. amina_scholar"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@school.edu.ng or personal@mail.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Age Selector & Zone Auto-Detection (Ages 6 to 30) */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Select Age (6 to 30): <span className="text-emerald-400 font-mono font-bold text-sm">{regAge} Years Old</span>
                  </label>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                    {currentZone}
                  </span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="30"
                  value={regAge}
                  onChange={(e) => setRegAge(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  {getZoneDescription(currentZone)}
                </p>
              </div>

              {/* School and State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    School / Educational Institution
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Building className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={regSchool}
                      onChange={(e) => setRegSchool(e.target.value)}
                      placeholder="e.g. King's College Lagos / UNILAG"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    State of Residence / Origin
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <select
                      value={regState}
                      onChange={(e) => setRegState(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    >
                      {NIGERIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Avatar Crest Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Academic Crest / House
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CRESTS.map((crest) => (
                    <button
                      key={crest.id}
                      type="button"
                      onClick={() => setRegCrest(crest.id)}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        regCrest === crest.id
                          ? "border-emerald-500 bg-emerald-950/40 text-emerald-300 shadow-sm"
                          : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <p className="text-xs font-bold font-mono">{crest.label}</p>
                      <p className="text-[10px] text-slate-500 truncate">{crest.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Password with Strength Meter */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Account Security Password
                  </label>
                  <span
                    className={`text-[11px] font-mono font-bold ${
                      passwordAnalysis.label === "Weak"
                        ? "text-rose-400"
                        : passwordAnalysis.label === "Fair"
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    Strength: {passwordAnalysis.label}
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 8 chars, uppercase, number & symbol"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Visual Strength Meter Bar */}
                <div className="mt-1.5 flex gap-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      passwordAnalysis.score === 1
                        ? "w-1/4 bg-rose-500"
                        : passwordAnalysis.score === 2
                        ? "w-2/4 bg-amber-500"
                        : passwordAnalysis.score === 3
                        ? "w-3/4 bg-emerald-500"
                        : passwordAnalysis.score >= 4
                        ? "w-full bg-emerald-400"
                        : "w-0"
                    }`}
                  />
                </div>

                {/* Validation checklist */}
                <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-400">
                  <span className={passwordAnalysis.hasMinLength ? "text-emerald-400" : "text-slate-500"}>
                    {passwordAnalysis.hasMinLength ? "✓" : "○"} 8+ Characters
                  </span>
                  <span className={passwordAnalysis.hasUppercase ? "text-emerald-400" : "text-slate-500"}>
                    {passwordAnalysis.hasUppercase ? "✓" : "○"} Uppercase Letter
                  </span>
                  <span className={passwordAnalysis.hasNumber ? "text-emerald-400" : "text-slate-500"}>
                    {passwordAnalysis.hasNumber ? "✓" : "○"} Numeric Digit
                  </span>
                  <span className={passwordAnalysis.hasSymbol ? "text-emerald-400" : "text-slate-500"}>
                    {passwordAnalysis.hasSymbol ? "✓" : "○"} Special Symbol
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !passwordAnalysis.isValid}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Registering with NeonDB...</span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Account & Register Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Database Diagnostics Bar */}
        <div className="border-t border-slate-800/80 bg-slate-950 px-6 py-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {dbStatus?.database?.isConfigured
                ? "Neon PostgreSQL Serverless (Active Cluster)"
                : "NeonDB PostgreSQL Adapter (Local Synced)"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SSL Secured · Port 5432</span>
          </div>
        </div>
      </div>
    </div>
  );
};
