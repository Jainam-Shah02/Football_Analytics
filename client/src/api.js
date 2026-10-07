import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000'
});

export const getTeams = async () => {
  const response = await API.get('/api/teams');
  return response.data;
};

export const predictMatch = async (homeTeam, awayTeam) => {
  const response = await API.post('/api/predict', { home_team: homeTeam, away_team: awayTeam });
  return response.data;
};

export const simulateTournament = async () => {
  const response = await API.post('/api/simulate');
  return response.data;
};

export const getProbabilities = async () => {
  const response = await API.get('/api/probabilities');
  return response.data;
};

// Player Analytics & Performance APIs
export const getPlayers = async (params = {}) => {
  const response = await API.get('/api/players', { params });
  return response.data;
};

export const getPlayerProfile = async (playerId) => {
  const response = await API.get(`/api/player/${playerId}`);
  return response.data;
};

export const getPlayerMatches = async (playerId) => {
  const response = await API.get(`/api/player/${playerId}/matches`);
  return response.data;
};

export const getPlayerPerformance = async (playerId) => {
  const response = await API.get(`/api/player/${playerId}/performance`);
  return response.data;
};

export const getPlayerForm = async (playerId, limit = 5) => {
  const response = await API.get(`/api/player/${playerId}/form`, { params: { limit } });
  return response.data;
};

export const getPlayerFilters = async () => {
  const response = await API.get('/api/player-filters');
  return response.data;
};
