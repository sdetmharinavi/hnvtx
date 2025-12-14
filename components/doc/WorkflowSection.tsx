// components/doc/WorkflowSection.tsx
import { Separator } from '@/components/common/ui/separator';
import StepList from '@/components/doc/StepList';
import { WorkflowSectionProps } from '@/components/doc/types/workflowTypes';
import { useUser } from '@/providers/UserProvider';
import { User, Monitor, Zap } from 'lucide-react';

// Added 'id' to props interface
interface ExtendedProps extends WorkflowSectionProps {
  id?: string;
}

export default function WorkflowSection({ workflow, index, colors, isLast, id }: ExtendedProps) {
  const { isSuperAdmin } = useUser();
  
  return (
    // Added id attribute here for anchor scrolling
    <div id={id} className="space-y-4 scroll-mt-24">
      <div className="flex items-center gap-3">
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${colors.badge}`}>
          Workflow {String.fromCharCode(65 + index)}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1">
          {workflow.title}
        </h3>
      </div>

      <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
        {/* User Actions */}
        <StepList
          icon={User}
          iconColor="text-emerald-600 dark:text-emerald-400"
          title="User Actions"
          steps={workflow.userSteps}
          stepColor="text-emerald-600 dark:text-emerald-400"
        />

        {/* UI Response */}
        <>
        {workflow.uiSteps && <StepList
          icon={Monitor}
          iconColor="text-blue-600 dark:text-blue-400"
          title="System Response (UI)"
          steps={workflow.uiSteps || []}
          stepColor="text-blue-600 dark:text-blue-400"
        />}
        </>

        {/* Technical Flow */}
        {isSuperAdmin && (
          <StepList
            icon={Zap}
            iconColor="text-amber-600 dark:text-amber-400"
            title="Technical Flow"
            steps={workflow.techSteps}
            stepColor="text-amber-600 dark:text-amber-400"
            isTechnical
          />
        )}
      </div>

      {!isLast && <Separator className="bg-gray-200 dark:bg-gray-700 my-6" />}
    </div>
  );
}