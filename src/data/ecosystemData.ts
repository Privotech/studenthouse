import {
  LearningPathItem,
  ProductEntitlementState,
  SubscriptionPlanCode,
  TalentCompetitionItem,
  TalentCompetitionSubmission,
  TalentProfileData,
} from "@/types/naijaplay";

export const SKILLQUEST_LEARNING_PATHS: LearningPathItem[] = [
  {
    id: "sq-path-stem-foundations",
    trackCode: "PATH-01",
    title: "Foundational STEM & Logical Numeracy",
    targetZones: ["JUNIOR"],
    estimatedWeeks: 4,
    outcomeSummary:
      "Build core confidence in fractions, earth systems, spatial reasoning, and structured vocabulary for Upper Primary scholars.",
    courseIds: ["math-primary-fractions", "science-basic-ecosystems", "english-grammar-comprehension"],
    milestoneBadge: "Foundational Scholar",
  },
  {
    id: "sq-path-engineering-cs",
    trackCode: "PATH-02",
    title: "Algorithms, Calculus & Engineering Systems",
    targetZones: ["TEEN", "YOUTH"],
    estimatedWeeks: 8,
    outcomeSummary:
      "Progress from secondary algebra and computational thinking into Big-O complexity, ACID databases, and differential modeling.",
    courseIds: ["math-calculus-intro", "cs-dsa-foundations", "physics-quantum-mechanics"],
    milestoneBadge: "Systems Architect",
  },
  {
    id: "sq-path-ai-renewable",
    trackCode: "PATH-03",
    title: "Applied AI & Clean Energy Engineering",
    targetZones: ["YOUTH", "SENIOR"],
    estimatedWeeks: 6,
    outcomeSummary:
      "Master neural optimization, microgrid inverter design, and resilient infrastructure tailored for West African energy and tech ecosystems.",
    courseIds: ["ai-neural-architectures", "energy-solar-microgrids", "biotech-crispr-health"],
    milestoneBadge: "Frontier Technologist",
  },
  {
    id: "sq-path-civics-econ",
    trackCode: "PATH-04",
    title: "Civic Governance, Constitutional Law & Macroeconomics",
    targetZones: ["TEEN", "YOUTH", "SENIOR"],
    estimatedWeeks: 6,
    outcomeSummary:
      "Understand Nigerian constitutional separations of power, central bank liquidity policy, capital allocation, and diplomatic trade.",
    courseIds: ["economics-macro-wealth", "law-constitution-governance", "history-west-africa-empires"],
    milestoneBadge: "Civic Fellow",
  },
];

export const COURSE_PRACTICAL_PROMPTS: Record<string, string> = {
  "math-calculus-intro":
    "Model a rate-of-change optimization problem (e.g. maximizing agricultural storage tank volume under fixed sheet-metal cost) and show derivative steps.",
  "cs-dsa-foundations":
    "Design a search index or ranking queue with documented Big-O time/space tradeoffs and include sample pseudocode or TypeScript snippet.",
  "economics-macro-wealth":
    "Draft a concise 250-word fiscal & monetary brief evaluating inflation vs infrastructure bond yields for a West African municipality.",
  "ai-neural-architectures":
    "Outline a supervised classification pipeline for local crop disease detection, specifying dataset hygiene and bias checks.",
  "energy-solar-microgrids":
    "Size a solar + LiFePO4 battery microgrid for a 6-classroom Nigerian secondary school, calculating kWh autonomy and inverter load.",
  "law-constitution-governance":
    "Write an analytical case memo comparing federal vs state legislative competence on public education standards under constitutional law.",
};

export const INITIAL_TALENT_SHOWCASE_PROFILES: TalentProfileData[] = [
  {
    userId: "seed-talent-adaeze",
    displayName: "Adaeze Nwosu",
    username: "adaeze_dev",
    ageZone: "YOUTH",
    school: "University of Lagos",
    state: "Lagos",
    headline: "Embedded Systems & Clean-Grid Telemetry Builder",
    primaryCategory: "Engineering & Robotics",
    bio: "Building low-cost ESP32 solar charge controllers and open water-level flood sensors for coastal communities in Lagos.",
    skills: ["TypeScript", "Embedded C++", "Solar Microgrids", "PCB Layout"],
    portfolio: [
      {
        id: "pf-adaeze-1",
        title: "EkoFlood Open Ultrasonic Sensor Node",
        category: "Engineering & Robotics",
        summary:
          "Low-power LoRaWAN drainage level monitor with 14-day solar battery backup and community SMS alert threshold logic.",
        mediaUrl: "https://github.com/naijaplay-showcase/ekoflood-node",
        tags: ["IoT", "Flood-Resilience", "Clean-Energy"],
        moderationStatus: "APPROVED",
        createdAt: "2026-10-12T10:00:00.000Z",
      },
    ],
    updatedAt: "2026-10-12T10:00:00.000Z",
  },
  {
    userId: "seed-talent-ibrahim",
    displayName: "Ibrahim Danjuma",
    username: "ibrahim_viz",
    ageZone: "TEEN",
    school: "Loyola Jesuit College, Abuja",
    state: "FCT Abuja",
    headline: "Visual Storyteller & Architectural Illustrator",
    primaryCategory: "Digital Art & Design",
    bio: "Illustrating vernacular Nigerian mud-brick thermal architecture and geometric patterns using digital canvas layering.",
    skills: ["Vector Composition", "Color Grading", "Technical Diagramming"],
    portfolio: [
      {
        id: "pf-ibrahim-1",
        title: "Kano Passive-Cooling Courtyard Study",
        category: "Digital Art & Design",
        summary:
          "Annotated cross-section illustration showing airflow convection in historic Northern Nigerian earth-brick courtyards.",
        tags: ["Architecture", "Climate-Design", "Illustration"],
        moderationStatus: "APPROVED",
        createdAt: "2026-10-18T14:30:00.000Z",
      },
    ],
    updatedAt: "2026-10-18T14:30:00.000Z",
  },
];

