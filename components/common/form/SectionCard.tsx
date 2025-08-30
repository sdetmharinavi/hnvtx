import { ReactNode } from "react";
import { cn } from "@/utils/classNames";

interface SectionCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function SectionCard({
  title,
  icon,
  children,
  className,
}: SectionCardProps) {
  return (
    <div
      className={cn(
        "border rounded-xl p-4 space-y-4 bg-white shadow-sm",
        "transition-all duration-200 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center space-x-2 border-b pb-2">
        {icon && <span className="text-xl text-primary">{icon}</span>}
        <h3 className="font-semibold text-gray-800 text-base">{title}</h3>
      </div>
      <div className="grid gap-4">{children}</div>
    </div>
  );
}
