export type AgeZone = "JUNIOR" | "TEEN" | "YOUTH" | "SENIOR";

export type ProfileVisibility =
  | "PRIVATE_GUARDIAN_ONLY"
  | "SCHOOL_AND_CLUB_ONLY"
  | "PUBLIC_OPT_IN";

export type GameDifficulty = "STANDARD" | "CHALLENGER" | "MASTER";
export type GameMode = "TIMED" | "UNTIMED";
export type GameCategoryFilter =
  | "ALL"
  | "TRIVIA"
  | "SPEED_RUSH"
  | "WORD"
  | "MATH"
  | "MEMORY"
  | "CODING";

export type NavTab =
  | "home"
  | "games"
  | "compete"
  | "learn"
  | "talent"
  | "studio"
  | "clubs"
  | "profile"
  | "portals";

export type EcosystemProduct = "hub" | "naijaplay" | "skillquest" | "talent_arena";

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

export interface GameHistoryRecord {
  id: string;
  gameSlug: string;
  gameTitle: string;
  category: string;
  score: number;
  accuracyPercent: number;
  durationSeconds: number;
  correctAnswers: number;
  questionsAnswered: number;
  isVerified: boolean;
  recordedAt: string;
}

export interface PersonalGameStats {
  gamesPlayed: number;
  averageAccuracy: number;
  bestScore: number;
  totalVerifiedXP: number;
  favoriteGameTitle: string;
  recentHistory: GameHistoryRecord[];
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: "ANNOUNCEMENT" | "ACHIEVEMENT" | "TOURNAMENT" | "SAFETY" | "GAME";
  readAt: string | null;
  createdAt: string;
  isSystemAnnouncement?: boolean;
}

export interface PlayerState {
  username?: string;
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
  profileVisibility?: ProfileVisibility;
  blockedUsers?: string[];
  achievementStats?: PlayerAchievementStats;
  personalStats?: PersonalGameStats;
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
  frequency?: "DAILY" | "WEEKLY";
  targetZone?: AgeZone;
  gameType?: "drills" | "memory" | "cipher" | "math_blitz" | "debugger" | "course" | "studio" | "tournament" | "club" | "trivia";
  targetRoute?: NavTab;
}

export interface GameCatalogEntry {
  id: string;
  title: string;
  subtitle: string;
  category: Exclude<GameCategoryFilter, "ALL">;
  arenaMode: "trivia" | "drills" | "cipher" | "math_blitz" | "memory" | "debugger";
  description: string;
  recommendedZones: AgeZone[];
  supportsUntimed: boolean;
  xpRange: string;
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
  visibility?: ProfileVisibility;
}

