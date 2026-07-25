import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Trophy, Loader2, AlertCircle, Medal } from 'lucide-react';
import { simulateTournament } from '../api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getFlagUrl, getLargeFlagUrl } from '../utils/flags';

export default function Simulator() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleSimulate = async () => {
    setError('');
    setIsLoading(true);
    try {
      const data = await simulateTournament();
      setResults(data);
    } catch (err) {
      setError('Simulation failed. Ensure backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-block px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-widest mb-4">
          Monte Carlo Engine
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">Tournament Simulator</h1>
        <p className="text-slate-500 dark:text-gray-400 font-light max-w-2xl mx-auto">Run a full stochastic simulation of the 2026 World Cup bracket to predict the ultimate champion.</p>
        
        <div className="mt-10 flex justify-center">
          <Button 
            variant="primary"
            onClick={handleSimulate}
            disabled={isLoading}
            className="w-full md:w-auto px-10"
          >
            {isLoading ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Processing...</span>
            ) : (
              <span className="flex items-center gap-2"><Play className="w-4 h-4 fill-current" /> Run Full Simulation</span>
            )}
          </Button>
        </div>
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

      <AnimatePresence>
        {results && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Podium Section */}
            <Card className="flex flex-col items-center pt-12 pb-8 px-4 relative overflow-hidden border-t-2 border-t-yellow-500 shadow-md">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div>
              
              <div className="inline-flex items-center gap-3 mb-12">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Simulated Champion
                </h2>
              </div>
              
              <div className="flex items-end justify-center gap-2 sm:gap-6 w-full max-w-2xl h-80 mt-10">
                
                {/* 2nd Place */}
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: '55%', opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="w-1/3 bg-slate-100/80 dark:bg-zinc-800 rounded-t-lg flex flex-col items-center justify-start relative pt-6 border border-slate-200 dark:border-zinc-700 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]"
                >
                  <div className="absolute bottom-full mb-3 flex flex-col items-center w-full">
                    <Medal className="w-7 h-7 text-zinc-400 mb-1" />
                    {getLargeFlagUrl(results.summary.runner_up) && (
                      <img src={getLargeFlagUrl(results.summary.runner_up)} alt="" className="w-9 h-6 object-cover rounded border border-slate-300 dark:border-zinc-700 shadow-sm mb-1.5" />
                    )}
                    <span className="font-semibold text-center text-sm md:text-base text-slate-800 dark:text-zinc-300 px-2 truncate max-w-[120px]">{results.summary.runner_up}</span>
                  </div>
                  <span className="text-4xl font-black text-slate-900/30 dark:text-white/20 mt-4">2</span>
                </motion.div>

                {/* 1st Place */}
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: '75%', opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="w-1/3 bg-amber-50/70 dark:bg-gradient-to-t dark:from-yellow-900/40 dark:to-yellow-600/30 rounded-t-lg flex flex-col items-center justify-start relative pt-6 border-2 border-yellow-400/80 dark:border-yellow-500/50 shadow-[0_-4px_15px_rgba(234,179,8,0.15)] dark:shadow-[0_-10px_40px_rgba(234,179,8,0.25)] z-10"
                >
                  <div className="absolute bottom-full mb-4 flex flex-col items-center w-full">
                    <Trophy className="w-10 h-10 text-yellow-500 mb-2 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                    {getLargeFlagUrl(results.summary.winner) && (
                      <img src={getLargeFlagUrl(results.summary.winner)} alt="" className="w-10 h-7 object-cover rounded border border-yellow-400/50 shadow-sm mb-2" />
                    )}
                    <span className="font-bold text-center text-base md:text-lg text-amber-700 dark:text-yellow-400 px-1 truncate max-w-[140px]">{results.summary.winner}</span>
                  </div>
                  <span className="text-5xl font-black text-yellow-500/35 dark:text-yellow-500/30 mt-4">1</span>
                </motion.div>

                {/* Final Score Info */}
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: '40%', opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="w-1/3 bg-slate-100/80 dark:bg-zinc-800 rounded-t-lg flex flex-col items-center justify-start relative pt-6 border border-slate-200 dark:border-zinc-700 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]"
                >
                  <div className="absolute bottom-full mb-3 flex flex-col items-center w-full">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-widest mb-1">Final Score</span>
                    <span className="font-mono text-center text-lg text-slate-800 dark:text-white">{results.knockout_results.filter(m => m.round === 'Final')[0]?.home_goals} - {results.knockout_results.filter(m => m.round === 'Final')[0]?.away_goals}</span>
                  </div>
                </motion.div>

              </div>
            </Card>

            {/* Knockout Bracket */}
            <Card className="shadow-md">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-6">Knockout Stage Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.knockout_results.map((match, idx) => (
                  <div key={idx} className={`p-4 rounded-lg border ${match.round === 'Final' ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-slate-50 dark:bg-black border-slate-100 dark:border-white/5'} transition-colors hover:border-slate-200 dark:hover:border-white/10`}>
                    <div className="text-[10px] text-slate-400 dark:text-gray-500 font-semibold uppercase mb-3 flex justify-between tracking-widest">
                      <span>{match.round}</span>
                    </div>
                     <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm ${match.home_team === match.winner ? 'font-bold text-slate-900 dark:text-white' : 'font-normal text-slate-400 dark:text-gray-500'} flex items-center gap-2`}>
                        {getFlagUrl(match.home_team) && (
                          <img src={getFlagUrl(match.home_team)} alt="" className="w-4.5 h-3 object-cover rounded-sm shadow-sm" />
                        )}
                        {match.home_team}
                      </span>
                      <span className={`font-mono text-sm ${match.home_team === match.winner ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-gray-600'}`}>{match.home_goals}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${match.away_team === match.winner ? 'font-bold text-slate-900 dark:text-white' : 'font-normal text-slate-400 dark:text-gray-500'} flex items-center gap-2`}>
                        {getFlagUrl(match.away_team) && (
                          <img src={getFlagUrl(match.away_team)} alt="" className="w-4.5 h-3 object-cover rounded-sm shadow-sm" />
                        )}
                        {match.away_team}
                      </span>
                      <span className={`font-mono text-sm ${match.away_team === match.winner ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-gray-600'}`}>{match.away_goals}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Group Stages */}
            <Card className="shadow-md">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-6">Group Stage Results</h3>
              <div className="space-y-10">
                {[...new Set(results.group_tables.map(t => t.group))].sort().map(group => (
                  <div key={group} className="space-y-4">
                    <h4 className="font-bold text-slate-900 dark:text-white text-lg border-b border-slate-100 dark:border-white/10 pb-2">Group {group}</h4>
                    
                    {/* Matches */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                      {results.group_matches.filter(m => m.group === group).map((match, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-white/5 p-3 rounded-lg flex justify-between text-sm items-center">
                          <span className="text-slate-700 dark:text-gray-300 w-[40%] text-right flex items-center justify-end gap-1.5">
                            {match.home_team}
                            {getFlagUrl(match.home_team) && (
                              <img src={getFlagUrl(match.home_team)} alt="" className="w-4 h-2.5 object-cover rounded-sm shadow-sm" />
                            )}
                          </span>
                          <span className="text-slate-900 dark:text-white font-mono font-bold px-2 text-center whitespace-nowrap">{match.home_goals} - {match.away_goals}</span>
                          <span className="text-slate-700 dark:text-gray-300 w-[40%] flex items-center justify-start gap-1.5">
                            {getFlagUrl(match.away_team) && (
                              <img src={getFlagUrl(match.away_team)} alt="" className="w-4 h-2.5 object-cover rounded-sm shadow-sm" />
                            )}
                            {match.away_team}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-700 dark:text-gray-300">
                        <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-gray-400 uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Rank</th>
                            <th className="px-3 py-2 font-semibold">Team</th>
                            <th className="px-3 py-2 font-semibold text-center">P</th>
                            <th className="px-3 py-2 font-semibold text-center">W</th>
                            <th className="px-3 py-2 font-semibold text-center">D</th>
                            <th className="px-3 py-2 font-semibold text-center">L</th>
                            <th className="px-3 py-2 font-semibold text-center">GF</th>
                            <th className="px-3 py-2 font-semibold text-center">GA</th>
                            <th className="px-3 py-2 font-semibold text-center">GD</th>
                            <th className="px-3 py-2 font-semibold text-center">Pts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                          {results.group_tables.filter(t => t.group === group).sort((a,b) => a.group_rank - b.group_rank).map((team) => (
                            <tr key={team.team} className={`${team.group_rank <= 2 ? 'bg-green-50 dark:bg-green-900/20' : team.group_rank === 3 ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''} hover:bg-slate-50 dark:hover:bg-white/5 transition-colors`}>
                              <td className="px-3 py-2 text-center font-mono text-slate-400 dark:text-gray-400">{team.group_rank}</td>
                              <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">
                                <div className="flex items-center gap-2">
                                  {getFlagUrl(team.team) && (
                                    <img src={getFlagUrl(team.team)} alt="" className="w-4.5 h-3 object-cover rounded-sm shadow-sm" />
                                  )}
                                  {team.team}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-center font-mono">{team.played}</td>
                              <td className="px-3 py-2 text-center font-mono">{team.wins}</td>
                              <td className="px-3 py-2 text-center font-mono">{team.draws}</td>
                              <td className="px-3 py-2 text-center font-mono">{team.losses}</td>
                              <td className="px-3 py-2 text-center font-mono">{team.goals_for}</td>
                              <td className="px-3 py-2 text-center font-mono">{team.goals_against}</td>
                              <td className="px-3 py-2 text-center font-mono">{team.goal_difference}</td>
                              <td className="px-3 py-2 text-center font-mono font-bold text-slate-900 dark:text-white">{team.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
