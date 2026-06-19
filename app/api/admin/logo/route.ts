import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageSettings } from "@/lib/authz";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "" }
    : undefined
});

const BUCKET = process.env.S3_BUCKET || "revathy-uploads";
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

// POST /api/admin/logo - Upload store logo
export async function POST(request: Request) {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("logo") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Logo too large. Max 2MB." }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Only image files allowed." }, { status: 400 });

  const ext = file.name.split(".").pop() || "png";
  const key = `branding/logo.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        CacheControl: "public, max-age=31536000, immutable"
      })
    );

    const logoUrl = `https://${BUCKET}.s3.${process.env.AWS_REGION || "ap-south-1"}.amazonaws.com/${key}?v=${Date.now()}`;

    // Save to settings
    await prisma.setting.upsert({
      where: { key: "logoUrl" },
      update: { value: logoUrl },
      create: { key: "logoUrl", value: logoUrl }
    });

    return NextResponse.json({ logoUrl });
  } catch (error) {
    console.error("Logo upload error:", error);
    return NextResponse.json({ error: "Upload failed. Check S3 configuration." }, { status: 500 });
  }
}

// GET /api/admin/logo - Get current logo URL
export async function GET() {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const setting = await prisma.setting.findUnique({ where: { key: "logoUrl" } });
  return NextResponse.json({ logoUrl: setting?.value || null });
}
