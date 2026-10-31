import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  AccountStatus,
  AgeZone,
  ConsentScope,
  ConsentStatus,
  createErrorResponse,
  createSuccessResponse,
  UserRole,
} from "@naijaplay/shared";
import { validateWithSchema } from "@naijaplay/validation";
import {
  authorizeAction,
  getAgeZonePrivacyDefaults,
  PlatformAction,
} from "@naijaplay/permissions";

const PermissionVerificationRequestSchema = z.object({
  actor: z.object({
    userId: z.string().min(3),
    role: z.nativeEnum(UserRole),
    accountStatus: z.nativeEnum(AccountStatus),
    dateOfBirth: z.string().optional(),
    consentRecord: z
      .object({
        guardianUserId: z.string(),
        childUserId: z.string(),
        status: z.nativeEnum(ConsentStatus),
        grantedScopes: z.array(z.nativeEnum(ConsentScope)),
        revokedAt: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
    linkedChildIds: z.array(z.string()).optional(),
    authorizedSchoolIds: z.array(z.string()).optional(),
  }),
  action: z.string(),
  targetResource: z
    .object({
      targetChildUserId: z.string().optional(),
      targetSchoolId: z.string().optional(),
      minAgeZone: z.nativeEnum(AgeZone).optional(),
      maxAgeZone: z.nativeEnum(AgeZone).optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const validated = validateWithSchema(PermissionVerificationRequestSchema, rawBody);

    const decision = authorizeAction(
      validated.actor,
      validated.action as PlatformAction,
      validated.targetResource,
    );

    const privacyDefaults = decision.computedAgeZone
      ? getAgeZonePrivacyDefaults(decision.computedAgeZone)
      : null;

    return NextResponse.json(
      createSuccessResponse({
        decision,
        privacyDefaults,
      }),
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, private",
        },
      },
    );
  } catch (error) {
    const { status, body } = createErrorResponse(error);
    return NextResponse.json(body, {
      status,
      headers: {
        "Cache-Control": "no-store, private",
      },
    });
  }
}
