import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/ui/card/card';
import { ScrollArea } from '@/components/common/ui/scroll-area';
import { WorkflowCardProps } from '@/components/doc/types/workflowTypes';
import WorkflowSection from '@/components/doc/WorkflowSection';
import { Workflow } from 'lucide-react';

export default function WorkflowCard({ purpose, workflows, color }: WorkflowCardProps) {
  const colorMap = {
    violet: {
      border: 'border-violet-500/30',
      glow: 'shadow-violet-500/10',
      badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      icon: 'text-violet-400',
    },
    blue: {
      border: 'border-blue-500/30',
      glow: 'shadow-blue-500/10',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      icon: 'text-blue-400',
    },
    teal: {
      border: 'border-teal-500/30',
      glow: 'shadow-teal-500/10',
      badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      icon: 'text-teal-400',
    },
    cyan: {
      border: 'border-cyan-500/30',
      glow: 'shadow-cyan-500/10',
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      icon: 'text-cyan-400',
    },
    orange: {
      border: 'border-orange-500/30',
      glow: 'shadow-orange-500/10',
      badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      icon: 'text-orange-400',
    },
    yellow: {
      border: 'border-yellow-500/30',
      glow: 'shadow-yellow-500/10',
      badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      icon: 'text-yellow-400',
    },
  };

  const colors = colorMap[color];

  return (
    <Card
      className={`mt-4 bg-gradient-to-br from-gray-900/90 to-gray-800/50 backdrop-blur-sm border ${colors.border} ${colors.glow} shadow-2xl`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg">
            <Workflow className={`w-5 h-5 ${colors.icon}`} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg text-gray-100 mb-2">Purpose</CardTitle>
            <p className="text-gray-400 text-sm leading-relaxed">{purpose}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <ScrollArea className="h-[600px] rounded-xl border border-gray-800/50 bg-gray-950/50 backdrop-blur-sm">
          <div className="p-6 space-y-8">
            {workflows.map((workflow, index) => (
              <WorkflowSection
                key={index}
                workflow={workflow}
                index={index}
                colors={colors}
                isLast={index === workflows.length - 1}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
