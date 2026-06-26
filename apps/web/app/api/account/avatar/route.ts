import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { validateImageFile } from "@/lib/security";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
      }
    : undefined
});

const BUCKET = process.env.S3_BUCKET || "msm-uploads";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// POST /api/account/avatar - Upload profile picture
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limit = await enforceRateLimit(`avatar-upload:${session.user.id}`, 10, 3600);
  if (limit.limited) return rateLimitResponse(limit.reset);

  const formData = await request.formData();
  const file = formData.get("avatar") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });
  let validated: Awaited<ReturnType<typeof validateImageFile>>;
  try {
    validated = await validateImageFile(file, MAX_SIZE);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid image.", code: "INVALID_IMAGE" }, { status: 400 });
  }
  const key = `avatars/${session.user.id}.${validated.extension}`;

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: validated.bytes,
        ContentType: validated.contentType,
        CacheControl: "public, max-age=31536000, immutable"
      })
    );

    const imageUrl = `https://${BUCKET}.s3.${process.env.AWS_REGION || "ap-south-1"}.amazonaws.com/${key}?v=${Date.now()}`;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl }
    });

    return NextResponse.json({ image: imageUrl });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json({ error: "Upload failed. Try again." }, { status: 500 });
  }
}

// DELETE /api/account/avatar - Remove profile picture
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: null }
  });

  return NextResponse.json({ ok: true });
}
