import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, RefreshCw, User, Layers } from 'lucide-react';
import { getPlayerProfile, getPlayerMatches, getPlayerPerformance } from '../api';
import PlayerSelector from '../components/player/PlayerSelector';
import PlayerHeader from '../components/player/PlayerHeader';
import SmallSampleWarning from '../components/player/SmallSampleWarning';
import StatCard from '../components/player/StatCard';
import PlayerRadar from '../components/player/PlayerRadar';
import MatchHistoryTable from '../components/player/MatchHistoryTable';

function StatCategoryTable({ title, rows }) {
  return (
    <div className="bg-[#0e0e0e] border border-white/10 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 bg-black/40 border-b border-white/10 flex items-center justify-between">
        <h4 className="text-sm sm:text-base font-semibold uppercase tracking-wider text-white">
          {title}
        </h4>
        <span className="text-xs text-gray-400 font-mono">Total · /90</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm font-mono">
          <tbody className="divide-y divide-white/5">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                <td className="py-2.5 px-4 font-sans text-gray-200 font-medium text-sm">
                  {row.name}
                </td>
                <td className={`py-2.5 px-4 text-right font-bold text-sm ${row.highlight ? 'text-cyan-400' : 'text-white'}`}>
                  {row.total !== undefined && row.total !== null ? row.total : '-'}
                </td>
                <td className="py-2.5 px-4 text-right text-gray-400 text-xs sm:text-sm">
                  {row.p90 !== undefined && row.p90 !== null && row.p90 !== '-' ? Number(row.p90).toFixed(2) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PlayerAnalytics() {
  const [selectedPlayerId, setSelectedPlayerId] = useState(5503); // Default to Lionel Messi
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'attacking', 'passing', 'possession', 'defending', 'discipline'
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPlayerData = useCallback(async (playerId) => {
    if (!playerId) {
      setProfile(null);
      setMatches([]);
      setPerformance(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const [profRes, matchRes, perfRes] = await Promise.all([
        getPlayerProfile(playerId),
        getPlayerMatches(playerId),
        getPlayerPerformance(playerId)
      ]);

      if (profRes.player_id !== playerId) return; // Prevent race conditions

      setProfile(profRes);
      setMatches(matchRes?.matches || []);
      setPerformance(perfRes);
    } catch (err) {
      console.error('Error loading player analytics:', err);
      setError('Unable to retrieve player data. Ensure the Flask backend server is running on port 5000.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlayerData(selectedPlayerId);
  }, [selectedPlayerId, loadPlayerData]);

  const handleSelectPlayer = (player) => {
    if (player && player.player_id) {
      setSelectedPlayerId(player.player_id);
    } else {
      setSelectedPlayerId(null);
      setProfile(null);
      setMatches([]);
      setPerformance(null);
    }
  };

  // Build Radar Data from performance percentiles
  const getRadarData = () => {
    if (!performance || !performance.percentiles) return [];
    const p = performance.percentiles;
    const role = profile?.role || 'MF';
    let metricKeys = [];

    if (role === 'FW') {
      metricKeys = [
        { key: 'xg_per90', label: 'Expected Goals' },
        { key: 'goals_per90', label: 'Finishing' },
        { key: 'shots_per90', label: 'Shot Volume' },
        { key: 'key_passes_per90', label: 'Key Passes' },
        { key: 'xa_per90', label: 'Expected Assists' },
        { key: 'dribbles_per90', label: 'Dribbles' },
        { key: 'carries_per90', label: 'Carries' }
      ];
    } else if (role === 'DF') {
      metricKeys = [
        { key: 'tackles_per90', label: 'Tackles' },
        { key: 'interceptions_per90', label: 'Interceptions' },
        { key: 'clearances_per90', label: 'Clearances' },
        { key: 'blocks_per90', label: 'Blocks' },
        { key: 'recoveries_per90', label: 'Recoveries' },
        { key: 'pass_accuracy', label: 'Pass Accuracy' },
        { key: 'progressive_passes_per90', label: 'Prog Passes' }
      ];
    } else {
      metricKeys = [
        { key: 'key_passes_per90', label: 'Key Passes' },
        { key: 'progressive_passes_per90', label: 'Prog Passes' },
        { key: 'pass_accuracy', label: 'Pass Accuracy' },
        { key: 'xa_per90', label: 'Expected Assists' },
        { key: 'carries_per90', label: 'Carries' },
        { key: 'tackles_per90', label: 'Tackles' },
        { key: 'interceptions_per90', label: 'Interceptions' },
        { key: 'xg_per90', label: 'Expected Goals' }
      ];
    }

    return metricKeys.map((m) => {
      const item = p[m.key];
      return {
        metric: m.key,
        label: m.label,
        value: item ? item.percentile : 50,
        isPercentile: true
      };
    });
  };

  const stats = profile?.stats || {};
  const per90 = profile?.per90 || {};

  // All 26 stats grouped logically into 5 categories
  const attackingStats = [
    { name: 'Goals', total: stats.goals, p90: per90.goals_per90, highlight: stats.goals > 0 },
    { name: 'Expected Goals (xG)', total: stats.xg !== undefined && stats.xg !== null ? Number(stats.xg).toFixed(2) : '-', p90: per90.xg_per90 },
    { name: 'Assists', total: stats.assists, p90: per90.assists_per90, highlight: stats.assists > 0 },
    { name: 'Expected Assists (xA)', total: stats.xa !== undefined && stats.xa !== null ? Number(stats.xa).toFixed(2) : '-', p90: per90.xa_per90 },
    { name: 'Shots', total: stats.shots, p90: per90.shots_per90 },
    { name: 'Shots on Target', total: stats.shots_on_target, p90: per90.shots_on_target_per90 },
    { name: 'Shot Accuracy', total: stats.shot_accuracy !== undefined && stats.shot_accuracy !== null ? `${Number(stats.shot_accuracy).toFixed(1)}%` : '-', p90: '-' },
    { name: 'xG per Shot', total: stats.xg_per_shot !== undefined && stats.xg_per_shot !== null ? Number(stats.xg_per_shot).toFixed(2) : '-', p90: '-' }
  ];

  const passingStats = [
    { name: 'Passes Attempted', total: stats.passes_attempted, p90: per90.passes_per90 },
    { name: 'Passes Completed', total: stats.passes_completed, p90: '-' },
    { name: 'Pass Accuracy', total: stats.pass_accuracy !== undefined && stats.pass_accuracy !== null ? `${Number(stats.pass_accuracy).toFixed(1)}%` : '-', p90: '-' },
    { name: 'Key Passes', total: stats.key_passes, p90: per90.key_passes_per90, highlight: stats.key_passes >= 5 },
    { name: 'Progressive Passes', total: stats.progressive_passes, p90: per90.progressive_passes_per90 }
  ];

  const possessionStats = [
    { name: 'Carries', total: stats.carries, p90: per90.carries_per90 },
    { name: 'Progressive Carries', total: stats.progressive_carries, p90: per90.progressive_carries_per90 },
    { name: 'Dribbles Attempted', total: stats.dribbles_attempted, p90: per90.dribbles_per90 },
    { name: 'Dribbles Completed', total: stats.dribbles_completed, p90: '-' },
    { name: 'Dribble Success Rate', total: stats.dribble_success_rate !== undefined && stats.dribble_success_rate !== null ? `${Number(stats.dribble_success_rate).toFixed(1)}%` : '-', p90: '-' }
  ];

  const defendingStats = [
    { name: 'Tackles', total: stats.tackles, p90: per90.tackles_per90 },
    { name: 'Interceptions', total: stats.interceptions, p90: per90.interceptions_per90 },
    { name: 'Ball Recoveries', total: stats.ball_recoveries, p90: per90.recoveries_per90 },
    { name: 'Clearances', total: stats.clearances, p90: per90.clearances_per90 },
    { name: 'Blocks', total: stats.blocks, p90: per90.blocks_per90 }
  ];

  const disciplineStats = [
    { name: 'Fouls Committed', total: stats.fouls_committed, p90: '-' },
    { name: 'Fouls Won', total: stats.fouls_won, p90: '-' },
    { name: 'Yellow Cards', total: stats.yellow_cards, p90: '-' },
    { name: 'Red Cards', total: stats.red_cards, p90: '-' }
  ];

  const tabs = [
    { id: 'all', label: 'All Sections' },
    { id: 'attacking', label: 'Attacking' },
    { id: 'passing', label: 'Passing' },
    { id: 'possession', label: 'Possession' },
    { id: 'defending', label: 'Defending' },
    { id: 'discipline', label: 'Discipline' }
  ];

  return (
    <div className="w-full space-y-8 text-white">
      {/* 1. Page Heading */}
      <div>
        <div className="inline-block px-2.5 py-0.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
          Player Intelligence
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Player Analytics
        </h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1.5 max-w-3xl">
          Detailed match and season statistics compiled directly from official StatsBomb event data for the FIFA World Cup.
        </p>
      </div>

      {/* 2. Filters */}
      <PlayerSelector
        selectedPlayerId={selectedPlayerId}
        onSelectPlayer={handleSelectPlayer}
      />

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-red-950/30 border border-red-500/40 rounded-lg text-red-200 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadPlayerData(selectedPlayerId)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 border border-red-500/40 rounded-md text-xs font-medium text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[45vh] bg-[#0e0e0e] border border-white/10 rounded-lg">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
          <p className="text-gray-400 text-sm font-medium">Loading player analytics...</p>
        </div>
      ) : !selectedPlayerId || !profile ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 bg-[#0e0e0e] border border-white/10 rounded-lg text-center">
          <User className="w-10 h-10 text-cyan-400/80 mb-3" />
          <h3 className="text-base font-semibold text-white">No Player Selected</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-md">
            Please search for a player or choose one from the selector dropdown above to view detailed match and tournament statistics.
          </p>
        </div>
      ) : (
        <>
          {/* Small Sample Warning */}
          {profile.is_qualified_sample === false && (
            <SmallSampleWarning minutes={profile.minutes_played || 0} />
          )}

          {/* 3. Player Identity Header */}
          <PlayerHeader
            player={profile}
            headlineStats={[
              {
                label: 'Matches',
                value: profile.matches_played,
                subtext: `(${profile.starts} starts)`
              },
              {
                label: 'Minutes',
                value: `${profile.minutes_played}'`
              },
              {
                label: 'Performance Score',
                value: profile.performance_score ? Number(profile.performance_score).toFixed(1) : '-',
                highlight: true
              }
            ]}
          />

          {/* 4. SECTION A — KEY STATISTICS (Compact 8-Tile Responsive Grid) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold tracking-wide uppercase text-white">
                Key Tournament Statistics
              </h2>
              <span className="text-xs text-gray-400 font-mono">Tournament Totals & Rates / 90</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                label="Goals"
                value={stats.goals}
                per90={per90.goals_per90}
                highlight={stats.goals > 0}
              />
              <StatCard
                label="Assists"
                value={stats.assists}
                per90={per90.assists_per90}
                highlight={stats.assists > 0}
              />
              <StatCard
                label="Expected Goals (xG)"
                value={stats.xg !== undefined && stats.xg !== null ? Number(stats.xg).toFixed(2) : '-'}
                per90={per90.xg_per90}
              />
              <StatCard
                label="Expected Assists (xA)"
                value={stats.xa !== undefined && stats.xa !== null ? Number(stats.xa).toFixed(2) : '-'}
                per90={per90.xa_per90}
              />
              <StatCard
                label="Shots"
                value={stats.shots}
                per90={per90.shots_per90}
                subtext={`${stats.shots_on_target || 0} on target`}
              />
              <StatCard
                label="Key Passes"
                value={stats.key_passes}
                per90={per90.key_passes_per90}
                highlight={stats.key_passes >= 5}
              />
              <StatCard
                label="Pass Accuracy"
                value={stats.pass_accuracy !== undefined && stats.pass_accuracy !== null ? `${Number(stats.pass_accuracy).toFixed(1)}%` : '-'}
                subtext={`${stats.passes_completed || 0}/${stats.passes_attempted || 0} passes`}
              />
              <StatCard
                label="Tackles"
                value={stats.tackles}
                per90={per90.tackles_per90}
              />
            </div>
          </section>

          {/* 5. SECTION B — RADAR + SUMMARY (Two-Column Layout) */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left: Radar Chart */}
            <div className="lg:col-span-7">
              <PlayerRadar
                data={getRadarData()}
                title={`${profile.player_name} — Role Profile Radar`}
                isQualified={profile.is_qualified_sample}
              />
            </div>

            {/* Right: Performance Snapshot List (Rows, Not Heavy Cards) */}
            <div className="lg:col-span-5 bg-[#0e0e0e] border border-white/10 rounded-lg p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white tracking-wide uppercase">
                      Performance Snapshot
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                      Role-relevant normalized production per 90 minutes
                    </p>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded">
                    Per 90 Mins
                  </span>
                </div>

                <div className="divide-y divide-white/5 font-mono text-xs sm:text-sm">
                  {[
                    { label: 'Goals / 90', val: per90.goals_per90 },
                    { label: 'xG / 90', val: per90.xg_per90 },
                    { label: 'Assists / 90', val: per90.assists_per90 },
                    { label: 'xA / 90', val: per90.xa_per90 },
                    { label: 'Key Passes / 90', val: per90.key_passes_per90 },
                    { label: 'Progressive Passes / 90', val: per90.progressive_passes_per90 },
                    { label: 'Pass Accuracy', val: stats.pass_accuracy !== undefined && stats.pass_accuracy !== null ? `${Number(stats.pass_accuracy).toFixed(1)}%` : null, isRaw: true },
                    { label: 'Carries / 90', val: per90.carries_per90 },
                    { label: 'Tackles / 90', val: per90.tackles_per90 },
                    { label: 'Interceptions / 90', val: per90.interceptions_per90 },
                    { label: 'Ball Recoveries / 90', val: per90.recoveries_per90 }
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2">
                      <span className="text-gray-300 font-sans text-xs sm:text-sm">{item.label}</span>
                      <span className="font-semibold text-white">
                        {item.isRaw ? item.val : (item.val !== undefined && item.val !== null ? Number(item.val).toFixed(2) : '-')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/10 text-xs text-gray-400 font-sans">
                Source: StatsBomb Open Data (FIFA World Cup)
              </div>
            </div>
          </section>

          {/* 6. SECTION C — DETAILED STATISTICS (Organized Sections with Optional Filter) */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-white/10 gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white tracking-wide uppercase flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Detailed Statistics</span>
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                  Complete breakdown across attacking, passing, possession, defending, and discipline
                </p>
              </div>

              {/* Category Filter Tabs */}
              <div className="inline-flex rounded-lg border border-white/10 bg-black/60 p-1 self-start sm:self-auto overflow-x-auto max-w-full">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1 rounded text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Displaying Categories */}
            {activeTab === 'all' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                {/* Column 1: Attacking & Passing */}
                <div className="space-y-5">
                  <StatCategoryTable title="Attacking" rows={attackingStats} />
                  <StatCategoryTable title="Passing" rows={passingStats} />
                </div>

                {/* Column 2: Possession, Defending & Discipline */}
                <div className="space-y-5">
                  <StatCategoryTable title="Possession" rows={possessionStats} />
                  <StatCategoryTable title="Defending" rows={defendingStats} />
                  <StatCategoryTable title="Discipline" rows={disciplineStats} />
                </div>
              </div>
            ) : (
              <div>
                {activeTab === 'attacking' && <StatCategoryTable title="Attacking" rows={attackingStats} />}
                {activeTab === 'passing' && <StatCategoryTable title="Passing" rows={passingStats} />}
                {activeTab === 'possession' && <StatCategoryTable title="Possession" rows={possessionStats} />}
                {activeTab === 'defending' && <StatCategoryTable title="Defending" rows={defendingStats} />}
                {activeTab === 'discipline' && <StatCategoryTable title="Discipline" rows={disciplineStats} />}
              </div>
            )}
          </section>

          {/* 7. SECTION D — MATCH HISTORY */}
          <section>
            <MatchHistoryTable matches={matches} />
          </section>
        </>
      )}
    </div>
  );
}
