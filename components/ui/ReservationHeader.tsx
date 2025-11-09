"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/outline";

interface ReservationHeaderProps {
  title: string;
  onBack: () => void;
}

export default function ReservationHeader({ title, onBack }: ReservationHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
      <button
        onClick={onBack}
        className="p-2 -ml-2 rounded-full hover:bg-gray-100"
      >
        <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
      </button>
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <div className="w-10" /> {/* Spacer */}
    </div>
  );
}
