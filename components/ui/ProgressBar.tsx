interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export default function ProgressBar({ currentStep, totalSteps, className = "" }: ProgressBarProps) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <div
          key={index}
          className={`h-1 rounded-full transition-colors ${
            index < currentStep
              ? "bg-green-500 w-8"
              : index === currentStep
              ? "bg-green-500 w-8"
              : "bg-gray-200 w-4"
          }`}
        />
      ))}
    </div>
  );
}
