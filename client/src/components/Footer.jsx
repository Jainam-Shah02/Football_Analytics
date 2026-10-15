import { BarChart2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black mt-auto">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-center md:text-left">
            <BarChart2 className="w-5 h-5 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-300 tracking-wide">
              ScoutX AI
            </h3>
          </div>
          
          <div className="flex items-center gap-6">
            <span className="text-gray-500 text-sm">v2.0.0</span>
          </div>
        </div>
        <div className="mt-8 border-t border-white/5 pt-8 text-center md:text-left flex flex-col md:flex-row justify-between">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} Aditya Singh. All rights reserved.
          </p>
          <p className="text-xs text-gray-600 mt-2 md:mt-0">
            Powered by AI, Elo Rating & Monte Carlo Simulation
          </p>
        </div>
      </div>
    </footer>
  );
}
