import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET_NAME } from "@/lib/r2";

export async function GET() {
  try {
    const result = await r2.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        MaxKeys: 1,
      })
    );

    return Response.json({
      success: true,
      message: "Cloudflare R2 connection successful!",
      bucket: R2_BUCKET_NAME,
      objects: result.KeyCount ?? 0,
    });
  } catch (error: any) {
    console.error("R2 connection error:", error);

    return Response.json(
      {
        success: false,
        message: "Cloudflare R2 connection failed.",
        error: error?.message || "Unknown R2 error",
        code: error?.Code || error?.name || null,
      },
      { status: 500 }
    );
  }
}