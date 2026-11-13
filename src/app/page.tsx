"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { HomeView } from "@/components/HomeView";
import { GameArena } from "@/components/GameArena";
import { CompetitionArena } from "@/components/CompetitionArena";
import { SkillQuestPortal } from "@/components/SkillQuestPortal";
import { TalentArenaPortal } from "@/components/TalentArenaPortal";
import { CreativeStudio } from "@/components/CreativeStudio";
import { ClubsAndCommunity } from "@/components/ClubsAndCommunity";
import { PlayerProfileView } from "@/components/PlayerProfileView";
import { ParentAndSchoolPortal } from "@/components/ParentAndSchoolPortal";
import { RoadmapModal } from "@/components/RoadmapModal";
import { AuthModal } from "@/components/AuthModal";
import { RewardsStoreModal } from "@/components/RewardsStoreModal";
import { SafetyReportModal, type ReportTarget } from "@/components/SafetyReportModal";
import {
  AgeZone,
  CreativeSubmissionItem,
  DailyMission,
  NavTab,
  NotificationItem,
  PlayerState,
  ProfileVisibility,
} from "@/types/naijaplay";
import {
  CREATIVE_SUBMISSIONS,
  DEFAULT_ANNOUNCEMENTS,
  INITIAL_MISSIONS,
  INITIAL_PLAYER,
  getMissionsForZone,
  getWeeklyChallengesForZone,
} from "@/data/mockData";
import { sounds } from "@/lib/audio";
import { Sparkles, Map, Gift, Clock, Shield } from "lucide-react";

const getScreenTimeStorageKey = () => {
  const today = new Date().toISOString().split("T")[0];
  return `np_screentime_${today}`;
};

