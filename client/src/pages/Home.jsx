import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Trophy, BarChart2, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] text-center px-4 relative overflow-hidden">
      
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-600/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl mx-auto z-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          v2.0 Model Live
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-slate-900 dark:text-white leading-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400">
            AI-Powered
          </span>{" "}
          Football Analytics Platform
        </h1>

        <p className="text-lg md:text-xl text-slate-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          Predict football matches using Elo Rating, Poisson Regression and Monte Carlo Simulation. 
          Analyze players. Scout talent. Generate AI insights.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-20">
          <Link to="/predictor">
            <Button variant="primary" className="h-12 px-8">
              Predict Match <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl z-10 mx-auto">
        <Link to="/predictor">
          <Card hover className="flex flex-col h-full text-left group">
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 w-fit mb-4 group-hover:bg-blue-500/20 transition-colors">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Match Predictor</h3>
            <p className="text-sm text-slate-500 dark:text-gray-500 flex-grow">Head-to-head predictions with expected goals and probability distributions.</p>
          </Card>
        </Link>
        
        <Link to="/simulator">
          <Card hover className="flex flex-col h-full text-left group">
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit mb-4 group-hover:bg-emerald-500/20 transition-colors">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Tournament Simulator</h3>
            <p className="text-sm text-slate-500 dark:text-gray-500 flex-grow">Run a live Monte Carlo simulation of the entire tournament.</p>
          </Card>
        </Link>

        <Link to="/analytics">
          <Card hover className="flex flex-col h-full text-left group">
            <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 w-fit mb-4 group-hover:bg-cyan-500/20 transition-colors">
              <BarChart2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Analytics</h3>
            <p className="text-sm text-slate-500 dark:text-gray-500 flex-grow">Explore precomputed stage probabilities and deep historical statistics.</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
