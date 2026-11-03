import {
  ClubItem,
  CreativeSubmissionItem,
  DailyMission,
  LeaderboardEntry,
  LearningCourse,
  PlayerState,
  Tournament,
} from "@/types/naijaplay";

export const INITIAL_PLAYER: PlayerState = {
  displayName: "Chidi Okonkwo",
  avatarInitials: "CO",
  avatarCrest: "Falcon",
  avatarBg: "from-emerald-700 to-slate-900",
  ageZone: "TEEN",
  age: 16,
  level: 14,
  xp: 1450,
  nextLevelXp: 2000,
  streakDays: 12,
  coins: 850,
  badges: [
    "Dean's Honour Roll",
    "Algorithmic Master",
    "Calculus Distinction",
    "Civic Governance Fellow",
    "West African Historian",
  ],
  school: "King's College Lagos",
  state: "Lagos State",
  certificates: [
    {
      id: "CERT-2026-CS101",
      courseId: "cs-101",
      courseTitle: "Computer Science & Algorithmic Logic",
      issuedDate: "2026-10-18",
      scorePercent: 96,
      grade: "Distinction",
    },
    {
      id: "CERT-2026-HIST201",
      courseId: "hist-201",
      courseTitle: "Pre-Colonial African Civilizations & Diplomatic History",
      issuedDate: "2026-10-24",
      scorePercent: 92,
      grade: "Distinction",
    },
  ],
  screenTimeTodayMinutes: 48,
  maxScreenTimeMinutes: 150,
};

export const AVATAR_CRESTS = [
  { id: "Falcon", label: "Falcon Vanguard", symbol: "F", desc: "Precision & Analytical Vision" },
  { id: "Atlas", label: "Atlas Pillar", symbol: "A", desc: "Mathematics & Structural Fortitude" },
  { id: "Apex", label: "Apex Prodigy", symbol: "X", desc: "Computing & Algorithmic Speed" },
  { id: "Summit", label: "Summit Scholar", symbol: "S", desc: "Academic Research & Literature" },
  { id: "Vanguard", label: "Civic Vanguard", symbol: "V", desc: "Constitutional Law & Ethics" },
  { id: "Sovereign", label: "Sovereign Scholar", symbol: "K", desc: "Economic Policy & Markets" },
];

export const INITIAL_MISSIONS: DailyMission[] = [
  {
    id: "m-1",
    title: "Complete Academic Subject Module",
    description: "Read one full lecture module and complete the checkpoint analysis",
    xpReward: 80,
    progress: 1,
    target: 1,
    completed: true,
    claimed: false,
    iconName: "BookOpen",
  },
  {
    id: "m-2",
    title: "Pass Academic Examination Test",
    description: "Attain 80% or higher on any subject examination test",
    xpReward: 120,
    progress: 0,
    target: 1,
    completed: false,
    claimed: false,
    iconName: "GraduationCap",
  },
  {
    id: "m-3",
    title: "Discipline Speed Challenge",
    description: "Complete an age-calibrated academic speed drill with zero errors",
    xpReward: 75,
    progress: 2,
    target: 3,
    completed: false,
    claimed: false,
    iconName: "Target",
  },
  {
    id: "m-4",
    title: "Studio Design Canvas Export",
    description: "Create and export an annotated diagram or composition in Studio",
    xpReward: 60,
    progress: 0,
    target: 1,
    completed: false,
    claimed: false,
    iconName: "Layers",
  },
];

