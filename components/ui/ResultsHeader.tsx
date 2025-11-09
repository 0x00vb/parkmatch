"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/outline";

interface ResultsHeaderProps {
  title: string;
  onClose: () => void;
}

export default function ResultsHeader({ title, onClose }: ResultsHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
      <button
        onClick={onClose}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <ArrowLeftIcon className="h-5 w-5" />
        <span className="text-sm font-medium">Volver</span>
      </button>
      <div className="text-sm font-medium text-gray-900">
        {title}
      </div>
      <div className="w-16" /> {/* Spacer for centering */}
    </div>
  );
}
