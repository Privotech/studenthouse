import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";
import { consumeRateQuota } from "@/lib/auth-security";
import { findSession, findUserById } from "@/lib/db";
import { sanitizePlainText } from "@/lib/input-security";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const MAX_DIMENSION = 4096;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const AGE_ZONES = ["JUNIOR", "TEEN", "YOUTH", "SENIOR"] as const;

export async function POST(request: NextRequest) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Cloudinary is not configured. Add its credentials to the server environment." },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;
  const cookieToken = request.cookies.get("np_session")?.value;
  const token = cookieToken || bearerToken;

  if (!token) {
    return NextResponse.json({ error: "Sign in before publishing artwork." }, { status: 401 });
  }

  try {
    const session = await findSession(token);
    if (!session) {
      return NextResponse.json({ error: "Your session has expired. Sign in again." }, { status: 401 });
    }

    const user = await findUserById(session.user_id);
    if (!user) {
      return NextResponse.json({ error: "Your account could not be verified." }, { status: 401 });
    }

    const canonical = await prisma.user.findUnique({
      where: { email: user.email },
      select: { accountStatus: true },
    });
    if (canonical && canonical.accountStatus !== "ACTIVE") {
      return NextResponse.json({ error: "Account is not active." }, { status: 403 });
    }

    if (!AGE_ZONES.includes(user.age_zone)) {
      return NextResponse.json({ error: "Your account age zone could not be verified." }, { status: 500 });
    }

    const quota = consumeRateQuota(`creative_upload_${user.id}`, 10);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: "Upload rate limit reached. Wait before publishing more artwork." },
        { status: 429 },
      );
    }

    const formData = await request.formData();
    const image = formData.get("image");
    const title = formData.get("title");

    if (!(image instanceof File) || typeof title !== "string") {
      return NextResponse.json({ error: "An image and title are required." }, { status: 400 });
    }
    if (image.size === 0 || image.size > MAX_IMAGE_SIZE || image.type !== "image/png") {
      return NextResponse.json(
        { error: "Upload a PNG image no larger than 2 MB." },
        { status: 400 },
      );
    }

    const cleanTitle = sanitizePlainText(title, 80);
    if (cleanTitle.length === 0) {
      return NextResponse.json(
        { error: "The artwork title must be between 1 and 80 characters." },
        { status: 400 },
      );
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer());
    if (
      imageBuffer.length < 24 ||
      !imageBuffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE) ||
      imageBuffer.subarray(12, 16).toString("ascii") !== "IHDR"
    ) {
      return NextResponse.json({ error: "The uploaded file is not a valid PNG image." }, { status: 400 });
    }

    const width = imageBuffer.readUInt32BE(16);
    const height = imageBuffer.readUInt32BE(20);
    if (width === 0 || height === 0 || width > MAX_DIMENSION || height > MAX_DIMENSION) {
      return NextResponse.json(
        { error: "PNG dimensions exceed maximum safe bounds." },
        { status: 400 },
      );
    }

    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    const publicId = randomUUID();
    const uploadResult = await cloudinary.uploader.upload(
      `data:image/png;base64,${imageBuffer.toString("base64")}`,
      {
        folder: "naijaplay/creative-submissions",
        public_id: publicId,
        resource_type: "image",
        type: "authenticated",
        overwrite: false,
        unique_filename: false,
      },
    );

    const imageUrl = cloudinary.url(uploadResult.public_id, {
      secure: true,
      resource_type: "image",
      type: "authenticated",
      sign_url: true,
    });

    return NextResponse.json({
      id: publicId,
      imageUrl,
      title: cleanTitle,
      author: user.display_name,
      authorZone: user.age_zone,
    });
  } catch (error) {
    console.error("Creative Studio Cloudinary upload failed:", error);
    return NextResponse.json(
      { error: "Artwork upload failed. Please try again." },
      { status: 502 },
    );
  }
}