export const INITIAL_TALENT_COMPETITIONS: TalentCompetitionItem[] = [
  {
    id: "comp-civic-tech-2026",
    title: "Pan-Nigerian Youth Civic & EdTech Prototype Showcase",
    category: "Software & AI",
    visibility: "SPONSORED",
    organizationId: null,
    organizationName: "NaijaPlay Foundation & Civic Partners",
    sponsorName: "Kora Civic Innovation Grant",
    sponsorshipDisclosure:
      "Transparent Sponsorship: Supported by Kora Civic Innovation Grant for logistics & stipends. Judging is strictly blind-rubric based; zero advertising tracking applied.",
    targetZone: "ALL",
    status: "JUDGING",
    deadline: "2026-12-15",
    recognitionAward: "Lab Equipment Grant + Verified National Finalist Certificate",
    rubric: [
      {
        id: "crit-exec",
        label: "Technical Execution & Clarity",
        maxPoints: 40,
        description: "Architecture soundness, reproducible demo, and clean engineering.",
      },
      {
        id: "crit-impact",
        label: "Local Problem Relevance",
        maxPoints: 35,
        description: "Measurable value for Nigerian classrooms, clinics, or civic life.",
      },
      {
        id: "crit-orig",
        label: "Originality & Craft",
        maxPoints: 25,
        description: "Thoughtful presentation and original problem framing.",
      },
    ],
    createdByUserId: "seed-organizer-1",
    organizerName: "NaijaPlay Talent Directorate",
    submissionsCount: 2,
    createdAt: "2026-10-01T09:00:00.000Z",
  },
  {
    id: "comp-clean-design-2026",
    title: "Vernacular Engineering & Visual Storytelling Cup",
    category: "Digital Art & Design",
    visibility: "PUBLIC",
    organizationId: null,
    organizationName: "Open Creative Fellowship",
    sponsorName: null,
    sponsorshipDisclosure: null,
    targetZone: "TEEN",
    status: "OPEN",
    deadline: "2026-12-20",
    recognitionAward: "Studio Monograph Feature + Gold Merit Seal",
    rubric: [
      {
        id: "crit-comp",
        label: "Visual Composition & Balance",
        maxPoints: 40,
        description: "Intentional typography, hierarchy, contrast, and structural layout.",
      },
      {
        id: "crit-narr",
        label: "Cultural & Analytical Narrative",
        maxPoints: 35,
        description: "Clarity of explanation and educational storytelling depth.",
      },
      {
        id: "crit-craft",
        label: "Finish & Accessibility",
        maxPoints: 25,
        description: "Legibility and precision of labeling.",
      },
    ],
    createdByUserId: "seed-organizer-2",
    organizerName: "West Africa Design Guild",
    submissionsCount: 1,
    createdAt: "2026-10-10T11:00:00.000Z",
  },
];

