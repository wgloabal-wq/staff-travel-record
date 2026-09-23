import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET_NAME } from "@/lib/r2";

function isAllowedKey(key: string) {
  return (
    key.startsWith("travel/") ||
    key.startsWith("candidates/") ||
    key.startsWith("staff/")
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return Response.json(
        {
          success: false,
          message: "Document key is required.",
        },
        { status: 400 }
      );
    }

    if (!isAllowedKey(key)) {
      return Response.json(
        {
          success: false,
          message: "Invalid document key.",
        },
        { status: 400 }
      );
    }

    const signedUrl = await getSignedUrl(
      r2,
      new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      }),
      {
        expiresIn: 60 * 10,
      }
    );

    return Response.json({
      success: true,
      signedUrl,
    });
  } catch (error: unknown) {
    console.error("R2 signed URL error:", error);

    const err = error as {
      message?: string;
    };

    return Response.json(
      {
        success: false,
        message: "Unable to create document URL.",
        error: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}