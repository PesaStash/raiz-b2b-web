import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { extractObjectUrlFromSignedUrl } from "@/utils/helpers";

const s3Client = new S3Client({
  region: process.env.AWS_REGION! as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESSKEY_ID as string,
    secretAccessKey: process.env.AWS_ACCESSKEY_SECRET as string,
  },
});

async function uploadImageToS3(
  file: Buffer,
  fileName: string,
  type: string
): Promise<string> {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME as string,
    Key: `${Date.now()}-${fileName}`,
    Body: file,
    ContentType: type,
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);

  const getCommand = new GetObjectCommand(params);
  const url = await getSignedUrl(s3Client, getCommand);

  return extractObjectUrlFromSignedUrl(url);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as Blob | null;
    if (!file) {
      return NextResponse.json(
        { error: "File blob is required." },
        { status: 400 }
      );
    }

    const mimeType = file.type;
    const fileExtension = mimeType.split("/")[1];

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadImageToS3(
      buffer,
      uuid() + "." + fileExtension,
      mimeType
    );

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      // Added return statement
      { message: "Error uploading image" },
      { status: 500 } // Added status code for error case
    );
  }
}
