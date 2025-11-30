// components/diagrams/uploader-components/RecentlyUploaded.tsx
import React from "react";
import Image from "next/image";
import { Eye, Download } from "lucide-react";

interface UploadedFileSummary {
  secure_url?: string | null;
  format?: string | null;
  file_url?: string; // Handle different response shapes
}

interface RecentlyUploadedProps {
  uploadedFiles: UploadedFileSummary[];
}

const RecentlyUploaded: React.FC<RecentlyUploadedProps> = ({
  uploadedFiles,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Recently Uploaded
      </h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {uploadedFiles.slice(-4).map((file, index) => {
          const url = file.secure_url || file.file_url;
          const isImageFile = url ? /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url) : false;

          return (
            <div
              key={index}
              className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
            >
              {isImageFile && url ? (
                <div className="relative h-24 w-full">
                  <Image
                    src={url}
                    alt="Uploaded file"
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
              ) : (
                <div className="flex h-24 w-full items-center justify-center bg-gray-100 dark:bg-gray-700">
                  <div className="text-center">
                    <div className="mb-1 text-2xl">📄</div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                      FILE
                    </p>
                  </div>
                </div>
              )}

              {url && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => window.open(url, "_blank")}
                    title="View"
                    className="rounded bg-black/70 p-1.5 text-white backdrop-blur-sm hover:bg-black/90"
                  >
                    <Eye className="h-3 w-3" />
                  </button>
                  <a
                    href={url}
                    download
                    title="Download"
                    className="rounded bg-black/70 p-1.5 text-white backdrop-blur-sm hover:bg-black/90"
                  >
                    <Download className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentlyUploaded;