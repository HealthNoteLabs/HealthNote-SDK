// src/charts/svg.ts
var DEFAULT_OPTS = {
  width: 320,
  height: 180,
  stroke: "#007aff",
  fill: "none"
};
function sanitizeSeries(series) {
  return series.filter((p) => Number.isFinite(p.value));
}
function lineChartSVG(series, opts = {}) {
  const options = { ...DEFAULT_OPTS, ...opts };
  const data = sanitizeSeries(series);
  if (!data.length)
    return '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  const { width, height, stroke } = options;
  const minVal = Math.min(...data.map((d) => d.value));
  const maxVal = Math.max(...data.map((d) => d.value));
  const yScale = (v) => {
    if (maxVal === minVal)
      return height / 2;
    return height - (v - minVal) / (maxVal - minVal) * (height - 20) - 10;
  };
  const xScale = (i) => {
    return i / (data.length - 1) * (width - 20) + 10;
  };
  let path = "";
  data.forEach((d, i) => {
    const x = xScale(i);
    const y = yScale(d.value);
    path += i === 0 ? `M${x},${y}` : ` L${x},${y}`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <path d="${path}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}
function barChartSVG(series, opts = {}) {
  const options = { ...DEFAULT_OPTS, ...opts };
  const data = sanitizeSeries(series);
  if (!data.length)
    return '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  const { width, height, fill } = options;
  const barWidth = Math.max(2, Math.floor((width - 20) / data.length));
  const minVal = 0;
  const maxVal = Math.max(...data.map((d) => d.value));
  const yScale = (v) => maxVal === 0 ? 0 : (v - minVal) / (maxVal - minVal) * (height - 20);
  let rects = "";
  data.forEach((d, i) => {
    const x = 10 + i * barWidth + 2;
    const barH = yScale(d.value);
    const y = height - barH - 10;
    rects += `<rect x="${x}" y="${y}" width="${barWidth - 4}" height="${barH}" fill="${fill !== "none" ? fill : "#007aff"}" />`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${rects}
  </svg>`;
}

export {
  lineChartSVG,
  barChartSVG
};
//# sourceMappingURL=chunk-FJTTLFWT.mjs.map