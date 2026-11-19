// Cursor tools: small SVGs that replace the mouse over a hotspot. The tip is at (0, 0); the art leans up and to the right.
export const TOOLS = {
  turner: `<g transform="rotate(32)"><rect x="-4" y="-120" width="8" height="84" rx="4" fill="#6B4423"/><rect x="-6" y="-60" width="12" height="16" fill="#8A8298"/>
<path d="M-26 -38L26 -38L30 10Q0 22 -30 10Z" fill="#B9B3C6" stroke="#6A6278" stroke-width="2.5"/>
<g stroke="#2C2834" stroke-width="3.2" stroke-linecap="round"><path d="M-17 -26V-2M-6 -26V-2M6 -26V-2M17 -26V-2"/></g></g>`,
  spoon: `<g transform="rotate(30)"><rect x="-4" y="-130" width="8" height="100" rx="4" fill="#A9743A"/>
<ellipse cx="0" cy="-12" rx="17" ry="24" fill="#B9823F" stroke="#7A4F22" stroke-width="2.5"/><ellipse cx="0" cy="-10" rx="9" ry="14" fill="#9A6A30" fill-opacity=".6"/></g>`,
};
export const toolSvg = (name) => `<svg viewBox="-70 -140 140 160" width="110" height="126" aria-hidden="true" style="overflow:visible">${TOOLS[name]}</svg>`;
