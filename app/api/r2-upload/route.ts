import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET_NAME } from "@/lib/r2";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder");

    if (!(file instanceof File)) {
      return Response.json(
        { success: false, message: "No file uploaded." },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return Response.json(
        { success: false, message: "Only PDF files are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { success: false, message: "PDF file must be 20 MB or less." },
        { status: 400 }
      );
    }

    const safeFolder =
      typeof folder === "string" && folder.trim()
        ? folder.trim().replace(/[^a-zA-Z0-9/_-]/g, "-")
        : "travel";

    if (!safeFolder.startsWith("travel/") && !safeFolder.startsWith("candidates/")) {
      return Response.json(
        { success: false, message: "Invalid upload folder." },
        { status: 400 }
      );
    }

    const originalName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-");

    const key = `${safeFolder}/${crypto.randomUUID()}-${originalName}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: "application/pdf",
        ContentLength: fileBuffer.length,
      })
    );

    return Response.json({
      success: true,
      key,
      size: fileBuffer.length,
    });
  } catch (error: any) {
    console.error("R2 upload error:", error);

    return Response.json(
      {
        success: false,
        message: "R2 upload failed.",
        error: error?.message || "Unknown error",
        code: error?.Code || error?.name || null,
      },
      { status: 500 }
    );
  }
}
