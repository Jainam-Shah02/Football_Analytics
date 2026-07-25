const countryCodes = {
  'Spain': 'es',
  'Argentina': 'ar',
  'France': 'fr',
  'England': 'gb-eng',
  'Brazil': 'br',
  'Colombia': 'co',
  'Netherlands': 'nl',
  'Germany': 'de',
  'Ecuador': 'ec',
  'Portugal': 'pt',
  'Croatia': 'hr',
  'Morocco': 'ma',
  'Uruguay': 'uy',
  'Norway': 'no',
  'Japan': 'jp',
  'Mexico': 'mx',
  'Turkey': 'tr',
  'Switzerland': 'ch',
  'Canada': 'ca',
  'Paraguay': 'py',
  'South Korea': 'kr',
  'Senegal': 'sn',
  'United States': 'us',
  'Belgium': 'be',
  'Australia': 'au',
  'Panama': 'pa',
  'Algeria': 'dz',
  'Austria': 'at',
  'Jordan': 'jo',
  'New Zealand': 'nz',
  'Iran': 'ir',
  'Scotland': 'gb-sct',
  'DR Congo': 'cd',
  'Bosnia and Herzegovina': 'ba',
  'Cape Verde': 'cv',
  'Tunisia': 'tn',
  'Curaçao': 'cw',
  'Sweden': 'se',
  'Czech Republic': 'cz',
  'Egypt': 'eg',
  'South Africa': 'za',
  'Ivory Coast': 'ci',
  'Saudi Arabia': 'sa',
  'Qatar': 'qa',
  'Ghana': 'gh',
  'Haiti': 'ht',
  'Iraq': 'iq',
  'Uzbekistan': 'uz'
};

export const getFlagUrl = (teamName) => {
  if (!teamName) return '';
  const code = countryCodes[teamName];
  if (!code) return '';
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
};

export const getLargeFlagUrl = (teamName) => {
  if (!teamName) return '';
  const code = countryCodes[teamName];
  if (!code) return '';
  // Use w80 or w160 for high-res large display
  return `https://flagcdn.com/w160/${code.toLowerCase()}.png`;
};
