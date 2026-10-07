import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Predictor from './pages/Predictor';
import Simulator from './pages/Simulator';
import Analytics from './pages/Analytics';
import PlayerAnalytics from './pages/PlayerAnalytics';
import PlayerPerformance from './pages/PlayerPerformance';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/predictor" element={<Predictor />} />
        <Route path="/simulator" element={<Simulator />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/player-analytics" element={<PlayerAnalytics />} />
        <Route path="/player-performance" element={<PlayerPerformance />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen selection:bg-cyan-500/30">
        <Navbar />
        <main className="flex-grow pt-20 pb-12 px-4 sm:px-8 lg:px-12 max-w-[1440px] mx-auto w-full">
          <AnimatedRoutes />
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
