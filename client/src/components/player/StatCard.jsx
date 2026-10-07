export default function StatCard({ label, value, per90, unit = '', highlight = false, subtext = '' }) {
  return (
    <div className={`p-4 rounded-lg border transition-colors ${
      highlight 
        ? 'bg-cyan-950/20 border-cyan-500/30 text-white' 
        : 'bg-[#0e0e0e] border-white/10 text-white hover:border-white/20'
    }`}>
      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider truncate">
        {label}
      </div>
      <div className="flex items-baseline gap-1 mt-1.5">
        <span className="text-2xl sm:text-[26px] font-bold font-mono tracking-tight text-white">
          {value !== undefined && value !== null ? value : '-'}
        </span>
        {unit && <span className="text-xs text-gray-400 font-sans">{unit}</span>}
      </div>
      {per90 !== undefined && per90 !== null && (
        <div className="text-xs text-gray-400 font-mono mt-1">
          {per90} <span className="text-gray-500 text-xs">/ 90</span>
        </div>
      )}
      {subtext && !per90 && (
        <div className="text-xs text-gray-400 font-mono mt-1 truncate">
          {subtext}
        </div>
      )}
    </div>
  );
}
