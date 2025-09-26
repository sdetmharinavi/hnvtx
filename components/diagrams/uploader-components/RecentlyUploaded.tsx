// components/diagrams/uploader-components/RecentlyUploaded.tsx
import React from "react";
import Image from "next/image";
import { Eye, Download } from "lucide-react";

interface UploadedFileSummary {
  secure_url?: string | null;
  format?: string | null;
}

interface RecentlyUploadedProps {
  uploadedFiles: UploadedFileSummary[];
}

const RecentlyUploaded: React.FC<RecentlyUploadedProps> = ({
  uploadedFiles,
}) => {
  return (
    <div className="space-y-4">
      <h3
        className={`text-lg font-semibold dark:text-white text-black`}
      >
        Recently Uploaded
      </h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {uploadedFiles.slice(-4).map((file, index) => {
          const secureUrl = typeof file.secure_url === "string" ? file.secure_url : null;
          const isImageFile = secureUrl ? /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(secureUrl) : false;

          return (
          <div
            key={index}
            className={`group relative overflow-hidden rounded border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
          >
            {isImageFile && secureUrl ? (
              <Image
                src={secureUrl}
                alt="Uploaded file"
                className="h-24 w-full rounded object-cover"
                width={300}
                height={96}
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div className="flex h-24 w-full items-center justify-center rounded bg-gray-100">
                <div className="text-center">
                  <div className="mb-1 text-xl">📄</div>
                  <p className="text-xs text-gray-600">
                    {file.format?.toUpperCase() || "FILE"}
                  </p>
                </div>
              </div>
            )}

            {secureUrl && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => window.open(secureUrl, "_blank")}
                  title="View"
                  className="bg-opacity-60 hover:bg-opacity-80 rounded bg-black p-1 text-white transition-all"
                >
                  <Eye className="h-3 w-3" />
                </button>
                <a
                  href={secureUrl}
                  download
                  title="Download"
                  className="bg-opacity-60 hover:bg-opacity-80 rounded bg-black p-1 text-white transition-all"
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