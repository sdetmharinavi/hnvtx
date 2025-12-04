"use client";

import { useParams, useRouter } from "next/navigation";
import { useEFileDetails, useCloseFile } from "@/hooks/data/useEFilesData";
import { PageSpinner, ErrorDisplay, Button, Card, ConfirmModal } from "@/components/common/ui";
import { PageHeader } from "@/components/common/page-header";
import { EFileTimeline } from "@/components/efile/EFileTimeline";
import { ForwardFileModal } from "@/components/efile/ActionModals";
import { useState } from "react";
import { ArrowLeft, Send, Archive, FileText, User } from "lucide-react";
import { useUser } from "@/providers/UserProvider";

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
    
    // Simplified Logic: Any Admin/Operator can manage movement, assuming they are doing data entry
    // for the physical file holder.
    const isActive = file.status === 'active';

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => router.back()} leftIcon={<ArrowLeft className="w-4 h-4"/>} className="mb-2">Back</Button>
            
            <PageHeader 
                title={file.subject} 
                description={`File No: ${file.file_number}`} 
                icon={<FileText />}
                actions={isActive ? [
                    { 
                        label: 'Archive / Close', 
                        onClick: () => setIsCloseModalOpen(true), 
                        variant: 'danger', 
                        leftIcon: <Archive />,
                    },
                    { 
                        label: 'Update Movement', 
                        onClick: () => setIsForwardModalOpen(true), 
                        variant: 'primary',
                        leftIcon: <Send />
                    }
                ] : []}
            />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column: Status Card */}
                <div className="space-y-6">
                    <Card className="p-0 overflow-hidden border-blue-200 dark:border-blue-800">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 border-b border-blue-100 dark:border-blue-800">
                            <h3 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                <User className="w-4 h-4" /> Current Location
                            </h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Held By</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{file.current_holder_name}</p>
                                </div>
                                <p className="text-sm text-gray-600">{file.current_holder_designation}</p>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <span className="font-semibold">Location:</span> {file.current_holder_area || 'Unknown'}
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t dark:border-gray-700">
                                <div>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Initiator</span>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1">{file.initiator_name}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Category</span>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1">{file.category}</p>
                                </div>
                            </div>

                            <div className="pt-2">
                                <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${file.priority === 'immediate' ? 'bg-red-100 text-red-800' : file.priority === 'urgent' ? 'bg-orange-100 text-orange-800' : 'bg-blue-50 text-blue-800'}`}>
                                    {file.priority} Priority
                                </span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                         <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Description</h3>
                         <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border dark:border-gray-700">
                             {file.description || "No detailed description provided."}
                         </div>
                    </Card>
                </div>

                {/* Right Column: Timeline */}
                <div className="xl:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
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