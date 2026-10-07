import { getFlagUrl } from '../../utils/flags';

export default function MatchHistoryTable({ matches = [] }) {
  if (!matches || matches.length === 0) {
    return (
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 text-center text-gray-500 text-sm">
        No match records found for this player in this tournament.
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0e0e0e] border border-white/10 rounded-lg overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-white tracking-wide uppercase">MATCH HISTORY</h3>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            Performance by match throughout the tournament
          </p>
        </div>
        <span className="text-xs font-mono text-gray-400 bg-white/5 px-2.5 py-1 rounded border border-white/10">
          {matches.reduce((acc, m) => acc + (m.minutes_played || 0), 0)} Total Mins
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-[13px] text-gray-300">
          <thead className="bg-black/50 text-gray-400 uppercase tracking-wider text-xs font-medium border-b border-white/10">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Stage</th>
              <th className="py-3 px-4">Opponent</th>
              <th className="py-3 px-3 text-right">Min</th>
              <th className="py-3 px-3 text-right font-semibold text-white">G</th>
              <th className="py-3 px-3 text-right font-semibold text-white">A</th>
              <th className="py-3 px-3 text-right">xG</th>
              <th className="py-3 px-3 text-right">xA</th>
              <th className="py-3 px-3 text-right">Sh (SoT)</th>
              <th className="py-3 px-3 text-right">Pass %</th>
              <th className="py-3 px-3 text-right">Key P</th>
              <th className="py-3 px-3 text-right">Tack</th>
              <th className="py-3 px-4 text-right">Int</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {matches.map((m, idx) => {
              const passAcc = m.passes_attempted > 0 
                ? ((m.passes_completed / m.passes_attempted) * 100).toFixed(1)
                : (m.pass_accuracy ? Number(m.pass_accuracy).toFixed(1) : '0.0');

              return (
                <tr key={m.match_id || idx} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-sans text-gray-400 whitespace-nowrap">
                    {m.match_date || '-'}
                  </td>
                  <td className="py-3 px-4 font-sans text-gray-300 whitespace-nowrap">
                    {m.stage || 'Group Stage'}
                  </td>
                  <td className="py-3 px-4 font-sans text-white font-medium whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getFlagUrl(m.opponent) && (
                        <img
                          src={getFlagUrl(m.opponent)}
                          alt={m.opponent}
                          className="w-4 h-3 object-cover rounded-xs border border-white/20"
                        />
                      )}
                      <span>vs {m.opponent}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right text-gray-300">
                    {m.minutes_played}&apos;
                  </td>
                  <td className={`py-3 px-3 text-right font-bold ${m.goals > 0 ? 'text-amber-400' : 'text-gray-400'}`}>
                    {m.goals || 0}
                  </td>
                  <td className={`py-3 px-3 text-right font-bold ${m.assists > 0 ? 'text-cyan-400' : 'text-gray-400'}`}>
                    {m.assists || 0}
                  </td>
                  <td className="py-3 px-3 text-right text-gray-300">
                    {m.xg !== undefined && m.xg !== null ? Number(m.xg).toFixed(2) : '0.00'}
                  </td>
                  <td className="py-3 px-3 text-right text-gray-300">
                    {m.xa !== undefined && m.xa !== null ? Number(m.xa).toFixed(2) : '0.00'}
                  </td>
                  <td className="py-3 px-3 text-right text-gray-300 whitespace-nowrap">
                    {m.shots || 0} ({m.shots_on_target || 0})
                  </td>
                  <td className="py-3 px-3 text-right text-gray-300">
                    {passAcc}%
                  </td>
                  <td className="py-3 px-3 text-right text-gray-300">
                    {m.key_passes || 0}
                  </td>
                  <td className="py-3 px-3 text-right text-gray-300">
                    {m.tackles || 0}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-300">
                    {m.interceptions || 0}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
