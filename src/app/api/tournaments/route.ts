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
    await ensureTournamentCatalog();
    const [entries, completed, results, catalogRows] = await Promise.all([
      player
        ? prisma.tournamentEntry.findMany({
            where: { playerProfileId: player.profile.id },
            select: { tournament: { select: { slug: true } } },
          })
        : Promise.resolve([]),
      player
        ? prisma.tournamentResult.findMany({
            where: { playerProfileId: player.profile.id },
            select: { tournament: { select: { slug: true } } },
          })
        : Promise.resolve([]),
      prisma.tournamentResult.findMany({
        where: { playerProfile: { profileVisibility: "PUBLIC_OPT_IN" } },
        orderBy: [{ verifiedBestScore: "desc" }, { finalizedAt: "asc" }],
        take: 100,
        select: {
          verifiedBestScore: true,
          tournament: { select: { title: true } },
          playerProfile: {
            select: {
              displayName: true,
              ageZone: true,
              schoolName: true,
              stateCode: true,
            },
          },
        },
      }),
      prisma.tournament.findMany({
        orderBy: { startsAt: "asc" },
        include: {
          game: { select: { title: true } },
          _count: { select: { entries: true } },
        },
      }),
    ]);
    const toTournamentId = (slug: string) =>
      slug.startsWith("tourn-1-") ? "tourn-1" : slug;
    const joinedTournamentIds = entries.map(({ tournament }) =>
      toTournamentId(tournament.slug),
    );
    const completedTournamentIds = completed.map(({ tournament }) =>
      toTournamentId(tournament.slug),
    );
    const leaderboard = results.map(({ verifiedBestScore, tournament, playerProfile }, index) => {
      const nameParts = playerProfile.displayName.trim().split(/\s+/);
      return {
        rank: index + 1,
        name: playerProfile.displayName,
        initials: nameParts.length > 1
          ? `${nameParts[0]![0]}${nameParts[nameParts.length - 1]![0]}`.toUpperCase()
          : playerProfile.displayName.slice(0, 2).toUpperCase(),
        score: verifiedBestScore,
        school: playerProfile.schoolName,
        state: playerProfile.stateCode,
        zone: playerProfile.ageZone,
        badge: tournament.title,
      };
    });
    const now = new Date();
    const tournamentMap = new Map<string, {
      id: string;
      title: string;
      game: string;
      participantsCount: number;
      startsAt: string;
      status: "Live Now" | "Upcoming" | "Completed";
      targetZone: "All Zones" | typeof ZONES[number];
    }>();
    for (const row of catalogRows) {
      const id = toTournamentId(row.slug);
      const existing = tournamentMap.get(id);
      if (existing) {
        existing.participantsCount += row._count.entries;
        continue;
      }

      const startsAt = row.startsAt.toISOString();
      const status = now >= row.endsAt
        ? "Completed"
        : now >= row.startsAt
          ? "Live Now"
          : "Upcoming";
      tournamentMap.set(id, {
        id,
        title: row.title,
        game: row.game.title,
        participantsCount: row._count.entries,
        startsAt,
        status,
        targetZone: id === "tourn-1" ? "All Zones" : row.targetAgeZone,
      });
    }
    const tournaments = [...tournamentMap.values()].map((tournament) => ({
      ...tournament,
      startsIn: new Intl.DateTimeFormat("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Africa/Lagos",
      }).format(new Date(tournament.startsAt)),
    }));

    return NextResponse.json(
      { joinedTournamentIds, completedTournamentIds, leaderboard, tournaments },
      { headers: { "Cache-Control": "no-store, private" } },
    );
  } catch (error) {
    console.error("Failed to load tournament registrations:", error);
    return NextResponse.json({ error: "Could not load tournament registrations." }, { status: 500 });
  }
}
