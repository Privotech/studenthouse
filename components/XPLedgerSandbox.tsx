"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Send, Repeat } from "lucide-react";
import { INITIAL_MVP_GAME_CATALOG } from "@naijaplay/game-engine";

interface LedgerEntry {
  id: string;
  playerId: string;
  source: string;
  referenceId: string;
  idempotencyKey: string;
  amount: number;
  createdAt: string;
}

interface PlayerLevelStatus {
  totalXP: number;
  level: number;
  currentLevelXP: number;
  nextLevelRequiredXP: number;
  progressPercent: number;
}

export function XPLedgerSandbox() {
  const [gameSlug, setGameSlug] = useState<string>("naija-trivia");
  const [questionsAnswered, setQuestionsAnswered] = useState<number>(10);
  const [correctAnswers, setCorrectAnswers] = useState<number>(8);
  const [durationSeconds, setDurationSeconds] = useState<number>(32);
  const [claimedScore, setClaimedScore] = useState<number>(800);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(
    "idem_naija_trivia_session_101",
  );
  const [playerStatus, setPlayerStatus] = useState<PlayerLevelStatus>({
    totalXP: 145,
    level: 1,
    currentLevelXP: 145,
    nextLevelRequiredXP: 200,
    progressPercent: 73,
  });
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [apiResponse, setApiResponse] = useState<{
    status: number;
    body: Record<string, unknown>;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/v1/architecture/verify-xp");
        const json = await res.json();
        if (json?.data?.status) {
          setPlayerStatus(json.data.status);
          setEntries(json.data.entries ?? []);
        }
      } catch {
        // Keep initial state if fetch fails
      }
    })();
  }, []);

  const submitScorePayload = async (customPayload?: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      const bodyToSend = customPayload ?? {
        mode: "GAME_SCORE",
        payload: {
          sessionId: "55555555-5555-4555-8555-555555555555",
          gameSlug,
          playerId: "11111111-1111-4111-8111-111111111111",
          claimedScore,
          durationSeconds,
          questionsAnswered,
          correctAnswers,
          clientEventCount: questionsAnswered,
          idempotencyKey,
        },
      };

      const res = await fetch("/api/v1/architecture/verify-xp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyToSend),
      });
      const json = await res.json();
      setApiResponse({ status: res.status, body: json });

      if (json?.data?.playerStatus) {
        setPlayerStatus(json.data.playerStatus);
      }
      if (json?.data?.allPlayerEntries) {
        setEntries(json.data.allPlayerEntries);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerValidGameAward = () => {
    const newKey = `idem_valid_score_${Date.now().toString(36)}`;
    setGameSlug("naija-trivia");
    setQuestionsAnswered(10);
    setCorrectAnswers(9);
    setClaimedScore(900);
    setDurationSeconds(28);
    setIdempotencyKey(newKey);

    void submitScorePayload({
      mode: "GAME_SCORE",
      payload: {
        sessionId: "55555555-5555-4555-8555-555555555555",
        gameSlug: "naija-trivia",
        playerId: "11111111-1111-4111-8111-111111111111",
        claimedScore: 900,
        durationSeconds: 28,
        questionsAnswered: 10,
        correctAnswers: 9,
        clientEventCount: 10,
        idempotencyKey: newKey,
      },
    });
  };

  const triggerAntiCheatSpeedHack = () => {
    const newKey = `idem_speedhack_${Date.now().toString(36)}`;
    setGameSlug("brain-rush");
    setQuestionsAnswered(15);
    setCorrectAnswers(15);
    setClaimedScore(1500);
    setDurationSeconds(6); // Impossible: 15 questions * 2.0s min = 30s required
    setIdempotencyKey(newKey);

    void submitScorePayload({
      mode: "GAME_SCORE",
      payload: {
        sessionId: "55555555-5555-4555-8555-555555555555",
        gameSlug: "brain-rush",
        playerId: "11111111-1111-4111-8111-111111111111",
        claimedScore: 1500,
        durationSeconds: 6,
        questionsAnswered: 15,
        correctAnswers: 15,
        clientEventCount: 15,
        idempotencyKey: newKey,
      },
    });
  };

  const triggerDuplicateMissionReplay = () => {
    // Re-submitting the seeded Daily Mission ("mission_daily_trivia:2026-10-30")
    void submitScorePayload({
      mode: "MISSION_REWARD",
      payload: {
        playerId: "11111111-1111-4111-8111-111111111111",
        source: "DAILY_MISSION",
        referenceId: "mission_daily_trivia:2026-10-30",
        idempotencyKey: `idem_replay_attempt_${Date.now().toString(36)}`,
        amount: 100,
      },
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left: Score Submission & Anti-Cheat Controls */}
      <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col justify-between space-y-5">
        <div className="space-y-4">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-semibold text-white">
              Server-Authoritative Score & Immutable XP Ledger Engine
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verifies session telemetry in <code className="font-mono text-emerald-400">@naijaplay/game-engine</code> and appends verified awards to the immutable <code className="font-mono text-slate-300">XPTransaction</code> ledger.
            </p>
          </div>

          {/* Quick Invariant Tests */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={triggerValidGameAward}
              className="rounded-lg border border-emerald-800/60 bg-emerald-950/30 px-3 py-2.5 text-left hover:bg-emerald-950/50 transition-colors cursor-pointer"
            >
              <div className="text-xs font-semibold text-emerald-300">
                1. Valid Trivia Session
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                9/10 in 28s → Credits +48 XP
              </div>
            </button>

            <button
              type="button"
              onClick={triggerAntiCheatSpeedHack}
              className="rounded-lg border border-amber-800/60 bg-amber-950/30 px-3 py-2.5 text-left hover:bg-amber-950/50 transition-colors cursor-pointer"
            >
              <div className="text-xs font-semibold text-amber-300">
                2. Speed-Hack Attempt
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                15/15 in 6s → 422 Rejected
              </div>
            </button>

            <button
              type="button"
              onClick={triggerDuplicateMissionReplay}
              className="rounded-lg border border-rose-800/60 bg-rose-950/30 px-3 py-2.5 text-left hover:bg-rose-950/50 transition-colors cursor-pointer"
            >
              <div className="text-xs font-semibold text-rose-300">
                3. Duplicate Mission Claim
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Replay Daily Mission → 409 Blocked
              </div>
            </button>
          </div>

          {/* Custom Score Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                MVP Game Catalogue
              </label>
              <select
                value={gameSlug}
                onChange={(e) => {
                  const slug = e.target.value;
                  setGameSlug(slug);
                  const rule = INITIAL_MVP_GAME_CATALOG[slug];
                  if (rule) {
                    setQuestionsAnswered(rule.maxQuestionsPerSession);
                    setCorrectAnswers(Math.floor(rule.maxQuestionsPerSession * 0.8));
                    setClaimedScore(
                      Math.floor(rule.maxQuestionsPerSession * 0.8) *
                        rule.pointsPerCorrectAnswer,
                    );
                    setDurationSeconds(
                      Math.ceil(rule.maxQuestionsPerSession * rule.minSecondsPerQuestion * 1.6),
                    );
                  }
                }}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100"
              >
                {Object.values(INITIAL_MVP_GAME_CATALOG).map((g) => (
                  <option key={g.gameSlug} value={g.gameSlug}>
                    {g.title} ({g.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Correct Answers / Total
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={correctAnswers}
                  onChange={(e) => setCorrectAnswers(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs font-mono tabular-nums text-slate-100"
                />
                <span className="text-slate-500 text-xs">/</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={questionsAnswered}
                  onChange={(e) => setQuestionsAnswered(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs font-mono tabular-nums text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Duration (s) & Claimed Score
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={3600}
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs font-mono tabular-nums text-slate-100"
                />
                <input
                  type="number"
                  min={0}
                  max={50000}
                  step={100}
                  value={claimedScore}
                  onChange={(e) => setClaimedScore(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs font-mono tabular-nums text-slate-100"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Idempotency Key (<code className="font-mono text-[11px]">@unique</code> on <code className="font-mono text-[11px]">XPTransaction</code>)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={idempotencyKey}
                onChange={(e) => setIdempotencyKey(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-slate-200"
              />
              <button
                type="button"
                onClick={() =>
                  setIdempotencyKey(`idem_session_${Date.now().toString(36)}`)
                }
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                New Key
              </button>
            </div>
          </div>

          {/* Immutable XP Ledger Table */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Append-Only XP Transaction Ledger (Player 1111...1111)</span>
              <span className="font-mono tabular-nums">
                Level {playerStatus.level} · {playerStatus.totalXP} Total XP ({playerStatus.currentLevelXP}/{playerStatus.nextLevelRequiredXP} XP)
              </span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                    <th className="py-2 px-3 font-medium">Source</th>
                    <th className="py-2 px-3 font-medium">Reference ID</th>
                    <th className="py-2 px-3 font-medium">Idempotency Key</th>
                    <th className="py-2 px-3 font-medium text-right">XP Award</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-xs font-mono tabular-nums">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-900/50">
                      <td className="py-2 px-3 text-slate-200">{entry.source}</td>
                      <td className="py-2 px-3 text-slate-400 truncate max-w-[160px]">
                        {entry.referenceId}
                      </td>
                      <td className="py-2 px-3 text-slate-500 truncate max-w-[160px]">
                        {entry.idempotencyKey}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-emerald-400">
                        +{entry.amount} XP
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={() => void submitScorePayload()}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Repeat className="w-3.5 h-3.5" />
            Re-Send Same Idempotency Key (Test 409)
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void submitScorePayload()}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {isSubmitting ? "Verifying..." : "Submit Score to Server Engine"}
          </button>
        </div>
      </div>

      {/* Right: Anti-Cheat & Ledger Verification Output */}
      <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-sm font-semibold text-white">
              Server Verification & Ledger Response
            </span>
            {apiResponse && (
              <span
                className={`text-xs font-mono font-semibold ${
                  apiResponse.status === 201 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                HTTP {apiResponse.status}
              </span>
            )}
          </div>

          {!apiResponse ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-xs text-slate-400">
                Click one of the three test buttons on the left or submit a custom game session payload to verify server-authoritative scoring and immutable XP ledger invariants.
              </p>
              <button
                type="button"
                onClick={triggerValidGameAward}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Verify Valid Trivia Session
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className={`rounded-lg border p-3.5 ${
                  apiResponse.status === 201
                    ? "border-emerald-800/70 bg-emerald-950/25"
                    : "border-rose-800/70 bg-rose-950/25"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  {apiResponse.status === 201 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-emerald-300">
                        VERIFIED — Score Validated & XP Appended to Ledger
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="text-rose-300">
                        REJECTED — Anti-Cheat or Ledger Uniqueness Invariant Triggered
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-400 mb-1.5">
                  Server Response Payload (<code className="font-mono text-[11px]">POST /api/v1/architecture/verify-xp</code>)
                </div>
                <pre className="max-h-80 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3.5 text-[11px] font-mono text-slate-200 leading-relaxed">
                  {JSON.stringify(apiResponse.body, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-800 pt-3 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Engine: @naijaplay/game-engine</span>
          <span>Append-Only Ledger Enforced</span>
        </div>
      </div>
    </div>
  );
}
