import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { COMMERCIAL_PLANS_CATALOG } from "@/data/ecosystemData";
import { logAuditEvent } from "@/lib/db";
import { getAuthenticatedActor, getClientIp } from "@/lib/ecosystem-auth";
import {
  createOrganizationTenant,
  getUserEntitlement,
  joinOrganizationByCode,
  listAllTalentProfiles,
  listOrganizationsForUser,
  listTalentCompetitionsForUser,
  setUserEntitlement,
} from "@/lib/ecosystem-db";

const CreateOrgSchema = z.object({
  action: z.literal("create_organization"),
  name: z.string().trim().min(3).max(120),
  orgType: z.enum(["SCHOOL", "ACADEMY", "NGO", "SPONSOR_PARTNER"]),
  stateCode: z.string().trim().min(2).max(40),
  creatorRole: z.enum(["SCHOOL_ADMIN", "INSTRUCTOR", "ORGANIZER"]).default("SCHOOL_ADMIN"),
});

const JoinOrgSchema = z.object({
  action: z.literal("join_organization"),
  joinCode: z.string().trim().min(4).max(24),
  role: z.enum(["LEARNER", "INSTRUCTOR", "JUDGE"]).default("LEARNER"),
});

const SelectPlanSchema = z.object({
  action: z.literal("activate_plan"),
  planCode: z.enum(["FREE_SCHOLAR", "SCHOLAR_PLUS", "SCHOOL_LICENSE", "NGO_PROGRAMME"]),
  idempotencyKey: z.string().trim().min(6).max(80).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const actor = await getAuthenticatedActor(request);
    const orgs = actor ? await listOrganizationsForUser(actor.userId) : [];
    const entitlement = actor
      ? await getUserEntitlement(actor.userId)
      : { ...COMMERCIAL_PLANS_CATALOG.FREE_SCHOLAR, updatedAt: new Date().toISOString() };

    const [competitions, profiles] = await Promise.all([
      listTalentCompetitionsForUser(orgs.map((o) => o.id)),
      listAllTalentProfiles(),
    ]);

    return NextResponse.json(
      {
        authenticated: Boolean(actor),
        entitlement,
        plansCatalog: Object.values(COMMERCIAL_PLANS_CATALOG),
        organizations: orgs,
        stats: {
          competitionsOpen: competitions.length,
          talentShowcases: profiles.length,
        },
      },
      { headers: { "Cache-Control": "no-store, private" } },
    );
  } catch (error) {
    console.error("Ecosystem GET error:", error);
    return NextResponse.json({ error: "Could not load ecosystem platform state." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getAuthenticatedActor(request);
    if (!actor) {
      return NextResponse.json(
        { error: "Sign in to manage organizations or commercial subscriptions." },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();

    const parsedCreateOrg = CreateOrgSchema.safeParse(body);
    if (parsedCreateOrg.success) {
      const org = await createOrganizationTenant({
        userId: actor.userId,
        name: parsedCreateOrg.data.name,
        orgType: parsedCreateOrg.data.orgType,
        stateCode: parsedCreateOrg.data.stateCode,
        creatorRole: parsedCreateOrg.data.creatorRole,
      });

      await logAuditEvent({
        user_id: actor.userId,
        event_type: "ORG_TENANT_UPDATE",
        ip_address: getClientIp(request),
        details: { action: "create_organization", organizationId: org.id, orgType: org.orgType },
      });

      return NextResponse.json({ organization: org }, { status: 201 });
    }

    const parsedJoinOrg = JoinOrgSchema.safeParse(body);
    if (parsedJoinOrg.success) {
      const org = await joinOrganizationByCode({
        userId: actor.userId,
        joinCode: parsedJoinOrg.data.joinCode,
        role: parsedJoinOrg.data.role,
      });
      if (!org) {
        return NextResponse.json({ error: "No organization matched that invite code." }, { status: 404 });
      }
      return NextResponse.json({ organization: org }, { status: 201 });
    }

    const parsedPlan = SelectPlanSchema.safeParse(body);
    if (parsedPlan.success) {
      const res = await setUserEntitlement({
        userId: actor.userId,
        planCode: parsedPlan.data.planCode,
        idempotencyKey: parsedPlan.data.idempotencyKey,
      });

      await logAuditEvent({
        user_id: actor.userId,
        event_type: "SUBSCRIPTION_UPDATE",
        ip_address: getClientIp(request),
        details: { planCode: parsedPlan.data.planCode, deduplicated: res.deduplicated },
      });

      return NextResponse.json(res, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid ecosystem request." }, { status: 400 });
  } catch (error) {
    console.error("Ecosystem POST error:", error);
    return NextResponse.json({ error: "Failed to process ecosystem action." }, { status: 500 });
  }
}
