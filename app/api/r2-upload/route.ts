import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET_NAME } from "@/lib/r2";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

function isAllowedFolder(folder: string) {
  return (
    folder.startsWith("travel/") ||
    folder.startsWith("candidates/") ||
    folder.startsWith("staff/")
  );
}

function getExtensionFromMimeType(type: string) {
  switch (type) {
    case "application/pdf":
      return "pdf";

    case "image/jpeg":
      return "jpg";

    case "image/png":
      return "png";

    default:
      return "bin";
  }
}

function cleanFileName(fileName: string) {
  // Remove any accidental MIME-type text
  let name = fileName
    .replace(/application\/pdf/gi, "")
    .replace(/image\/jpeg/gi, "")
    .replace(/image\/png/gi, "");

  // Remove existing extension
  name = name.replace(/\.(pdf|jpg|jpeg|png)$/i, "");

  // Replace unsafe characters
  name = name
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return name || "document";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const folder = formData.get("folder");

    if (!(file instanceof File)) {
      return Response.json(
        {
          success: false,
          message: "No file uploaded.",
        },
        { status: 400 }
      );
    }

    // File type validation
    if (!ALLOWED_TYPES.has(file.type)) {
      return Response.json(
        {
          success: false,
          message: "Only PDF, JPG and PNG files are allowed.",
        },
        { status: 400 }
      );
    }

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        {
          success: false,
          message: "File size must be 20 MB or less.",
        },
        { status: 400 }
      );
    }

    // Clean folder
    const safeFolder =
      typeof folder === "string" && folder.trim()
        ? folder
            .trim()
            .replace(/[^a-zA-Z0-9/_-]/g, "-")
            .replace(/\/+/g, "/")
        : "travel";

    if (!isAllowedFolder(safeFolder)) {
      return Response.json(
        {
          success: false,
          message: "Invalid upload folder.",
        },
        { status: 400 }
      );
    }

    // Create clean filename
    const baseName = cleanFileName(file.name);

    // Always use extension based on actual MIME type
    const extension = getExtensionFromMimeType(file.type);

    const key = `${safeFolder}/${crypto.randomUUID()}-${baseName}.${extension}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: file.type,
        ContentLength: fileBuffer.length,
      })
    );

    return Response.json({
      success: true,
      key,
      size: fileBuffer.length,
      fileName: `${baseName}.${extension}`,
    });
  } catch (error: unknown) {
    console.error("R2 upload error:", error);

    const err = error as {
      message?: string;
      Code?: string;
      name?: string;
    };

    return Response.json(
      {
        success: false,
        message: "R2 upload failed.",
        error: err?.message || "Unknown error",
        code: err?.Code || err?.name || null,
      },
      { status: 500 }
    );
  }
}