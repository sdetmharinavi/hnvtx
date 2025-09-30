import { LucideIcon } from "lucide-react";

interface StepListProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  steps: string[];
  stepColor: string;
  isTechnical?: boolean;
}

export default function StepList({ 
  icon: Icon, 
  iconColor, 
  title, 
  steps, 
  stepColor,
  isTechnical = false 
}: StepListProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h4 className="text-sm font-semibold text-gray-200">{title}</h4>
      </div>
      <ul className="space-y-2 ml-6">
        {steps.map((step, index) => (
          <li key={index} className="text-sm text-gray-400 flex items-start gap-2">
            <span className={`${stepColor} mt-1`}>•</span>
            {isTechnical ? (
              <span dangerouslySetInnerHTML={{ 
                __html: step.replace(
                  /`([^`]+)`/g, 
                  '<code class="bg-gray-800/80 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-gray-700/50">$1</code>'
                ) 
              }} />
            ) : (
              <span>{step}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}