import { Workflow } from "lucide-react";

export default function HeaderSection() {
  return (
    <div className="text-center space-y-4 mb-12">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500/20 to-cyan-500/20 rounded-full border border-violet-500/30 backdrop-blur-sm">
        <Workflow className="w-4 h-4 text-violet-400" />
        <span className="text-sm font-medium text-gray-300">Technical Documentation</span>
      </div>
      <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
        System Workflows
      </h1>
      <p className="text-gray-400 text-lg max-w-2xl mx-auto">
        Comprehensive step-by-step user and technical workflows for your application
      </p>
    </div>
  );
}