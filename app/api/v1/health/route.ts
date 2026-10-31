import { NextResponse } from "next/server";
import { createSuccessResponse } from "@naijaplay/shared";
import { PRISMA_SCHEMA_MODELS } from "@naijaplay/database";
import { INITIAL_MVP_GAME_CATALOG } from "@naijaplay/game-engine";

export async function GET() {
  const payload = createSuccessResponse({
    service: "naijaplay-modular-monolith",
    phase: "Phase 01 — Foundation, System Architecture & Engineering Setup",
    status: "NOMINAL",
    packages: [
      "@naijaplay/shared",
      "@naijaplay/validation",
      "@naijaplay/permissions",
      "@naijaplay/game-engine",
      "@naijaplay/database",
      "@naijaplay/ui",
    ],
    schemaModelsCount: PRISMA_SCHEMA_MODELS.length,
    mvpGameCatalogCount: Object.keys(INITIAL_MVP_GAME_CATALOG).length,
    securityPolicies: {
      serverSideAgeResolution: true,
      guardianConsentRequiredForMinors: true,
      immutableXPLedger: true,
      directMessagingForMinors: "PROHIBITED",
    },
  });

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, private",
    },
  });
}
