"use client";
import { FiMenu } from "react-icons/fi";

interface MenuButtonProps {
  onClick: () => void;
}

export default function MenuButton({ onClick }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="block md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label="Open sidebar menu"
      type="button"
    >
      <FiMenu className="h-6 w-6" />
    </button>
  );
}