// ============================================================================
// ALL 8 CORE ACADEMIC SUBJECTS (FULL LECTURE + FORMAL 5-QUESTION EXAMINATION)
// ============================================================================
export const COMPREHENSIVE_COURSES: LearningCourse[] = [
  {
    id: "math-101",
    title: "Calculus & Quantitative Reasoning",
    category: "Mathematics",
    level: "Advanced",
    targetZone: "YOUTH",
    iconName: "Sigma",
    xpReward: 250,
    overview:
      "A rigorous exploration of limits, continuity, differential calculus, integral calculus, and their dynamic applications in engineering, physics, and economic growth models.",
    learningOutcomes: [
      "Master the formal epsilon-delta definition of limits and continuity",
      "Apply the product, quotient, and chain rules to multi-variable functions",
      "Compute definite and indefinite integrals via substitution and integration by parts",
      "Model population growth, disease transmission, and rate of capital accumulation",
    ],
    curriculumSections: [
      {
        title: "1. Foundations of Differential Calculus",
        body: [
          "Calculus forms the bedrock of mathematical modeling. The derivative measures the instantaneous rate of change of a dependent variable with respect to an independent variable.",
          "Geometrically, f'(x) represents the tangent gradient to the curve f(x) at point x. When f'(x) = 0 and f''(x) < 0, the function attains a local maximum; when f''(x) > 0, it achieves a local minimum.",
          "In economic theory, derivatives determine marginal revenue, marginal cost, and elasticities of demand.",
        ],
        keyFormulasOrTakeaways: [
          "Power Rule: d/dx [x^n] = n * x^(n-1)",
          "Product Rule: d/dx [u * v] = u'v + uv'",
          "Chain Rule: d/dx [f(g(x))] = f'(g(x)) * g'(x)",
        ],
        caseStudy: {
          title: "Infrastructure Load Optimization in Lagos Mega-Bridge Design",
          narrative:
            "Structural engineers apply second-order differential equations to calculate harmonic resonance and tensile strain on suspension cables during high-traffic windstorms.",
        },
      },
      {
        title: "2. The Fundamental Theorem of Calculus",
        body: [
          "The Fundamental Theorem of Calculus bridges differentiation and integration, showing they are inverse mathematical operations.",
          "Part 1 guarantees that the definite integral of a function accumulates its rate of change over an interval [a, b]. Part 2 states that if F'(x) = f(x), then integral from a to b of f(x) dx = F(b) - F(a).",
        ],
        keyFormulasOrTakeaways: [
          "Integral of x^n dx = (x^(n+1))/(n+1) + C for n != -1",
          "Integration by Parts: Integral u dv = uv - Integral v du",
        ],
      },
    ],
    examination: [
      {
        id: "m-q1",
        question: "What is the derivative of f(x) = 3x^4 - 5x^2 + 8 with respect to x?",
        options: ["12x^3 - 10x", "12x^4 - 10x^2", "7x^3 - 10x + 8", "12x^3 - 5x"],
        correctAnswer: 0,
        explanation: "By applying the power rule, d/dx(3x^4) = 12x^3, d/dx(-5x^2) = -10x, and the derivative of a constant is 0.",
      },
      {
        id: "m-q2",
        question: "If a function f(x) has f'(c) = 0 and f''(c) = -6, what occurs at point c?",
        options: ["A point of inflection", "A local maximum", "A local minimum", "A vertical asymptote"],
        correctAnswer: 1,
        explanation: "By the second derivative test, if the first derivative is zero and the second derivative is strictly negative, the curve is concave down, establishing a local maximum.",
      },
      {
        id: "m-q3",
        question: "Evaluate the definite integral of 2x dx from x = 1 to x = 4.",
        options: ["12", "15", "16", "18"],
        correctAnswer: 1,
        explanation: "The antiderivative of 2x is x^2. Evaluating at the limits: [4^2] - [1^2] = 16 - 1 = 15.",
      },
      {
        id: "m-q4",
        question: "Which theorem formally establishes that differentiation and integration are inverse operations?",
        options: ["Mean Value Theorem", "Intermediate Value Theorem", "Fundamental Theorem of Calculus", "Taylor's Remainder Theorem"],
        correctAnswer: 2,
        explanation: "The Fundamental Theorem of Calculus formally connects differentiation with definite integration as inverse operations.",
      },
      {
        id: "m-q5",
        question: "Using the chain rule, what is the derivative of f(x) = sin(2x^3)?",
        options: ["6x^2 * cos(2x^3)", "cos(6x^2)", "6x * sin(2x^3)", "3x^2 * cos(x^3)"],
        correctAnswer: 0,
        explanation: "Let u = 2x^3; du/dx = 6x^2. d/du[sin(u)] = cos(u). Thus, d/dx = cos(2x^3) * 6x^2 = 6x^2 * cos(2x^3).",
      },
    ],
  },
  {
    id: "cs-101",
    title: "Computer Science & Algorithmic Architecture",
    category: "Computer Science",
    level: "Advanced",
    targetZone: "YOUTH",
    iconName: "Terminal",
    xpReward: 250,
    overview:
      "Comprehensive curriculum spanning asymptotic complexity (Big-O), linear and non-linear data structures, relational and graph schemas, and secure software engineering principles.",
    learningOutcomes: [
      "Analyze time and space complexity using asymptotic Big-O notation",
      "Implement balanced binary search trees, hash tables, and directed acyclic graphs",
      "Design fault-tolerant backend architectures with ACID guarantees and message queues",
      "Understand encryption standards (AES-256, RSA) and zero-trust authentication",
    ],
    curriculumSections: [
      {
        title: "1. Asymptotic Complexity and Algorithm Analysis",
        body: [
          "Computational complexity quantifies the resources (time and memory) required by an algorithm as input size n scales toward infinity.",
          "O(1) represents constant time, O(log n) logarithmic (e.g., binary search), O(n) linear, O(n log n) linearithmic (e.g., MergeSort, QuickSort average), and O(n^2) quadratic.",
          "Efficient systems strive to maintain query complexity at O(1) or O(log n) through balanced indexing and hash tables.",
        ],
        keyFormulasOrTakeaways: [
          "Binary Search on sorted array: O(log n) time, O(1) space",
          "Hash Table lookup: O(1) average time, O(n) worst-case",
          "QuickSort: O(n log n) average, O(n^2) worst-case",
        ],
        caseStudy: {
          title: "Real-Time Transaction Clearing in African Interbank Switches",
          narrative:
            "High-throughput financial switches utilize lock-free ring buffers and in-memory hash indexes to verify balances and route millions of settlement packets in sub-millisecond latencies.",
        },
      },
      {
        title: "2. Data Structures: Graphs and Relational Schemas",
        body: [
          "Graphs model relational networks consisting of vertices (nodes) and edges. Traversal algorithms such as Breadth-First Search (BFS) and Depth-First Search (DFS) solve shortest-path and dependency resolution problems.",
          "Dijkstra's algorithm determines the single-source shortest path in non-negative weighted graphs in O((V + E) log V) using priority queues.",
        ],
      },
    ],
    examination: [
      {
        id: "cs-q1",
        question: "What is the worst-case time complexity of searching for an element in an unsorted array of size n?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        correctAnswer: 2,
        explanation: "In an unsorted array, linear search must examine every single element in the worst case, yielding O(n) complexity.",
      },
      {
        id: "cs-q2",
        question: "Which data structure operates on a Last-In, First-Out (LIFO) protocol?",
        options: ["Queue", "Stack", "Binary Heap", "Linked List"],
        correctAnswer: 1,
        explanation: "A Stack enforces LIFO access semantics, where the most recently pushed element is the first to be popped.",
      },
      {
        id: "cs-q3",
        question: "What is the average time complexity of searching a key in a well-balanced Hash Table?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n^2)"],
        correctAnswer: 0,
        explanation: "A well-distributed hash function distributes keys uniformly, granting O(1) expected average time for lookups, insertions, and deletions.",
      },
      {
        id: "cs-q4",
        question: "In relational database design, what does the 'I' in ACID transactions guarantee?",
        options: ["Integrity", "Isolation", "Immutability", "Indexing"],
        correctAnswer: 1,
        explanation: "Isolation ensures concurrent transactions execute without interfering with one another, preventing dirty reads or non-repeatable reads.",
      },
      {
        id: "cs-q5",
        question: "Which graph traversal algorithm utilizes a FIFO Queue and finds the shortest path on unweighted graphs?",
        options: ["Depth-First Search (DFS)", "Breadth-First Search (BFS)", "Bellman-Ford Algorithm", "Kruskal's Algorithm"],
        correctAnswer: 1,
        explanation: "BFS explores nodes level by level using a queue, guaranteeing the shortest path in unweighted graphs.",
      },
    ],
  },
  {
    id: "phys-101",
    title: "Classical Mechanics, Electromagnetism & Energy Systems",
    category: "Physical Sciences",
    level: "Intermediate",
    targetZone: "TEEN",
    iconName: "Atom",
    xpReward: 250,
    overview:
      "Exploration of Newtonian dynamics, conservation laws, electromagnetic induction, wave behavior, and renewable energy conversion systems.",
    learningOutcomes: [
      "Apply Newton's Three Laws of Motion to static and dynamic physical systems",
      "Calculate gravitational, kinetic, and potential energy conversions",
      "Understand Faraday's Law of Induction and Maxwell's equations",
      "Analyze photovoltaic efficiency and solar irradiance dynamics across West Africa",
    ],
    curriculumSections: [
      {
        title: "1. Newtonian Dynamics and Conservation Principles",
        body: [
          "Classical mechanics describes the motion of macroscopic bodies. Newton's second law states that net force is proportional to the rate of change of linear momentum (F = dp/dt = m * a for constant mass).",
          "The Law of Conservation of Energy dictates that within an isolated system, energy cannot be created or destroyed, only transformed between states (e.g. potential to kinetic).",
        ],
        keyFormulasOrTakeaways: [
          "Force: F = m * a (Newtons)",
          "Work: W = F * d * cos(theta) (Joules)",
          "Kinetic Energy: KE = 0.5 * m * v^2",
          "Potential Energy: PE = m * g * h",
        ],
      },
      {
        title: "2. Electromagnetism and Power Generation",
        body: [
          "Faraday's Law of Electromagnetic Induction dictates that a changing magnetic flux through a conducting circuit induces an electromotive force (EMF).",
          "This fundamental physical law enables all hydroelectric turbines (such as Nigeria's Kainji Dam) and wind generators.",
        ],
      },
    ],
    examination: [
      {
        id: "p-q1",
        question: "What net force is required to accelerate an 800 kg vehicle at a rate of 2.5 m/s^2?",
        options: ["1,600 N", "2,000 N", "2,400 N", "3,200 N"],
        correctAnswer: 1,
        explanation: "Using Newton's Second Law: F = m * a = 800 kg * 2.5 m/s^2 = 2,000 Newtons.",
      },
      {
        id: "p-q2",
        question: "If a 2 kg object is dropped from a height of 20 meters, what is its potential energy before release? (g = 9.8 m/s^2)",
        options: ["196 J", "392 J", "400 J", "98 J"],
        correctAnswer: 1,
        explanation: "PE = m * g * h = 2 kg * 9.8 m/s^2 * 20 m = 392 Joules.",
      },
      {
        id: "p-q3",
        question: "Which law states that induced electromotive force opposes the magnetic flux change that created it?",
        options: ["Ohm's Law", "Coulomb's Law", "Lenz's Law", "Ampère's Law"],
        correctAnswer: 2,
        explanation: "Lenz's Law specifies that the direction of the induced current is always such as to oppose the change in magnetic flux producing it.",
      },
      {
        id: "p-q4",
        question: "What is the SI unit of electrical resistance?",
        options: ["Volt", "Ampere", "Ohm", "Watt"],
        correctAnswer: 2,
        explanation: "The Ohm (symbol: Omega) is the standard international unit of electrical resistance.",
      },
      {
        id: "p-q5",
        question: "In photovoltaic solar cells, light energy is converted directly into electricity via which physical process?",
        options: ["Photoelectric effect", "Compton scattering", "Thermal convection", "Nuclear fission"],
        correctAnswer: 0,
        explanation: "Photons dislodge electrons from semiconductor valence bands in the photoelectric effect, creating electric current.",
      },
    ],
  },
  {
    id: "bio-101",
    title: "Molecular Genetics & Cellular Biology",
    category: "Biological Sciences",
    level: "Intermediate",
    targetZone: "TEEN",
    iconName: "Dna",
    xpReward: 250,
    overview:
      "Deep dive into DNA structure, transcription, translation, Mendelian genetics, sickle cell trait adaptations, and modern CRISPR biotechnology.",
    learningOutcomes: [
      "Understand the double-helix antiparallel structure of DNA and base pairing",
      "Trace the central dogma from DNA transcription to mRNA ribosomal translation",
      "Analyze inheritance patterns using Punnett squares and pedigree charts",
      "Study malaria resistance mechanisms associated with sickle cell trait (HbAS)",
    ],
    curriculumSections: [
      {
        title: "1. The Central Dogma of Molecular Biology",
        body: [
          "Genetic information flows unidirectionally: DNA is transcribed into messenger RNA (mRNA) inside the cell nucleus, which is subsequently translated into amino acid polypeptide chains at the ribosomes.",
          "DNA consists of four nitrogenous bases: Adenine pairs with Thymine (via 2 hydrogen bonds), and Cytosine pairs with Guanine (via 3 hydrogen bonds). In RNA, Uracil replaces Thymine.",
        ],
        keyFormulasOrTakeaways: [
          "Transcription: DNA -> mRNA (RNA Polymerase)",
          "Translation: mRNA codon -> tRNA anticodon -> Amino Acid",
          "Start Codon: AUG (Methionine)",
        ],
      },
      {
        title: "2. Genetic Inheritance and Evolutionary Selection in Africa",
        body: [
          "Heterozygous carriers of the sickle cell allele (HbAS) possess significant evolutionary protection against severe Plasmodium falciparum malaria without suffering from full sickle cell anemia (HbSS).",
          "This classic balanced polymorphism demonstrates how environmental pressures shape regional allele frequencies over millennia.",
        ],
      },
    ],
    examination: [
      {
        id: "b-q1",
        question: "Which nitrogenous base pairs with Guanine in a double-stranded DNA molecule?",
        options: ["Thymine", "Adenine", "Cytosine", "Uracil"],
        correctAnswer: 2,
        explanation: "In DNA, Cytosine forms three hydrogen bonds specifically with Guanine.",
      },
      {
        id: "b-q2",
        question: "What is the direct product of DNA transcription?",
        options: ["Polypeptide chain", "mRNA", "tRNA", "Lipid bilayer"],
        correctAnswer: 1,
        explanation: "Transcription synthesizes a complementary messenger RNA (mRNA) transcript from the template DNA strand.",
      },
      {
        id: "b-q3",
        question: "If two carrier parents (HbAS x HbAS) have a child, what is the statistical probability of the child having sickle cell disease (HbSS)?",
        options: ["0%", "25%", "50%", "75%"],
        correctAnswer: 1,
        explanation: "A standard monohybrid cross between two heterozygotes yields 25% homozygous normal (HbAA), 50% carrier (HbAS), and 25% homozygous affected (HbSS).",
      },
      {
        id: "b-q4",
        question: "Where within the eukaryotic cell does protein translation occur?",
        options: ["Inside the Nucleolus", "At the Ribosome", "Within the Lysosome", "Inside the Golgi Body"],
        correctAnswer: 1,
        explanation: "Translation occurs in the cytoplasm at ribosomes, where tRNAs read mRNA codons to assemble amino acid sequences.",
      },
      {
        id: "b-q5",
        question: "What molecular tool acts as biological scissors to enable targeted genomic editing in modern biotechnology?",
        options: ["CRISPR-Cas9", "DNA Ligase", "Amylase", "Hemoglobin"],
        correctAnswer: 0,
        explanation: "CRISPR-Cas9 is an endonuclease guided by synthetic RNA to bind and cut exact target DNA sequences with high fidelity.",
      },
    ],
  },
  {
    id: "econ-101",
    title: "Macroeconomics, Capital Markets & Wealth Architecture",
    category: "Financial Economics",
    level: "Advanced",
    targetZone: "SENIOR",
    iconName: "TrendingUp",
    xpReward: 300,
    overview:
      "Comprehensive economic theory, sovereign monetary policy, inflation management, bond and equity valuation, exchange rate dynamics, and investment portfolio construction.",
    learningOutcomes: [
      "Understand central bank monetary policy mechanisms (interest rates, reserve ratios)",
      "Analyze GDP components (Consumption, Investment, Government, Net Exports)",
      "Model discounted cash flow (DCF) asset valuations and compound interest yields",
      "Evaluate currency volatility, sovereign debt sustainability, and diversification",
    ],
    curriculumSections: [
      {
        title: "1. Macroeconomic Equilibrium & Monetary Mechanics",
        body: [
          "National output is defined by the expenditure identity: GDP = C + I + G + (X - M).",
          "Central banks govern domestic money supply and control inflation through benchmark policy rates. Raising rates increases the cost of borrowing, dampening inflationary pressures while potentially cooling economic expansion.",
        ],
        keyFormulasOrTakeaways: [
          "Compound Growth: A = P * (1 + r/n)^(n*t)",
          "Rule of 72: Years to Double approx = 72 / Interest Rate",
          "Discounted Cash Flow: PV = Sum [ CF_t / (1 + r)^t ]",
        ],
      },
      {
        title: "2. Capital Allocation and Modern Portfolio Theory",
        body: [
          "Modern Portfolio Theory (Markowitz) demonstrates that an investor can construct an efficient frontier of optimal portfolios offering maximum expected return for a defined level of risk.",
          "Diversification across uncorrelated asset classes (equities, sovereign treasuries, real estate, infrastructure bonds) mitigates unsystematic risk.",
        ],
      },
    ],
    examination: [
      {
        id: "e-q1",
        question: "In the standard macroeconomic equation GDP = C + I + G + NX, what does 'NX' represent?",
        options: ["National Expenses", "Net Exports (Exports minus Imports)", "Non-taxable Assets", "Nominal Exchange Rate"],
        correctAnswer: 1,
        explanation: "NX stands for Net Exports, calculated as the total value of physical and service exports minus imports.",
      },
      {
        id: "e-q2",
        question: "According to the Rule of 72, approximately how many years will it take for an investment to double at an 8% annual compound return?",
        options: ["6 years", "9 years", "12 years", "14 years"],
        correctAnswer: 1,
        explanation: "72 divided by 8 equals 9 years.",
      },
      {
        id: "e-q3",
        question: "When a central bank raises its benchmark monetary policy rate, what is the expected impact on domestic inflation and borrowing?",
        options: ["Inflation increases; borrowing rises", "Inflation decreases; borrowing slows down", "Currency immediately devalues to zero", "Government debt is automatically cancelled"],
        correctAnswer: 1,
        explanation: "Higher policy rates raise the cost of credit, suppressing aggregate demand and curtailing inflationary velocity.",
      },
      {
        id: "e-q4",
        question: "What type of financial risk can be eliminated through broad portfolio diversification across uncorrelated assets?",
        options: ["Systemic Market Risk", "Unsystematic (Idiosyncratic) Risk", "Global Currency Risk", "Sovereign Default Risk"],
        correctAnswer: 1,
        explanation: "Unsystematic risk is specific to an individual firm or sector and can be diversified away; systematic risk affects the entire market.",
      },
      {
        id: "e-q5",
        question: "What financial metric measures the present value of all anticipated future cash inflows discounted by the cost of capital?",
        options: ["Net Present Value (NPV)", "Gross Domestic Product (GDP)", "Price-to-Earnings Ratio", "Return on Equity (ROE)"],
        correctAnswer: 0,
        explanation: "Net Present Value discounts projected cash flows to evaluate capital expenditure profitability today.",
      },
    ],
  },
  {
    id: "hist-201",
    title: "Pre-Colonial African Civilizations & Diplomatic History",
    category: "African & World History",
    level: "Intermediate",
    targetZone: "TEEN",
    iconName: "Globe",
    xpReward: 250,
    overview:
      "A scholarly analysis of state formation, metallurgic advancement, trans-Saharan trade corridors, and constitutional balance of power across Benin, Songhai, Mali, and Great Zimbabwe.",
    learningOutcomes: [
      "Understand the governance structure and checks and balances of the Oyo Mesi and Oba in the Oyo Empire",
      "Trace medieval trans-Saharan gold, salt, and manuscript trade between Timbuktu, Cairo, and Fez",
      "Examine advanced brass casting, architecture, and linear earthworks of the Benin Kingdom",
      "Analyze the diplomatic and maritime trade networks of the Swahili Coast with Arabia, India, and China",
    ],
    curriculumSections: [
      {
        title: "1. The Benin Kingdom and Engineering Feats",
        body: [
          "The Kingdom of Benin (c. 1180–1897 CE) represented one of the most sophisticated urban centers in pre-colonial West Africa. Its earthworks, known as the Walls of Benin, encompassed over 16,000 kilometers of contiguous boundary moats.",
          "Guild artisans belonging to the Igun Eronmwon produced lost-wax bronze and brass sculptures that demonstrated peerless metallurgical precision.",
        ],
      },
      {
        title: "2. Constitutional Governance: The Oyo Empire",
        body: [
          "The Oyo Empire maintained a constitutional monarchy. The Alaafin (monarch) ruled alongside the Oyo Mesi (Council of Seven State Notables), headed by the Bashorun.",
          "If an Alaafin abused imperial authority, the Oyo Mesi held the constitutional mandate to reject his governance, compelling peaceful transition of power.",
        ],
      },
    ],
    examination: [
      {
        id: "h-q1",
        question: "In the constitutional governance of the Oyo Empire, who served as head of the Oyo Mesi council?",
        options: ["The Alaafin", "The Bashorun", "The Kakanfo", "The Balogun"],
        correctAnswer: 1,
        explanation: "The Bashorun was the supreme prime minister and head of the Oyo Mesi council.",
      },
      {
        id: "h-q2",
        question: "Which ancient West African culture produced distinctive terracotta sculptures dating back to 500 BCE in central Nigeria?",
        options: ["Nok Culture", "Songhai Empire", "Kingdom of Aksum", "Mutapa Empire"],
        correctAnswer: 0,
        explanation: "The Nok culture of central Nigeria was renowned for terracotta sculptures and early iron smelting.",
      },
      {
        id: "h-q3",
        question: "The massive medieval earthworks enclosing the Kingdom of Benin are historically documented as what?",
        options: ["Benin Moats and Earthworks", "Great Pyramid of Giza", "Ruins of Kilwa", "Oyo Trench System"],
        correctAnswer: 0,
        explanation: "The Benin Moats and Earthworks formed an estimated 16,000 km of interconnected earthen barriers.",
      },
      {
        id: "h-q4",
        question: "Mansa Musa's renowned 1324 pilgrimage to Mecca established the extraordinary wealth and gold trade of which empire?",
        options: ["Mali Empire", "Ashanti Empire", "Zulu Kingdom", "Kingdom of Dahomey"],
        correctAnswer: 0,
        explanation: "Mansa Musa was the tenth ruler of the Mali Empire, whose pilgrimage stimulated Mediterranean trade corridors.",
      },
      {
        id: "h-q5",
        question: "Which university center in medieval Timbuktu housed tens of thousands of scholastic manuscripts on astronomy, mathematics, and law?",
        options: ["Sankore University", "Al-Azhar", "Oxford University", "Nalanda University"],
        correctAnswer: 0,
        explanation: "The University of Sankore in Timbuktu was a global center of Islamic and African scholarship.",
      },
    ],
  },
  {
    id: "law-101",
    title: "Constitutional Law, Governance & Human Rights",
    category: "Civic Governance & Law",
    level: "Advanced",
    targetZone: "SENIOR",
    iconName: "Shield",
    xpReward: 300,
    overview:
      "Exploration of democratic constitutionalism, separation of powers, judicial review, fundamental human rights, and the rule of law under common law frameworks.",
    learningOutcomes: [
      "Analyze the constitutional doctrine of Separation of Powers (Legislative, Executive, Judicial)",
      "Understand the mechanics of judicial review under Marbury v. Madison and common law precedents",
      "Examine Chapter IV fundamental human rights provisions under modern African constitutions",
      "Study international humanitarian treaties and anti-corruption jurisprudence",
    ],
    curriculumSections: [
      {
        title: "1. Separation of Powers and Constitutional Checks",
        body: [
          "The doctrine articulated by Baron de Montesquieu posits that liberty requires dividing sovereign power among three distinct organs: the Legislature (makes laws), the Executive (enforces laws), and the Judiciary (interprets laws).",
          "Checks and balances ensure no single branch operates with unchecked sovereignty.",
        ],
      },
      {
        title: "2. Fundamental Rights and Judicial Independence",
        body: [
          "Constitutional rights—such as liberty, freedom of expression, fair hearing, and privacy—are protected against executive overreach through habeas corpus, mandamus, and certiorari writs.",
        ],
      },
    ],
    examination: [
      {
        id: "l-q1",
        question: "Which organ of government possesses the constitutional power to interpret statutes and review executive actions?",
        options: ["The Legislature", "The Executive", "The Judiciary", "The Civil Service Commission"],
        correctAnswer: 2,
        explanation: "The Judiciary is constitutionally vested with judicial power to interpret laws and adjudicate disputes.",
      },
      {
        id: "l-q2",
        question: "What legal writ translates from Latin as 'produce the body' to protect individuals against unlawful administrative detention?",
        options: ["Subpoena", "Habeas Corpus", "Certiorari", "Injunction"],
        correctAnswer: 1,
        explanation: "Habeas corpus directs that a detained person be presented before a court to determine the legality of detention.",
      },
      {
        id: "l-q3",
        question: "What constitutional principle dictates that every citizen, including heads of state, is equally subject to the law?",
        options: ["Rule of Law", "Executive Immunity", "Sovereign Discretion", "Martial Ordinance"],
        correctAnswer: 0,
        explanation: "The Rule of Law asserts that no person is above the law and all authority must be exercised in accordance with established statutes.",
      },
      {
        id: "l-q4",
        question: "Under standard democratic constitutions, what body holds the primary power of the purse (budget appropriation)?",
        options: ["The Central Bank", "The Legislature", "The Supreme Court", "The Military Council"],
        correctAnswer: 1,
        explanation: "The Legislature holds the power of the purse, authorising public revenue collection and expenditure budgets.",
      },
      {
        id: "l-q5",
        question: "What standard of proof is required in criminal prosecutions under common law systems?",
        options: ["Balance of probabilities", "Beyond a reasonable doubt", "Preponderance of evidence", "Clear and convincing"],
        correctAnswer: 1,
        explanation: "Criminal liability requires establishing guilt beyond a reasonable doubt, protecting the presumption of innocence.",
      },
    ],
  },
  {
    id: "eng-101",
    title: "Critical Rhetoric, Literature & Formal Discourse",
    category: "English & Literature",
    level: "Intermediate",
    targetZone: "TEEN",
    iconName: "BookMarked",
    xpReward: 250,
    overview:
      "Mastery of structural argument construction, literary criticism, rhetorical devices (ethos, pathos, logos), and African post-colonial literary canons.",
    learningOutcomes: [
      "Master classical rhetoric: ethos (credibility), pathos (emotion), and logos (logical reasoning)",
      "Analyze literary masterworks by Chinua Achebe, Wole Soyinka, Chimamanda Adichie, and Ngugi wa Thiong'o",
      "Identify syntactic fallacies, cognitive biases, and stylistic nuances in formal essays",
      "Construct persuasive, evidence-grounded analytical prose",
    ],
    curriculumSections: [
      {
        title: "1. The Trivium: Grammar, Logic, and Rhetoric",
        body: [
          "Classical discourse balances sound grammatical syntax, inductive/deductive formal logic, and persuasive rhetorical cadence.",
          "An effective argument establishes premises that necessarily lead to a coherent, defensible conclusion while dismantling opposing counter-arguments.",
        ],
      },
    ],
    examination: [
      {
        id: "en-q1",
        question: "In classical Aristotelian rhetoric, what appeal relies on empirical data, evidence, and deduction?",
        options: ["Ethos", "Logos", "Pathos", "Kairos"],
        correctAnswer: 1,
        explanation: "Logos is the rhetorical appeal to logic, empirical evidence, and deductive demonstration.",
      },
      {
        id: "en-q2",
        question: "Chinua Achebe's seminal novel 'Things Fall Apart' takes its title from which W.B. Yeats poem?",
        options: ["The Second Coming", "Sailing to Byzantium", "The Lake Isle of Innisfree", "Easter 1916"],
        correctAnswer: 0,
        explanation: "'Things Fall Apart' draws its title directly from Yeats's 1919 poem 'The Second Coming'.",
      },
      {
        id: "en-q3",
        question: "What literary device involves attributing human emotions or characteristics to inanimate objects or nature?",
        options: ["Hyperbole", "Personification", "Metonymy", "Oxymoron"],
        correctAnswer: 1,
        explanation: "Personification endows non-human objects or forces of nature with human traits and intentionality.",
      },
      {
        id: "en-q4",
        question: "Who was the first African laureate to win the Nobel Prize in Literature in 1986?",
        options: ["Chinua Achebe", "Wole Soyinka", "Naguib Mahfouz", "Nadine Gordimer"],
        correctAnswer: 1,
        explanation: "Wole Soyinka was awarded the Nobel Prize in Literature in 1986.",
      },
      {
        id: "en-q5",
        question: "What logical fallacy occurs when an arguer attacks an opponent's character instead of addressing their argument?",
        options: ["Straw Man", "Ad Hominem", "Post Hoc Ergo Propter Hoc", "False Dilemma"],
        correctAnswer: 1,
        explanation: "An Ad Hominem attack attempts to invalidate a point by disparaging the person presenting it rather than its merits.",
      },
    ],
  },
  {
    id: "ai-101",
    title: "Artificial Intelligence, Neural Networks & Machine Learning",
    category: "Artificial Intelligence",
    level: "Advanced",
    targetZone: "YOUTH",
    iconName: "Cpu",
    xpReward: 300,
    overview:
      "Comprehensive examination of feedforward artificial neural networks, backpropagation calculus, transformer attention mechanisms, reinforcement learning, and ethical AI deployment across African agriculture and healthcare.",
    learningOutcomes: [
      "Derive gradient descent weight updates and backpropagation chain rule equations",
      "Understand multi-head self-attention mechanisms in modern Large Language Models",
      "Evaluate precision, recall, F1-score, and ROC-AUC metrics for machine learning classification",
      "Design fault-tolerant edge AI deployment pipelines for rural telemedicine diagnostics",
    ],
    flashcards: [
      {
        term: "Gradient Descent",
        definition: "An optimization algorithm for finding a local minimum of a differentiable objective function by taking steps proportional to the negative gradient.",
        context: "Used to iteratively tune neural network weights and minimize loss during model training.",
      },
      {
        term: "Self-Attention Mechanism",
        definition: "A mathematical layer that computes dynamic scalar weights between all token pairs in a sequence via query, key, and value dot-products.",
        context: "The architectural cornerstone of Transformer models and modern generative intelligence.",
      },
      {
        term: "Overfitting & Regularization",
        definition: "When a model memorizes training noise instead of general patterns; countered with techniques like L1/L2 weight decay and Dropout.",
        context: "Ensures models generalize reliably to unseen clinical and agricultural field data.",
      },
      {
        term: "Perceptron",
        definition: "The simplest artificial neuron model that computes a weighted sum of inputs plus bias and applies an activation function.",
        context: "Proposed by Frank Rosenblatt in 1958, laying the empirical foundation for modern deep learning.",
      },
    ],
    curriculumSections: [
      {
        title: "1. Mathematical Foundations of Deep Learning",
        body: [
          "Deep learning models approximate complex non-linear mappings between high-dimensional vector spaces. A neural layer computes a linear transformation followed by an activation function: a = sigma(W * x + b).",
          "Backpropagation applies the multi-variable chain rule to propagate the loss gradient backward from output to input, updating weight tensors using stochastic gradient descent (SGD) or Adam optimizers.",
        ],
        keyFormulasOrTakeaways: [
          "Linear Activation: z = W^T * x + b",
          "Softmax Probability: P(y=i) = exp(z_i) / Sigma(exp(z_j))",
          "Cross-Entropy Loss: L = -Sigma(y_i * log(p_i))",
        ],
        caseStudy: {
          title: "Computer Vision Diagnosis of Cassava Mosaic Disease in Nigeria",
          narrative:
            "African agronomy researchers train mobile convolutional neural networks (MobileNetV3) to diagnose leaf necrosis and viral strains in real-time without internet access.",
        },
      },
      {
        title: "2. Transformers and Attention Mechanisms",
        body: [
          "The Transformer architecture replaces recurrent architectures with multi-head self-attention, processing entire sequence contexts in parallel across GPUs.",
          "Given Query (Q), Key (K), and Value (V) matrices, Attention(Q, K, V) = softmax((Q * K^T) / sqrt(d_k)) * V.",
        ],
        keyFormulasOrTakeaways: [
          "Attention Matrix: Softmax((Q * K^T) / sqrt(d_k))",
          "Multi-Head Concatenation: Concat(head_1, ..., head_h) * W_O",
        ],
      },
    ],
    examination: [
      {
        id: "ai-q1",
        question: "In neural network optimization, what does the gradient of the loss function represent?",
        options: [
          "The direction of maximum rate of increase of the loss function",
          "The global minimum of model parameters",
          "The learning rate hyperparameter",
          "The ratio of true positives to false positives",
        ],
        correctAnswer: 0,
        explanation: "The gradient vector points in the direction of greatest rate of increase; gradient descent moves in the opposite direction.",
      },
      {
        id: "ai-q2",
        question: "Which scaling factor is applied to the dot product of Query and Key vectors in Scaled Dot-Product Attention?",
        options: ["1 / d_k", "1 / sqrt(d_k)", "sqrt(d_k)", "d_k^2"],
        correctAnswer: 1,
        explanation: "Dividing by sqrt(d_k) prevents dot products from growing excessively large for large dimensions, which would cause vanishing softmax gradients.",
      },
      {
        id: "ai-q3",
        question: "What regularization technique randomly deactivates a fraction of neurons during each training forward pass?",
        options: ["Batch Normalization", "Dropout", "Early Stopping", "Gradient Clipping"],
        correctAnswer: 1,
        explanation: "Dropout randomly sets a specified probability of neuron activations to zero during training, preventing co-adaptation of features.",
      },
      {
        id: "ai-q4",
        question: "When evaluating a binary classifier with high class imbalance, which metric is generally superior to raw accuracy?",
        options: ["Mean Squared Error", "F1-Score / Area Under Precision-Recall Curve", "Training Loss", "L1 Norm"],
        correctAnswer: 1,
        explanation: "F1-score (harmonic mean of precision and recall) accounts for false positives and false negatives without skew from dominant classes.",
      },
      {
        id: "ai-q5",
        question: "What activation function is defined as f(x) = max(0, x)?",
        options: ["Sigmoid", "Hyperbolic Tangent (Tanh)", "Rectified Linear Unit (ReLU)", "GELU"],
        correctAnswer: 2,
        explanation: "ReLU outputs x if x > 0 and 0 otherwise, overcoming the vanishing gradient problem common in sigmoid and tanh activations.",
      },
    ],
  },
  {
    id: "energy-101",
    title: "Renewable Energy Systems & Microgrid Engineering",
    category: "Renewable Energy & Engineering",
    level: "Advanced",
    targetZone: "YOUTH",
    iconName: "Zap",
    xpReward: 300,
    overview:
      "Engineering principles of decentralized photovoltaic generation, battery energy storage systems (BESS), inverter topologies, and hybrid mini-grid load management across sub-Saharan Africa.",
    learningOutcomes: [
      "Calculate peak solar irradiance (W/m2) and diurnal capacity factors across African climate zones",
      "Model lithium-iron-phosphate (LiFePO4) battery degradation curves and round-trip efficiency",
      "Analyze pure sine-wave DC-AC inverter topologies and maximum power point tracking (MPPT)",
      "Design resilient microgrid topologies capable of islanding during national grid collapses",
    ],
    flashcards: [
      {
        term: "Maximum Power Point Tracking (MPPT)",
        definition: "An electronic DC-to-DC converter algorithm that dynamically adjusts the electrical operating point of PV modules to extract maximum available power.",
        context: "Vital for solar installations where cloud cover and panel temperatures fluctuate rapidly throughout the day.",
      },
      {
        term: "Levelized Cost of Electricity (LCOE)",
        definition: "The net present value of the unit cost of electricity over the lifetime of a generating asset.",
        context: "The primary financial metric used to evaluate parity between off-grid solar mini-grids and fossil-fueled generators.",
      },
      {
        term: "Islanding Mode",
        definition: "A microgrid condition where a local distributed power system disconnects from the central utility grid and continues to supply power autonomously.",
        context: "Ensures critical hospitals and data centers remain energized during transmission outages.",
      },
      {
        term: "Depth of Discharge (DoD)",
        definition: "The percentage of a battery capacity that has been discharged relative to its overall capacity.",
        context: "Limiting DoD to 80% on LiFePO4 cells dramatically extends lifecycle to 5,000+ cycles.",
      },
    ],
    curriculumSections: [
      {
        title: "1. Solar Photovoltaic Physics and Irradiance Mechanics",
        body: [
          "Sub-Saharan Africa receives exceptional solar irradiance, averaging between 4.5 and 7.0 kWh/m2/day. Photovoltaic cells exploit the photoelectric effect in semiconductor p-n junctions.",
          "When photons with energy greater than the semiconductor bandgap strike the depletion region, electron-hole pairs are created, producing direct current (DC).",
        ],
        keyFormulasOrTakeaways: [
          "Power Output: P = V * I (Watts)",
          "Daily Energy Yield: E = Peak Sun Hours * System Capacity (kWp) * Performance Ratio",
          "Efficiency Derating: P_temp = P_stc * [1 + gamma * (T_cell - 25°C)]",
        ],
        caseStudy: {
          title: "Decentralized Solar Hybrid Mini-Grids in Rural Kano and Ogun",
          narrative:
            "Rural electrification initiatives deploy 100kWp solar-diesel-battery hybrid mini-grids with smart prepaid smart meters, powering agricultural agro-processing mills and cold storage hubs.",
        },
      },
      {
        title: "2. Energy Storage and Inverter Topologies",
        body: [
          "Lithium-iron-phosphate (LFP) chemistry has emerged as the premier standard for tropical microgrids due to high thermal runaway thresholds and long cycle life.",
          "Bidirectional inverters synchronize AC frequency (50 Hz standard in Nigeria) and automatically isolate circuits within milliseconds when grid frequency deviates beyond tolerance limits.",
        ],
      },
    ],
    examination: [
      {
        id: "en-q1",
        question: "What does MPPT stand for in solar charge controllers and grid-tied inverters?",
        options: [
          "Maximum Power Point Tracking",
          "Miniaturized Photovoltaic Power Transfer",
          "Multi-Phase Periodic Transmission",
          "Minimum Peak Phase Threshold",
        ],
        correctAnswer: 0,
        explanation: "MPPT constantly optimizes the impedance match between the solar array and battery bank or inverter.",
      },
      {
        id: "en-q2",
        question: "Which battery chemistry is currently favored for tropical stationary storage due to exceptional thermal stability and non-toxicity?",
        options: ["Lead-Acid AGM", "Lithium Iron Phosphate (LiFePO4)", "Nickel-Cadmium", "Lithium Cobalt Oxide (LCO)"],
        correctAnswer: 1,
        explanation: "LiFePO4 provides superior thermal safety, 4,000+ deep cycles, and excellent performance in warm sub-Saharan ambient temperatures.",
      },
      {
        id: "en-q3",
        question: "If a 5 kW solar array operates for 5 Peak Sun Hours with an 80% system performance ratio, what is the daily energy production?",
        options: ["15 kWh", "20 kWh", "25 kWh", "30 kWh"],
        correctAnswer: 1,
        explanation: "Energy = 5 kW * 5 hours * 0.80 = 20 kWh per day.",
      },
      {
        id: "en-q4",
        question: "What metric calculates the average net present cost of electricity generation for a generating plant over its operational lifespan?",
        options: ["Return on Investment (ROI)", "Levelized Cost of Electricity (LCOE)", "Internal Rate of Return (IRR)", "Operating Expense Ratio (OPEX)"],
        correctAnswer: 1,
        explanation: "LCOE divides total lifecycle costs by total electrical output over the plant's lifetime.",
      },
      {
        id: "en-q5",
        question: "What protective function disconnects a distributed solar generator from the grid when utility power fails to prevent electrocuting line workers?",
        options: ["Anti-islanding protection", "Thermal throttling", "Dynamic frequency scaling", "Harmonic dampening"],
        correctAnswer: 0,
        explanation: "Anti-islanding protection mandates rapid disconnect when the grid goes dark, preventing the local inverter from back-feeding live lines.",
      },
    ],
  },
  {
    id: "biotech-101",
    title: "Biotechnology, Molecular Genetics & Precision Medicine",
    category: "Biotechnology & Health",
    level: "Advanced",
    targetZone: "SENIOR",
    iconName: "Dna",
    xpReward: 300,
    overview:
      "Advanced study of recombinant DNA technology, CRISPR-Cas9 genome editing, sickle-cell genetics in sub-Saharan Africa, mRNA therapeutic platforms, and bioinformatics pipeline analysis.",
    learningOutcomes: [
      "Examine the molecular mechanism of CRISPR-Cas9 double-stranded DNA breaks and NHEJ/HDR repair",
      "Understand the single-nucleotide point mutation (HbS) underlying Sickle Cell Anemia and gene therapies",
      "Analyze recombinant plasmid vector cloning, restriction enzymes, and PCR amplification protocols",
      "Evaluate high-throughput next-generation sequencing (NGS) and phylogenetic pathogen tracing",
    ],
    flashcards: [
      {
        term: "CRISPR-Cas9",
        definition: "A targeted molecular gene-editing tool consisting of a Cas9 endonuclease and single guide RNA (sgRNA) that introduces double-strand breaks at specific genomic loci.",
        context: "Revolutionizing clinical gene therapy for sickle-cell disease and β-thalassemia.",
      },
      {
        term: "Sickle Cell Gene Mutation",
        definition: "A point mutation in codon 6 of the HBB gene on chromosome 11, substituting valine for glutamic acid (GAG to GTG).",
        context: "Historically selected for in malaria-endemic regions as heterozygous carriers (HbAS) possess malaria protection.",
      },
      {
        term: "Polymerase Chain Reaction (PCR)",
        definition: "A laboratory technique for enzymatic exponential amplification of specific DNA fragments using thermostable Taq polymerase and oligonucleotide primers.",
        context: "The gold standard for infectious pathogen diagnostics and forensic genomics.",
      },
      {
        term: "Recombinant DNA",
        definition: "DNA molecules formed by laboratory methods of genetic recombination to bring together genetic material from multiple sources.",
        context: "Enables industrial biosynthesis of human insulin, clotting factors, and monoclonal antibodies.",
      },
    ],
    curriculumSections: [
      {
        title: "1. Molecular Architecture of Genomic Engineering",
        body: [
          "Modern biotechnology hinges upon precise manipulation of nucleic acids. The central dogma dictates transcription of DNA into messenger RNA (mRNA), followed by translation into functional polypeptide proteins at the ribosome.",
          "CRISPR-Cas9 harnesses an adaptive bacterial immune system. The Cas9 enzyme utilizes a 20-nucleotide guide RNA sequence adjacent to a Protospacer Adjacent Motif (PAM: 5'-NGG-3') to cleave genomic DNA with surgical precision.",
        ],
        keyFormulasOrTakeaways: [
          "DNA Base Pairing: Adenine with Thymine (2 H-bonds); Guanine with Cytosine (3 H-bonds)",
          "PCR Cycle Yield: Amplified DNA = N_0 * 2^n (where n = number of thermal cycles)",
          "PAM Motif: Essential recognition sequence required for Cas9 endonuclease cleavage",
        ],
        caseStudy: {
          title: "Sickle Cell Gene Correction Research at the Nigerian Institute of Medical Research",
          narrative:
            "Clinical investigators evaluate Cas9 ribonucleoprotein editing targeting BCL11A erythroid enhancer sequences to reactivate protective fetal hemoglobin (HbF) in homozygous sickle cell patients.",
        },
      },
      {
        title: "2. Next-Generation Sequencing & Pathogen Surveillance",
        body: [
          "High-throughput Illumina and Oxford Nanopore sequencers enable de novo assembly and variant calling of viral and bacterial pathogens in hours.",
          "Genomic surveillance centers in Ede, Osun State track viral lineages (such as Lassa fever and Mpox), identifying evolutionary transmission trees.",
        ],
      },
    ],
    examination: [
      {
        id: "bio-q1",
        question: "Which nucleotide substitution in the beta-globin (HBB) gene causes Sickle Cell Disease?",
        options: [
          "Adenine replaced by Thymine in codon 6 (GAG to GTG)",
          "Cytosine replaced by Guanine in codon 12 (CGC to GGC)",
          "Thymine replaced by Cytosine in codon 4 (TAG to CAG)",
          "Guanine deleted in codon 1 (ATG to TG)",
        ],
        correctAnswer: 0,
        explanation: "The single point mutation swaps an Adenine with Thymine in codon 6, replacing hydrophilic glutamic acid with hydrophobic valine.",
      },
      {
        id: "bio-q2",
        question: "What short nucleotide sequence must be present directly adjacent to the target genomic site for Streptococcus pyogenes Cas9 to cleave DNA?",
        options: ["TATA Box", "PAM (Protospacer Adjacent Motif, 5'-NGG-3')", "Poly-A Tail", "Kozak Sequence"],
        correctAnswer: 1,
        explanation: "Cas9 strictly requires the PAM sequence (typically 5'-NGG-3') immediately downstream of the target DNA sequence to initiate cleavage.",
      },
      {
        id: "bio-q3",
        question: "Why does Taq polymerase remain functional throughout the repeated high-temperature denaturation steps (95°C) of PCR?",
        options: [
          "It is protected by lipid nanoparticles",
          "It is isolated from thermophilic bacterium Thermus aquaticus",
          "It is synthesized without peptide bonds",
          "It operates only under high pressure",
        ],
        correctAnswer: 1,
        explanation: "Taq polymerase originated from Thermus aquaticus, a bacterium that lives in thermal hot springs, conferring extraordinary thermostability.",
      },
      {
        id: "bio-q4",
        question: "In mRNA vaccines, what delivery vehicle protects fragile mRNA molecules from degradation by extracellular ribonucleases?",
        options: ["Viral bacteriophages", "Lipid Nanoparticles (LNPs)", "Cellulose fibers", "Alum crystals"],
        correctAnswer: 1,
        explanation: "Lipid nanoparticles encapsulate synthetic mRNA, safeguarding it from enzymatic destruction and facilitating cellular endocytosis.",
      },
      {
        id: "bio-q5",
        question: "Which cellular repair pathway can introduce targeted gene insertions when a homologous DNA donor template is supplied alongside Cas9?",
        options: ["Non-Homologous End Joining (NHEJ)", "Homology-Directed Repair (HDR)", "Base Excision Repair", "Mismatch Repair"],
        correctAnswer: 1,
        explanation: "Homology-Directed Repair (HDR) uses homologous sequence templates to achieve high-fidelity gene insertion or base correction.",
      },
    ],
  },
  {
    id: "ir-101",
    title: "International Relations, Geopolitics & African Economic Diplomacy",
    category: "International Relations & Geopolitics",
    level: "Advanced",
    targetZone: "SENIOR",
    iconName: "Globe",
    xpReward: 300,
    overview:
      "Theories of international statecraft, multilateral diplomacy, the African Continental Free Trade Area (AfCFTA), maritime trade security in the Gulf of Guinea, and Africa's strategic agency in the multipolar world order.",
    learningOutcomes: [
      "Compare Realism, Liberal Institutionalism, and Constructivism in international system analysis",
      "Analyze dispute settlement mechanisms and Rules of Origin under the AfCFTA framework",
      "Examine sovereignty, non-interference, and the Responsibility to Protect (R2P) under the AU and UN",
      "Evaluate bilateral debt diplomacy, resource concessions, and foreign direct investment (FDI) inflows",
    ],
    flashcards: [
      {
        term: "Rules of Origin",
        definition: "The criteria needed to determine the national source of a product under trade agreements.",
        context: "Crucial under AfCFTA to ensure goods receiving duty-free preferences are substantially manufactured within African states.",
      },
      {
        term: "Realism vs. Liberal Institutionalism",
        definition: "Realism views the international system as anarchic where states pursue power and security; Liberalism argues multilateral institutions foster cooperation and reduce conflict.",
        context: "The foundational theoretical debate informing national foreign policy and treaty alliances.",
      },
      {
        term: "Gulf of Guinea Maritime Security",
        definition: "The strategic multilateral defense framework policing vital commercial shipping lanes against maritime piracy and illegal fishing.",
        context: "Governed by the Yaoundé Architecture spanning ECOWAS, ECCAS, and the Gulf of Guinea Commission.",
      },
      {
        term: "Pan-African Payment and Settlement System (PAPSS)",
        definition: "A centralized financial market infrastructure enabling commercial trade across Africa in local domestic currencies without converting to USD or EUR.",
        context: "Developed by Afreximbank to eliminate estimated billions of dollars in foreign exchange transaction frictions.",
      },
    ],
    curriculumSections: [
      {
        title: "1. The African Continental Free Trade Area (AfCFTA)",
        body: [
          "The AfCFTA constitutes the largest free trade area in the world by number of participating countries, covering 1.3 billion people and a combined GDP exceeding $3.4 trillion.",
          "By progressively eliminating tariffs on 90% of tariff lines and harmonizing non-tariff barriers, the agreement aims to accelerate intra-African trade from historical lows of ~15% toward levels exceeding 50%.",
        ],
        keyFormulasOrTakeaways: [
          "Combined Market: 54 signatory states, 1.3B consumers",
          "PAPSS Integration: Real-time settlement in domestic local currencies",
          "Protocol on Trade in Goods: Progressive tariff reduction schedules over 5–10 years",
        ],
        caseStudy: {
          title: "Cross-Border Trade Harmonization at Seme-Krake Border Post",
          narrative:
            "Nigeria and the Republic of Benin implement joint border inspection posts, reducing truck turnaround times from days to hours through digital customs clearing manifests.",
        },
      },
      {
        title: "2. Multilateral Sovereignty and the African Union Peace Architecture",
        body: [
          "Article 4(h) of the African Union Constitutive Act establishes the right of the Union to intervene in a Member State pursuant to a decision of the Assembly in respect of grave circumstances (war crimes, genocide, and crimes against humanity).",
          "This represented a historical paradigm shift from traditional absolute non-interference toward 'non-indifference'.",
        ],
      },
    ],
    examination: [
      {
        id: "ir-q1",
        question: "Which pan-African settlement platform enables businesses to trade cross-border in local currencies without converting through foreign currencies like USD?",
        options: [
          "Pan-African Payment and Settlement System (PAPSS)",
          "SWIFT Interbank Protocol",
          "Afro-Euro Clearing Exchange",
          "Continental Treasury Network",
        ],
        correctAnswer: 0,
        explanation: "PAPSS, developed by Afreximbank, allows instantaneous commercial cross-border settlement in local domestic currencies.",
      },
      {
        id: "ir-q2",
        question: "What legal criteria under free trade agreements determine whether a good qualifies for preferential tariff-free status based on local value addition?",
        options: ["Rules of Origin", "Tariff Rate Quotas", "Most Favored Nation (MFN)", "Cabotage Laws"],
        correctAnswer: 0,
        explanation: "Rules of Origin establish the necessary manufacturing thresholds required to verify that goods originate within member states.",
      },
      {
        id: "ir-q3",
        question: "Which theoretical school of international relations contends that international politics is fundamentally an anarchic struggle for state survival and military power?",
        options: ["Liberal Institutionalism", "Structural Realism (Realpolitik)", "Constructivism", "Feminist IR Theory"],
        correctAnswer: 1,
        explanation: "Structural Realism posits that because no overarching world government exists (anarchy), sovereign states must prioritize relative power and national security.",
      },
      {
        id: "ir-q4",
        question: "Which landmark article of the African Union Constitutive Act enshrines the right of intervention in cases of grave circumstances (war crimes, genocide)?",
        options: ["Article 4(h)", "Article 12(b)", "Article 24", "Article 51"],
        correctAnswer: 0,
        explanation: "Article 4(h) of the AU Constitutive Act codifies the legal authority to intervene to prevent or halt mass atrocities.",
      },
      {
        id: "ir-q5",
        question: "What regional multilateral architecture coordinates maritime anti-piracy operations and intelligence sharing across the Gulf of Guinea?",
        options: ["The Yaoundé Architecture", "The Malabo Protocol", "The Nairobi Accord", "The Dakar Framework"],
        correctAnswer: 0,
        explanation: "The Yaoundé Architecture (signed in 2013) links ECOWAS, ECCAS, and the Gulf of Guinea Commission to secure maritime trade.",
      },
    ],
  },
];

