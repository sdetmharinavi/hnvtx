// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Increase body size limit config for Vercel/Next.js
export const config = {
  api: {
    bodyParser: false, 
    responseLimit: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication Check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Validate Headers
    const folderId = request.headers.get("x-folder-id");
    if (!folderId) {
      return NextResponse.json(
        { error: "Folder ID is required" },
        { status: 400 }
      );
    }

    // 3. Parse FormData safely
    let formData: FormData;
    try {
        formData = await request.formData();
    } catch (e) {
        console.error("Error parsing form data:", e);
        return NextResponse.json(
            { error: "Failed to parse file data. The file might be corrupted or too large." },
            { status: 400 }
        );
    }

    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 4. File Validation
    if (file.size === 0) {
      return NextResponse.json(
        { error: "File is empty." },
        { status: 400 }
      );
    }

    // Max Size: 50MB (Matches client-side Uppy config)
    const maxSize = 50 * 1024 * 1024; 
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size too large. Maximum 50MB allowed." },
        { status: 400 }
      );
    }

    // 5. Cloudinary Config Check
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      console.error("Missing Cloudinary Config");
      return NextResponse.json(
        { error: "Server configuration error: Cloudinary keys missing" },
        { status: 500 }
      );
    }

    // 6. Prepare Cloudinary Upload
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", file);
    cloudinaryFormData.append("upload_preset", uploadPreset);
    cloudinaryFormData.append("folder", `user_${user.id}/folder_${folderId}`);

    // Determine resource type
    let resourceType = "auto";
    if (file.type === "application/pdf") {
      resourceType = "raw"; 
      cloudinaryFormData.append("resource_type", "raw");
    } else if (file.type.startsWith("image/")) {
       resourceType = "image";
       cloudinaryFormData.append("resource_type", "image");
    } else if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
       resourceType = "video";
       cloudinaryFormData.append("resource_type", "video");
    }

    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    cloudinaryFormData.append("public_id", `${Date.now()}_${sanitizedFileName}`);

    // 7. Upload to Cloudinary
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    const cloudinaryResponse = await fetch(uploadUrl, {
        method: "POST",
        body: cloudinaryFormData,
    });

    if (!cloudinaryResponse.ok) {
      const errorText = await cloudinaryResponse.text();
      console.error("Cloudinary Error:", errorText);
      return NextResponse.json(
        { error: `Cloudinary Upload Failed: ${cloudinaryResponse.statusText}` },
        { status: cloudinaryResponse.status }
      );
    }

    const cloudinaryData = await cloudinaryResponse.json();

    return NextResponse.json({
      public_id: cloudinaryData.public_id,
      secure_url: cloudinaryData.secure_url,
      format: cloudinaryData.format,
      resource_type: cloudinaryData.resource_type,
      bytes: cloudinaryData.bytes,
      success: true,
    });

  } catch (error: unknown) {
    console.error("Upload API Critical Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    "http://localhost:3000",
    "https://localhost:3000",
  ].filter(Boolean);

  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-folder-id, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };

  if (origin && allowedOrigins.includes(origin)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (headers as any)["Access-Control-Allow-Origin"] = origin;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (headers as any)["Access-Control-Allow-Origin"] = "*";
  }

  return new NextResponse(null, { status: 200, headers });
}