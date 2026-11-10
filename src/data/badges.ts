import { BadgeCategory, BadgeTier, PlayerState } from "@/types/naijaplay";

export interface BadgeDefinition {
  id: string;
  title: string;
  category: BadgeCategory;
  tier: BadgeTier;
  desc: string;
  lore: string;
  xpBonus: number;
  iconName: string;
  targetMilestone: number;
  milestoneUnit: string;
  evaluate: (player: PlayerState) => {
    isUnlocked: boolean;
    currentValue: number;
    progressPercent: number;
    formattedProgress: string;
    conferredNote?: string;
  };
}

export const TIER_CONFIG: Record<
  BadgeTier,
  {
    label: string;
    badgeBg: string;
    badgeBorder: string;
    textColor: string;
    glowColor: string;
    ringColor: string;
    accentBg: string;
  }
> = {
  BRONZE: {
    label: "Bronze Order",
    badgeBg: "from-amber-950/40 via-amber-900/20 to-slate-950",
    badgeBorder: "border-amber-700/50 hover:border-amber-500/80",
    textColor: "text-amber-400",
    glowColor: "shadow-amber-950/40",
    ringColor: "ring-amber-600/30",
    accentBg: "bg-amber-950/60 text-amber-300 border-amber-800/60",
  },
  SILVER: {
    label: "Silver Order",
    badgeBg: "from-slate-800/50 via-slate-700/20 to-slate-950",
    badgeBorder: "border-slate-500/50 hover:border-slate-300/80",
    textColor: "text-slate-200",
    glowColor: "shadow-slate-800/40",
    ringColor: "ring-slate-400/30",
    accentBg: "bg-slate-800/80 text-slate-200 border-slate-600/60",
  },
  GOLD: {
    label: "Gold Laureate",
    badgeBg: "from-yellow-950/40 via-amber-800/25 to-slate-950",
    badgeBorder: "border-yellow-500/60 hover:border-yellow-400",
    textColor: "text-yellow-300",
    glowColor: "shadow-yellow-950/50",
    ringColor: "ring-yellow-400/40",
    accentBg: "bg-yellow-950/70 text-yellow-300 border-yellow-700/70",
  },
  OBSIDIAN: {
    label: "Obsidian Fellow",
    badgeBg: "from-emerald-950/50 via-teal-900/30 to-slate-950",
    badgeBorder: "border-emerald-500/60 hover:border-emerald-400",
    textColor: "text-emerald-300",
    glowColor: "shadow-emerald-950/60",
    ringColor: "ring-emerald-400/40",
    accentBg: "bg-emerald-950/80 text-emerald-300 border-emerald-700/80",
  },
};

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // --------------------------------------------------------------------------
  // 1. LEARNING & ACADEMIC MASTERY
  // --------------------------------------------------------------------------
  {
    id: "foundation-scholar",
    title: "Foundation Scholar",
    category: "LEARNING",
    tier: "BRONZE",
    desc: "Earn your first accredited Certificate of Academic Excellence.",
    lore: "Awarded to initiates who complete rigorous coursework and formally register their scholarly credentials on the academic ledger.",
    xpBonus: 100,
    iconName: "GraduationCap",
    targetMilestone: 1,
    milestoneUnit: "Certificate",
    evaluate: (player) => {
      const count = player.certificates.length;
      const target = 1;
      const isUnlocked = count >= target;
      return {
        isUnlocked,
        currentValue: count,
        progressPercent: Math.min(100, Math.round((count / target) * 100)),
        formattedProgress: `${count} / ${target} Earned`,
        conferredNote: isUnlocked ? "Accredited Certificate on Record" : undefined,
      };
    },
  },
  {
    id: "deans-honour-roll",
    title: "Dean's Honour Roll",
    category: "LEARNING",
    tier: "SILVER",
    desc: "Earn at least 2 course certificates with Distinction grade (≥90%).",
    lore: "Reserved for scholars displaying extraordinary academic rigor, consistently outperforming standard benchmarks in university-grade modules.",
    xpBonus: 250,
    iconName: "Crown",
    targetMilestone: 2,
    milestoneUnit: "Distinctions",
    evaluate: (player) => {
      const count = player.certificates.filter((c) => c.scorePercent >= 90).length;
      const target = 2;
      const isUnlocked = count >= target;
      return {
        isUnlocked,
        currentValue: count,
        progressPercent: Math.min(100, Math.round((count / target) * 100)),
        formattedProgress: `${count} / ${target} Distinctions`,
        conferredNote: isUnlocked ? "Double Distinction Conferred" : undefined,
      };
    },
  },
  {
    id: "polymath-laureate",
    title: "Polymath Laureate",
    category: "LEARNING",
    tier: "GOLD",
    desc: "Complete coursework and earn 4 accredited academic certificates.",
    lore: "Reflects the ancient tradition of African polymaths in Timbuktu and Alexandria who mastered multiple intersecting spheres of knowledge.",
    xpBonus: 500,
    iconName: "BookOpen",
    targetMilestone: 4,
    milestoneUnit: "Certificates",
    evaluate: (player) => {
      const count = player.certificates.length;
      const target = 4;
      const isUnlocked = count >= target;
      return {
        isUnlocked,
        currentValue: count,
        progressPercent: Math.min(100, Math.round((count / target) * 100)),
        formattedProgress: `${count} / ${target} Certificates`,
        conferredNote: isUnlocked ? "Multidisciplinary Polymath Standing" : undefined,
      };
    },
  },
  {
    id: "algorithmic-architect",
    title: "Algorithmic Architect",
    category: "LEARNING",
    tier: "GOLD",
    desc: "Pass the Computer Science & Algorithmic Logic Examination with Distinction.",
    lore: "Conferred upon computer scientists who exhibit mastery over computational complexity, balanced trees, and deterministic algorithmic proofs.",
    xpBonus: 350,
    iconName: "Terminal",
    targetMilestone: 1,
    milestoneUnit: "CS Distinction",
    evaluate: (player) => {
      const csCert = player.certificates.find(
        (c) =>
          c.courseId.includes("cs") ||
          c.courseTitle.toLowerCase().includes("computer") ||
          c.courseTitle.toLowerCase().includes("algorithm"),
      );
      const isUnlocked = Boolean(csCert && csCert.scorePercent >= 90);
      const currentValue = isUnlocked ? 1 : csCert ? 0.5 : 0;
      return {
        isUnlocked,
        currentValue: isUnlocked ? 1 : 0,
        progressPercent: isUnlocked ? 100 : csCert ? 50 : 0,
        formattedProgress: isUnlocked
          ? `Score ${csCert?.scorePercent}% (Distinction)`
          : csCert
          ? `Score ${csCert.scorePercent}% (Requires ≥90%)`
          : "Exam Not Yet Attempted",
        conferredNote: isUnlocked ? "CS Distinction Verified" : undefined,
      };
    },
  },
  {
    id: "pan-african-historian",
    title: "Pan-African Historian",
    category: "LEARNING",
    tier: "SILVER",
    desc: "Earn certification in African Civilizations & Sahelian Trade.",
    lore: "Honours deep scholarship in West African metallurgical centers, the Nok culture, Benin earthworks, and trans-Saharan diplomatic relations.",
    xpBonus: 200,
    iconName: "Globe",
    targetMilestone: 1,
    milestoneUnit: "History Cert",
    evaluate: (player) => {
      const histCert = player.certificates.find(
        (c) =>
          c.courseId.includes("hist") ||
          c.courseTitle.toLowerCase().includes("civilization") ||
          c.courseTitle.toLowerCase().includes("history"),
      );
      const isUnlocked = Boolean(histCert);
      return {
        isUnlocked,
        currentValue: isUnlocked ? 1 : 0,
        progressPercent: isUnlocked ? 100 : 0,
        formattedProgress: isUnlocked
          ? `Conferred (${histCert?.scorePercent}%)`
          : "History Exam Pending",
        conferredNote: isUnlocked ? "Verified Historical Scholar" : undefined,
      };
    },
  },
  {
    id: "sovereign-economist",
    title: "Sovereign Economist",
    category: "LEARNING",
    tier: "GOLD",
    desc: "Conquer Macroeconomics & Wealth Architecture or AfCFTA Policy.",
    lore: "Recognizes expertise in monetary mechanics, real exchange equilibria, industrial manufacturing policy, and intra-African trade architecture.",
    xpBonus: 350,
    iconName: "TrendingUp",
    targetMilestone: 1,
    milestoneUnit: "Economics Cert",
    evaluate: (player) => {
      const econCert = player.certificates.find(
        (c) =>
          c.courseId.includes("econ") ||
          c.courseTitle.toLowerCase().includes("macroeconomic") ||
          c.courseTitle.toLowerCase().includes("finance"),
      );
      const isUnlocked = Boolean(econCert);
      return {
        isUnlocked,
        currentValue: isUnlocked ? 1 : 0,
        progressPercent: isUnlocked ? 100 : 0,
        formattedProgress: isUnlocked
          ? `Conferred (${econCert?.scorePercent}%)`
          : "Economics Exam Pending",
        conferredNote: isUnlocked ? "Macroeconomic Fellow" : undefined,
      };
    },
  },
  {
    id: "grand-academic-fellow",
    title: "Grand Academic Fellow",
    category: "LEARNING",
    tier: "OBSIDIAN",
    desc: "Earn 6 certificates and advance past Level 15 in academic rank.",
    lore: "The highest academic order in the NaijaPlay ecosystem, reserved for visionary scholars who define institutional excellence.",
    xpBonus: 1000,
    iconName: "Sparkles",
    targetMilestone: 6,
    milestoneUnit: "Certificates & Lvl 15+",
    evaluate: (player) => {
      const certCount = player.certificates.length;
      const levelMet = player.level >= 15;
      const isUnlocked = certCount >= 6 && levelMet;
      const certProgress = Math.min(100, Math.round((certCount / 6) * 50));
      const levelProgress = Math.min(100, Math.round((player.level / 15) * 50));
      return {
        isUnlocked,
        currentValue: certCount,
        progressPercent: isUnlocked ? 100 : certProgress + levelProgress,
        formattedProgress: `${certCount}/6 Certs · Lvl ${player.level}/15`,
        conferredNote: isUnlocked ? "Obsidian Academic Fellowship" : undefined,
      };
    },
  },

  // --------------------------------------------------------------------------
  // 2. COMPETITION & OLYMPIAD MILESTONES
  // --------------------------------------------------------------------------
  {
    id: "olympiad-initiate",
    title: "Olympiad Initiate",
    category: "COMPETITION",
    tier: "BRONZE",
    desc: "Register and enroll in an Interscholastic Olympiad Tournament.",
    lore: "Commemorates a scholar's bold entrance into national competition, testing intellect against the brightest minds across Nigeria.",
    xpBonus: 120,
    iconName: "Trophy",
    targetMilestone: 1,
    milestoneUnit: "Tournament",
    evaluate: (player) => {
      const tourneyCount = player.achievementStats?.tournamentsEnteredCount ?? 1;
      const target = 1;
      const isUnlocked = tourneyCount >= target;
      return {
        isUnlocked,
        currentValue: tourneyCount,
        progressPercent: isUnlocked ? 100 : 0,
        formattedProgress: `${tourneyCount} / ${target} Enrolled`,
        conferredNote: isUnlocked ? "Olympiad Roster Verified" : undefined,
      };
    },
  },
  {
    id: "national-qualifier-contender",
    title: "National Contender",
    category: "COMPETITION",
    tier: "SILVER",
    desc: "Successfully pass an Olympiad Qualifying Round with verified score.",
    lore: "Requires solving multi-disciplinary problems under timed examination pressure in front of the anti-cheat verification engine.",
    xpBonus: 250,
    iconName: "Medal",
    targetMilestone: 1,
    milestoneUnit: "Qualifier Round",
    evaluate: (player) => {
      const passed = player.achievementStats?.olympiadQualifiersPassed ?? 1;
      const target = 1;
      const isUnlocked = passed >= target;
      return {
        isUnlocked,
        currentValue: passed,
        progressPercent: isUnlocked ? 100 : 0,
        formattedProgress: `${passed} / ${target} Rounds Passed`,
        conferredNote: isUnlocked ? "National Qualifier Confirmed" : undefined,
      };
    },
  },
  {
    id: "derby-champion",
    title: "Derby Champion",
    category: "COMPETITION",
    tier: "GOLD",
    desc: "Complete 3 Olympiad Qualifier rounds and represent your school.",
    lore: "Celebrates tournament endurance and interschool sportsmanship, elevating the scholar's school on the National Interscholastic Leaderboard.",
    xpBonus: 500,
    iconName: "Award",
    targetMilestone: 3,
    milestoneUnit: "Qualifiers",
    evaluate: (player) => {
      const passed = player.achievementStats?.olympiadQualifiersPassed ?? 1;
      const target = 3;
      const isUnlocked = passed >= target;
      return {
        isUnlocked,
        currentValue: passed,
        progressPercent: Math.min(100, Math.round((passed / target) * 100)),
        formattedProgress: `${passed} / ${target} Qualifiers`,
        conferredNote: isUnlocked ? "School Derby Champion" : undefined,
      };
    },
  },
  {
    id: "speed-drill-master",
    title: "Speed Drill Master",
    category: "COMPETITION",
    tier: "SILVER",
    desc: "Complete 5 timed speed drills in the Game Arena with high accuracy.",
    lore: "Demonstrates rapid cognitive recall and mental arithmetic fluency without hesitation under time constraints.",
    xpBonus: 200,
    iconName: "Zap",
    targetMilestone: 5,
    milestoneUnit: "Drills",
    evaluate: (player) => {
      const drills = player.achievementStats?.drillsCompleted ?? 4;
      const target = 5;
      const isUnlocked = drills >= target;
      return {
        isUnlocked,
        currentValue: drills,
        progressPercent: Math.min(100, Math.round((drills / target) * 100)),
        formattedProgress: `${drills} / ${target} Drills Completed`,
        conferredNote: isUnlocked ? "Speed Drill Master Verified" : undefined,
      };
    },
  },
  {
    id: "apex-victor",
    title: "Apex Victor",
    category: "COMPETITION",
    tier: "OBSIDIAN",
    desc: "Win 5 Olympiad Derbies and accumulate 2,500+ Competition XP.",
    lore: "The pinnacle of interscholastic competition, standing atop the podium of all secondary and tertiary institutions in the federation.",
    xpBonus: 1000,
    iconName: "ShieldCheck",
    targetMilestone: 5,
    milestoneUnit: "Derbies & 2,500 XP",
    evaluate: (player) => {
      const passed = player.achievementStats?.olympiadQualifiersPassed ?? 1;
      const target = 5;
      const isUnlocked = passed >= target && player.xp >= 2500;
      const derbiesProgress = Math.min(50, (passed / target) * 50);
      const xpProgress = Math.min(50, (player.xp / 2500) * 50);
      return {
        isUnlocked,
        currentValue: passed,
        progressPercent: isUnlocked ? 100 : Math.round(derbiesProgress + xpProgress),
        formattedProgress: `${passed}/5 Derbies · ${player.xp}/2,500 XP`,
        conferredNote: isUnlocked ? "National Apex Champion" : undefined,
      };
    },
  },

  // --------------------------------------------------------------------------
  // 3. DISCIPLINE & HABIT MILESTONES
  // --------------------------------------------------------------------------
  {
    id: "daily-devotion-3d",
    title: "Consistent Scholar",
    category: "DISCIPLINE",
    tier: "BRONZE",
    desc: "Maintain an unbroken daily academic study streak of 3 days.",
    lore: "Consistency is the foundation of intellectual achievement; small daily increments compound into profound mastery.",
    xpBonus: 80,
    iconName: "Flame",
    targetMilestone: 3,
    milestoneUnit: "Days Streak",
    evaluate: (player) => {
      const streak = player.streakDays;
      const target = 3;
      const isUnlocked = streak >= target;
      return {
        isUnlocked,
        currentValue: streak,
        progressPercent: Math.min(100, Math.round((streak / target) * 100)),
        formattedProgress: `${streak} / ${target} Days Active`,
        conferredNote: isUnlocked ? "3-Day Streak Maintained" : undefined,
      };
    },
  },
  {
    id: "unwavering-discipline-7d",
    title: "Unwavering Discipline",
    category: "DISCIPLINE",
    tier: "SILVER",
    desc: "Maintain a consecutive 7-day academic study streak.",
    lore: "A full week of uninterrupted daily learning, showing exceptional self-regulation and dedication to educational growth.",
    xpBonus: 200,
    iconName: "Flame",
    targetMilestone: 7,
    milestoneUnit: "Days Streak",
    evaluate: (player) => {
      const streak = player.streakDays;
      const target = 7;
      const isUnlocked = streak >= target;
      return {
        isUnlocked,
        currentValue: streak,
        progressPercent: Math.min(100, Math.round((streak / target) * 100)),
        formattedProgress: `${streak} / ${target} Days Active`,
        conferredNote: isUnlocked ? "Weekly Streak Conferred" : undefined,
      };
    },
  },
  {
    id: "fortnight-of-excellence-14d",
    title: "Fortnight of Excellence",
    category: "DISCIPLINE",
    tier: "GOLD",
    desc: "Maintain a consecutive 14-day unbroken study streak.",
    lore: "Two consecutive weeks of persistent intellectual inquiry, building study habits that prepare young minds for lifelong success.",
    xpBonus: 450,
    iconName: "Flame",
    targetMilestone: 14,
    milestoneUnit: "Days Streak",
    evaluate: (player) => {
      const streak = player.streakDays;
      const target = 14;
      const isUnlocked = streak >= target;
      return {
        isUnlocked,
        currentValue: streak,
        progressPercent: Math.min(100, Math.round((streak / target) * 100)),
        formattedProgress: `${streak} / ${target} Days Active`,
        conferredNote: isUnlocked ? "Fortnight Record Achieved" : undefined,
      };
    },
  },
  {
    id: "academic-xp-titan",
    title: "Academic XP Titan",
    category: "DISCIPLINE",
    tier: "OBSIDIAN",
    desc: "Amass 3,000 Total Academic XP across courses, drills, and olympiads.",
    lore: "Reflects thousands of solved problems, verified examination questions, and completed peer exercises.",
    xpBonus: 800,
    iconName: "Sparkles",
    targetMilestone: 3000,
    milestoneUnit: "XP",
    evaluate: (player) => {
      const xp = player.xp;
      const target = 3000;
      const isUnlocked = xp >= target;
      return {
        isUnlocked,
        currentValue: xp,
        progressPercent: Math.min(100, Math.round((xp / target) * 100)),
        formattedProgress: `${xp.toLocaleString()} / ${target.toLocaleString()} XP`,
        conferredNote: isUnlocked ? "XP Titan Milestone Reached" : undefined,
      };
    },
  },

  // --------------------------------------------------------------------------
  // 4. CREATIVE & SCHOLARLY COMMUNITY MILESTONES
  // --------------------------------------------------------------------------
  {
    id: "society-fellow",
    title: "Research Circle Fellow",
    category: "CREATIVE_COMMUNITY",
    tier: "BRONZE",
    desc: "Enroll in at least 1 Academic Society and join collaborative study.",
    lore: "Scholars flourish in community; joining fellow minds fosters peer-reviewed critique, curiosity, and shared ambition.",
    xpBonus: 100,
    iconName: "Users",
    targetMilestone: 1,
    milestoneUnit: "Society",
    evaluate: (player) => {
      const count = player.achievementStats?.societiesJoined ?? 2;
      const target = 1;
      const isUnlocked = count >= target;
      return {
        isUnlocked,
        currentValue: count,
        progressPercent: isUnlocked ? 100 : 0,
        formattedProgress: `${count} / ${target} Societies`,
        conferredNote: isUnlocked ? "Active Society Fellow" : undefined,
      };
    },
  },
  {
    id: "problem-set-laureate",
    title: "Problem Set Laureate",
    category: "CREATIVE_COMMUNITY",
    tier: "SILVER",
    desc: "Solve 3 interactive problem sets in Academic Societies.",
    lore: "Commends scholars who dissect complex domain challenges, producing rigorous proofs and clean problem resolutions.",
    xpBonus: 220,
    iconName: "CheckCircle2",
    targetMilestone: 3,
    milestoneUnit: "Problems",
    evaluate: (player) => {
      const solved = player.achievementStats?.problemsSolved ?? 2;
      const target = 3;
      const isUnlocked = solved >= target;
      return {
        isUnlocked,
        currentValue: solved,
        progressPercent: Math.min(100, Math.round((solved / target) * 100)),
        formattedProgress: `${solved} / ${target} Problems Solved`,
        conferredNote: isUnlocked ? "Laureate Problem Solver" : undefined,
      };
    },
  },
  {
    id: "studio-visual-architect",
    title: "Visual Studio Architect",
    category: "CREATIVE_COMMUNITY",
    tier: "SILVER",
    desc: "Publish an engineering composition to the Scholarly Showcase.",
    lore: "Bridging the arts and sciences, visual diagrams make intricate architectural and mathematical theories immediately intelligible.",
    xpBonus: 200,
    iconName: "Palette",
    targetMilestone: 1,
    milestoneUnit: "Published Work",
    evaluate: (player) => {
      const count = player.achievementStats?.studioPublished ?? 1;
      const target = 1;
      const isUnlocked = count >= target;
      return {
        isUnlocked,
        currentValue: count,
        progressPercent: isUnlocked ? 100 : 0,
        formattedProgress: `${count} / ${target} Published Works`,
        conferredNote: isUnlocked ? "Published Studio Artist" : undefined,
      };
    },
  },
  {
    id: "master-polytechnic",
    title: "Master Polytechnic",
    category: "CREATIVE_COMMUNITY",
    tier: "GOLD",
    desc: "Solve 5 Society Problem Sets and publish 2 Studio Compositions.",
    lore: "Awarded to those rare youth who balance analytical computation with inventive graphic communication.",
    xpBonus: 450,
    iconName: "Atom",
    targetMilestone: 7,
    milestoneUnit: "Combined Activities",
    evaluate: (player) => {
      const solved = player.achievementStats?.problemsSolved ?? 2;
      const published = player.achievementStats?.studioPublished ?? 1;
      const total = solved + published;
      const target = 7;
      const isUnlocked = solved >= 5 && published >= 2;
      return {
        isUnlocked,
        currentValue: total,
        progressPercent: isUnlocked ? 100 : Math.min(100, Math.round((total / target) * 100)),
        formattedProgress: `${solved}/5 Solved · ${published}/2 Published`,
        conferredNote: isUnlocked ? "Master Polytechnic Conferred" : undefined,
      };
    },
  },
];
