// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // Get authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get folder ID from headers
    const folderId = request.headers.get("x-folder-id");
    if (!folderId) {
      return NextResponse.json(
        { error: "Folder ID is required" },
        { status: 400 },
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check for empty files
    if (file.size === 0) {
      console.error("Empty file detected:", file.name);
      return NextResponse.json(
        { error: "File is empty or corrupted. Please try uploading again." },
        { status: 400 },
      );
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size too large. Maximum 100MB allowed." },
        { status: 400 },
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/",
      "application/rtf",
      "video/",
      "audio/",
    ];

    const isValidType = allowedTypes.some(
      (type) => file.type.startsWith(type) || file.type === type,
    );
    if (!isValidType) {
      return NextResponse.json(
        { error: "File type not supported" },
        { status: 400 },
      );
    }

    // Additional validation for images
    if (file.type.startsWith("image/")) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        if (arrayBuffer.byteLength === 0) {
          return NextResponse.json(
            { error: "Image file appears to be corrupted" },
            { status: 400 },
          );
        }
      } catch (error) {
        console.error("Error reading file:", error);
        return NextResponse.json(
          { error: "Unable to process image file" },
          { status: 400 },
        );
      }
    }

    // Validate Cloudinary configuration
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      console.error("Missing Cloudinary configuration:", {
        cloudName: !!cloudName,
        uploadPreset: !!uploadPreset,
      });
      return NextResponse.json(
        { error: "Server configuration error: Missing Cloudinary keys" },
        { status: 500 },
      );
    }

    // Check if folder exists and belongs to user (Optional check, disabled for now to allow shared folders)
    /*
    const { data: folderData, error: folderError } = await supabase
      .from("folders")
      .select("id, user_id")
      .eq("id", folderId)
      .single();

    if (folderError || !folderData) {
      return NextResponse.json(
        { error: "Invalid folder or access denied" },
        { status: 403 },
      );
    }
    */

    // Prepare Cloudinary upload
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", file);
    cloudinaryFormData.append("upload_preset", uploadPreset);

    // Set resource type based on file type
    const isPDF = file.type === "application/pdf";
    const isVideo = file.type.startsWith("video/");
    const isAudio = file.type.startsWith("audio/");
    const isImage = file.type.startsWith("image/");

    if (isPDF) {
      cloudinaryFormData.append("resource_type", "raw");
      cloudinaryFormData.append("tags", "pdf_document");
    } else if (isVideo) {
      cloudinaryFormData.append("resource_type", "video");
      cloudinaryFormData.append("tags", "video_file");
    } else if (isAudio) {
      cloudinaryFormData.append("resource_type", "video");
      cloudinaryFormData.append("tags", "audio_file");
    } else if (isImage) {
      cloudinaryFormData.append("resource_type", "image");
      cloudinaryFormData.append("tags", "image_file");
      cloudinaryFormData.append("quality", "auto:good");
      cloudinaryFormData.append("fetch_format", "auto");
    } else {
      cloudinaryFormData.append("resource_type", "auto");
    }

    // Add folder organization in Cloudinary
    cloudinaryFormData.append("folder", `user_${user.id}/folder_${folderId}`);

    // Add timestamp to avoid filename conflicts
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    cloudinaryFormData.append(
      "public_id",
      `${Date.now()}_${sanitizedFileName}`,
    );

    // Upload to Cloudinary with timeout
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

    const cloudinaryResponse = await Promise.race([
      fetch(uploadUrl, {
        method: "POST",
        body: cloudinaryFormData,
      }),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error("Upload timeout")), 300000), // 5 minute timeout
      ),
    ]);

    if (!cloudinaryResponse.ok) {
      const errorText = await cloudinaryResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      console.error("Cloudinary upload error:", {
        status: cloudinaryResponse.status,
        statusText: cloudinaryResponse.statusText,
        error: errorData,
      });

      return NextResponse.json(
        {
          error:
            errorData.message ||
            `Upload failed: ${cloudinaryResponse.statusText}`,
        },
        { status: 500 },
      );
    }

    const cloudinaryData = await cloudinaryResponse.json();

    if (!cloudinaryData.secure_url) {
      return NextResponse.json(
        { error: "Upload succeeded but no URL returned" },
        { status: 500 },
      );
    }

    // IMPORTANT: Return success response for Uppy
    // Note: We do NOT insert into the DB here. The client-side useUppyUploader hook
    // listens for 'upload-success' and performs the DB insert. This avoids duplicates.
    
    return NextResponse.json({
      public_id: cloudinaryData.public_id,
      secure_url: cloudinaryData.secure_url,
      // Return all data Uppy might need
      width: cloudinaryData.width,
      height: cloudinaryData.height,
      format: cloudinaryData.format,
      resource_type: cloudinaryData.resource_type,
      bytes: cloudinaryData.bytes,
      success: true, // Signal success to Uppy
    });

  } catch (error: unknown) {
    console.error("Upload API error:", error);

    if (
      error instanceof Error &&
      (error.name === "AbortError" || error.message.includes("timeout"))
    ) {
      return NextResponse.json(
        { error: "Upload timeout. Please try again with a smaller file." },
        { status: 408 },
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined,
      },
      { status: 500 },
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

  const corsHeaders = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-folder-id, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  } as Record<string, string>;

  if (origin && allowedOrigins.includes(origin)) {
    corsHeaders["Access-Control-Allow-Origin"] = origin;
  } else if (process.env.NODE_ENV === "development") {
    corsHeaders["Access-Control-Allow-Origin"] = "*";
  }

  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}