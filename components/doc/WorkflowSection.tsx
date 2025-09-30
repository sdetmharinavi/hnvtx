import { Separator } from "@/components/common/ui/separator";
import StepList from "@/components/doc/StepList";
import { WorkflowSectionProps } from "@/components/doc/types/workflowTypes";
import { User, Monitor, Zap } from "lucide-react";

export default function WorkflowSection({ 
  workflow, 
  index, 
  colors, 
  isLast 
}: WorkflowSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${colors.badge}`}>
          Workflow {String.fromCharCode(65 + index)}
        </div>
        <h3 className="text-lg font-semibold text-gray-100 flex-1">
          {workflow.title.replace(/^Workflow [A-Z]: /, '')}
        </h3>
      </div>

      <div className="space-y-4 pl-4 border-l-2 border-gray-800/50">
        {/* User Actions */}
        <StepList
          icon={User}
          iconColor="text-emerald-400"
          title="User Actions"
          steps={workflow.userSteps}
          stepColor="text-emerald-400"
        />

        {/* UI Response */}
        <StepList
          icon={Monitor}
          iconColor="text-blue-400"
          title="System Response (UI)"
          steps={workflow.uiSteps}
          stepColor="text-blue-400"
        />

        {/* Technical Flow */}
        <StepList
          icon={Zap}
          iconColor="text-amber-400"
          title="Technical Flow"
          steps={workflow.techSteps}
          stepColor="text-amber-400"
          isTechnical
        />
      </div>

      {!isLast && (
        <Separator className="bg-gradient-to-r from-transparent via-gray-800 to-transparent my-6" />
      )}
    </div>
  );
}