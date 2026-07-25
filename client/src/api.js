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
