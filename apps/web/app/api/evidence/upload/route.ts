import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getR2PublicUrl } from "@/lib/r2";
import { validateImageFile } from "@/lib/security";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";

function client() { return new S3Client({ region: "auto", endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? "", secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? "" } }); }

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const limit = await enforceRateLimit(`evidence:upload:${session.user.id}`, 10, 3600);
  if (limit.limited) return rateLimitResponse(limit.reset);
  const bucket = process.env.CLOUDFLARE_R2_BUCKET;
  if (!bucket || !process.env.CLOUDFLARE_R2_PUBLIC_URL) return NextResponse.json({ error: "Evidence storage is unavailable.", code: "STORAGE_UNAVAILABLE" }, { status: 503 });
  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Image is required.", code: "FILE_REQUIRED" }, { status: 400 });
  try {
    const image = await validateImageFile(file, 5 * 1024 * 1024);
    const key = `evidence/${session.user.id}/${crypto.randomUUID()}.${image.extension}`;
    await client().send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: image.bytes, ContentType: image.contentType, CacheControl: "private, max-age=86400" }));
    return NextResponse.json({ url: getR2PublicUrl(key) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed.", code: "INVALID_IMAGE" }, { status: 400 });
  }
}
