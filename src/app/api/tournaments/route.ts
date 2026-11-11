import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlayerProfileFromRequest } from "@/lib/player-session";

const ZONES = ["JUNIOR", "TEEN", "YOUTH", "SENIOR"] as const;

const getTournamentDates = (now: Date) => {
  const firstStart = new Date(now);
  firstStart.setUTCHours(15, 0, 0, 0);
  if (firstStart <= now) firstStart.setUTCDate(firstStart.getUTCDate() + 1);

  const secondStart = new Date(firstStart);
  secondStart.setUTCDate(secondStart.getUTCDate() + 1);
  secondStart.setUTCHours(9, 0, 0, 0);

  const thirdStart = new Date(firstStart);
  const daysUntilSaturday = (6 - thirdStart.getUTCDay() + 7) % 7 || 7;
  thirdStart.setUTCDate(thirdStart.getUTCDate() + daysUntilSaturday);
  thirdStart.setUTCHours(13, 0, 0, 0);

  return [firstStart, secondStart, thirdStart];
};

async function ensureTournamentCatalog() {
  const [firstStart, secondStart, thirdStart] = getTournamentDates(new Date());
  const definitions = [
    {
      id: "tourn-1",
      title: "National STEM & Quantitative Olympiad",
      gameTitle: "Calculus & Computer Science IQ",
      zones: ZONES,
      startsAt: firstStart,
    },
    {
      id: "tourn-2",
      title: "West African Interscholastic Mathematics Derby",
      gameTitle: "Algebra & Rapid Probability",
      zones: ["TEEN"] as const,
      startsAt: secondStart,
    },
    {
      id: "tourn-3",
      title: "Pan-African Jurisprudence & Economics Cup",
      gameTitle: "Macroeconomics & Constitutional Law",
      zones: ["SENIOR"] as const,
      startsAt: thirdStart,
    },
  ];

  for (const [index, definition] of definitions.entries()) {
    const game = await prisma.game.upsert({
      where: { slug: `tournament-game-${definition.id}` },
      update: {},
      create: {
        slug: `tournament-game-${definition.id}`,
        title: definition.gameTitle,
        description: `Academic competition game for ${definition.title}.`,
        category: index === 2 ? "LOGIC" : "TRIVIA",
        minAgeZone: definition.zones[0],
        maxAgeZone: definition.zones[definition.zones.length - 1],
        maxPossibleScore: 1000,
        pointsPerCorrectAnswer: 100,
        maxQuestionsPerSession: 10,
        minSecondsPerQuestion: 1.5,
        baseXPReward: 50,
        maxBonusXP: 0,
        isPublished: true,
      },
    });

    for (const zone of definition.zones) {
      const slug = definition.id === "tourn-1"
        ? `${definition.id}-${zone.toLowerCase()}`
        : definition.id;
      await prisma.tournament.upsert({
        where: { slug },
        update: {},
        create: {
          slug,
          title: definition.title,
          gameId: game.id,
          targetAgeZone: zone,
          status: "REGISTRATION_OPEN",
          startsAt: definition.startsAt,
          endsAt: new Date(definition.startsAt.getTime() + 2 * 60 * 60 * 1000),
        },
      });
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const player = await getPlayerProfileFromRequest(request);
    if (!player) {
      return NextResponse.json({ error: "Sign in to load saved tournament registrations." }, { status: 401 });
    }

    await ensureTournamentCatalog();
    const entries = await prisma.tournamentEntry.findMany({
      where: { playerProfileId: player.profile.id },
      select: { tournament: { select: { slug: true } } },
    });
    const joinedTournamentIds = entries.map(({ tournament }) =>
      tournament.slug.startsWith("tourn-1-") ? "tourn-1" : tournament.slug,
    );

    return NextResponse.json(
      { joinedTournamentIds },
      { headers: { "Cache-Control": "no-store, private" } },
    );
  } catch (error) {
    console.error("Failed to load tournament registrations:", error);
    return NextResponse.json({ error: "Could not load tournament registrations." }, { status: 500 });
  }
}
