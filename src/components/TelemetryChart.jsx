import React from 'react';

export const TelemetryChart = ({ plantName, currentMoisture }) => {
  // Generate pseudo-historical moisture data points leading to currentMoisture
  const base = Math.max(20, Math.min(90, currentMoisture));
  const points = [
    { time: '00:00', val: Math.min(95, base + 22) },
    { time: '04:00', val: Math.min(95, base + 16) },
    { time: '08:00', val: Math.min(95, base + 9) },
    { time: '12:00', val: Math.min(95, base + 4) },
    { time: '16:00', val: Math.min(95, base - 3) },
    { time: '20:00', val: Math.min(95, base + 12) },
    { time: 'Now', val: currentMoisture }
  ];

  const width = 500;
  const height = 140;
  const padding = 25;

  const minVal = 0;
  const maxVal = 100;

  const getX = (idx) => padding + (idx / (points.length - 1)) * (width - padding * 2);
  const getY = (val) => height - padding - ((val - minVal) / (maxVal - minVal)) * (height - padding * 2);

  const pathD = points.reduce((acc, pt, i) => {
    const x = getX(i);
    const y = getY(pt.val);
    if (i === 0) return `M ${x} ${y}`;
    // Smooth bezier curve
    const prevX = getX(i - 1);
    const prevY = getY(points[i - 1].val);
    const cx1 = prevX + (x - prevX) / 2;
    const cx2 = prevX + (x - prevX) / 2;
    return `${acc} C ${cx1} ${prevY}, ${cx2} ${y}, ${x} ${y}`;
  }, '');

  const areaD = `${pathD} L ${getX(points.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-slate-500 font-medium">Sensor Stream: 24h Soil Moisture Curve</span>
        <span className="font-mono font-bold text-emerald-700">{currentMoisture}% Live</span>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="moistureGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={getY(30)} x2={width - padding} y2={getY(30)} stroke="#E2E8F0" strokeDasharray="4 4" strokeWidth="1" />
          <line x1={padding} y1={getY(70)} x2={width - padding} y2={getY(70)} stroke="#E2E8F0" strokeDasharray="4 4" strokeWidth="1" />

          {/* Safety Threshold Line */}
          <line x1={padding} y1={getY(30)} x2={width - padding} y2={getY(30)} stroke="#F59E0B" strokeWidth="1.5" opacity="0.6" />

          {/* Area Fill */}
          <path d={areaD} fill="url(#moistureGradient)" />

          {/* Curve Line */}
          <path d={pathD} fill="none" stroke="#10B981" strokeWidth="3" filter="url(#glow)" />

          {/* Data Points */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle 
                cx={getX(i)} 
                cy={getY(pt.val)} 
                r={i === points.length - 1 ? "5" : "3.5"} 
                fill={i === points.length - 1 ? "#059669" : "#ffffff"} 
                stroke="#10B981" 
                strokeWidth="2.5" 
              />
              <text 
                x={getX(i)} 
                y={height - 5} 
                textAnchor="middle" 
                fontSize="12" 
                fill="#94A3B8"
                className="font-mono font-medium"
              >
                {pt.time}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};
