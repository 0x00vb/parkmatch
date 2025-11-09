"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
}

export default function ModalHeader({ title, onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <button
        onClick={onClose}
        className="p-2 -mr-2 rounded-full hover:bg-gray-100"
      >
        <XMarkIcon className="w-6 h-6 text-gray-600" />
      </button>
    </div>
  );
}