export interface RegionalRankingEntry {
  rank: number;
  state: string;
  region: string;
  scholarsCount: number;
  averageScore: number;
  totalPoints: number;
  topSchool: string;
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

export interface SchoolDerbyItem {
  id: string;
  name: string;
  state: string;
  city: string;
  type: "Federal Unity" | "State Model" | "Private Leading" | "Missionary Elite";
  scholarsCount: number;
  totalXP: number;
  goldMedals: number;
  silverMedals: number;
  bronzeMedals: number;
  derbyRank: number;
  motto: string;
  code: string;
}

export interface RewardItem {
  id: string;
  title: string;
  category: "AIRTIME_DATA" | "EXAM_VOUCHER" | "SCHOLARSHIP" | "MERCH";
  provider: "MTN" | "Airtel" | "Glo" | "9mobile" | "Safaricom" | "Vodacom" | "WAEC" | "JAMB" | "NECO" | "NaijaPlay";
  country: "NG" | "GH" | "KE" | "ZA" | "PAN_AFRICA";
  coinCost: number;
  fiatValue: string;
  description: string;
  instantDelivery: boolean;
}

export interface RedeemedVoucher {
  id: string;
  rewardId: string;
  title: string;
  fiatValue: string;
  voucherCode: string;
  redeemedAt: string;
  recipient: string;
  status: "ACTIVE" | "USED";
}

// ============================================================================
// SKILLQUEST DOMAIN TYPES
// ============================================================================

export interface LearningPathItem {
  id: string;
  title: string;
  trackCode: string;
  targetZones: AgeZone[];
  estimatedWeeks: number;
  outcomeSummary: string;
  courseIds: string[];
  milestoneBadge: string;
}

export interface SkillQuestProgressRecord {
  id: string;
  courseId: string;
  courseTitle: string;
  scorePercent: number;
  grade: "Distinction" | "Merit" | "Pass";
  certificateId: string;
  xpAwarded: number;
  completedAt: string;
  criteriaMet: string[];
}

export interface SkillAssignmentSubmission {
  id: string;
  courseId: string;
  projectTitle: string;
  artifactUrl: string;
  summaryNotes: string;
  status: "SUBMITTED" | "REVIEWED";
  instructorFeedback?: string;
  submittedAt: string;
}

export interface ClassTaskAssignment {
  id: string;
  organizationId: string;
  organizationName: string;
  classLabel: string;
  courseId: string;
  courseTitle: string;
  dueDate: string;
  instructions: string;
  assignedBy: string;
  createdAt: string;
}

export interface CustomInstructorCourse {
  id: string;
  organizationId: string | null;
  authorName: string;
  title: string;
  category: LearningCourse["category"];
  level: LearningCourse["level"];
  targetZone: AgeZone;
  overview: string;
  practicalPrompt: string;
  xpReward: number;
  sections: Array<{ title: string; body: string }>;
  quiz: LearningTestQuestion[];
  createdAt: string;
}

// ============================================================================
// TALENT ARENA DOMAIN TYPES
// ============================================================================

export type TalentCategory =
  | "Software & AI"
  | "Digital Art & Design"
  | "Engineering & Robotics"
  | "Creative Writing & Debate"
  | "STEM Research";

export interface PortfolioProjectItem {
  id: string;
  title: string;
  category: TalentCategory;
  summary: string;
  mediaUrl?: string;
  tags: string[];
  moderationStatus: "APPROVED" | "PENDING_REVIEW";
  createdAt: string;
}

export interface TalentProfileData {
  userId: string;
  displayName: string;
  username: string;
  ageZone: AgeZone;
  school: string;
  state: string;
  headline: string;
  primaryCategory: TalentCategory;
  bio: string;
  skills: string[];
  portfolio: PortfolioProjectItem[];
  updatedAt: string;
}

export interface JudgeRubricCriterion {
  id: string;
  label: string;
  maxPoints: number;
  description: string;
}

export interface JudgeScorecardItem {
  id: string;
  competitionId: string;
  submissionId: string;
  judgeUserId: string;
  judgeName: string;
  scoresByCriterion: Record<string, number>;
  totalScore: number;
  feedback: string;
  updatedAt: string;
}

export interface TalentCompetitionSubmission {
  id: string;
  competitionId: string;
  userId: string;
  participantName: string;
  participantZone: AgeZone;
  schoolName: string;
  projectTitle: string;
  category: TalentCategory;
  projectSummary: string;
  artifactUrl: string;
  moderationStatus: "APPROVED" | "PENDING_REVIEW";
  submittedAt: string;
  judgeScores: JudgeScorecardItem[];
  averageScore: number;
}

export interface TalentCompetitionItem {
  id: string;
  title: string;
  category: TalentCategory;
  visibility: "PUBLIC" | "SCHOOL_ORG" | "SPONSORED";
  organizationId: string | null;
  organizationName: string | null;
  sponsorName: string | null;
  sponsorshipDisclosure: string | null;
  targetZone: AgeZone | "ALL";
  status: "OPEN" | "JUDGING" | "FINALIZED";
  deadline: string;
  recognitionAward: string;
  rubric: JudgeRubricCriterion[];
  createdByUserId: string;
  organizerName: string;
  submissionsCount: number;
  createdAt: string;
}

// ============================================================================
// MULTI-TENANT ORGANIZATIONS & COMMERCIAL PLANS
// ============================================================================

export type OrganizationType = "SCHOOL" | "ACADEMY" | "NGO" | "SPONSOR_PARTNER";
export type OrganizationMemberRole =
  | "LEARNER"
  | "INSTRUCTOR"
  | "ORGANIZER"
  | "JUDGE"
  | "SCHOOL_ADMIN";

export interface OrganizationTenantItem {
  id: string;
  name: string;
  orgType: OrganizationType;
  joinCode: string;
  stateCode: string;
  planTier: SubscriptionPlanCode;
  myRole: OrganizationMemberRole;
  memberCount: number;
  createdAt: string;
}

export type SubscriptionPlanCode =
  | "FREE_SCHOLAR"
  | "SCHOLAR_PLUS"
  | "SCHOOL_LICENSE"
  | "NGO_PROGRAMME";

export interface ProductEntitlementState {
  planCode: SubscriptionPlanCode;
  planName: string;
  monthlyPriceLabel: string;
  naijaplayDailySessionsLimit: number | "UNLIMITED";
  skillquestAuthoringUnlocked: boolean;
  skillquestCustomPaths: boolean;
  talentArenaOrgCompetitions: boolean;
  minorAdFreeGuaranteed: true;
  outcomesUnaffectedByPayment: true;
  updatedAt: string;
}



