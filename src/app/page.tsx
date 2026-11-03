"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { HomeView } from "@/components/HomeView";
import { GameArena } from "@/components/GameArena";
import { CompetitionArena } from "@/components/CompetitionArena";
import { LearnAndGrow } from "@/components/LearnAndGrow";
import { CreativeStudio } from "@/components/CreativeStudio";
import { ClubsAndCommunity } from "@/components/ClubsAndCommunity";
import { PlayerProfileView } from "@/components/PlayerProfileView";
import { ParentAndSchoolPortal } from "@/components/ParentAndSchoolPortal";
import { AdminModerationModal } from "@/components/AdminModerationModal";
import { RoadmapModal } from "@/components/RoadmapModal";
import { AgeZone, CreativeSubmissionItem, NavTab, PlayerState } from "@/types/naijaplay";
import { CREATIVE_SUBMISSIONS, INITIAL_MISSIONS, INITIAL_PLAYER } from "@/data/mockData";
import { sounds } from "@/lib/audio";
import { Sparkles, ShieldAlert, Map } from "lucide-react";

export default function NaijaPlayApp() {
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [player, setPlayer] = useState<PlayerState>(INITIAL_PLAYER);
  const [missions, setMissions] = useState(INITIAL_MISSIONS);
  const [submissions, setSubmissions] = useState<CreativeSubmissionItem[]>(CREATIVE_SUBMISSIONS);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Floating notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Award XP and calculate Level Up
  const handleAwardXP = (amount: number, reason: string) => {
    setPlayer((prev) => {
      const newXp = prev.xp + amount;
      let newLevel = prev.level;
      let newNextXp = prev.nextLevelXp;

      if (newXp >= newNextXp) {
        newLevel += 1;
        newNextXp = newLevel * 150;
        sounds.playLevelUp();
        showToast(`Level Conferred: Advanced to Level ${newLevel}! (+${amount} XP)`);
      } else {
        showToast(`+${amount} XP Conferred · ${reason}`);
      }

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        nextLevelXp: newNextXp,
        coins: prev.coins + Math.round(amount / 5),
      };
    });
  };

  // Update Mission progress
  const handleMissionProgress = (missionId: string, delta: number) => {
    setMissions((prev) =>
      prev.map((m) => {
        if (m.id === missionId && !m.completed) {
          const newProg = Math.min(m.target, m.progress + delta);
          const isDone = newProg >= m.target;
          if (isDone) {
            sounds.playCorrect();
            showToast(`Academic Goal Fulfilled: ${m.title}!`);
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
  };

  // Claim mission reward
  const handleClaimMission = (missionId: string) => {
    const mission = missions.find((m) => m.id === missionId);
    if (!mission || mission.claimed || !mission.completed) return;

    sounds.playTrophy();
    handleAwardXP(mission.xpReward, `Completed Goal: ${mission.title}`);

    setMissions((prev) =>
      prev.map((m) => (m.id === missionId ? { ...m, claimed: true } : m)),
    );
  };

  // Age zone switch (Ages 6 to 30)
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
    showToast(`Academic Tier Configured: ${zone} (Age ${mappedAge})`);
  };

  // Update player Age directly (6 to 30)
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
    showToast(`Age calibrated to ${newAge} (${zone} Tier)`);
  };

  // Avatar crest update
  const handleUpdateAvatarCrest = (crest: string) => {
    setPlayer((prev) => ({ ...prev, avatarCrest: crest }));
    showToast(`Emblem updated to ${crest}`);
  };

  // Name update
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
    showToast(`Scholar name set to ${displayName}`);
  };

  // Certificate earned from examination
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

  // Submit creative studio work
  const handleSubmitWork = (item: CreativeSubmissionItem) => {
    setSubmissions((prev) => [item, ...prev]);
  };

  // Screen time limit update
  const handleUpdateScreenTime = (minutes: number) => {
    setPlayer((prev) => ({ ...prev, maxScreenTimeMinutes: minutes }));
    showToast(`Daily study limit set to ${minutes} mins.`);
  };

  return (
    <div className="min-h-screen bg-[#0B111E] text-slate-100 flex flex-col font-sans pb-20 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Bar */}
      <Navbar
        ageZone={player.ageZone}
        onZoneChange={handleZoneChange}
        xp={player.xp}
        level={player.level}
        streakDays={player.streakDays}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const next = !soundEnabled;
          setSoundEnabled(next);
          sounds.setEnabled(next);
        }}
        onOpenRoadmap={() => setIsRoadmapOpen(true)}
        onOpenPortals={() => setActiveTab("portals")}
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
            onClaimMission={handleClaimMission}
            onNavigateTab={setActiveTab}
            onZoneChange={handleZoneChange}
            onOpenRoadmap={() => setIsRoadmapOpen(true)}
          />
        )}

        {activeTab === "games" && (
          <GameArena
            ageZone={player.ageZone}
            onAwardXP={handleAwardXP}
            onMissionProgress={handleMissionProgress}
          />
        )}

        {activeTab === "compete" && (
          <CompetitionArena
            ageZone={player.ageZone}
            onAwardXP={handleAwardXP}
          />
        )}

        {activeTab === "learn" && (
          <LearnAndGrow
            ageZone={player.ageZone}
            onAwardXP={handleAwardXP}
            onMissionProgress={handleMissionProgress}
            onEarnCertificate={handleEarnCertificate}
          />
        )}

        {activeTab === "studio" && (
          <CreativeStudio
            ageZone={player.ageZone}
            submissions={submissions}
            onSubmitWork={handleSubmitWork}
            onAwardXP={handleAwardXP}
          />
        )}

        {activeTab === "clubs" && (
          <ClubsAndCommunity
            ageZone={player.ageZone}
            onAwardXP={handleAwardXP}
          />
        )}

        {activeTab === "profile" && (
          <PlayerProfileView
            player={player}
            onUpdateAvatarCrest={handleUpdateAvatarCrest}
            onUpdateName={handleUpdateName}
            onUpdateAge={handleUpdateAge}
          />
        )}

        {activeTab === "portals" && (
          <ParentAndSchoolPortal
            player={player}
            onUpdateScreenTime={handleUpdateScreenTime}
          />
        )}
      </main>

      {/* Quick Access Floating Buttons for Roadmap & Admin Moderation */}
      <div className="fixed bottom-20 right-4 z-30 flex flex-col gap-2">
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

        <button
          onClick={() => {
            sounds.playClick();
            setIsAdminOpen(true);
          }}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 shadow-xl hover:text-white hover:bg-slate-700 transition-transform hover:scale-105"
          title="Module 8: Admin & Moderation Queue"
          aria-label="Admin Moderation"
        >
          <ShieldAlert className="w-5 h-5 text-emerald-400" />
        </button>
      </div>

      {/* Bottom PWA Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Product Roadmap Modal */}
      <RoadmapModal
        isOpen={isRoadmapOpen}
        onClose={() => setIsRoadmapOpen(false)}
      />

      {/* Admin Moderation Modal */}
      <AdminModerationModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />
    </div>
  );
}
