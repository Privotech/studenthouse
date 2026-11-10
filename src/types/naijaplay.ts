export type AgeZone = "JUNIOR" | "TEEN" | "YOUTH" | "SENIOR";

export type NavTab =
  | "home"
  | "games"
  | "compete"
  | "learn"
  | "studio"
  | "clubs"
  | "profile"
  | "portals";

export type BadgeTier = "BRONZE" | "SILVER" | "GOLD" | "OBSIDIAN";

export type BadgeCategory =
  | "LEARNING"
  | "COMPETITION"
  | "DISCIPLINE"
  | "CREATIVE_COMMUNITY";

export interface PlayerAchievementStats {
  tournamentsEnteredCount: number;
  olympiadQualifiersPassed: number;
  drillsCompleted: number;
  societiesJoined: number;
  problemsSolved: number;
  studioPublished: number;
}

export interface PlayerState {
  displayName: string;
  avatarInitials: string;
  avatarCrest: string; // "Vanguard" | "Falcon" | "Apex" | "Atlas" | "Summit" | "Scholar"
  avatarBg: string;
  ageZone: AgeZone;
  age: number; // 6 to 30
  level: number;
  xp: number;
  nextLevelXp: number;
  streakDays: number;
  coins: number;
  badges: string[];
  featuredBadgeId?: string;
  achievementStats?: PlayerAchievementStats;
  school: string;
  state: string;
  certificates: Array<{
    id: string;
    courseId: string;
    courseTitle: string;
    issuedDate: string;
    scorePercent: number;
    grade: "Distinction" | "Merit" | "Pass";
  }>;
  screenTimeTodayMinutes: number;
  maxScreenTimeMinutes: number;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  iconName: string;
  targetZone?: AgeZone;
  gameType?: "drills" | "memory" | "cipher" | "math_blitz" | "debugger" | "course" | "studio" | "tournament" | "club";
  targetRoute?: NavTab;
}

export interface EducationalGame {
  id: string;
  title: string;
  discipline: string;
  description: string;
  targetZone: AgeZone;
  iconName: string;
  difficulty: "Foundational (Ages 6-12)" | "Secondary (Ages 13-17)" | "Advanced (Ages 18-24)" | "Professional (Ages 25-30)";
  xpReward: number;
}

export interface LearningTestQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface LearningCourse {
  id: string;
  title: string;
  category:
    | "Mathematics"
    | "Computer Science"
    | "Physical Sciences"
    | "Biological Sciences"
    | "English & Literature"
    | "Financial Economics"
    | "African & World History"
    | "Civic Governance & Law"
    | "Artificial Intelligence"
    | "Renewable Energy & Engineering"
    | "Biotechnology & Health"
    | "International Relations & Geopolitics";
  level: "Foundational" | "Intermediate" | "Advanced" | "Professional";
  targetZone: AgeZone;
  iconName: string;
  xpReward: number;
  overview: string;
  learningOutcomes: string[];
  flashcards?: Array<{
    term: string;
    definition: string;
    context: string;
  }>;
  curriculumSections: Array<{
    title: string;
    body: string[];
    keyFormulasOrTakeaways?: string[];
    caseStudy?: {
      title: string;
      narrative: string;
    };
  }>;
  examination: LearningTestQuestion[];
}

export interface Tournament {
  id: string;
  title: string;
  type: "Individual" | "School vs School" | "State vs State";
  game: string;
  prizePool: string;
  participantsCount: number;
  startsIn: string;
  status: "Live Now" | "Upcoming" | "Completed";
  targetZone: AgeZone | "All Zones";
  bannerBg: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  initials: string;
  score: number;
  school?: string;
  state: string;
  zone: AgeZone;
  badge: string;
}

export interface CreativeSubmissionItem {
  id: string;
  title: string;
  author: string;
  authorZone: AgeZone;
  category: "Design Composition" | "Analytical Narrative" | "Software Architecture";
  content: string; // Image data URL or text
  type: "image" | "text";
  likes: number;
  moderationStatus: "Approved" | "Pending";
  tags: string[];
  createdAt: string; // ISO format or academic term
}

export interface ClubItem {
  id: string;
  name: string;
  tagline: string;
  category: "Computer Science" | "Competitive Mathematics" | "Visual Design" | "Biotechnology" | "Constitutional Law";
  membersCount: number;
  bannerGradient: string;
  targetZone: AgeZone | "All";
  activities: string[];
  isJoined?: boolean;
}
