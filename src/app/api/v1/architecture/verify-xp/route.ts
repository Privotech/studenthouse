import { NextRequest, NextResponse } from "next/server";
import {
  createErrorResponse,
  createSuccessResponse,
  XPTransactionSource,
} from "@naijaplay/shared";
import {
  GameScoreSubmissionSchema,
  validateWithSchema,
  XPLedgerEntrySchema,
} from "@naijaplay/validation";
import {
  AuthoritativeXPLedger,
  verifyGameScoreSubmission,
} from "@naijaplay/game-engine";

// Server-side singleton ledger instance for verifying idempotency & duplicate mission prevention
const serverVerificationLedger = new AuthoritativeXPLedger([
  {
    id: "xp_seed_001",
    playerId: "11111111-1111-4111-8111-111111111111",
    source: XPTransactionSource.GAME_COMPLETION,
    referenceId: "session_initial_001",
    idempotencyKey: "idem_initial_seed_0001",
    amount: 45,
    createdAt: "2026-10-30T10:00:00.000Z",
  },
  {
    id: "xp_seed_002",
    playerId: "11111111-1111-4111-8111-111111111111",
    source: XPTransactionSource.DAILY_MISSION,
    referenceId: "mission_daily_trivia:2026-10-30",
    idempotencyKey: "idem_initial_seed_0002",
    amount: 100,
    createdAt: "2026-10-30T11:15:00.000Z",
  },
]);

export async function GET() {
  const playerId = "11111111-1111-4111-8111-111111111111";
  return NextResponse.json(
    createSuccessResponse({
      playerId,
      status: serverVerificationLedger.getPlayerStatus(playerId),
      entries: serverVerificationLedger.getPlayerEntries(playerId),
    }),
    {
      status: 200,
      headers: { "Cache-Control": "no-store, private" },
    },
  );
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const mode = rawBody?.mode as "GAME_SCORE" | "MISSION_REWARD" | undefined;

    if (mode === "GAME_SCORE") {
      const validatedScore = validateWithSchema(
        GameScoreSubmissionSchema,
        rawBody.payload,
      );
      const scoreVerification = verifyGameScoreSubmission(validatedScore);

      const ledgerResult = serverVerificationLedger.recordTransaction({
        playerId: validatedScore.playerId,
        source: XPTransactionSource.GAME_COMPLETION,
        referenceId: validatedScore.sessionId,
        idempotencyKey: validatedScore.idempotencyKey,
        amount: scoreVerification.awardedXP,
      });

      return NextResponse.json(
        createSuccessResponse({
          mode: "GAME_SCORE",
          scoreVerification,
          ledgerEntry: ledgerResult.entry,
          playerStatus: ledgerResult.status,
          allPlayerEntries: serverVerificationLedger.getPlayerEntries(
            validatedScore.playerId,
          ),
        }),
        { status: 201, headers: { "Cache-Control": "no-store, private" } },
      );
    }

    const validatedLedger = validateWithSchema(XPLedgerEntrySchema, rawBody.payload);
    const ledgerResult = serverVerificationLedger.recordTransaction(validatedLedger);

    return NextResponse.json(
      createSuccessResponse({
        mode: "MISSION_REWARD",
        ledgerEntry: ledgerResult.entry,
        playerStatus: ledgerResult.status,
        allPlayerEntries: serverVerificationLedger.getPlayerEntries(
          validatedLedger.playerId,
        ),
      }),
      { status: 201, headers: { "Cache-Control": "no-store, private" } },
    );
  } catch (error) {
    const { status, body } = createErrorResponse(error);
    return NextResponse.json(body, {
      status,
      headers: { "Cache-Control": "no-store, private" },
    });
  }
}
