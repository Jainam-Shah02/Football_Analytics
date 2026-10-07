import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

export default function PlayerRadar({ data = [], title = 'Attribute Profile', isQualified = true }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-xs">
        Insufficient data for radar visualization
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-[#111111] border border-white/20 px-3 py-2 rounded-md shadow-xl text-xs">
          <div className="font-semibold text-white">{item.label || item.metric}</div>
          <div className="text-cyan-400 font-mono mt-0.5">
            {item.value !== null && item.value !== undefined ? Number(item.value).toFixed(1) : '-'}
            <span className="text-gray-400 text-[10px] ml-1">
              {item.isPercentile ? 'th percentile' : ''}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2 pb-2.5 border-b border-white/10">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide">{title}</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {isQualified ? 'Role-benchmarked percentiles (0–100 scale)' : 'Unranked sample (<90 mins)'}
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 rounded">
          Percentiles
        </span>
      </div>

      <div className="w-full h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="#262626" />
            <PolarAngleAxis
              dataKey="label"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: '#52525b', fontSize: 9 }}
              stroke="#262626"
            />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              name="Player"
              dataKey="value"
              stroke="#06b6d4"
              fill="#06b6d4"
              fillOpacity={0.25}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
