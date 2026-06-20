import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireProductStaff } from "@/lib/authz";
import { getR2PublicUrl } from "@/lib/r2";

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

  const bucket = process.env.CLOUDFLARE_R2_BUCKET;
  if (!bucket) return NextResponse.json({ error: "Cloudflare R2 bucket is not configured. Set CLOUDFLARE_R2_BUCKET env var." }, { status: 500 });

  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!publicUrl) return NextResponse.json({ error: "CLOUDFLARE_R2_PUBLIC_URL is not configured. Enable public access on your R2 bucket in Cloudflare Dashboard, then add the r2.dev URL to your Vercel env vars." }, { status: 500 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "File is required." }, { status: 400 });

  const extension = file.name.split(".").pop() ?? "jpg";
  const key = `products/${crypto.randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  await r2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bytes,
      ContentType: file.type
    })
  );

  const url = `${publicUrl.replace(/\/$/, "")}/${key}`;
  return NextResponse.json({ key, url });
}