export const INITIAL_TALENT_SUBMISSIONS: TalentCompetitionSubmission[] = [
  {
    id: "sub-civic-1",
    competitionId: "comp-civic-tech-2026",
    userId: "seed-talent-adaeze",
    participantName: "Adaeze Nwosu",
    participantZone: "YOUTH",
    schoolName: "University of Lagos",
    projectTitle: "EkoFlood Open Ultrasonic Sensor Node",
    category: "Software & AI",
    projectSummary:
      "Solar-assisted drainage depth monitor pushing structured hazard alerts to neighborhood flood coordinators.",
    artifactUrl: "https://github.com/naijaplay-showcase/ekoflood-node",
    moderationStatus: "APPROVED",
    submittedAt: "2026-10-14T15:20:00.000Z",
    judgeScores: [
      {
        id: "js-seed-1",
        competitionId: "comp-civic-tech-2026",
        submissionId: "sub-civic-1",
        judgeUserId: "seed-judge-1",
        judgeName: "Dr. Tunde Bakare (UNILAG Systems Lab)",
        scoresByCriterion: {
          "crit-exec": 37,
          "crit-impact": 33,
          "crit-orig": 22,
        },
        totalScore: 92,
        feedback: "Strong enclosure durability analysis and practical SMS fallback for low-bandwidth districts.",
        updatedAt: "2026-10-20T09:10:00.000Z",
      },
    ],
    averageScore: 92,
  },
  {
    id: "sub-civic-2",
    competitionId: "comp-civic-tech-2026",
    userId: "seed-talent-ibrahim",
    participantName: "Ibrahim Danjuma",
    participantZone: "TEEN",
    schoolName: "Loyola Jesuit College, Abuja",
    projectTitle: "Offline Hausa-Yoruba-Igbo STEM Glossary PWA",
    category: "Software & AI",
    projectSummary:
      "IndexedDB-backed bilingual physics and algebra reference companion built for rural computer labs.",
    artifactUrl: "https://github.com/naijaplay-showcase/stem-glossary-pwa",
    moderationStatus: "APPROVED",
    submittedAt: "2026-10-19T12:45:00.000Z",
    judgeScores: [
      {
        id: "js-seed-2",
        competitionId: "comp-civic-tech-2026",
        submissionId: "sub-civic-2",
        judgeUserId: "seed-judge-1",
        judgeName: "Dr. Tunde Bakare (UNILAG Systems Lab)",
        scoresByCriterion: {
          "crit-exec": 34,
          "crit-impact": 34,
          "crit-orig": 21,
        },
        totalScore: 89,
        feedback: "Zero-network sync strategy is thoughtful; expanding audio pronunciation samples would elevate accessibility.",
        updatedAt: "2026-10-20T09:40:00.000Z",
      },
    ],
    averageScore: 89,
  },
  {
    id: "sub-design-1",
    competitionId: "comp-clean-design-2026",
    userId: "seed-talent-ibrahim",
    participantName: "Ibrahim Danjuma",
    participantZone: "TEEN",
    schoolName: "Loyola Jesuit College, Abuja",
    projectTitle: "Kano Passive-Cooling Courtyard Study",
    category: "Digital Art & Design",
    projectSummary:
      "High-contrast annotated architectural diagram visualizing nocturnal thermal mass cooling.",
    artifactUrl: "https://github.com/naijaplay-showcase/kano-courtyard-diagram",
    moderationStatus: "APPROVED",
    submittedAt: "2026-10-21T16:10:00.000Z",
    judgeScores: [],
    averageScore: 0,
  },
];

export const COMMERCIAL_PLANS_CATALOG: Record<SubscriptionPlanCode, Omit<ProductEntitlementState, "updatedAt">> = {
  FREE_SCHOLAR: {
    planCode: "FREE_SCHOLAR",
    planName: "Free Scholar Tier",
    monthlyPriceLabel: "₦0 / month",
    naijaplayDailySessionsLimit: 12,
    skillquestAuthoringUnlocked: true,
    skillquestCustomPaths: false,
    talentArenaOrgCompetitions: false,
    minorAdFreeGuaranteed: true,
    outcomesUnaffectedByPayment: true,
  },
  SCHOLAR_PLUS: {
    planCode: "SCHOLAR_PLUS",
    planName: "Scholar Plus Individual",
    monthlyPriceLabel: "₦2,500 / month",
    naijaplayDailySessionsLimit: "UNLIMITED",
    skillquestAuthoringUnlocked: true,
    skillquestCustomPaths: true,
    talentArenaOrgCompetitions: false,
    minorAdFreeGuaranteed: true,
    outcomesUnaffectedByPayment: true,
  },
  SCHOOL_LICENSE: {
    planCode: "SCHOOL_LICENSE",
    planName: "School & Academy License",
    monthlyPriceLabel: "₦45,000 / term (up to 250 seats)",
    naijaplayDailySessionsLimit: "UNLIMITED",
    skillquestAuthoringUnlocked: true,
    skillquestCustomPaths: true,
    talentArenaOrgCompetitions: true,
    minorAdFreeGuaranteed: true,
    outcomesUnaffectedByPayment: true,
  },
  NGO_PROGRAMME: {
    planCode: "NGO_PROGRAMME",
    planName: "NGO & Youth Foundation Suite",
    monthlyPriceLabel: "₦95,000 / cohort",
    naijaplayDailySessionsLimit: "UNLIMITED",
    skillquestAuthoringUnlocked: true,
    skillquestCustomPaths: true,
    talentArenaOrgCompetitions: true,
    minorAdFreeGuaranteed: true,
    outcomesUnaffectedByPayment: true,
  },
};
