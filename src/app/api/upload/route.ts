import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v4 as uuid } from "uuid";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const SIGNED_URL_EXPIRY_SECONDS = 15 * 60;

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

const s3Client = new S3Client({
  region: process.env.AWS_REGION! as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESSKEY_ID as string,
    secretAccessKey: process.env.AWS_ACCESSKEY_SECRET as string,
  },
});

function buildObjectUrl(key: string): string {
  const bucket = process.env.AWS_BUCKET_NAME as string;
  const region = process.env.AWS_REGION as string;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

async function uploadToS3(
  file: Buffer,
  fileName: string,
  contentType: string,
): Promise<{ key: string; objectUrl: string; signedUrl: string }> {
  const key = `${Date.now()}-${fileName}`;
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME as string,
    Key: key,
    Body: file,
    ContentType: contentType,
  };

  await s3Client.send(new PutObjectCommand(params));

  const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand(params), {
    expiresIn: SIGNED_URL_EXPIRY_SECONDS,
  });

  return { key, objectUrl: buildObjectUrl(key), signedUrl };
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    const file = formData.get("file") as Blob | null;
    if (!file) {
      return NextResponse.json(
        { message: "File blob is required." },
        { status: 400 },
      );
    }

    const mimeType = file.type;
    const fileExtension = ALLOWED_MIME_TYPES[mimeType];
    if (!fileExtension) {
      return NextResponse.json(
        { message: "File type not allowed." },
        { status: 415 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { message: "File exceeds maximum size of 5MB." },
        { status: 413 },
      );
    }

    const { key, objectUrl, signedUrl } = await uploadToS3(
      buffer,
      `${uuid()}.${fileExtension}`,
      mimeType,
    );

    return NextResponse.json({ success: true, key, objectUrl, signedUrl });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { message: "Error uploading file" },
      { status: 500 },
    );
  }
}
