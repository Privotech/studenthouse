import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";
import { findSession, findUserById } from "@/lib/db";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const AGE_ZONES = ["JUNIOR", "TEEN", "YOUTH", "SENIOR"] as const;

export async function POST(request: NextRequest) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Cloudinary is not configured. Add its credentials to the server environment." },
      { status: 503 }
    );
  }

  const token = request.cookies.get("np_session")?.value;
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
    if (!AGE_ZONES.includes(user.age_zone)) {
      return NextResponse.json({ error: "Your account age zone could not be verified." }, { status: 500 });
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
        { status: 400 }
      );
    }
    if (title.trim().length === 0 || title.length > 80) {
      return NextResponse.json(
        { error: "The artwork title must be between 1 and 80 characters." },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer());
    if (
      imageBuffer.length < PNG_SIGNATURE.length ||
      !imageBuffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)
    ) {
      return NextResponse.json({ error: "The uploaded file is not a valid PNG image." }, { status: 400 });
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
      }
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
      author: user.display_name,
      authorZone: user.age_zone,
    });
  } catch (error) {
    console.error("Creative Studio Cloudinary upload failed:", error);
    return NextResponse.json(
      { error: "Artwork upload failed. Please try again." },
      { status: 502 }
    );
  }
}
