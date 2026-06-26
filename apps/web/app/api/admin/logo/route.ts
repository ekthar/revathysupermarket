import { NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageSettings } from "@/lib/authz";
import { getR2PublicUrl } from "@/lib/r2";
import { allowedExternalImageUrl, validateImageFile } from "@/lib/security";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

function r2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? ""
    }
  });
}

// POST /api/admin/logo - Upload store logo via R2 OR save a URL
export async function POST(request: Request) {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = request.headers.get("content-type") || "";

  // JSON body = save URL directly (no upload)
  if (contentType.includes("application/json")) {
    const body = await request.json();
    const logoUrl = body.logoUrl?.trim();
    if (!logoUrl) return NextResponse.json({ error: "No URL provided." }, { status: 400 });
    if (!allowedExternalImageUrl(logoUrl)) return NextResponse.json({ error: "Use an approved HTTPS image host.", code: "INVALID_IMAGE_URL" }, { status: 400 });
    await prisma.setting.upsert({
      where: { key: "logoUrl" },
      update: { value: logoUrl },
      create: { key: "logoUrl", value: logoUrl }
    });
    return NextResponse.json({ logoUrl });
  }

  // FormData = file upload via Cloudflare R2
  const bucket = process.env.CLOUDFLARE_R2_BUCKET;
  if (!bucket) return NextResponse.json({ error: "Cloudflare R2 is not configured. Paste an image URL instead." }, { status: 500 });

  const formData = await request.formData();
  const file = (formData.get("logo") ?? formData.get("file")) as File | null;

  if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });
  let validated: Awaited<ReturnType<typeof validateImageFile>>;
  try {
    validated = await validateImageFile(file, MAX_SIZE);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid image.", code: "INVALID_IMAGE" }, { status: 400 });
  }
  const key = `branding/logo-${Date.now()}.${validated.extension}`;

  try {
    await r2Client().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: validated.bytes,
        ContentType: validated.contentType,
        CacheControl: "public, max-age=31536000, immutable"
      })
    );

    const logoUrl = getR2PublicUrl(key);

    // Save to settings DB
    await prisma.setting.upsert({
      where: { key: "logoUrl" },
      update: { value: logoUrl },
      create: { key: "logoUrl", value: logoUrl }
    });

    return NextResponse.json({ logoUrl });
  } catch (error) {
    console.error("Logo upload error:", error);
    return NextResponse.json({ error: "Upload failed. Paste an image URL instead." }, { status: 500 });
  }
}

// GET /api/admin/logo - Get current logo URL
export async function GET() {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const setting = await prisma.setting.findUnique({ where: { key: "logoUrl" } });
  return NextResponse.json({ logoUrl: setting?.value || null });
}
