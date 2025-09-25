import { FiPlus } from "react-icons/fi";
import { Button } from "@/components/common/ui/Button";
import { Card } from "@/components/common/ui/card";

interface EmptyStateProps {
  onCreate: () => void;
}

export function EmptyState({ onCreate }: EmptyStateProps) {
  return (
    <Card className="p-8 text-center dark:border-gray-700 dark:bg-gray-800">
      <p className="mb-4 text-gray-500 dark:text-gray-400">
        No unique categories found.
      </p>
      <Button onClick={onCreate}>
        <FiPlus className="mr-2 h-4 w-4" />
        Create First Category
      </Button>
    </Card>
  );
}