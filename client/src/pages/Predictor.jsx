import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Search, Loader2, AlertCircle, Shield } from 'lucide-react';
import { getTeams, predictMatch } from '../api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getFlagUrl, getLargeFlagUrl } from '../utils/flags';

const COLORS = ['#3b82f6', '#71717a', '#06b6d4']; // Blue, Gray, Cyan

export default function Predictor() {
  const [teams, setTeams] = useState([]);
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await getTeams();
        setTeams(data.teams);
        if (data.teams.length > 1) {
          setHomeTeam(data.teams[0].name);
          setAwayTeam(data.teams[1].name);
        }
      } catch (err) {
        setError('Failed to load teams. Ensure backend is running.');
      }
    };
    fetchTeams();
  }, []);

  const handlePredict = async () => {
    if (homeTeam === awayTeam) {
      setError('Please select two different teams.');
      return;
    }
    setError('');
    setIsLoading(true);
    setPrediction(null);
    try {
      const data = await predictMatch(homeTeam, awayTeam);
      setPrediction(data);
    } catch (err) {
      setError('Failed to fetch prediction. Ensure backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const getTeamInfo = (teamName) => teams.find(t => t.name === teamName);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-block px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-widest mb-4">
          Match Predictor AI
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">Head-to-Head Analysis</h1>
        <p className="text-slate-500 dark:text-gray-400 font-light">Select two teams to run the Elo & Poisson prediction models</p>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3 mb-8"
          >
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="mb-12 border-t-2 border-t-blue-500 shadow-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-2">
          
          {/* Home Team */}
          <div className="flex-1 w-full flex flex-col items-center">
            <div className="w-16 h-11 overflow-hidden rounded border border-slate-200 dark:border-white/10 flex items-center justify-center mb-4 shadow-sm bg-blue-500/5">
              {getLargeFlagUrl(homeTeam) ? (
                <img src={getLargeFlagUrl(homeTeam)} alt={homeTeam} className="w-full h-full object-cover" />
              ) : (
                <Shield className="w-8 h-8 text-blue-600 dark:text-blue-505" />
              )}
            </div>
            <label className="text-xs text-slate-400 dark:text-gray-500 mb-2 font-semibold tracking-widest uppercase">Home Team</label>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 w-4 h-4" />
              <select 
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
              >
                {teams.map(t => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
            {getTeamInfo(homeTeam) && (
              <div className="mt-3 flex gap-3 text-xs text-slate-500 dark:text-gray-500 font-medium">
                <span className="bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/5">Elo {Math.round(getTeamInfo(homeTeam).elo)}</span>
                <span className="bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/5">Rank #{getTeamInfo(homeTeam).fifa_rank}</span>
              </div>
            )}
          </div>

          {/* VS Badge */}
          <div className="flex-shrink-0 relative hidden md:block">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 flex items-center justify-center font-bold text-slate-500 dark:text-gray-400 text-sm z-10 shadow-sm">
              VS
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250%] h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent -z-10"></div>
          </div>

          {/* Away Team */}
          <div className="flex-1 w-full flex flex-col items-center">
            <div className="w-16 h-11 overflow-hidden rounded border border-slate-200 dark:border-white/10 flex items-center justify-center mb-4 shadow-sm bg-cyan-500/5">
              {getLargeFlagUrl(awayTeam) ? (
                <img src={getLargeFlagUrl(awayTeam)} alt={awayTeam} className="w-full h-full object-cover" />
              ) : (
                <Shield className="w-8 h-8 text-cyan-600 dark:text-cyan-500" />
              )}
            </div>
            <label className="text-xs text-slate-400 dark:text-gray-500 mb-2 font-semibold tracking-widest uppercase">Away Team</label>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 w-4 h-4" />
              <select 
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors appearance-none cursor-pointer"
              >
                {teams.map(t => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
            {getTeamInfo(awayTeam) && (
              <div className="mt-3 flex gap-3 text-xs text-slate-500 dark:text-gray-500 font-medium">
                <span className="bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/5">Elo {Math.round(getTeamInfo(awayTeam).elo)}</span>
                <span className="bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/5">Rank #{getTeamInfo(awayTeam).fifa_rank}</span>
              </div>
            )}
          </div>

        </div>

        <div className="mt-10 flex justify-center">
          <Button 
            variant="primary"
            onClick={handlePredict}
            disabled={isLoading || teams.length === 0}
            className="w-full md:w-auto md:px-16"
          >
            {isLoading ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</span>
            ) : (
              'Generate Prediction'
            )}
          </Button>
        </div>
      </Card>

      <AnimatePresence>
        {prediction && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Probabilities Card */}
            <Card className="lg:col-span-2 shadow-md">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-6">Outcome Probability</h3>
              
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-48 h-48 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: `${prediction.home_team} Win`, value: prediction.home_win_prob },
                          { name: 'Draw', value: prediction.draw_prob },
                          { name: `${prediction.away_team} Win`, value: prediction.away_win_prob }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value) => `${(value * 100).toFixed(1)}%`}
                        contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-color)', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--color-text-main)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 w-full space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        {getFlagUrl(prediction.home_team) && (
                          <img src={getFlagUrl(prediction.home_team)} alt="" className="w-5 h-3.5 object-cover rounded shadow-sm" />
                        )}
                        {prediction.home_team}
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 font-mono">{(prediction.home_win_prob * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${prediction.home_win_prob * 100}%` }} 
                        className="bg-blue-600 h-full rounded-full"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-slate-500 dark:text-gray-400">Draw</span>
                      <span className="text-slate-500 dark:text-gray-400 font-mono">{(prediction.draw_prob * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${prediction.draw_prob * 100}%` }} 
                        className="bg-slate-400 dark:bg-zinc-500 h-full rounded-full"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        {getFlagUrl(prediction.away_team) && (
                          <img src={getFlagUrl(prediction.away_team)} alt="" className="w-5 h-3.5 object-cover rounded shadow-sm" />
                        )}
                        {prediction.away_team}
                      </span>
                      <span className="text-cyan-600 dark:text-cyan-400 font-mono">{(prediction.away_win_prob * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${prediction.away_win_prob * 100}%` }} 
                        className="bg-cyan-500 h-full rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-white/10 pt-6">
                <div className="flex flex-col items-center justify-center p-4">
                  <p className="text-slate-400 dark:text-gray-505 text-xs font-semibold uppercase tracking-wider mb-2">Expected Goals (xG)</p>
                  <p className="text-3xl font-light text-blue-600 dark:text-blue-400">{prediction.home_xg.toFixed(2)}</p>
                  <div className="text-xs text-slate-400 dark:text-gray-600 mt-1 flex items-center gap-1.5 justify-center">
                    {getFlagUrl(prediction.home_team) && (
                      <img src={getFlagUrl(prediction.home_team)} alt="" className="w-4.5 h-3 object-cover rounded shadow-sm" />
                    )}
                    {prediction.home_team}
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center p-4 border-l border-slate-200 dark:border-white/5">
                  <p className="text-slate-400 dark:text-gray-505 text-xs font-semibold uppercase tracking-wider mb-2">Expected Goals (xG)</p>
                  <p className="text-3xl font-light text-cyan-600 dark:text-cyan-400">{prediction.away_xg.toFixed(2)}</p>
                  <div className="text-xs text-slate-400 dark:text-gray-600 mt-1 flex items-center gap-1.5 justify-center">
                    {getFlagUrl(prediction.away_team) && (
                      <img src={getFlagUrl(prediction.away_team)} alt="" className="w-4.5 h-3 object-cover rounded shadow-sm" />
                    )}
                    {prediction.away_team}
                  </div>
                </div>
              </div>
            </Card>

            {/* Scorelines Card */}
            <Card className="shadow-md">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-6">Most Likely Scores</h3>
              <div className="space-y-2">
                {prediction.score_probs.map((score, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={idx} 
                    className="flex items-center justify-between p-3 rounded-md hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-base font-mono text-slate-900 dark:text-white">
                        {score.home_goals} - {score.away_goals}
                      </span>
                    </div>
                    <div className="text-slate-500 dark:text-gray-400 font-mono text-sm">
                      {(score.probability * 100).toFixed(1)}%
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Team Context Card */}
            <Card className="lg:col-span-3 shadow-md">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-6">Team context</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700 dark:text-gray-300">
                  <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-gray-400 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 font-semibold rounded-tl-lg">team</th>
                      <th className="px-4 py-3 font-semibold">elo</th>
                      <th className="px-4 py-3 font-semibold">fifa_rank</th>
                      <th className="px-4 py-3 font-semibold">rank_change</th>
                      <th className="px-4 py-3 font-semibold">form_score</th>
                      <th className="px-4 py-3 font-semibold rounded-tr-lg">h2h_score_vs_opponent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                    <tr className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          {getFlagUrl(prediction.home_team) && (
                            <img src={getFlagUrl(prediction.home_team)} alt="" className="w-5 h-3.5 object-cover rounded shadow-sm" />
                          )}
                          {prediction.home_team}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono">{getTeamInfo(prediction.home_team).elo.toFixed(4)}</td>
                      <td className="px-4 py-4 font-mono">{getTeamInfo(prediction.home_team).fifa_rank}</td>
                      <td className="px-4 py-4 font-mono">{getTeamInfo(prediction.home_team).rank_change}</td>
                      <td className="px-4 py-4 font-mono">{getTeamInfo(prediction.home_team).form_score}</td>
                      <td className="px-4 py-4 font-mono">{prediction.h2h_home}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          {getFlagUrl(prediction.away_team) && (
                            <img src={getFlagUrl(prediction.away_team)} alt="" className="w-5 h-3.5 object-cover rounded shadow-sm" />
                          )}
                          {prediction.away_team}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono">{getTeamInfo(prediction.away_team).elo.toFixed(4)}</td>
                      <td className="px-4 py-4 font-mono">{getTeamInfo(prediction.away_team).fifa_rank}</td>
                      <td className="px-4 py-4 font-mono">{getTeamInfo(prediction.away_team).rank_change}</td>
                      <td className="px-4 py-4 font-mono">{getTeamInfo(prediction.away_team).form_score}</td>
                      <td className="px-4 py-4 font-mono">{prediction.h2h_away}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
