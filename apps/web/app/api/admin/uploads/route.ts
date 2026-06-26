import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireProductStaff } from "@/lib/authz";
import { getR2PublicUrl } from "@/lib/r2";
import { validateImageFile } from "@/lib/security";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";

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

export async function POST(request: Request) {
  const session = await auth();
  const unauthorized = requireProductStaff(session);
  if (unauthorized) return unauthorized;
  const limit = await enforceRateLimit(`admin-upload:${session!.user!.id}`, 30, 600);
  if (limit.limited) return rateLimitResponse(limit.reset);

  const bucket = process.env.CLOUDFLARE_R2_BUCKET;
  if (!bucket) return NextResponse.json({ error: "Cloudflare R2 bucket is not configured." }, { status: 500 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "File is required." }, { status: 400 });

  let validated: Awaited<ReturnType<typeof validateImageFile>>;
  try {
    validated = await validateImageFile(file, 5 * 1024 * 1024);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid image.", code: "INVALID_IMAGE" }, { status: 400 });
  }
  const key = `products/${crypto.randomUUID()}.${validated.extension}`;

  await r2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: validated.bytes,
      ContentType: validated.contentType
    })
  );

  return NextResponse.json({ key, url: getR2PublicUrl(key) });
}