// ============================================================================
// EDUCATIONAL LEARNING DRILLS & GAMES (CALIBRATED BY AGE ZONE)
// ============================================================================
export interface GameQuestionItem {
  id: string;
  discipline: string;
  targetZone: "JUNIOR" | "TEEN" | "YOUTH" | "SENIOR";
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export const AGE_CALIBRATED_QUESTIONS: Record<string, GameQuestionItem[]> = {
  JUNIOR: [
    {
      id: "j-1",
      discipline: "Mathematics",
      targetZone: "JUNIOR",
      question: "What is 14 multiplied by 6?",
      options: ["74", "84", "94", "86"],
      correctAnswer: 1,
      explanation: "14 * 6 = (10 * 6) + (4 * 6) = 60 + 24 = 84.",
    },
    {
      id: "j-2",
      discipline: "Natural Science",
      targetZone: "JUNIOR",
      question: "Which planet in our solar system is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctAnswer: 1,
      explanation: "Mars appears red due to iron oxide (rust) on its planetary surface.",
    },
    {
      id: "j-3",
      discipline: "African Geography",
      targetZone: "JUNIOR",
      question: "What is the longest river in Africa?",
      options: ["River Niger", "River Congo", "River Nile", "Zambezi River"],
      correctAnswer: 2,
      explanation: "The Nile River is approximately 6,650 km long, flowing north into the Mediterranean.",
    },
    {
      id: "j-4",
      discipline: "English Vocabulary",
      targetZone: "JUNIOR",
      question: "What is the antonym (opposite) of the word 'Abundant'?",
      options: ["Plentiful", "Scarce", "Enormous", "Vibrant"],
      correctAnswer: 1,
      explanation: "'Scarce' means insufficient or rare, the direct opposite of abundant.",
    },
    {
      id: "j-5",
      discipline: "Mathematics",
      targetZone: "JUNIOR",
      question: "If a rectangle has length 9 cm and width 4 cm, what is its perimeter?",
      options: ["36 cm", "26 cm", "24 cm", "18 cm"],
      correctAnswer: 1,
      explanation: "Perimeter = 2 * (length + width) = 2 * (9 + 4) = 2 * 13 = 26 cm.",
    },
    {
      id: "j-6",
      discipline: "Natural Science",
      targetZone: "JUNIOR",
      question: "Which gas do green plants absorb from the atmosphere during photosynthesis?",
      options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Helium"],
      correctAnswer: 1,
      explanation: "Green plants absorb carbon dioxide and water to synthesize glucose, releasing oxygen as a byproduct.",
    },
    {
      id: "j-7",
      discipline: "African Heritage",
      targetZone: "JUNIOR",
      question: "Which famous ancient Nigerian kingdom was world-renowned for its intricate bronze sculptures and royal plaques?",
      options: ["Kingdom of Benin", "Mali Empire", "Songhai Empire", "Kush Empire"],
      correctAnswer: 0,
      explanation: "The historical Kingdom of Benin produced renowned cast bronze artworks and guild metal sculptures.",
    },
    {
      id: "j-8",
      discipline: "English Grammar",
      targetZone: "JUNIOR",
      question: "Identify the action verb in the sentence: 'The fast cheetah sprinted across the dry savanna.'",
      options: ["Fast", "Cheetah", "Sprinted", "Savanna"],
      correctAnswer: 2,
      explanation: "'Sprinted' is the dynamic action verb describing what the cheetah did.",
    },
  ],
  TEEN: [
    {
      id: "t-1",
      discipline: "Algebra",
      targetZone: "TEEN",
      question: "Solve for x in the equation: 3x - 7 = 2x + 11",
      options: ["18", "14", "4", "22"],
      correctAnswer: 0,
      explanation: "Subtract 2x from both sides: x - 7 = 11. Add 7: x = 18.",
    },
    {
      id: "t-2",
      discipline: "Physics",
      targetZone: "TEEN",
      question: "What is the acceleration due to gravity on Earth's surface?",
      options: ["8.9 m/s^2", "9.8 m/s^2", "10.8 m/s^2", "12.0 m/s^2"],
      correctAnswer: 1,
      explanation: "Standard acceleration due to Earth's gravity is approximately 9.8 m/s^2.",
    },
    {
      id: "t-3",
      discipline: "Computer Programming",
      targetZone: "TEEN",
      question: "In Python, what is the output of: len([x for x in range(10) if x % 2 == 0])?",
      options: ["4", "5", "10", "6"],
      correctAnswer: 1,
      explanation: "The even integers in range(10) are 0, 2, 4, 6, 8, which is exactly 5 elements.",
    },
    {
      id: "t-4",
      discipline: "Civic Governance",
      targetZone: "TEEN",
      question: "In what year did Nigeria gain national independence from British colonial rule?",
      options: ["1957", "1960", "1963", "1970"],
      correctAnswer: 1,
      explanation: "Nigeria attained independence on October 1, 1960.",
    },
    {
      id: "t-5",
      discipline: "Chemistry",
      targetZone: "TEEN",
      question: "What is the pH value of pure neutral water at 25 degrees Celsius?",
      options: ["0.0", "5.5", "7.0", "9.2"],
      correctAnswer: 2,
      explanation: "A pH of 7.0 signifies exact equality between hydrogen ion and hydroxide ion concentrations.",
    },
    {
      id: "t-6",
      discipline: "Biology",
      targetZone: "TEEN",
      question: "Which cellular organelle synthesizes ATP through oxidative phosphorylation?",
      options: ["Ribosome", "Golgi Apparatus", "Mitochondrion", "Lysosome"],
      correctAnswer: 2,
      explanation: "Mitochondria produce the majority of cellular adenosine triphosphate (ATP) energy currency.",
    },
    {
      id: "t-7",
      discipline: "Literature",
      targetZone: "TEEN",
      question: "What is a fourteen-line poem written in iambic pentameter with a structured rhyme scheme called?",
      options: ["Sonnet", "Ballad", "Haiku", "Elegy"],
      correctAnswer: 0,
      explanation: "A sonnet is traditionally composed of 14 lines in iambic pentameter (e.g. Petrarchan or Shakespearean).",
    },
    {
      id: "t-8",
      discipline: "Microeconomics",
      targetZone: "TEEN",
      question: "When consumer demand strictly exceeds supply for a scarce good at current price levels, what happens?",
      options: ["Surplus occurs and price falls", "Shortage occurs and price tends to rise", "Price remains fixed", "Supply automatically drops"],
      correctAnswer: 1,
      explanation: "Excess demand creates a market shortage, exerting upward pressure on the clearing price until equilibrium is restored.",
    },
  ],
  YOUTH: [
    {
      id: "y-1",
      discipline: "Probability & Statistics",
      targetZone: "YOUTH",
      question: "What is the probability of rolling a sum of 7 with two fair 6-sided dice?",
      options: ["1/6 (6/36)", "1/8 (4/36)", "1/12 (3/36)", "5/36"],
      correctAnswer: 0,
      explanation: "Pairs yielding 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) = 6 outcomes out of 36 = 1/6.",
    },
    {
      id: "y-2",
      discipline: "Data Structures",
      targetZone: "YOUTH",
      question: "What is the amortized time complexity of appending an element to a dynamic array?",
      options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
      correctAnswer: 0,
      explanation: "While resizing takes O(n), it occurs infrequently; thus the amortized complexity is O(1).",
    },
    {
      id: "y-3",
      discipline: "Macroeconomics",
      targetZone: "YOUTH",
      question: "What economic condition is characterized by stagnant economic growth paired with high inflation?",
      options: ["Deflation", "Stagflation", "Hypergrowth", "Liquidity Trap"],
      correctAnswer: 1,
      explanation: "Stagflation combines economic stagnation (recession/slow growth) with elevated price inflation.",
    },
    {
      id: "y-4",
      discipline: "Geopolitics",
      targetZone: "YOUTH",
      question: "What continental treaty created the world's largest free trade area by member states in Africa?",
      options: ["ECOWAS Treaty", "AfCFTA", "SADC Protocol", "AU Charter"],
      correctAnswer: 1,
      explanation: "The African Continental Free Trade Area (AfCFTA) spans 54 signatory states.",
    },
    {
      id: "y-5",
      discipline: "Machine Learning & Linear Algebra",
      targetZone: "YOUTH",
      question: "Which matrix factorization decomposes any real matrix into two orthogonal matrices and a diagonal matrix of singular values?",
      options: ["LU Decomposition", "Cholesky Decomposition", "Singular Value Decomposition (SVD)", "QR Factorization"],
      correctAnswer: 2,
      explanation: "SVD factors A = U * Sigma * V^T, central to dimensionality reduction, PCA, and latent semantic analysis.",
    },
    {
      id: "y-6",
      discipline: "Cellular Biochemistry",
      targetZone: "YOUTH",
      question: "Which metabolic cycle in the mitochondrial matrix oxidizes acetyl-CoA into carbon dioxide, generating high-energy NADH and FADH2?",
      options: ["Calvin Cycle", "Citric Acid (Krebs) Cycle", "Glycolysis", "Pentose Phosphate Pathway"],
      correctAnswer: 1,
      explanation: "The Krebs / Citric Acid Cycle systematically harvests electrons from organic substrates to feed the electron transport chain.",
    },
    {
      id: "y-7",
      discipline: "Computer Networks",
      targetZone: "YOUTH",
      question: "At which layer of the OSI 7-layer reference model do IP addressing and packet routing decisions occur?",
      options: ["Data Link Layer (Layer 2)", "Network Layer (Layer 3)", "Transport Layer (Layer 4)", "Session Layer (Layer 5)"],
      correctAnswer: 1,
      explanation: "Layer 3 (Network Layer) manages logical packet routing and forwarding across subnetworks.",
    },
    {
      id: "y-8",
      discipline: "Corporate Finance",
      targetZone: "YOUTH",
      question: "If a discounted capital expenditure project generates a Net Present Value (NPV) strictly greater than zero, what is the rational investment action?",
      options: ["Reject the project", "Accept the project as it creates economic value", "Defer decision indefinitely", "Borrow more debt"],
      correctAnswer: 1,
      explanation: "A positive NPV indicates that projected discounted cash inflows exceed the initial cost of capital, augmenting enterprise value.",
    },
  ],
  SENIOR: [
    {
      id: "s-1",
      discipline: "System Architecture",
      targetZone: "SENIOR",
      question: "According to the CAP Theorem, in the presence of a network partition (P), a distributed system must choose between what?",
      options: ["Speed vs Security", "Consistency vs Availability", "Latency vs Storage", "Durability vs Compression"],
      correctAnswer: 1,
      explanation: "The CAP Theorem states that upon a network partition, a system can maintain either Consistency (C) or Availability (A), but not both.",
    },
    {
      id: "s-2",
      discipline: "Corporate Finance",
      targetZone: "SENIOR",
      question: "In corporate valuation, what does WACC represent?",
      options: ["Weighted Average Cost of Capital", "Working Asset Cash Coverage", "World Aggregate Credit Committee", "Weighted Annual Capital Ceiling"],
      correctAnswer: 0,
      explanation: "WACC blends a firm's required cost of equity and after-tax cost of debt weighted by market value.",
    },
    {
      id: "s-3",
      discipline: "Constitutional Jurisprudence",
      targetZone: "SENIOR",
      question: "What constitutional doctrine permits a court to refuse to decide issues fundamentally non-justiciable or entrusted to political branches?",
      options: ["Stare Decisis", "Political Question Doctrine", "Res Judicata", "Ultra Vires"],
      correctAnswer: 1,
      explanation: "The Political Question Doctrine holds that certain questions are properly resolved by elected political branches rather than the judiciary.",
    },
    {
      id: "s-4",
      discipline: "Cognitive Strategy",
      targetZone: "SENIOR",
      question: "In decision theory, which heuristic leads individuals to disproportionately overweight the first piece of information received?",
      options: ["Confirmation Bias", "Anchoring Effect", "Sunk Cost Fallacy", "Framing Effect"],
      correctAnswer: 1,
      explanation: "The Anchoring Effect describes relying heavily on initial reference points when evaluating subsequent data.",
    },
    {
      id: "s-5",
      discipline: "Applied Cryptography",
      targetZone: "SENIOR",
      question: "Which asymmetric public-key cryptosystem achieves comparable security to 3072-bit RSA with a much smaller 256-bit key size?",
      options: ["Diffie-Hellman", "Elliptic Curve Cryptography (ECC)", "DES Cipher", "MD5 Hash"],
      correctAnswer: 1,
      explanation: "ECC leverages the hardness of the Elliptic Curve Discrete Logarithm Problem (ECDLP), granting equivalent security with compact 256-bit keys.",
    },
    {
      id: "s-6",
      discipline: "Distributed Consensus",
      targetZone: "SENIOR",
      question: "In the Raft consensus algorithm, which state does a follower node transition to if its election timer elapses without receiving heartbeats?",
      options: ["Leader", "Candidate", "Standby", "Terminator"],
      correctAnswer: 1,
      explanation: "When a follower's election timer times out, it increments the term and transitions to Candidate to initiate an election.",
    },
    {
      id: "s-7",
      discipline: "Quantitative Derivatives",
      targetZone: "SENIOR",
      question: "In the Black-Scholes-Merton model, what does the Greek metric 'Delta' measure?",
      options: [
        "Rate of change of option price with respect to underlying asset price",
        "Sensitivity of option price to changes in implied volatility",
        "Rate of decay with time",
        "Sensitivity to benchmark interest rate changes",
      ],
      correctAnswer: 0,
      explanation: "Delta (∂V/∂S) measures how much the theoretical option price moves per unit change in the underlying spot asset price.",
    },
    {
      id: "s-8",
      discipline: "International Maritime Law",
      targetZone: "SENIOR",
      question: "Under the United Nations Convention on the Law of the Sea (UNCLOS), an Exclusive Economic Zone (EEZ) extends out to how many nautical miles from the baseline?",
      options: ["12 nautical miles", "24 nautical miles", "200 nautical miles", "350 nautical miles"],
      correctAnswer: 2,
      explanation: "The EEZ extends up to 200 nautical miles (370.4 km), granting coastal states sovereign rights for exploring and managing natural marine resources.",
    },
  ],
};

// ============================================================================
// INTERACTIVE LEARNING GAMES DATASETS
// ============================================================================

export interface MemoryCardDefinition {
  id: string;
  pairKey: string;
  label: string;
  sublabel: string;
  category: string;
}

export const MEMORY_DECKS_BY_ZONE: Record<string, MemoryCardDefinition[]> = {
  JUNIOR: [
    { id: "m1a", pairKey: "sun", label: "Solar Energy", sublabel: "Photoelectric Photons", category: "Physics" },
    { id: "m1b", pairKey: "sun", label: "Solar Energy", sublabel: "Photoelectric Photons", category: "Physics" },
    { id: "m2a", pairKey: "dna", label: "DNA Helix", sublabel: "Genetic Code (A,T,C,G)", category: "Biology" },
    { id: "m2b", pairKey: "dna", label: "DNA Helix", sublabel: "Genetic Code (A,T,C,G)", category: "Biology" },
    { id: "m3a", pairKey: "nile", label: "River Nile", sublabel: "Longest African River", category: "Geography" },
    { id: "m3b", pairKey: "nile", label: "River Nile", sublabel: "Longest African River", category: "Geography" },
    { id: "m4a", pairKey: "pi", label: "Pi Constant", sublabel: "3.14159 Circle Ratio", category: "Math" },
    { id: "m4b", pairKey: "pi", label: "Pi Constant", sublabel: "3.14159 Circle Ratio", category: "Math" },
    { id: "m5a", pairKey: "benin", label: "Benin Bronzes", sublabel: "Historic Metallurgy", category: "History" },
    { id: "m5b", pairKey: "benin", label: "Benin Bronzes", sublabel: "Historic Metallurgy", category: "History" },
    { id: "m6a", pairKey: "gravity", label: "Earth Gravity", sublabel: "9.8 m/s^2 Acceleration", category: "Physics" },
    { id: "m6b", pairKey: "gravity", label: "Earth Gravity", sublabel: "9.8 m/s^2 Acceleration", category: "Physics" },
  ],
  TEEN: [
    { id: "t1a", pairKey: "py", label: "Python Syntax", sublabel: "List Comprehension", category: "Computing" },
    { id: "t1b", pairKey: "py", label: "Python Syntax", sublabel: "List Comprehension", category: "Computing" },
    { id: "t2a", pairKey: "ph", label: "Neutral pH", sublabel: "pH 7.0 at 25°C", category: "Chemistry" },
    { id: "t2b", pairKey: "ph", label: "Neutral pH", sublabel: "pH 7.0 at 25°C", category: "Chemistry" },
    { id: "t3a", pairKey: "mit", label: "Mitochondria", sublabel: "ATP Phosphorylation", category: "Biology" },
    { id: "t3b", pairKey: "mit", label: "Mitochondria", sublabel: "ATP Phosphorylation", category: "Biology" },
    { id: "t4a", pairKey: "cfta", label: "AfCFTA Treaty", sublabel: "Pan-African Trade", category: "Economics" },
    { id: "t4b", pairKey: "cfta", label: "AfCFTA Treaty", sublabel: "Pan-African Trade", category: "Economics" },
    { id: "t5a", pairKey: "ohm", label: "Ohm's Law", sublabel: "V = I * R Circuit", category: "Physics" },
    { id: "t5b", pairKey: "ohm", label: "Ohm's Law", sublabel: "V = I * R Circuit", category: "Physics" },
    { id: "t6a", pairKey: "quad", label: "Quadratic Formula", sublabel: "x = (-b ± sqrt(b^2-4ac))/2a", category: "Math" },
    { id: "t6b", pairKey: "quad", label: "Quadratic Formula", sublabel: "x = (-b ± sqrt(b^2-4ac))/2a", category: "Math" },
  ],
  YOUTH: [
    { id: "y1a", pairKey: "cap", label: "CAP Theorem", sublabel: "Consistency vs Availability", category: "Systems" },
    { id: "y1b", pairKey: "cap", label: "CAP Theorem", sublabel: "Consistency vs Availability", category: "Systems" },
    { id: "y2a", pairKey: "svd", label: "SVD Factorization", sublabel: "A = U * Sigma * V^T", category: "AI Math" },
    { id: "y2b", pairKey: "svd", label: "SVD Factorization", sublabel: "A = U * Sigma * V^T", category: "AI Math" },
    { id: "y3a", pairKey: "bess", label: "LiFePO4 Storage", sublabel: "Stationary Microgrid BESS", category: "Energy" },
    { id: "y3b", pairKey: "bess", label: "LiFePO4 Storage", sublabel: "Stationary Microgrid BESS", category: "Energy" },
    { id: "y4a", pairKey: "crispr", label: "CRISPR-Cas9", sublabel: "sgRNA PAM Double-Strand", category: "Biotech" },
    { id: "y4b", pairKey: "crispr", label: "CRISPR-Cas9", sublabel: "sgRNA PAM Double-Strand", category: "Biotech" },
    { id: "y5a", pairKey: "papss", label: "PAPSS Infrastructure", sublabel: "Local Domestic Currency Settlement", category: "Finance" },
    { id: "y5b", pairKey: "papss", label: "PAPSS Infrastructure", sublabel: "Local Domestic Currency Settlement", category: "Finance" },
    { id: "y6a", pairKey: "bigo", label: "Binary Search", sublabel: "O(log n) Asymptotic Bound", category: "Algorithms" },
    { id: "y6b", pairKey: "bigo", label: "Binary Search", sublabel: "O(log n) Asymptotic Bound", category: "Algorithms" },
  ],
  SENIOR: [
    { id: "s1a", pairKey: "raft", label: "Raft Consensus", sublabel: "Leader Election & Log Replicas", category: "Distributed" },
    { id: "s1b", pairKey: "raft", label: "Raft Consensus", sublabel: "Leader Election & Log Replicas", category: "Distributed" },
    { id: "s2a", pairKey: "wacc", label: "WACC Valuation", sublabel: "Weighted Cost of Debt & Equity", category: "Valuation" },
    { id: "s2b", pairKey: "wacc", label: "WACC Valuation", sublabel: "Weighted Cost of Debt & Equity", category: "Valuation" },
    { id: "s3a", pairKey: "ecc", label: "ECC-256 Cryptography", sublabel: "Discrete Logarithm Hardness", category: "Security" },
    { id: "s3b", pairKey: "ecc", label: "ECC-256 Cryptography", sublabel: "Discrete Logarithm Hardness", category: "Security" },
    { id: "s4a", pairKey: "eez", label: "UNCLOS EEZ", sublabel: "200 Nautical Mile Sovereign Zone", category: "Treaty Law" },
    { id: "s4b", pairKey: "eez", label: "UNCLOS EEZ", sublabel: "200 Nautical Mile Sovereign Zone", category: "Treaty Law" },
    { id: "s5a", pairKey: "bsm", label: "Black-Scholes Delta", sublabel: "∂V/∂S Spot Hedge Ratio", category: "Quant Finance" },
    { id: "s5b", pairKey: "bsm", label: "Black-Scholes Delta", sublabel: "∂V/∂S Spot Hedge Ratio", category: "Quant Finance" },
    { id: "s6a", pairKey: "acid", label: "ACID Isolation", sublabel: "Serializable Snapshot Concurrency", category: "Databases" },
    { id: "s6b", pairKey: "acid", label: "ACID Isolation", sublabel: "Serializable Snapshot Concurrency", category: "Databases" },
  ],
};

export interface WordCipherItem {
  id: string;
  targetZone: "JUNIOR" | "TEEN" | "YOUTH" | "SENIOR";
  targetWord: string;
  discipline: string;
  clue: string;
}

export const WORD_CIPHER_DATASET: WordCipherItem[] = [
  // JUNIOR
  { id: "wc-j1", targetZone: "JUNIOR", targetWord: "GRAVITY", discipline: "Natural Science", clue: "The invisible force that pulls planetary objects toward Earth." },
  { id: "wc-j2", targetZone: "JUNIOR", targetWord: "EQUATOR", discipline: "Geography", clue: "The imaginary circle line dividing the Earth into Northern and Southern hemispheres." },
  { id: "wc-j3", targetZone: "JUNIOR", targetWord: "FRACTION", discipline: "Mathematics", clue: "A numerical quantity that represents part of a whole number (e.g. 3/4)." },
  { id: "wc-j4", targetZone: "JUNIOR", targetWord: "HABITAT", discipline: "Ecology", clue: "The natural home or physical environment of an animal, plant, or organism." },

  // TEEN
  { id: "wc-t1", targetZone: "TEEN", targetWord: "ALGORITHM", discipline: "Computer Science", clue: "A finite unambiguous step-by-step procedure for solving a computational problem." },
  { id: "wc-t2", targetZone: "TEEN", targetWord: "CATALYST", discipline: "Chemistry", clue: "A chemical substance that accelerates a reaction rate without undergoing permanent change." },
  { id: "wc-t3", targetZone: "TEEN", targetWord: "METABOLISM", discipline: "Biology", clue: "The chemical processes occurring within a living organism to sustain life and convert energy." },
  { id: "wc-t4", targetZone: "TEEN", targetWord: "RHETORIC", discipline: "Literature", clue: "The art of effective persuasive discourse using ethos, pathos, and logos." },

  // YOUTH
  { id: "wc-y1", targetZone: "YOUTH", targetWord: "DERIVATIVE", discipline: "Calculus", clue: "The mathematical rate of change of a function with respect to a chosen independent variable." },
  { id: "wc-y2", targetZone: "YOUTH", targetWord: "HEURISTIC", discipline: "Artificial Intelligence", clue: "A practical approach or mental shortcut not guaranteed to be optimal but sufficient for immediate goals." },
  { id: "wc-y3", targetZone: "YOUTH", targetWord: "ASYMPTOTIC", discipline: "Algorithms", clue: "Refers to the limiting behavior of an algorithm execution as input size n approaches infinity." },
  { id: "wc-y4", targetZone: "YOUTH", targetWord: "SOVEREIGNTY", discipline: "Political Science", clue: "The supreme legitimate power and authority of an independent state to govern its domestic domain." },

  // SENIOR
  { id: "wc-s1", targetZone: "SENIOR", targetWord: "IDEMPOTENT", discipline: "Distributed Systems", clue: "An API operation property where executing a request multiple times yields the same identical state." },
  { id: "wc-s2", targetZone: "SENIOR", targetWord: "ARBITRAGE", discipline: "Financial Markets", clue: "The simultaneous purchase and sale of an asset in different markets to exploit price discrepancies." },
  { id: "wc-s3", targetZone: "SENIOR", targetWord: "JURISPRUDENCE", discipline: "Constitutional Law", clue: "The philosophy, theoretical study, and science of legal principles and court precedents." },
  { id: "wc-s4", targetZone: "SENIOR", targetWord: "ISOMORPHISM", discipline: "Abstract Algebra", clue: "A bijective structure-preserving mapping between two algebraic systems." },
];

export interface CodeDebuggerItem {
  id: string;
  targetZone: "JUNIOR" | "TEEN" | "YOUTH" | "SENIOR";
  title: string;
  language: string;
  codeLines: string[];
  bugLineIndex: number;
  explanation: string;
  fix: string;
}

export const CODE_DEBUGGER_DATASET: CodeDebuggerItem[] = [
  {
    id: "cd-1",
    targetZone: "TEEN",
    title: "Array Off-By-One Index Error",
    language: "Python",
    codeLines: [
      "def compute_mean(scores):",
      "    total = sum(scores)",
      "    # Return arithmetic mean",
      "    return total / (len(scores) + 1)",
    ],
    bugLineIndex: 3,
    explanation: "Line 4 divides total by (len(scores) + 1) instead of len(scores), skewing the true mean downward.",
    fix: "return total / len(scores)",
  },
  {
    id: "cd-2",
    targetZone: "TEEN",
    title: "Comparison vs Assignment Operator",
    language: "JavaScript / TypeScript",
    codeLines: [
      "function isPassing(grade: number): boolean {",
      "    // Threshold check for pass",
      "    if (grade = 70) {",
      "        return true;",
      "    }",
      "    return false;",
      "}",
    ],
    bugLineIndex: 2,
    explanation: "Line 3 uses single assignment '=' instead of strict equality comparison '===', causing grade to be reassigned to 70 and always evaluating to truthy.",
    fix: "if (grade >= 70) {",
  },
  {
    id: "cd-3",
    targetZone: "YOUTH",
    title: "Mutable Default Argument Pitfall",
    language: "Python",
    codeLines: [
      "def register_scholar(name, roster=[]):",
      "    roster.append(name)",
      "    # Return updated list",
      "    return roster",
    ],
    bugLineIndex: 0,
    explanation: "Line 1 defines 'roster=[]' as a default argument, which binds once at function definition time and is shared across all function calls.",
    fix: "def register_scholar(name, roster=None): if roster is None: roster = []",
  },
  {
    id: "cd-4",
    targetZone: "YOUTH",
    title: "Unsynchronized Race Condition in Async Loop",
    language: "TypeScript",
    codeLines: [
      "async function processAccounts(ids: string[]) {",
      "    let balance = 0;",
      "    ids.forEach(async (id) => {",
      "        balance += await fetchBalance(id);",
      "    });",
      "    return balance;",
      "}",
    ],
    bugLineIndex: 2,
    explanation: "Array.prototype.forEach does not await async callbacks; the function returns balance = 0 before promises resolve.",
    fix: "Use for (const id of ids) or Promise.all()",
  },
  {
    id: "cd-5",
    targetZone: "SENIOR",
    title: "SQL Injection Vulnerability in Raw Query",
    language: "SQL / TypeScript",
    codeLines: [
      "async function getUserRecords(userRole: string) {",
      "    // Execute database query",
      "    const query = `SELECT * FROM users WHERE role = '${userRole}'`;",
      "    return await db.raw(query);",
      "}",
    ],
    bugLineIndex: 2,
    explanation: "String interpolation directly embeds unescaped inputs into raw SQL, exposing the database to SQL injection attacks.",
    fix: "Use parameterized queries: SELECT * FROM users WHERE role = $1",
  },
  {
    id: "cd-6",
    targetZone: "SENIOR",
    title: "Broken Mutex Lock Release on Error",
    language: "Go / Concurrency",
    codeLines: [
      "func (s *SafeStore) Transfer(amount int) error {",
      "    s.mu.Lock()",
      "    if err := s.validate(amount); err != nil {",
      "        return err // Mutex left permanently locked",
      "    }",
      "    s.balance -= amount",
      "    s.mu.Unlock()",
      "    return nil",
      "}",
    ],
    bugLineIndex: 3,
    explanation: "Returning early on error without unlocking s.mu leaves the mutex locked permanently, deadlocking subsequent calls.",
    fix: "Call defer s.mu.Unlock() immediately after s.mu.Lock()",
  },
];

// ============================================================================
// TOURNAMENTS & COMPETITIONS
// ============================================================================
export const TOURNAMENTS: Tournament[] = [
  {
    id: "tourn-1",
    title: "National STEM & Quantitative Olympiad",
    type: "School vs School",
    game: "Calculus & Computer Science IQ",
    prizePool: "Academic Research Grant + Trophy",
    participantsCount: 1420,
    startsIn: "Today, 16:00 WAT",
    status: "Live Now",
    targetZone: "All Zones",
    bannerBg: "from-emerald-950 via-slate-900 to-slate-950",
  },
  {
    id: "tourn-2",
    title: "West African Interscholastic Mathematics Derby",
    type: "School vs School",
    game: "Algebra & Rapid Probability",
    prizePool: "Laboratory Equipment Sponsorship",
    participantsCount: 890,
    startsIn: "Tomorrow, 10:00 WAT",
    status: "Upcoming",
    targetZone: "TEEN",
    bannerBg: "from-blue-950 via-slate-900 to-slate-950",
  },
  {
    id: "tourn-3",
    title: "Pan-African Jurisprudence & Economics Cup",
    type: "Individual",
    game: "Macroeconomics & Constitutional Law",
    prizePool: "Fellowship Endowment",
    participantsCount: 640,
    startsIn: "Saturday, 14:00 WAT",
    status: "Upcoming",
    targetZone: "SENIOR",
    bannerBg: "from-amber-950 via-slate-900 to-slate-950",
  },
];

// ============================================================================
// LEADERBOARD (CLEAN MONOGRAMS, NO EMOJIS)
// ============================================================================
export const LEADERBOARD_ENTRIES: LeaderboardEntry[] = [
  { rank: 1, name: "Ibrahim Danjuma", initials: "ID", score: 9850, school: "Federal Government College Kano", state: "Kano", zone: "YOUTH", badge: "Olympiad Laureate" },
  { rank: 2, name: "Ngozi Adeleke", initials: "NA", score: 9620, school: "Queen's College Lagos", state: "Lagos", zone: "TEEN", badge: "Calculus Scholar" },
  { rank: 3, name: "Chidi Okonkwo", initials: "CO", score: 9450, school: "King's College Lagos", state: "Lagos", zone: "TEEN", badge: "Algorithmic Master" },
  { rank: 4, name: "Folake Balogun", initials: "FB", score: 9180, school: "Corona Secondary School", state: "Lagos", zone: "YOUTH", badge: "Economics Distinction" },
  { rank: 5, name: "Emeka Eze", initials: "EE", score: 8920, school: "University of Nigeria Nsukka", state: "Enugu", zone: "SENIOR", badge: "System Architect" },
  { rank: 6, name: "Zainab Aliyu", initials: "ZA", score: 8740, school: "Loyola Jesuit College Abuja", state: "Abuja FCT", zone: "TEEN", badge: "Physics Scholar" },
  { rank: 7, name: "Tunde Ojo", initials: "TO", score: 8610, school: "University of Lagos", state: "Lagos", zone: "SENIOR", badge: "Jurisprudence Fellow" },
  { rank: 8, name: "Amina Yusuf", initials: "AY", score: 8490, school: "Barewa College Zaria", state: "Kaduna", zone: "YOUTH", badge: "Bioinformatics Scholar" },
];

// ============================================================================
// CLUBS & ACADEMIC SOCIETIES (STRUCTURED, ZERO UNMODERATED DMS)
// ============================================================================
export const CLUBS: ClubItem[] = [
  {
    id: "club-1",
    name: "Turing Computer Science & AI League",
    tagline: "Algorithms, distributed systems, compiler architecture, and machine learning research",
    category: "Computer Science",
    membersCount: 840,
    bannerGradient: "from-blue-900 to-slate-900",
    targetZone: "All",
    activities: ["Algorithmic Problem Sets", "System Design Reviews", "Code Audit Clinics"],
    isJoined: true,
  },
  {
    id: "club-2",
    name: "Ramanujan Mathematical Society",
    tagline: "Number theory, real analysis, topology, and mathematical physics olympiads",
    category: "Competitive Mathematics",
    membersCount: 620,
    bannerGradient: "from-emerald-900 to-slate-900",
    targetZone: "All",
    activities: ["Calculus Derivations", "Combinatorics Challenges", "Olympiad Preparation"],
    isJoined: false,
  },
  {
    id: "club-3",
    name: "Adam Smith Economic Policy Institute",
    tagline: "Monetary policy analysis, capital allocation, sovereign wealth, and market modeling",
    category: "Constitutional Law",
    membersCount: 430,
    bannerGradient: "from-amber-900 to-slate-900",
    targetZone: "YOUTH",
    activities: ["Macroeconomic Forecasts", "Valuation Modeling", "Central Bank Paper Critiques"],
    isJoined: false,
  },
  {
    id: "club-4",
    name: "Bio-Genomics & Molecular Research Circle",
    tagline: "DNA transcription, CRISPR research, cellular immunology, and epidemiology",
    category: "Biotechnology",
    membersCount: 390,
    bannerGradient: "from-teal-900 to-slate-900",
    targetZone: "TEEN",
    activities: ["Genomic Sequence Labs", "Pathogen Tracking", "Laboratory Case Reviews"],
    isJoined: false,
  },
];

// ============================================================================
// CREATIVE STUDIO & SCHOLARLY SHOWCASE (PROFESSIONAL COMPOSITIONS)
// ============================================================================
export const CREATIVE_SUBMISSIONS: CreativeSubmissionItem[] = [
  {
    id: "cs-1",
    title: "Structural Diagram: Lagos High-Speed Rail & Solar Power Grid",
    author: "Engr_Oluwaseun",
    authorZone: "SENIOR",
    category: "Design Composition",
    type: "text",
    content: "A detailed engineering composition mapping high-voltage direct current (HVDC) transmission lines across the Lekki peninsula, integrating decentralized floating photovoltaic arrays across the lagoon basin.",
    likes: 412,
    moderationStatus: "Approved",
    tags: ["Engineering", "Infrastructure", "PowerSystems"],
    createdAt: "2026-10-26",
  },
  {
    id: "cs-2",
    title: "Analytical Essay: The Economic Impact of the AfCFTA on West African Logistics",
    author: "Zainab_Economist",
    authorZone: "YOUTH",
    category: "Analytical Narrative",
    type: "text",
    content: "An empirical examination evaluating non-tariff regulatory barriers, harmonized customs clearing mechanisms, and the reduction of transit dwell times at the Seme-Krake border corridor.",
    likes: 285,
    moderationStatus: "Approved",
    tags: ["Economics", "AfCFTA", "Policy"],
    createdAt: "2026-10-22",
  },
  {
    id: "cs-3",
    title: "System Architecture: Event-Driven Banking Switch with Kafka & PostgreSQL",
    author: "Dev_Kelechi",
    authorZone: "SENIOR",
    category: "Software Architecture",
    type: "text",
    content: "Architectural blueprint detailing message ingestion partitions, idempotent deduplication stores, outbox pattern dispatchers, and distributed consensus for multi-region failover.",
    likes: 349,
    moderationStatus: "Approved",
    tags: ["Architecture", "Databases", "DistributedSystems"],
    createdAt: "2026-10-15",
  },
];

// ============================================================================
// 12-PHASE ARCHITECTURAL ROADMAP SPECIFICATION
// ============================================================================
export const ROADMAP_PHASES = [
  {
    phase: "Phase 01",
    title: "System Blueprint & Relational Foundations",
    status: "Completed",
    timeline: "Weeks 1–2",
    details: "Modular monolith topology, 26-model PostgreSQL + Prisma schema, Zod validation, NDPA child-safety authorization engine, immutable XP ledger, automated test suites.",
  },
  {
    phase: "Phase 02",
    title: "Executive Interface & Academic Design System",
    status: "Completed",
    timeline: "Weeks 3–4",
    details: "Professional high-contrast UI, full Photoshop-grade creative studio, 4 calibrated age zones (Ages 6 to 30), synthesized Web Audio, zero-emoji typography.",
  },
  {
    phase: "Phase 03",
    title: "Authentication & Age-Calibrated Onboarding",
    status: "Active (Current)",
    timeline: "Weeks 5–6",
    details: "Age tier validation (6–30), parental consent OTP verification for minors, institutional school codes, session security.",
  },
  {
    phase: "Phase 04",
    title: "Curriculum Engine & Academic Examinations",
    status: "Implemented",
    timeline: "Weeks 7–9",
    details: "8 academic disciplines, interactive lecture modules, 5-question formal examination tests, automated grading and certificate generation.",
  },
  {
    phase: "Phase 05",
    title: "Age-Calibrated Learning Drills & Speed Arena",
    status: "Implemented",
    timeline: "Weeks 10–11",
    details: "Foundational, Secondary, Undergraduate, and Executive speed drills with immediate pedagogical feedback.",
  },
  {
    phase: "Phase 06",
    title: "Photoshop Web Creative Studio",
    status: "Implemented",
    timeline: "Weeks 12–13",
    details: "Multi-tool graphics editor (brush, shapes, text, eraser, eyedropper, filters, image import, PNG/JPEG export).",
  },
  {
    phase: "Phase 07",
    title: "Interscholastic Competition & Derby Engine",
    status: "Implemented",
    timeline: "Weeks 14–15",
    details: "School-versus-school Olympiad brackets, state leaderboards, server-authoritative score auditing.",
  },
  {
    phase: "Phase 08",
    title: "Scholarly Societies & Moderation Queues",
    status: "Implemented",
    timeline: "Weeks 16–17",
    details: "Structured academic societies, zero unmoderated DMs, strict child protection audit logs.",
  },
  {
    phase: "Phase 09",
    title: "Institutional School & Guardian Portals",
    status: "Implemented",
    timeline: "Weeks 18–19",
    details: "Parent screen-time controls (30 to 240 mins), curriculum homework assignments, class progress rosters.",
  },
  {
    phase: "Phase 10",
    title: "Administrative Operations & Audit Console",
    status: "Implemented",
    timeline: "Weeks 20–21",
    details: "Content moderation queue, suspicious score fraud detection, administrative action trails.",
  },
  {
    phase: "Phase 11",
    title: "Production Deployment & Lagos/Abuja Pilot",
    status: "Planned",
    timeline: "Weeks 22–24",
    details: "Pilot launch across 5 flagship schools (500 enrolled students, 1,000 target community scholars).",
  },
  {
    phase: "Phase 12",
    title: "Pan-African Expansion & Localization",
    status: "Future",
    timeline: "Expansion",
    details: "Regional curricula adaptation for Ghana, Kenya, South Africa; language support for Swahili, French, Yoruba, Hausa, Igbo.",
  },
];

export const DATABASE_26_MODELS = [
  { name: "User", domain: "Auth & Identity", responsibility: "Core authentication entity, email, hashed credentials, phone, status" },
  { name: "PlayerProfile", domain: "Auth & Identity", responsibility: "Avatar crest, level, public display name, school, state, age-zone rating" },
  { name: "Guardian", domain: "Child Protection", responsibility: "Parent/guardian account link, contact details, verified status" },
  { name: "GuardianConsent", domain: "Child Protection", responsibility: "NDPA consent records, granular scope permissions, timestamp, revocation" },
  { name: "School", domain: "Institutions", responsibility: "Registered educational institution, accreditation code, state, tier" },
  { name: "SchoolMembership", domain: "Institutions", responsibility: "Student-to-school and teacher-to-school roles, class assignments" },
  { name: "Game", domain: "Academic Arena", responsibility: "Catalogue entry, rules, minimum age zone, difficulty brackets" },
  { name: "GameSession", domain: "Academic Arena", responsibility: "Individual play attempt, start/finish duration, anti-cheat tokens" },
  { name: "GameScore", domain: "Academic Arena", responsibility: "Server-validated final score, accuracy, timestamp, XP awarded" },
  { name: "LearningCourse", domain: "Curriculum Engine", responsibility: "Curriculum definition, subject track, age rating, certificate unlock" },
  { name: "LearningLesson", domain: "Curriculum Engine", responsibility: "Lesson sections, interactive check-ins, checkpoint quiz items" },
  { name: "LearningProgress", domain: "Curriculum Engine", responsibility: "Completion states, quiz scores, certificate issuance records" },
  { name: "Mission", domain: "Engagement", responsibility: "Daily and weekly recurring activity goals, criteria targets" },
  { name: "MissionCompletion", domain: "Engagement", responsibility: "Idempotent completion state, date key, claimed XP timestamp" },
  { name: "XPTransaction", domain: "Rewards Ledger", responsibility: "Immutable append-only ledger entry, source activity, delta, audit ref" },
  { name: "Achievement", domain: "Rewards Ledger", responsibility: "Badge or trophy definition, criteria rule, rarity, icon" },
  { name: "PlayerAchievement", domain: "Rewards Ledger", responsibility: "Unlocked badge association, timestamp, showcase pinned status" },
  { name: "Tournament", domain: "Competitions", responsibility: "Scheduled competitive event, registration window, age zone rules" },
  { name: "TournamentEntry", domain: "Competitions", responsibility: "Player or school team registration, seeded bracket position" },
  { name: "TournamentResult", domain: "Competitions", responsibility: "Final placement, tournament points, verified competition records" },
  { name: "Club", domain: "Societies", responsibility: "Structured interest hub (Computer Science, Mathematics, Law), safety tier" },
  { name: "ClubMembership", domain: "Societies", responsibility: "User membership, assigned club leader/mentor role, joined date" },
  { name: "CreativeSubmission", domain: "Creative Studio", responsibility: "Studio canvas data, analytical essay text, challenge link" },
  { name: "ContentReport", domain: "Moderation", responsibility: "Flagged content, reporter user, violation reason, priority severity" },
  { name: "ModerationAction", domain: "Moderation", responsibility: "Audit decision by moderator: Approved, Rejected, Hidden, Ban duration" },
  { name: "Notification", domain: "Platform", responsibility: "Mission reminders, tournament invites, level up announcements" },
  { name: "AuditLog", domain: "Platform", responsibility: "Administrative mutation trail, IP hash, actor, previous and new state" },
];

export const PILOT_TARGET_DISTRIBUTION = [
  { source: "5 Pilot Flagship Schools (Lagos & Abuja)", target: 500, strategy: "Interscholastic STEM & Quantitative Olympiad" },
  { source: "Undergraduate & Coding Communities", target: 200, strategy: "Turing League & Macroeconomic Policy challenges" },
  { source: "Academic Peer Referrals", target: 150, strategy: "Non-cash academic crests and certificate honors" },
  { source: "Scholastic Publisher Partnerships", target: 100, strategy: "Collaborations with accredited Nigerian educational boards" },
  { source: "Direct Institutional Outreach", target: 50, strategy: "University laboratories and secondary school masterclasses" },
];

export const MONETIZATION_STREAMS = [
  { stream: "School Enterprise Licenses", description: "Institutions pay termly for classroom analytics, homework dispatchers, and inter-school derby management." },
  { stream: "Institutional Brand Sponsorships", description: "Banks, telecoms, and foundations fund national academic competitions without accessing learner data." },
  { stream: "Educational Research Partnerships", description: "Development organizations and universities fund specialized STEM and regional economic curricula." },
  { stream: "Executive Youth Certification (Ages 18–30)", description: "Verified software engineering, data science, and financial modeling certificate accreditation." },
  { stream: "Institutional Talent Portfolios", description: "Undergraduates and young professionals showcase verified academic examination transcripts to employers." },
  { stream: "Corporate Research Fellowships", description: "Industry-funded scholarships and research equipment grants awarded for Olympiad performance." },
];
