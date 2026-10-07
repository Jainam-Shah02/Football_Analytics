import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronDown, Check, Loader2, X } from 'lucide-react';
import { getPlayers, getPlayerFilters, getPlayerProfile } from '../../api';
import { getFlagUrl } from '../../utils/flags';

export default function PlayerSelector({ selectedPlayerId, onSelectPlayer, defaultRole = '' }) {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState(defaultRole);
  const [team, setTeam] = useState('');
  const [players, setPlayers] = useState([]);
  const [filterData, setFilterData] = useState({
    teams: [],
    roles: ['FW', 'MF', 'DF', 'GK'],
    competition: { name: 'FIFA World Cup', season: '2022' },
    total_players: 680
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Load filter metadata once
  useEffect(() => {
    let isMounted = true;
    getPlayerFilters()
      .then((data) => {
        if (isMounted && data) {
          setFilterData(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load player filters:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch players whenever search query, role filter, or team filter changes
  useEffect(() => {
    let isMounted = true;
    const fetchList = async () => {
      setIsLoading(true);
      try {
        const params = {
          limit: 40,
          search: query.trim() || undefined,
          role: role || undefined,
          team: team || undefined,
          sort_by: 'performance_score',
          order: 'desc'
        };
        const res = await getPlayers(params);
        if (isMounted) {
          setPlayers(res.players || []);
        }
      } catch (err) {
        console.error('Failed to load players:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchList, query ? 250 : 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query, role, team]);

  // Sync selected player details when selectedPlayerId changes
  useEffect(() => {
    let isMounted = true;
    if (!selectedPlayerId) {
      setSelectedPlayer(null);
      return;
    }

    // Check if player is in currently loaded list
    const found = players.find((p) => p.player_id === selectedPlayerId);
    if (found) {
      setSelectedPlayer(found);
      return;
    }

    // If not found in current list and we don't already have this player, fetch profile
    if (!selectedPlayer || selectedPlayer.player_id !== selectedPlayerId) {
      getPlayerProfile(selectedPlayerId)
        .then((prof) => {
          if (isMounted && prof) {
            setSelectedPlayer({
              player_id: prof.player_id,
              player_name: prof.player_name,
              team_name: prof.team_name,
              role: prof.role,
              primary_position: prof.primary_position,
              minutes_played: prof.minutes_played,
              performance_score: prof.performance_score
            });
          }
        })
        .catch((err) => {
          console.error('Failed to fetch player profile for selector:', err);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [selectedPlayerId, players]);

  // Handle Role Filter change
  const handleRoleChange = (newRole) => {
    setRole(newRole);
    // If a player is selected and does NOT match the new role filter, clear selection
    if (selectedPlayer && newRole && selectedPlayer.role?.toUpperCase() !== newRole.toUpperCase()) {
      setSelectedPlayer(null);
      if (onSelectPlayer) onSelectPlayer(null);
      setIsOpen(true);
    }
  };

  // Handle Team Filter change
  const handleTeamChange = (newTeam) => {
    setTeam(newTeam);
    // If a player is selected and does NOT match the new team filter, clear selection
    if (selectedPlayer && newTeam && selectedPlayer.team_name?.toLowerCase() !== newTeam.toLowerCase()) {
      setSelectedPlayer(null);
      if (onSelectPlayer) onSelectPlayer(null);
      setIsOpen(true);
    }
  };

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (p) => {
    setSelectedPlayer(p);
    setIsOpen(false);
    if (onSelectPlayer) {
      onSelectPlayer(p);
    }
  };

  const handleClearSelection = (e) => {
    e.stopPropagation();
    setSelectedPlayer(null);
    if (onSelectPlayer) onSelectPlayer(null);
    setIsOpen(true);
  };

  const getRoleBadgeColor = (r) => {
    switch (r) {
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

  // Dynamic placeholder text reflecting active filters
  const getPlaceholderText = () => {
    if (team && role) return `Select a ${role} from ${team}...`;
    if (team) return `Select player from ${team}...`;
    if (role) return `Select a ${role} player...`;
    return 'Search player by name (e.g. Messi, Modric)...';
  };

  return (
    <div className="w-full bg-[#0e0e0e] border border-white/10 rounded-lg p-3.5 sm:p-4 text-white">
      {/* 5-Column Compact Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-end" ref={dropdownRef}>
        {/* 1. Player Selector Input (4 cols on desktop) */}
        <div className="sm:col-span-2 md:col-span-4 relative">
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
            Player Selection
          </label>
          <div
            onClick={() => {
              setIsOpen(true);
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            className={`w-full h-11 flex items-center justify-between px-3 bg-black/60 border rounded-md cursor-pointer transition-colors ${
              selectedPlayer
                ? 'border-white/15 hover:border-cyan-500/50'
                : 'border-cyan-500/40 bg-cyan-950/10'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {selectedPlayer ? (
                <>
                  {getFlagUrl(selectedPlayer.team_name) && (
                    <img
                      src={getFlagUrl(selectedPlayer.team_name)}
                      alt={selectedPlayer.team_name}
                      className="w-4.5 h-3 object-cover rounded-xs border border-white/20 shrink-0"
                    />
                  )}
                  <span className="font-semibold text-white truncate text-xs sm:text-sm">
                    {selectedPlayer.player_name}
                  </span>
                  <span className={`text-xs font-mono px-1 py-0.2 rounded border shrink-0 ${getRoleBadgeColor(selectedPlayer.role)}`}>
                    {selectedPlayer.role}
                  </span>
                </>
              ) : (
                <span className="text-gray-400 text-xs sm:text-sm truncate">
                  {getPlaceholderText()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-gray-400 shrink-0">
              {selectedPlayer && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="hover:text-white p-0.5"
                  title="Clear selection"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-[#141414] border border-white/15 rounded-md shadow-2xl z-50 overflow-hidden max-h-96 flex flex-col">
              <div className="p-2 border-b border-white/10 bg-black/50 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-gray-400 ml-1" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type player name..."
                  className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none py-1"
                />
                {isLoading && <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin mr-1" />}
              </div>

              {/* Player Results List */}
              <div className="overflow-y-auto max-h-72 divide-y divide-white/5">
                {players.length === 0 ? (
                  <div className="p-3 text-center text-xs text-gray-400 font-sans">
                    {isLoading ? 'Searching...' : 'No players matching criteria'}
                  </div>
                ) : (
                  players.map((p) => {
                    const isSelected = selectedPlayer?.player_id === p.player_id;
                    return (
                      <div
                        key={p.player_id}
                        onClick={() => handleSelect(p)}
                        className={`px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors ${
                          isSelected ? 'bg-cyan-500/15' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {getFlagUrl(p.team_name) && (
                            <img
                              src={getFlagUrl(p.team_name)}
                              alt={p.team_name}
                              className="w-4 h-3 object-cover rounded-xs border border-white/20 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-medium text-white truncate flex items-center gap-1.5">
                              <span>{p.player_name}</span>
                              <span className={`text-[10px] font-mono px-1 rounded border ${getRoleBadgeColor(p.role)}`}>
                                {p.role}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                              {p.team_name} · {p.primary_position} · {p.minutes_played}&apos;
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <div className="text-right">
                            <div className="text-xs sm:text-sm font-semibold font-mono text-cyan-400">
                              {p.performance_score ? Number(p.performance_score).toFixed(1) : '-'}
                            </div>
                            <div className="text-[10px] text-gray-400">Score</div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. Competition Metadata (2 cols on desktop) */}
        <div className="sm:col-span-1 md:col-span-2">
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
            Competition
          </label>
          <div className="w-full h-11 flex items-center px-3 bg-black/40 border border-white/10 rounded-md text-xs sm:text-sm text-gray-200 font-medium truncate">
            {filterData.competition?.name || 'FIFA World Cup'}
          </div>
        </div>

        {/* 3. Season Metadata (1 col on desktop) */}
        <div className="sm:col-span-1 md:col-span-1">
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
            Season
          </label>
          <div className="w-full h-11 flex items-center justify-center px-2 bg-black/40 border border-white/10 rounded-md text-xs sm:text-sm text-gray-200 font-mono font-medium">
            {filterData.competition?.season || '2022'}
          </div>
        </div>

        {/* 4. Position Role Filter (2 cols on desktop) */}
        <div className="sm:col-span-1 md:col-span-2">
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="w-full h-11 px-2.5 bg-black/60 border border-white/15 rounded-md text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500/50"
          >
            <option value="">All Roles</option>
            <option value="FW">Forwards (FW)</option>
            <option value="MF">Midfielders (MF)</option>
            <option value="DF">Defenders (DF)</option>
            <option value="GK">Goalkeepers (GK)</option>
          </select>
        </div>

        {/* 5. National Team Filter (3 cols on desktop) */}
        <div className="sm:col-span-1 md:col-span-3">
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
            National Team
          </label>
          <select
            value={team}
            onChange={(e) => handleTeamChange(e.target.value)}
            className="w-full h-11 px-2.5 bg-black/60 border border-white/15 rounded-md text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500/50"
          >
            <option value="">All 32 Teams</option>
            {filterData.teams?.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
