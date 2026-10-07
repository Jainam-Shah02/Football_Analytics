import { AlertTriangle } from 'lucide-react';

export default function SmallSampleWarning({ minutes = 0 }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200 mb-6">
      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <div className="text-sm">
        <span className="font-semibold text-amber-300">Small Sample Size: </span>
        Player has only {minutes} minute{minutes === 1 ? '' : 's'} recorded (less than 90 minutes). Percentiles are unranked and the analytical performance score is dampened.
      </div>
    </div>
  );
}
