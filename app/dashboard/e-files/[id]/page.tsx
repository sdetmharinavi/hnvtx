"use client";

import { useParams, useRouter } from "next/navigation";
import { useEFileDetails, useCloseFile } from "@/hooks/data/useEFilesData";
import { PageSpinner, ErrorDisplay, Button, Card, ConfirmModal } from "@/components/common/ui";
import { EFileTimeline } from "@/components/efile/EFileTimeline";
import { ForwardFileModal } from "@/components/efile/ActionModals";
import { useState } from "react";
import { ArrowLeft, Send, Archive, FileText, User } from "lucide-react";
import { HtmlContent } from "@/components/common/ui/HtmlContent"; // Import HtmlContent

export default function EFileDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

    const { data, isLoading, isError, error } = useEFileDetails(id as string);
    const closeMutation = useCloseFile();

    if (isLoading) return <PageSpinner text="Loading file details..." />;
    if (isError || !data) return <ErrorDisplay error={error?.message || "File not found"} />;

    const { file, history } = data;

    const isActive = file.status === 'active';

    return (
        <div className="p-4 md:p-6 max-w-11/12 mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => router.back()} leftIcon={<ArrowLeft className="w-4 h-4"/>} size="sm">
                    Back
                </Button>
                {file.status === 'closed' && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-xs font-bold rounded-full uppercase">
                        Closed / Archived
                    </span>
                )}
            </div>

            {/* Custom Header with Break Words to prevent overflow */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 mt-1 shrink-0">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-tight wrap-break-word">
                                {file.subject}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-mono break-all">
                                File No: {file.file_number}
                            </p>
                        </div>
                    </div>
                </div>

                {isActive && (
                    <div className="flex gap-2 shrink-0">
                        <Button
                            variant="danger"
                            onClick={() => setIsCloseModalOpen(true)}
                            leftIcon={<Archive className="w-4 h-4" />}
                        >
                            Close File
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => setIsForwardModalOpen(true)}
                            leftIcon={<Send className="w-4 h-4" />}
                        >
                            Update Movement
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column: Status Card */}
                <div className="space-y-6">
                    <Card className="p-0 overflow-hidden border-blue-200 dark:border-blue-800 shadow-sm">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 border-b border-blue-100 dark:border-blue-800">
                            <h3 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                <User className="w-4 h-4" /> Current Location
                            </h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Held By</span>
                                <div className="flex items-start gap-2 mt-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mt-2 shrink-0"></div>
                                    <div className="min-w-0">
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white wrap-break-word leading-tight">
                                            {file.current_holder_name}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 wrap-break-word">
                                            {file.current_holder_designation}
                                        </p>
                                    </div>
                                </div>
                                {file.current_holder_area && (
                                    <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                                        <span className="font-semibold shrink-0">Loc:</span>
                                        <span className="wrap-break-word">{file.current_holder_area}</span>
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-gray-700">
                                <div>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Initiator</span>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1 wrap-break-word">
                                        {file.initiator_name}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Category</span>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1 wrap-break-word">
                                        {file.category}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-2">
                                <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold uppercase ${file.priority === 'immediate' ? 'bg-red-100 text-red-800' : file.priority === 'urgent' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {file.priority} Priority
                                </span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                         <h3 className="font-semibold mb-3 text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2">Description</h3>
                         <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border dark:border-gray-700 whitespace-pre-wrap wrap-break-word">
                             {/* THE FIX: Use HtmlContent for the description */}
                             <HtmlContent content={file.description} />
                         </div>
                    </Card>
                </div>

                {/* Right Column: Timeline */}
                <div className="xl:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-full">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b dark:border-gray-700 pb-2">
                            Movement History
                        </h3>
                        <EFileTimeline history={history} />
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ForwardFileModal
                isOpen={isForwardModalOpen}
                onClose={() => setIsForwardModalOpen(false)}
                fileId={file.id}
            />

            <ConfirmModal
                isOpen={isCloseModalOpen}
                onCancel={() => setIsCloseModalOpen(false)}
                onConfirm={() => {
                    closeMutation.mutate({ fileId: file.id, remarks: 'File parted/closed.' });
                    setIsCloseModalOpen(false);
                }}
                title="Close File"
                message="Are you sure you want to close this file? This indicates the work is complete."
                confirmText="Close File"
                type="danger"
            />
        </div>
    );
}