import { getFlagUrl } from '../../utils/flags';

export default function PlayerHeader({ player, headlineStats = [] }) {
  if (!player) return null;

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'FW':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'MF':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'DF':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'GK':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="w-full bg-[#0e0e0e] border border-white/10 rounded-lg px-5 py-3.5 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        {/* Left: Player Identity */}
        <div className="flex items-center gap-3.5 min-w-0">
          {getFlagUrl(player.team_name) && (
            <img
              src={getFlagUrl(player.team_name)}
              alt={player.team_name}
              className="w-9 h-6.5 object-cover rounded-xs border border-white/20 shrink-0 shadow-sm"
            />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl sm:text-[30px] font-bold tracking-tight text-white truncate">
                {player.player_name}
              </h2>
              <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border shrink-0 ${getRoleBadgeColor(player.role)}`}>
                {player.role}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300 mt-1 truncate">
              <span className="text-white font-medium">{player.team_name}</span>
              <span>·</span>
              <span className="truncate text-gray-400">{player.primary_position}</span>
            </div>
          </div>
        </div>

        {/* Right: Inline Headline Stats Row */}
        <div className="flex items-center gap-5 sm:gap-6 shrink-0 divide-x divide-white/10 border-t sm:border-t-0 border-white/10 pt-2.5 sm:pt-0">
          {headlineStats.map((stat, idx) => (
            <div key={idx} className={idx > 0 ? 'pl-5 sm:pl-6' : ''}>
              <div className="text-xs uppercase tracking-wider text-gray-400 font-medium">
                {stat.label}
              </div>
              <div className="flex items-baseline gap-1 mt-1 font-mono">
                <span className={`text-xl sm:text-2xl font-bold ${stat.highlight ? 'text-cyan-400' : 'text-white'}`}>
                  {stat.value}
                </span>
                {stat.subtext && (
                  <span className="text-xs text-gray-400 font-sans">{stat.subtext}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
