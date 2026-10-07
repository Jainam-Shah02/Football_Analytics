import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  User,
  Activity,
  Sliders
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { getPlayerPerformance, getPlayerForm, getPlayerProfile } from '../api';
import PlayerSelector from '../components/player/PlayerSelector';
import SmallSampleWarning from '../components/player/SmallSampleWarning';
import PlayerRadar from '../components/player/PlayerRadar';
import { getFlagUrl } from '../utils/flags';

export default function PlayerPerformance() {
  const [selectedPlayerId, setSelectedPlayerId] = useState(5503); // Default: Lionel Messi
  const [period, setPeriod] = useState('full'); // 'full', '10', '5'
  const [performance, setPerformance] = useState(null);
  const [form, setForm] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Cache to prevent duplicate calls when only period changes
  const lastPlayerIdRef = useRef(null);

  const loadData = useCallback(async (playerId, selectedPeriod) => {
    if (!playerId) {
      setPerformance(null);
      setForm(null);
      setProfile(null);
      setIsLoading(false);
      lastPlayerIdRef.current = null;
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const limit = selectedPeriod === '5' ? 5 : (selectedPeriod === '10' ? 10 : 100);

      // If player changed, fetch everything. If only period changed, fetch only form!
      if (lastPlayerIdRef.current !== playerId) {
        const [perfRes, formRes, profRes] = await Promise.all([
          getPlayerPerformance(playerId),
          getPlayerForm(playerId, limit),
          getPlayerProfile(playerId)
        ]);

        if (perfRes.player_id !== playerId) return; // Prevent race conditions

        setPerformance(perfRes);
        setForm(formRes);
        setProfile(profRes);
        lastPlayerIdRef.current = playerId;
      } else {
        // Only period changed: fetch form only
        const formRes = await getPlayerForm(playerId, limit);
        if (formRes.player_id !== playerId) return;
        setForm(formRes);
      }
    } catch (err) {
      console.error('Error loading performance data:', err);
      setError('Unable to retrieve player performance. Ensure the Flask backend server is running on port 5000.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(selectedPlayerId, period);
  }, [selectedPlayerId, period, loadData]);

  const handleSelectPlayer = (player) => {
    if (player && player.player_id) {
      setSelectedPlayerId(player.player_id);
    } else {
      setSelectedPlayerId(null);
      setPerformance(null);
      setForm(null);
      setProfile(null);
    }
  };

  // Percentiles formatted for breakdown rows
  const getPercentileChartData = () => {
    if (!performance || !performance.percentiles) return [];
    return Object.entries(performance.percentiles).map(([key, item]) => ({
      key,
      label: item.label || key,
      percentile: Number(item.percentile.toFixed(1))
    })).sort((a, b) => b.percentile - a.percentile);
  };

  const percentileData = getPercentileChartData();

  // Radar data
  const getRadarData = () => {
    if (!performance || !performance.percentiles) return [];
    const p = performance.percentiles;
    const role = performance?.role || 'MF';
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

  // Timeline chart data from form
  const timelineData = form?.timeline?.map((m) => ({
    name: `vs ${m.opponent}`,
    opponent: m.opponent,
    date: m.date,
    stage: m.stage,
    score: m.match_score,
    xg: m.xg,
    xa: m.xa,
    minutes: m.minutes,
    goals: m.goals,
    assists: m.assists
  })) || [];

  const periodLabel = period === '5' ? 'Last 5 Matches' : period === '10' ? 'Last 10 Matches' : 'Full Tournament';

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
    <div className="w-full space-y-8 text-white">
      {/* 1. Page Heading */}
      <div>
        <div className="inline-block px-2.5 py-0.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
          Evaluation Engine
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Player Performance & Benchmarking
        </h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1.5 max-w-3xl">
          Role-aware analytical evaluation model benchmarking individual match and tournament output against peer distributions.
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
            onClick={() => loadData(selectedPlayerId, period)}
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
          <p className="text-gray-400 text-sm font-medium">Computing performance models...</p>
        </div>
      ) : !selectedPlayerId || !performance ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 bg-[#0e0e0e] border border-white/10 rounded-lg text-center">
          <User className="w-10 h-10 text-cyan-400/80 mb-3" />
          <h3 className="text-base font-semibold text-white">No Player Selected</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-md">
            Please search for a player or choose one from the selector dropdown above to view performance analysis.
          </p>
        </div>
      ) : (
        <>
          {/* Small Sample Size Warning */}
          {!performance.is_qualified_sample && (
            <SmallSampleWarning minutes={performance.minutes_played || 0} />
          )}

          {/* 1. PLAYER IDENTITY & EVALUATION HEADER */}
          <div className="w-full bg-[#0e0e0e] border border-white/10 rounded-lg p-5 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Player Identity */}
              <div className="flex items-center gap-4 min-w-0">
                {getFlagUrl(performance.team_name) && (
                  <img
                    src={getFlagUrl(performance.team_name)}
                    alt={performance.team_name}
                    className="w-11 h-8 object-cover rounded-xs border border-white/20 shrink-0 shadow-sm"
                  />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl sm:text-[30px] font-bold tracking-tight text-white truncate">
                      {performance.player_name}
                    </h2>
                    <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border shrink-0 ${getRoleBadgeColor(performance.role)}`}>
                      {performance.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300 mt-1">
                    <span className="text-white font-medium">{performance.team_name}</span>
                    <span>·</span>
                    <span className="text-gray-400">{performance.primary_position}</span>
                    <span>·</span>
                    <span>{performance.minutes_played} Tournament Minutes</span>
                  </div>
                </div>
              </div>

              {/* Performance Score & Analysis Period (Close together) */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6 shrink-0">
                {/* Performance Score */}
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Performance Score
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-4xl sm:text-5xl font-extrabold font-mono text-cyan-400 tracking-tight">
                      {performance.performance_score !== null && performance.performance_score !== undefined
                        ? Number(performance.performance_score).toFixed(1)
                        : '-'}
                    </span>
                    <span className="text-sm text-gray-400 font-mono">/ 100</span>
                  </div>
                  <div className="text-xs text-gray-400 font-mono">
                    Tournament analytical model
                  </div>
                </div>

                {/* Analysis Period Control */}
                <div className="border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-6">
                  <div className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Analysis Period</span>
                  </div>
                  <div className="inline-flex rounded-lg border border-white/10 bg-black/60 p-1">
                    <button
                      onClick={() => setPeriod('full')}
                      className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${
                        period === 'full'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Full Tournament
                    </button>
                    <button
                      onClick={() => setPeriod('10')}
                      className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${
                        period === '10'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Last 10
                    </button>
                    <button
                      onClick={() => setPeriod('5')}
                      className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${
                        period === '5'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Last 5
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 max-w-[220px]">
                    Controls match-form window & period statistics.
                  </p>
                </div>
              </div>
            </div>

            {/* Model Disclaimer */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 text-xs sm:text-sm text-gray-400">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong className="text-gray-300">Analytical Model Notice:</strong> {performance.model_disclaimer}
              </span>
            </div>
          </div>

          {/* 2. PERIOD STATISTICS — Compact Horizontal Metric Group */}
          <div className="bg-[#0e0e0e] border border-white/10 rounded-lg p-4">
            <div className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-300 mb-2.5 flex items-center justify-between">
              <span>Selected Period — {periodLabel.toUpperCase()}</span>
              {form?.recent_form_rating !== undefined && form?.recent_form_rating !== null && (
                <span className="text-amber-400 font-mono text-sm">
                  {Number(form.recent_form_rating).toFixed(1)} Form Rating
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs sm:text-sm font-mono">
              <div className="p-2.5 rounded bg-black/40 border border-white/5">
                <div className="text-xs text-gray-400 font-sans uppercase">Matches</div>
                <div className="text-xl font-bold text-white mt-0.5">{form?.matches_evaluated || 0}</div>
              </div>
              <div className="p-2.5 rounded bg-black/40 border border-white/5">
                <div className="text-xs text-gray-400 font-sans uppercase">Minutes</div>
                <div className="text-xl font-bold text-cyan-400 mt-0.5">{form?.summary?.total_minutes || 0}&apos;</div>
              </div>
              <div className="p-2.5 rounded bg-black/40 border border-white/5">
                <div className="text-xs text-gray-400 font-sans uppercase">Goals</div>
                <div className={`text-xl font-bold mt-0.5 ${form?.summary?.goals > 0 ? 'text-amber-400' : 'text-white'}`}>
                  {form?.summary?.goals || 0}
                </div>
              </div>
              <div className="p-2.5 rounded bg-black/40 border border-white/5">
                <div className="text-xs text-gray-400 font-sans uppercase">Assists</div>
                <div className={`text-xl font-bold mt-0.5 ${form?.summary?.assists > 0 ? 'text-cyan-400' : 'text-white'}`}>
                  {form?.summary?.assists || 0}
                </div>
              </div>
              <div className="p-2.5 rounded bg-black/40 border border-white/5">
                <div className="text-xs text-gray-400 font-sans uppercase">xG</div>
                <div className="text-xl font-bold text-white mt-0.5">
                  {form?.summary?.xg !== undefined && form?.summary?.xg !== null ? Number(form.summary.xg).toFixed(2) : '0.00'}
                </div>
              </div>
              <div className="p-2.5 rounded bg-black/40 border border-white/5">
                <div className="text-xs text-gray-400 font-sans uppercase">xA</div>
                <div className="text-xl font-bold text-white mt-0.5">
                  {form?.summary?.xa !== undefined && form?.summary?.xa !== null ? Number(form.summary.xa).toFixed(2) : '0.00'}
                </div>
              </div>
              <div className="p-2.5 rounded bg-black/40 border border-white/5 col-span-2 sm:col-span-1">
                <div className="text-xs text-gray-400 font-sans uppercase">Pass %</div>
                <div className="text-xl font-bold text-cyan-400 mt-0.5">
                  {form?.summary?.pass_accuracy !== undefined && form?.summary?.pass_accuracy !== null ? `${Number(form.summary.pass_accuracy).toFixed(1)}%` : '0.0%'}
                </div>
              </div>
            </div>
          </div>

          {/* 3. FORM CHART + PERIOD SUMMARY (Medium Sized Chart: 280-320px) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left: Form Chart */}
            <div className="lg:col-span-8 bg-[#0e0e0e] border border-white/10 rounded-lg p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white tracking-wide uppercase flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      <span>Form Trajectory ({periodLabel})</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                      Match impact rating index across evaluated appearances
                    </p>
                  </div>
                  <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded">
                    {timelineData.length} Matches
                  </span>
                </div>

                {timelineData.length > 0 ? (
                  <div className="w-full h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timelineData} margin={{ top: 10, right: 15, left: -25, bottom: 15 }}>
                        <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: '#9ca3af', fontSize: 10 }}
                          interval={0}
                        />
                        <YAxis
                          domain={[40, 100]}
                          tick={{ fill: '#52525b', fontSize: 10 }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const m = payload[0].payload;
                              return (
                                <div className="bg-[#111111] border border-white/20 p-2.5 rounded shadow-xl text-xs">
                                  <div className="font-semibold text-white">{m.name}</div>
                                  <div className="text-gray-400 text-[10px] mt-0.5">{m.stage} · {m.date}</div>
                                  <div className="mt-1.5 space-y-0.5 font-mono text-[11px]">
                                    <div className="text-cyan-400">Match Impact: {m.score}</div>
                                    <div className="text-gray-300">Minutes: {m.minutes}&apos;</div>
                                    <div className="text-gray-300">Goals: {m.goals} | Assists: {m.assists}</div>
                                    <div className="text-gray-300">xG: {m.xg ? Number(m.xg).toFixed(2) : '0.00'} | xA: {m.xa ? Number(m.xa).toFixed(2) : '0.00'}</div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#06b6d4"
                          strokeWidth={2.5}
                          dot={{ fill: '#06b6d4', r: 3.5 }}
                          activeDot={{ r: 5, fill: '#38bdf8' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-gray-500">
                    No match logs available in this window.
                  </div>
                )}
              </div>

              <div className="text-[10px] text-gray-500 font-sans mt-2 pt-2 border-t border-white/5">
                Note: Rating incorporates involvement, attacking production, playmaking, and defensive contributions per 90.
              </div>
            </div>

            {/* Right: Concise Period Summary */}
            <div className="lg:col-span-4 bg-[#0e0e0e] border border-white/10 rounded-lg p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <h3 className="text-base sm:text-lg font-semibold text-white tracking-wide uppercase">
                    Period Summary
                  </h3>
                  <span className="text-sm font-mono font-bold text-amber-400">
                    {form?.recent_form_rating !== null && form?.recent_form_rating !== undefined ? Number(form.recent_form_rating).toFixed(1) : '-'} Rating
                  </span>
                </div>

                <div className="divide-y divide-white/5 font-mono text-xs sm:text-sm">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-300 font-sans text-xs sm:text-sm">Appearances</span>
                    <span className="font-semibold text-white">{form?.matches_evaluated || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-300 font-sans text-xs sm:text-sm">Total Minutes</span>
                    <span className="font-semibold text-white">{form?.summary?.total_minutes || 0}&apos;</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-300 font-sans text-xs sm:text-sm">Average Min / Match</span>
                    <span className="font-semibold text-gray-300">{form?.summary?.avg_minutes || 0}&apos;</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-300 font-sans text-xs sm:text-sm">Goals / xG</span>
                    <span className="font-semibold text-white">
                      {form?.summary?.goals || 0} <span className="text-gray-400 font-sans text-xs">({form?.summary?.xg !== undefined ? Number(form.summary.xg).toFixed(2) : '0.00'})</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-300 font-sans text-xs sm:text-sm">Assists / xA</span>
                    <span className="font-semibold text-white">
                      {form?.summary?.assists || 0} <span className="text-gray-400 font-sans text-xs">({form?.summary?.xa !== undefined ? Number(form.summary.xa).toFixed(2) : '0.00'})</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-300 font-sans text-xs sm:text-sm">Pass Accuracy</span>
                    <span className="font-semibold text-cyan-400">
                      {form?.summary?.pass_accuracy !== undefined ? `${Number(form.summary.pass_accuracy).toFixed(1)}%` : '0.0%'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-400 font-sans mt-3 pt-2.5 border-t border-white/10">
                Summary reflects the active {periodLabel} selection.
              </div>
            </div>
          </div>

          {/* 4. PERFORMANCE BREAKDOWN — Compact Horizontal Rows */}
          <div className="bg-[#0e0e0e] border border-white/10 rounded-lg p-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white tracking-wide uppercase">
                  Performance Breakdown ({performance.role} Role)
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                  Percentile distribution derived relative to qualified tournament {performance.role} peers (&ge;90 mins)
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded">
                Percentiles (0–100)
              </span>
            </div>

            <div className="space-y-2.5 font-mono text-xs sm:text-sm">
              {percentileData.map((item) => {
                const pct = item.percentile;
                let barColor = 'bg-cyan-500';
                if (pct >= 75) barColor = 'bg-emerald-500';
                else if (pct <= 25) barColor = 'bg-amber-500';

                return (
                  <div key={item.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-sans text-gray-200 text-xs sm:text-sm">{item.label}</span>
                      <span className="font-bold text-white">{pct}th %ile</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-300`}
                        style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. STRENGTHS + AREAS TO IMPROVE — Side-by-Side Compact Rows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Strengths (>= 75th percentile) */}
            <div className="bg-[#0e0e0e] border border-white/10 rounded-lg p-5">
              <div className="flex items-center gap-2 pb-3 border-b border-white/10 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base sm:text-lg font-semibold text-white tracking-wide uppercase">
                  Strengths (&ge; 75th Percentile)
                </h3>
              </div>
              {performance.strengths && performance.strengths.length > 0 ? (
                <div className="space-y-2">
                  {performance.strengths.map((s) => (
                    <div
                      key={s.metric}
                      className="flex items-center justify-between p-2.5 rounded bg-emerald-950/20 border border-emerald-500/20 text-xs sm:text-sm"
                    >
                      <span className="font-medium text-emerald-200 text-xs sm:text-sm">{s.label}</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {Number(s.percentile).toFixed(1)}th %ile
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs sm:text-sm text-gray-400 p-4 text-center font-sans">
                  No metrics currently in the &ge; 75th percentile for this role distribution.
                </div>
              )}
            </div>

            {/* Areas for Improvement (<= 25th percentile) */}
            <div className="bg-[#0e0e0e] border border-white/10 rounded-lg p-5">
              <div className="flex items-center gap-2 pb-3 border-b border-white/10 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-base sm:text-lg font-semibold text-white tracking-wide uppercase">
                  Areas to Improve (&le; 25th Percentile)
                </h3>
              </div>
              {performance.weaknesses && performance.weaknesses.length > 0 ? (
                <div className="space-y-2">
                  {performance.weaknesses.map((w) => (
                    <div
                      key={w.metric}
                      className="flex items-center justify-between p-2.5 rounded bg-amber-950/20 border border-amber-500/20 text-xs sm:text-sm"
                    >
                      <span className="font-medium text-amber-200 text-xs sm:text-sm">{w.label}</span>
                      <span className="font-mono font-bold text-amber-400">
                        {Number(w.percentile).toFixed(1)}th %ile
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs sm:text-sm text-gray-400 p-4 text-center font-sans">
                  No metrics identified in the lower quartile (&le; 25th percentile).
                </div>
              )}
            </div>
          </div>

          {/* 6. RADAR & MODEL WEIGHTS (Side-by-Side) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-7">
              <PlayerRadar
                data={getRadarData()}
                title={`${performance.player_name} — Role Benchmarking Radar`}
                isQualified={performance.is_qualified_sample}
              />
            </div>

            <div className="lg:col-span-5 bg-[#0e0e0e] border border-white/10 rounded-lg p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <h3 className="text-base sm:text-lg font-semibold text-white tracking-wide uppercase flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span>Model Weights ({performance.role})</span>
                  </h3>
                  <span className="text-xs text-gray-400">Total: 100%</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-400 mb-3">
                  Analytical importance percentages configured for the {performance.role} role scoring model.
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm font-mono">
                  {Object.entries(performance.scoring_model_weights || {}).map(([feat, w]) => (
                    <div key={feat} className="p-2.5 rounded bg-black/40 border border-white/5 flex items-center justify-between">
                      <span className="text-gray-300 font-sans text-xs sm:text-sm truncate mr-1">{feat}</span>
                      <span className="text-cyan-400 font-bold shrink-0">{w}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-xs text-gray-400 font-sans mt-3 pt-2.5 border-t border-white/10">
                Model weights adapt dynamically based on player tactical role.
              </div>
            </div>
          </div>

          {/* 7. PERIOD MATCH LOG TABLE */}
          <div className="bg-[#0e0e0e] border border-white/10 rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white tracking-wide uppercase">
                  Matches in {periodLabel}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                  Detailed match ratings and statistics evaluated for form rating ({timelineData.length} match{timelineData.length === 1 ? '' : 'es'})
                </p>
              </div>
              <span className="text-xs font-mono text-gray-400 bg-white/5 px-2.5 py-1 rounded border border-white/10">
                {timelineData.length} Matches
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-[13px] text-gray-300 font-mono">
                <thead className="bg-black/50 text-gray-400 uppercase tracking-wider text-xs font-medium border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4 font-medium">Date</th>
                    <th className="py-3 px-4 font-medium">Opponent</th>
                    <th className="py-3 px-4 font-medium">Stage</th>
                    <th className="py-3 px-3 text-right font-medium">Min</th>
                    <th className="py-3 px-3 text-right font-medium">G</th>
                    <th className="py-3 px-3 text-right font-medium">A</th>
                    <th className="py-3 px-3 text-right font-medium">xG</th>
                    <th className="py-3 px-3 text-right font-medium">xA</th>
                    <th className="py-3 px-4 text-right text-cyan-400 font-medium">Match Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {timelineData.map((m, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-sans text-gray-400">{m.date}</td>
                      <td className="py-3 px-4 font-sans text-white font-medium">
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
                      <td className="py-3 px-4 font-sans text-gray-300">{m.stage}</td>
                      <td className="py-3 px-3 text-right">{m.minutes}&apos;</td>
                      <td className={`py-3 px-3 text-right font-bold ${m.goals > 0 ? 'text-amber-400' : 'text-gray-400'}`}>{m.goals}</td>
                      <td className={`py-3 px-3 text-right font-bold ${m.assists > 0 ? 'text-cyan-400' : 'text-gray-400'}`}>{m.assists}</td>
                      <td className="py-3 px-3 text-right">{m.xg ? Number(m.xg).toFixed(2) : '0.00'}</td>
                      <td className="py-3 px-3 text-right">{m.xa ? Number(m.xa).toFixed(2) : '0.00'}</td>
                      <td className="py-3 px-4 text-right font-bold text-cyan-400">{m.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
