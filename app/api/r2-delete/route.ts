import { DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET_NAME } from "@/lib/r2";

function isAllowedKey(key: string) {
  return key.startsWith("travel/") || key.startsWith("candidates/");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const keys = Array.isArray(body?.keys)
      ? body.keys.filter(
          (key: unknown): key is string => typeof key === "string"
        )
      : [];

    if (!keys.length) {
      return Response.json(
        {
          success: false,
          message: "No document keys provided.",
        },
        { status: 400 }
      );
    }

    if (keys.some((key: string) => !isAllowedKey(key))) {
      return Response.json(
        {
          success: false,
          message: "Invalid document key.",
        },
        { status: 400 }
      );
    }

    await r2.send(
      new DeleteObjectsCommand({
        Bucket: R2_BUCKET_NAME,
        Delete: {
          Objects: keys.map((key: string) => ({
            Key: key,
          })),
          Quiet: true,
        },
      })
    );

    return Response.json({
      success: true,
      deleted: keys.length,
    });
  } catch (error: any) {
    console.error("R2 delete error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to delete documents.",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}