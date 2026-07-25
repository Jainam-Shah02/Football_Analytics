import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, AlertCircle, BarChart2, TrendingUp, Award } from 'lucide-react';
import { getProbabilities } from '../api';
import Card from '../components/ui/Card';
import { getFlagUrl } from '../utils/flags';

export default function Analytics() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [topN, setTopN] = useState(15);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const probs = await getProbabilities();
        const sorted = probs.sort((a, b) => b.winner_prob - a.winner_prob);
        setData(sorted);
      } catch (err) {
        setError('Failed to load analytics data. Ensure backend is running.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const getBarColor = (index) => {
    if (index < 1) return '#eab308'; // Gold for 1st
    if (index < 4) return '#3b82f6'; // Blue for top 4
    if (index < 10) return '#06b6d4'; // Cyan for next
    return '#64748b'; // Slate/Zinc for rest
  };

  const chartData = data.slice(0, topN).map((item, index) => ({
    name: item.team,
    probability: Number((item.winner_prob * 100).toFixed(1)),
    fill: getBarColor(index)
  }));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-cyan-600 dark:text-cyan-500 animate-spin mb-4" />
        <p className="text-slate-500 dark:text-gray-400 font-light">Compiling analytics...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="inline-block px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-4">
          Global Statistics
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">Analytics Dashboard</h1>
        <p className="text-slate-500 dark:text-gray-400 font-light max-w-3xl">Aggregate statistics from 10,000+ Monte Carlo simulations mapped alongside Elo ratings and confederation data.</p>
      </motion.div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3 mb-8">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {data.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="flex flex-col border-t-2 border-t-yellow-500 shadow-md">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs text-slate-400 dark:text-gray-400 uppercase tracking-widest font-semibold">Tournament Favorite</span>
                <TrophyIcon className="w-5 h-5 text-yellow-500" />
              </div>
              <span className="text-3xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                {getFlagUrl(data[0].team) && (
                  <img src={getFlagUrl(data[0].team)} alt="" className="w-6 h-4.5 object-cover rounded shadow-sm" />
                )}
                {data[0].team}
              </span>
              <span className="text-sm text-yellow-600 dark:text-yellow-555 font-mono">{(data[0].winner_prob * 100).toFixed(1)}% Win Prob</span>
            </Card>

            <Card className="flex flex-col border-t-2 border-t-blue-500 shadow-md">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs text-slate-400 dark:text-gray-400 uppercase tracking-widest font-semibold">Highest Rated Team</span>
                <Award className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-3xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                {getFlagUrl(data.sort((a,b) => b.elo - a.elo)[0].team) && (
                  <img src={getFlagUrl(data.sort((a,b) => b.elo - a.elo)[0].team)} alt="" className="w-6 h-4.5 object-cover rounded shadow-sm" />
                )}
                {data.sort((a,b) => b.elo - a.elo)[0].team}
              </span>
              <span className="text-sm text-blue-600 dark:text-blue-405 font-mono">{Math.round(data.sort((a,b) => b.elo - a.elo)[0].elo)} Elo Rating</span>
            </Card>

            <Card className="flex flex-col border-t-2 border-t-cyan-500 shadow-md">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs text-slate-400 dark:text-gray-400 uppercase tracking-widest font-semibold">Most Likely Finalist</span>
                <TrendingUp className="w-5 h-5 text-cyan-500" />
              </div>
              <span className="text-3xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                {getFlagUrl(data.sort((a,b) => b.final_prob - a.final_prob)[0].team) && (
                  <img src={getFlagUrl(data.sort((a,b) => b.final_prob - a.final_prob)[0].team)} alt="" className="w-6 h-4.5 object-cover rounded shadow-sm" />
                )}
                {data.sort((a,b) => b.final_prob - a.final_prob)[0].team}
              </span>
              <span className="text-sm text-cyan-600 dark:text-cyan-405 font-mono">{(data.sort((a,b) => b.final_prob - a.final_prob)[0].final_prob * 100).toFixed(1)}% Final Prob</span>
            </Card>
          </div>

          {/* Win Probability Chart */}
          <Card className="shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div className="flex items-center gap-3">
                <BarChart2 className="w-6 h-6 text-slate-400 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Championship Distribution</h3>
              </div>
              <select 
                value={topN}
                onChange={(e) => setTopN(Number(e.target.value))}
                className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-lg py-2 px-4 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
              >
                <option value={10}>Top 10 Teams</option>
                <option value={15}>Top 15 Teams</option>
                <option value={32}>Top 32 Teams</option>
                <option value={48}>All Teams</option>
              </select>
            </div>
            
            <div className="h-[400px] w-full text-slate-500 dark:text-gray-400">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-white/5" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="currentColor" 
                    className="text-slate-400 dark:text-slate-600"
                    angle={-45} 
                    textAnchor="end"
                    tick={{ fill: 'currentColor', fontSize: 11 }}
                    interval={0}
                    axisLine={{ stroke: 'currentColor' }}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="currentColor" 
                    className="text-slate-400 dark:text-slate-600"
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fill: 'currentColor', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip 
                    cursor={{ fill: 'var(--color-surface-hover)' }}
                    contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-color)', borderRadius: '8px', color: 'var(--color-text-main)' }}
                    formatter={(value) => [`${value}%`, 'Win Probability']}
                    itemStyle={{ color: '#2563eb' }}
                  />
                  <Bar dataKey="probability" radius={[4, 4, 0, 0]} maxBarSize={60}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Probability Table */}
          <Card className="overflow-hidden p-0 shadow-md">
            <div className="p-6 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Full Stage Probabilities</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap text-slate-700 dark:text-gray-300">
                <thead className="bg-slate-50 dark:bg-black/50 text-slate-500 dark:text-gray-400 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Team</th>
                    <th className="px-6 py-4 font-semibold">Confed</th>
                    <th className="px-6 py-4 font-semibold text-right">FIFA Rank</th>
                    <th className="px-6 py-4 font-semibold text-right">Elo</th>
                    <th className="px-6 py-4 font-semibold text-right">R32 %</th>
                    <th className="px-6 py-4 font-semibold text-right">R16 %</th>
                    <th className="px-6 py-4 font-semibold text-right">QF %</th>
                    <th className="px-6 py-4 font-semibold text-right">SF %</th>
                    <th className="px-6 py-4 font-semibold text-right">Final %</th>
                    <th className="px-6 py-4 font-semibold text-right text-blue-600 dark:text-cyan-400">Winner %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-white">
                        <div className="flex items-center gap-2">
                          {getFlagUrl(row.team) && (
                            <img src={getFlagUrl(row.team)} alt="" className="w-5 h-3.5 object-cover rounded-sm shadow-sm" />
                          )}
                          {row.team}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-505 dark:text-gray-505">{row.confederation}</td>
                      <td className="px-6 py-4 text-right text-slate-500 dark:text-gray-400 font-mono">{row.fifa_rank}</td>
                      <td className="px-6 py-4 text-right text-slate-500 dark:text-gray-400 font-mono">{Math.round(row.elo)}</td>
                      <td className="px-6 py-4 text-right text-slate-400 dark:text-gray-500 font-mono">{(row.r32_prob * 100).toFixed(1)}</td>
                      <td className="px-6 py-4 text-right text-slate-400 dark:text-gray-500 font-mono">{(row.r16_prob * 100).toFixed(1)}</td>
                      <td className="px-6 py-4 text-right text-slate-400 dark:text-gray-500 font-mono">{(row.qf_prob * 100).toFixed(1)}</td>
                      <td className="px-6 py-4 text-right text-slate-400 dark:text-gray-505 font-mono">{(row.sf_prob * 100).toFixed(1)}</td>
                      <td className="px-6 py-4 text-right text-slate-500 dark:text-gray-400 font-mono">{(row.final_prob * 100).toFixed(1)}</td>
                      <td className="px-6 py-4 text-right font-bold text-blue-600 dark:text-cyan-500 font-mono bg-blue-50/50 dark:bg-cyan-500/5 group-hover:bg-transparent transition-colors">{(row.winner_prob * 100).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function TrophyIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7c0 3.31 2.69 6 6 6s6-2.69 6-6V2Z" />
    </svg>
  );
}
