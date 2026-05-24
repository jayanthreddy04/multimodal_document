export default function ProgressBar({ progress, label, stage }) {
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label || 'Processing'}</span>
        <span className="font-medium text-primary-600">{progress}%</span>
      </div>
      <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {stage && (
        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
          Stage: {stage.replace(/_/g, ' ')}
        </p>
      )}
    </div>
  );
}
