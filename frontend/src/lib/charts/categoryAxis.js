/**
 * @param {Record<number, string>} labelMap
 * @returns {{
 *   incrs: number[],
 *   splits: () => number[],
 *   values: (u: unknown, splits: number[]) => string[],
 *   grid: { show: boolean }
 * }}
 */
export function categoryXAxis(labelMap) {
  const keys = Object.keys(labelMap)
    .map(Number)
    .sort((a, b) => a - b);

  return {
    incrs: [1],
    splits: () => keys,
    values: (_u, splits) => splits.map((val) => labelMap[Math.round(val)] || ''),
    grid: { show: false },
  };
}
