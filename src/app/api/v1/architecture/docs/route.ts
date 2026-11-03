import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import {
  AppError,
  createErrorResponse,
  createSuccessResponse,
  ErrorCode,
} from "@naijaplay/shared";

const ALLOWED_DOCUMENT_PATHS: Record<string, { title: string; relativePath: string; category: string }> = {
  "readme": {
    title: "README.md — Engineering Setup & Repository Guide",
    relativePath: "README.md",
    category: "Overview",
  },
  "prd": {
    title: "docs/product/PRODUCT_REQUIREMENTS.md",
    relativePath: "docs/product/PRODUCT_REQUIREMENTS.md",
    category: "Product",
  },
  "system-architecture": {
    title: "docs/architecture/SYSTEM_ARCHITECTURE.md",
    relativePath: "docs/architecture/SYSTEM_ARCHITECTURE.md",
    category: "Architecture",
  },
  "database-design": {
    title: "docs/database/DATABASE_DESIGN.md",
    relativePath: "docs/database/DATABASE_DESIGN.md",
    category: "Database",
  },
  "prisma-schema": {
    title: "packages/database/prisma/schema.prisma",
    relativePath: "packages/database/prisma/schema.prisma",
    category: "Database",
  },
  "security-requirements": {
    title: "docs/security/SECURITY_REQUIREMENTS.md",
    relativePath: "docs/security/SECURITY_REQUIREMENTS.md",
    category: "Security",
  },
  "threat-model": {
    title: "docs/security/THREAT_MODEL.md",
    relativePath: "docs/security/THREAT_MODEL.md",
    category: "Security",
  },
  "api-conventions": {
    title: "docs/api/API_CONVENTIONS.md",
    relativePath: "docs/api/API_CONVENTIONS.md",
    category: "API",
  },
  "architecture-decisions": {
    title: "docs/decisions/ARCHITECTURE_DECISIONS.md",
    relativePath: "docs/decisions/ARCHITECTURE_DECISIONS.md",
    category: "Decisions",
  },
  "pwa-strategy": {
    title: "docs/architecture/PWA_STRATEGY.md",
    relativePath: "docs/architecture/PWA_STRATEGY.md",
    category: "Architecture",
  },
  "development-workflow": {
    title: "docs/architecture/DEVELOPMENT_WORKFLOW.md",
    relativePath: "docs/architecture/DEVELOPMENT_WORKFLOW.md",
    category: "Workflow",
  },
};

export async function GET(req: NextRequest) {
  try {
    const docKey = req.nextUrl.searchParams.get("doc") ?? "system-architecture";
    const descriptor = ALLOWED_DOCUMENT_PATHS[docKey];

    if (!descriptor) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        `Document key '${docKey}' is not registered in the Phase 1 documentation index.`,
        404,
      );
    }

    const fullPath = path.join(process.cwd(), descriptor.relativePath);
    const content = await fs.readFile(fullPath, "utf-8");

    return NextResponse.json(
      createSuccessResponse({
        key: docKey,
        title: descriptor.title,
        relativePath: descriptor.relativePath,
        category: descriptor.category,
        content,
        index: Object.entries(ALLOWED_DOCUMENT_PATHS).map(([k, v]) => ({
          key: k,
          title: v.title,
          relativePath: v.relativePath,
          category: v.category,
        })),
      }),
      { status: 200 },
    );
  } catch (error) {
    const { status, body } = createErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
