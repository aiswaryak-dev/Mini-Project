# Developer Documentation: `TelemetryChart.jsx`

## Overview
`TelemetryChart.jsx` renders a vector SVG trend graph illustrating live 24-hour soil moisture decay curves and glowing telemetry data points.

## Why It's Used
Visualizes historical telemetry trends inside the plant detail modal to give users clear insight into moisture levels over time.

## File Location
`src/components/TelemetryChart.jsx`

## Imports & Dependencies
- `React` from `react`

## Props
| Prop Name | Type | Description |
| :--- | :--- | :--- |
| `plantName` | `string` | Name of the target plant specimen |
| `currentMoisture` | `number` | Current live soil moisture percentage |

## State & Hooks
N/A (Pure presentation component driven by props).

## Full Code Flow (Step-by-Step)
1. Takes `currentMoisture` prop and generates 7 historical points.
2. Calculates SVG canvas coordinates `(getX, getY)` for each point.
3. Constructs cubic bezier path string `pathD` and area fill path `areaD`.
4. Renders SVG canvas with gradient area fill, glowing stroke, grid lines, and safety line.

```javascript
const pathD = points.reduce((acc, pt, i) => {
  const x = getX(i);
  const y = getY(pt.val);
  if (i === 0) return `M ${x} ${y}`;
  const prevX = getX(i - 1);
  const prevY = getY(points[i - 1].val);
  const cx1 = prevX + (x - prevX) / 2;
  return `${acc} C ${cx1} ${prevY}, ${cx1} ${y}, ${x} ${y}`;
}, '');
```

## Backend Connection
N/A.

## Data Flow Diagram
`PlantModal (currentMoisture)` ➔ `TelemetryChart` ➔ SVG Vector Calculation ➔ Render Graph

## Events & Handlers
N/A.

## Edge Cases & Error Handling
Clamps moisture values between 0% and 100%.

## Styling
SVG with linear gradient fill (`#10B981`) and blur glow filter.