export default function NaijaPlayApp() {
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [player, setPlayer] = useState<PlayerState>(() => ({
    ...INITIAL_PLAYER,
    displayName: "Guest Scholar",
    avatarInitials: "GS",
    school: "Visitor Portal",
  }));
  const [missions, setMissions] = useState<DailyMission[]>(INITIAL_MISSIONS);
  const [weeklyChallenges, setWeeklyChallenges] = useState<DailyMission[]>(() =>
    getWeeklyChallengesForZone(INITIAL_PLAYER.ageZone),
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_ANNOUNCEMENTS);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [screenBreakSnoozed, setScreenBreakSnoozed] = useState(false);

  const [submissions, setSubmissions] = useState<CreativeSubmissionItem[]>(CREATIVE_SUBMISSIONS);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<"signin" | "register">("signin");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  const refreshAuthenticatedData = useCallback(async (token?: string | null) => {
    const authHeaders: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};
    try {
      const [sessionsRes, notifRes, blockRes] = await Promise.all([
        fetch("/api/games/sessions", { headers: authHeaders }),
        fetch("/api/notifications", { headers: authHeaders }),
        fetch("/api/safety/block", { headers: authHeaders }),
      ]);

      if (sessionsRes.ok) {
        const sData = await sessionsRes.json();
        if (sData.stats) {
          setPlayer((prev) => ({
            ...prev,
            personalStats: {
              ...sData.stats,
              recentHistory: sData.history ?? [],
            },
          }));
        }
      }
      if (notifRes.ok) {
        const nData = await notifRes.json();
        if (Array.isArray(nData.notifications)) {
          setNotifications(nData.notifications);
        }
      }
      if (blockRes.ok) {
        const bData = await blockRes.json();
        if (Array.isArray(bData.blockedUsers)) {
          setBlockedUsers(bData.blockedUsers);
          setPlayer((prev) => ({ ...prev, blockedUsers: bData.blockedUsers }));
        }
      }
    } catch {
      // ignore background fetch hiccups
    }
  }, []);

  // Restore authenticated session and load persisted player telemetry
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("np_session_token") : null;
    const savedMinsRaw = typeof window !== "undefined" ? localStorage.getItem(getScreenTimeStorageKey()) : null;
    const savedMins = savedMinsRaw ? Number(savedMinsRaw) : 0;

    if (token) {
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated && data.user) {
            setIsAuthenticated(true);
            setUserEmail(data.user.email);
            const userZone: AgeZone = data.user.age_zone || "TEEN";
            setPlayer((prev) => ({
              ...prev,
              username: data.user.username,
              displayName: data.user.display_name,
              avatarInitials: data.user.avatar_initials,
              avatarCrest: data.user.avatar_crest,
              ageZone: userZone,
              age: data.user.age,
              level: data.user.level,
              xp: data.user.xp,
              streakDays: data.user.streak_days,
              school: data.user.school,
              state: data.user.state,
              profileVisibility: data.user.profile_visibility || "SCHOOL_AND_CLUB_ONLY",
              maxScreenTimeMinutes: data.user.daily_screen_time_limit_mins || prev.maxScreenTimeMinutes,
              screenTimeTodayMinutes: Number.isFinite(savedMins) && savedMins > 0 ? savedMins : prev.screenTimeTodayMinutes,
            }));
            setMissions(getMissionsForZone(userZone));
            setWeeklyChallenges(getWeeklyChallengesForZone(userZone));
            void refreshAuthenticatedData(token);
          }
        })
        .catch(() => {});
    }
  }, [refreshAuthenticatedData]);

  // Active screen-time tracker (1 minute tick when signed in)
  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setInterval(() => {
      setPlayer((prev) => {
        const nextMins = prev.screenTimeTodayMinutes + 1;
        if (typeof window !== "undefined") {
          localStorage.setItem(getScreenTimeStorageKey(), String(nextMins));
        }
        return { ...prev, screenTimeTodayMinutes: nextMins };
      });
    }, 60000);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

  const handleAuthSuccess = (userData: Partial<PlayerState> & { email: string; username: string }) => {
    setIsAuthenticated(true);
    setUserEmail(userData.email);
    const assignedZone: AgeZone = userData.ageZone || "TEEN";
    setPlayer((prev) => ({
      ...prev,
      ...userData,
      ageZone: assignedZone,
    }));
    setMissions(getMissionsForZone(assignedZone));
    setWeeklyChallenges(getWeeklyChallengesForZone(assignedZone));
    const token = typeof window !== "undefined" ? localStorage.getItem("np_session_token") : null;
    void refreshAuthenticatedData(token);
    sounds.playLevelUp();
    showToast(`Welcome ${userData.displayName || userData.username}! Calibrated game tasks loaded for ${assignedZone} zone.`);
  };

  const handleSignOut = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("np_session_token") : null;
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (typeof window !== "undefined") {
        localStorage.removeItem("np_session_token");
      }
    } catch {}

    setIsAuthenticated(false);
    setUserEmail(undefined);
    setBlockedUsers([]);
    setNotifications(DEFAULT_ANNOUNCEMENTS);
    setPlayer({
      ...INITIAL_PLAYER,
      displayName: "Guest Scholar",
      avatarInitials: "GS",
      school: "Visitor Portal",
    });
    setMissions(getMissionsForZone("TEEN"));
    setWeeklyChallenges(getWeeklyChallengesForZone("TEEN"));
    showToast("Signed out. Operating in guest session with fresh missions.");
  };

  const persistPlayerSettings = async (payload: Record<string, unknown>) => {
    if (!isAuthenticated) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("np_session_token") : null;
      await fetch("/api/player/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
    } catch {
      // silent fallback
    }
  };

  // Tab navigation with authentication enforcement for games
  const handleTabChange = (newTab: NavTab) => {
    setActiveTab(newTab);
    if (newTab === "games" && !isAuthenticated) {
      setAuthDefaultTab("signin");
      setIsAuthOpen(true);
      showToast("Sign in or register to enter and play games.");
    }
  };

  const handleAwardXP = (_amount: number, reason: string) => {
    showToast(`XP for "${reason}" logged in activity feed.`);
  };

  const handleVerifiedXP = (amount: number, totalXP: number, level: number) => {
    setPlayer((prev) => ({
      ...prev,
      xp: totalXP,
      level,
      nextLevelXp: level * 150,
      coins: prev.coins + Math.round(amount / 5),
    }));
    if (amount > 0) {
      showToast(`Verified drill saved · +${amount} XP`);
    }
  };

  const handleMissionProgress = (missionId: string, delta: number) => {
    setMissions((prev) =>
      prev.map((m) => {
        if (m.id === missionId && !m.completed) {
          const newProg = Math.min(m.target, m.progress + delta);
          const isDone = newProg >= m.target;
          if (isDone) {
            sounds.playCorrect();
            showToast(`Daily Mission Completed: ${m.title}!`);
          }
          return {
            ...m,
            progress: newProg,
            completed: isDone,
          };
        }
        return m;
      }),
    );

    // Advance matching weekly challenge counters
    setWeeklyChallenges((prev) =>
      prev.map((w, index) => {
        if (w.completed) return w;
        if (index === 0 || (missionId.includes("trivia") && w.gameType === "trivia")) {
          const newProg = Math.min(w.target, w.progress + delta);
          return {
            ...w,
            progress: newProg,
            completed: newProg >= w.target,
          };
        }
        return w;
      }),
    );
  };

  const handleClaimMission = (missionId: string) => {
    const daily = missions.find((m) => m.id === missionId);
    const weekly = weeklyChallenges.find((m) => m.id === missionId);
    const mission = daily || weekly;
    if (!mission || mission.claimed || !mission.completed) return;

    sounds.playTrophy();
    setPlayer((prev) => {
      const nextXp = prev.xp + mission.xpReward;
      const nextLvl = Math.floor(nextXp / 150) + 1;
      return {
        ...prev,
        xp: nextXp,
        level: Math.max(prev.level, nextLvl),
        nextLevelXp: Math.max(prev.level, nextLvl) * 150,
        coins: prev.coins + Math.round(mission.xpReward / 4),
      };
    });
    showToast(`Challenge Reward Claimed: +${mission.xpReward} XP!`);

    if (daily) {
      setMissions((prev) =>
        prev.map((m) => (m.id === missionId ? { ...m, claimed: true } : m)),
      );
    } else {
      setWeeklyChallenges((prev) =>
        prev.map((m) => (m.id === missionId ? { ...m, claimed: true } : m)),
      );
    }
  };

  const handleZoneChange = (zone: AgeZone) => {
    let mappedAge = 16;
    if (zone === "JUNIOR") mappedAge = 10;
    else if (zone === "TEEN") mappedAge = 16;
    else if (zone === "YOUTH") mappedAge = 21;
    else if (zone === "SENIOR") mappedAge = 27;

    setPlayer((prev) => ({
      ...prev,
      ageZone: zone,
      age: mappedAge,
      maxScreenTimeMinutes: zone === "JUNIOR" ? 60 : zone === "TEEN" ? 120 : zone === "YOUTH" ? 180 : 240,
    }));
    setMissions(getMissionsForZone(zone));
    setWeeklyChallenges(getWeeklyChallengesForZone(zone));
    showToast(`Academic Tier Configured: ${zone} (Age ${mappedAge}) - Tasks Recalibrated`);
  };

  const handleUpdateAge = (newAge: number) => {
    let zone: AgeZone = "TEEN";
    if (newAge <= 12) zone = "JUNIOR";
    else if (newAge <= 17) zone = "TEEN";
    else if (newAge <= 24) zone = "YOUTH";
    else zone = "SENIOR";

    setPlayer((prev) => ({
      ...prev,
      age: newAge,
      ageZone: zone,
    }));
    setMissions(getMissionsForZone(zone));
    setWeeklyChallenges(getWeeklyChallengesForZone(zone));
    showToast(`Age calibrated to ${newAge} (${zone} Tier) - Tasks Recalibrated`);
  };

  const handleUpdateAvatarCrest = (crest: string) => {
    setPlayer((prev) => ({ ...prev, avatarCrest: crest }));
    void persistPlayerSettings({ avatarCrest: crest });
    showToast(`Emblem updated to ${crest}`);
  };

  const handleUpdateName = (displayName: string) => {
    const initials = displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    setPlayer((prev) => ({
      ...prev,
      displayName,
      avatarInitials: initials || "NP",
    }));
    void persistPlayerSettings({ displayName });
    showToast(`Scholar name updated to ${displayName}`);
  };

  const handleUpdatePrivacy = async (visibility: ProfileVisibility) => {
    setPlayer((prev) => ({ ...prev, profileVisibility: visibility }));
    await persistPlayerSettings({ profileVisibility: visibility });
    showToast(`Privacy setting saved: ${visibility.replaceAll("_", " ")}`);
  };

  const handleBlockUser = async (targetName: string) => {
    const next = [...new Set([...blockedUsers, targetName])];
    setBlockedUsers(next);
    setPlayer((prev) => ({ ...prev, blockedUsers: next }));
    if (isAuthenticated) {
      const token = typeof window !== "undefined" ? localStorage.getItem("np_session_token") : null;
      await fetch("/api/safety/block", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ targetName }),
      });
    }
    showToast(`${targetName} blocked from your view.`);
  };

  const handleUnblockUser = async (targetName: string) => {
    const next = blockedUsers.filter((u) => u !== targetName);
    setBlockedUsers(next);
    setPlayer((prev) => ({ ...prev, blockedUsers: next }));
    if (isAuthenticated) {
      const token = typeof window !== "undefined" ? localStorage.getItem("np_session_token") : null;
      await fetch(`/api/safety/block?targetName=${encodeURIComponent(targetName)}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    }
    showToast(`${targetName} unblocked.`);
  };

  const handleMarkAllRead = async () => {
    const nowIso = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || nowIso })));
    if (isAuthenticated) {
      const token = typeof window !== "undefined" ? localStorage.getItem("np_session_token") : null;
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ markAll: true }),
      }).catch(() => {});
    }
  };

  const handleEarnCertificate = (certDetails: {
    id: string;
    courseId: string;
    courseTitle: string;
    issuedDate: string;
    scorePercent: number;
    grade: "Distinction" | "Merit" | "Pass";
  }) => {
    setPlayer((prev) => {
      const exists = prev.certificates.some((c) => c.courseId === certDetails.courseId);
      if (exists) {
        return {
          ...prev,
          certificates: prev.certificates.map((c) =>
            c.courseId === certDetails.courseId ? certDetails : c
          ),
        };
      }
      return {
        ...prev,
        certificates: [certDetails, ...prev.certificates],
      };
    });
    showToast(`Certificate of Academic Excellence Awarded: ${certDetails.courseTitle}`);
  };

  const handleSubmitWork = (item: CreativeSubmissionItem) => {
    setSubmissions((prev) => [item, ...prev]);
  };

  const handleSetFeaturedBadge = (badgeId: string) => {
    setPlayer((prev) => ({
      ...prev,
      featuredBadgeId: badgeId || undefined,
    }));
    if (badgeId) {
      showToast("Featured badge pinned to scholar profile.");
    } else {
      showToast("Featured badge unpinned.");
    }
  };

  const handleUpdateScreenTime = (minutes: number) => {
    setPlayer((prev) => ({ ...prev, maxScreenTimeMinutes: minutes }));
    setScreenBreakSnoozed(false);
    void persistPlayerSettings({ dailyScreenTimeLimitMins: minutes });
    showToast(`Daily study limit set to ${minutes} mins and persisted.`);
  };

  const isScreenLimitExceeded =
    isAuthenticated &&
    player.screenTimeTodayMinutes >= player.maxScreenTimeMinutes &&
    !screenBreakSnoozed &&
    activeTab !== "portals";

  return (
    <div className="min-h-screen bg-[#0B111E] text-slate-100 flex flex-col font-sans pb-24 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Bar */}
      <Navbar
        ageZone={player.ageZone}
        onZoneChange={handleZoneChange}
        xp={player.xp}
        level={player.level}
        streakDays={player.streakDays}
        coins={player.coins}
        onOpenRewards={() => setIsRewardsOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const next = !soundEnabled;
          setSoundEnabled(next);
          sounds.setEnabled(next);
        }}
        onOpenRoadmap={() => setIsRoadmapOpen(true)}
        onOpenPortals={() => setActiveTab("portals")}
        onOpenAuth={(tab) => {
          setAuthDefaultTab(tab || "signin");
          setIsAuthOpen(true);
        }}
        isAuthenticated={isAuthenticated}
        userName={player.displayName}
        userInitials={player.avatarInitials}
        onSignOut={handleSignOut}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
        screenTimeTodayMinutes={player.screenTimeTodayMinutes}
        maxScreenTimeMinutes={player.maxScreenTimeMinutes}
        activeTab={activeTab}
        onNavigateTab={handleTabChange}
      />

      {/* Floating XP Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-2xl shadow-emerald-950 border border-emerald-400/40">
          <Sparkles className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Viewport Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === "home" && (
          <HomeView
            player={player}
            missions={missions}
            weeklyChallenges={weeklyChallenges}
            onClaimMission={handleClaimMission}
            onNavigateTab={handleTabChange}
            onZoneChange={handleZoneChange}
            onOpenRoadmap={() => setIsRoadmapOpen(true)}
            onOpenRewards={() => setIsRewardsOpen(true)}
            isAuthenticated={isAuthenticated}
            onRequestAuth={(tab) => {
              setAuthDefaultTab(tab || "signin");
              setIsAuthOpen(true);
            }}
          />
        )}

        {activeTab === "games" && (
          <GameArena
            ageZone={player.ageZone}
            onAwardXP={handleAwardXP}
            onVerifiedXP={handleVerifiedXP}
            onMissionProgress={handleMissionProgress}
            isAuthenticated={isAuthenticated}
            onRequestAuth={(tab) => {
              setAuthDefaultTab(tab || "signin");
              setIsAuthOpen(true);
            }}
            onGameCompleted={() => {
              const token = typeof window !== "undefined" ? localStorage.getItem("np_session_token") : null;
              void refreshAuthenticatedData(token);
            }}
          />
        )}

        {activeTab === "compete" && (
          <CompetitionArena
            ageZone={player.ageZone}
            onVerifiedXP={handleVerifiedXP}
            isAuthenticated={isAuthenticated}
            onRequestAuth={() => {
              setAuthDefaultTab("signin");
              setIsAuthOpen(true);
            }}
            blockedUsers={blockedUsers}
            onReportTarget={setReportTarget}
            userSchool={player.school}
            profileVisibility={player.profileVisibility}
          />
        )}

        {activeTab === "learn" && (
          <SkillQuestPortal
            ageZone={player.ageZone}
            playerDisplayName={player.displayName}
            isAuthenticated={isAuthenticated}
            onRequestAuth={(tab) => {
              setAuthDefaultTab(tab || "signin");
              setIsAuthOpen(true);
            }}
            onAwardXP={handleAwardXP}
            onVerifiedXP={handleVerifiedXP}
            onMissionProgress={handleMissionProgress}
            onEarnCertificate={handleEarnCertificate}
          />
        )}

        {activeTab === "talent" && (
          <TalentArenaPortal
            ageZone={player.ageZone}
            playerDisplayName={player.displayName}
            isAuthenticated={isAuthenticated}
            onRequestAuth={(tab) => {
              setAuthDefaultTab(tab || "signin");
              setIsAuthOpen(true);
            }}
            onAwardXP={handleAwardXP}
          />
        )}

        {activeTab === "studio" && (
          <CreativeStudio
            ageZone={player.ageZone}
            submissions={submissions}
            onSubmitWork={handleSubmitWork}
            onAwardXP={handleAwardXP}
            blockedUsers={blockedUsers}
            onReportTarget={setReportTarget}
            isAuthenticated={isAuthenticated}
            onNavigateTab={handleTabChange}
          />
        )}

        {activeTab === "clubs" && (
          <ClubsAndCommunity
            ageZone={player.ageZone}
            onAwardXP={handleAwardXP}
            blockedUsers={blockedUsers}
            onReportTarget={setReportTarget}
            profileVisibility={player.profileVisibility}
            userDisplayName={player.displayName}
          />
        )}

        {activeTab === "profile" && (
          <PlayerProfileView
            player={player}
            onUpdateAvatarCrest={handleUpdateAvatarCrest}
            onUpdateName={handleUpdateName}
            onUpdateAge={handleUpdateAge}
            onSetFeaturedBadge={handleSetFeaturedBadge}
            onOpenAuth={(tab) => {
              setAuthDefaultTab(tab || "signin");
              setIsAuthOpen(true);
            }}
            onOpenRewards={() => setIsRewardsOpen(true)}
            onUpdatePrivacy={handleUpdatePrivacy}
            onUnblockUser={handleUnblockUser}
            onNavigateTab={handleTabChange}
            userEmail={userEmail}
            isAuthenticated={isAuthenticated}
          />
        )}

        {activeTab === "portals" && (
          <ParentAndSchoolPortal
            player={player}
            onUpdateScreenTime={handleUpdateScreenTime}
            isAuthenticated={isAuthenticated}
            onNavigateTab={handleTabChange}
          />
        )}
      </main>

      {/* Screen-Time Break Protective Overlay */}
      {isScreenLimitExceeded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-amber-700/60 bg-slate-900 p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-white">
                  Daily Screen-Time Cap Reached
                </h3>
                <p className="text-xs font-mono text-amber-300">
                  {player.screenTimeTodayMinutes} / {player.maxScreenTimeMinutes} Minutes Used Today
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Healthy study balance is enforced for the <strong>{player.ageZone}</strong> tier. Take a screen break or ask a parent/guardian to adjust your daily limit in Guardian Controls.
            </p>
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setScreenBreakSnoozed(true)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Finish Current View
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("portals");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Open Guardian Controls</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Access Floating Buttons for Roadmap & Rewards */}
      <div className="fixed bottom-20 right-4 z-30 flex flex-col gap-2">
        <button
          onClick={() => {
            sounds.playClick();
            setIsRewardsOpen(true);
          }}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 shadow-xl shadow-amber-950/60 hover:from-amber-400 hover:to-amber-600 transition-transform hover:scale-105"
          title="Pan-African Rewards & Airtime Store"
          aria-label="Rewards Store"
        >
          <Gift className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setIsRoadmapOpen(true);
          }}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-950 hover:bg-emerald-500 transition-transform hover:scale-105"
          title="Product Concept & Full Roadmap"
          aria-label="Product Roadmap"
        >
          <Map className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom PWA Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Safety Report & Block Modal */}
      <SafetyReportModal
        target={reportTarget}
        isAuthenticated={isAuthenticated}
        onClose={() => setReportTarget(null)}
        onBlockUser={handleBlockUser}
        onReportSubmitted={(msg) => showToast(msg)}
        onRequestAuth={() => {
          setAuthDefaultTab("signin");
          setIsAuthOpen(true);
        }}
      />

      {/* Product Roadmap Modal */}
      <RoadmapModal
        isOpen={isRoadmapOpen}
        onClose={() => setIsRoadmapOpen(false)}
      />

      {/* Pan-African Rewards & Airtime Store Modal */}
      <RewardsStoreModal
        isOpen={isRewardsOpen}
        onClose={() => setIsRewardsOpen(false)}
        player={player}
        onCoinsDeducted={(newCoins) => {
          setPlayer((prev) => ({ ...prev, coins: newCoins }));
          showToast(`Reward voucher successfully redeemed! Remaining balance: ${newCoins} coins.`);
        }}
        onNavigateTab={setActiveTab}
      />

      {/* NeonDB Authentication Modal (Sign In / Register) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        defaultTab={authDefaultTab}
      />
    </div>
  );
}
