"use client";

import { Card } from "@/components/common/ui/card";
import { Button } from "@/components/common/ui/Button";
import { FiPlus } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/common/ui/LoadingSpinner";

export function NoCategoriesState({ error, isLoading }: { error?: Error; isLoading: boolean }) {
  const router = useRouter();
  
  return (
    <Card className="p-8 text-center ">
      <p className="mb-4 text-gray-500 dark:text-gray-400">
        {isLoading ? "Loading categories..." : "No categories found."}
      </p>
      {error && (
        <p className="mb-4 text-red-500 dark:text-red-400">
          Error: {error.message}
        </p>
      )}
      <Button onClick={() => router.push('/dashboard/categories')}>
        <FiPlus className="mr-2 h-4 w-4" />
        Manage Categories
      </Button>
    </Card>
  );
}

export function SelectCategoryPrompt() {
  return (
    <Card className="p-8 text-center dark:bg-gray-800">
      <p className="text-gray-500 dark:text-gray-400">
        Please select a category to view lookup types.
      </p>
    </Card>
  );
}

export function LoadingState({ selectedCategory }: { selectedCategory: string }) {
  return (
    <div className="flex justify-center py-8">
      <LoadingSpinner />
      <span className="ml-2 text-gray-600 dark:text-gray-400">
        Loading lookup types for {`"${selectedCategory}"`}...
      </span>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
      <p className="text-red-600 dark:text-red-400">
        Error loading lookup types: {error.message}
      </p>
      <Button
        onClick={onRetry}
        variant="outline"
        className="mt-2"
      >
        Retry
      </Button>
    </Card>
  );
}