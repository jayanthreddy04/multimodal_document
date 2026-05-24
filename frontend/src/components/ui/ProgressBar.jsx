export default function ProgressBar({ progress, label }) {
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm mb-1 text-gray-600 dark:text-gray-400">
          <span>{label}</span>
          <span>{progress}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-primary-600 h-2.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}
