// The seven spice icons (48 x 48), used on the plate and the end card. spiceIcon(id) returns an SVG string.
// Moved from v1's topdown.js.
const EGGS = {
  elaichi: `
    <path d="M7 31C9 14 33 7 43 17C40 35 17 43 7 31z" fill="#0A0D18" opacity=".4" transform="translate(1.500 2)"/>
    <path d="M6 30C8 13 32 6 42 16C39 34 16 42 6 30z" fill="#5E8C4A"/>
    <path d="M6 30C8 13 32 6 42 16C28 14 14 20 6 30z" fill="#7BA85F"/>
    <path d="M10 33C18 22 30 17 40 18M12 36C22 27 32 22 41 22" fill="none" stroke="#3F6234" stroke-width="1.600" stroke-linecap="round"/>
    <path d="M6 30l-3 3M42 16l3-3" stroke="#3F6234" stroke-width="2.400" stroke-linecap="round"/>`,
  clove: `
    <path d="M22 17Q24 32 25 45Q27 32 28 17z" fill="#0A0D18" opacity=".4" transform="translate(2 2)"/>
    <path d="M20 16Q23 32 24 45Q26 32 28 16z" fill="#6B3418"/>
    <path d="M20 16Q22 30 24 45Q22 30 22.500 16z" fill="#8F4B27"/>
    <path d="M24 3L29 8L24 13L19 8z" fill="#3A1C0E"/>
    <circle cx="24" cy="8" r="6.500" fill="#6B3418"/>
    <circle cx="22" cy="6" r="2.400" fill="#A8642C"/>
    <path d="M17 17Q24 12 31 17L28 20Q24 17 20 20z" fill="#8F4B27"/>
    <path d="M16 16L12 12M32 16L36 12M18 21L13 24M30 21L35 24" stroke="#6B3418" stroke-width="3" stroke-linecap="round"/>`,
  cinnamon: `
    <g transform="rotate(-32 24 24)">
      <rect x="2" y="15" width="44" height="18" rx="7" fill="#0A0D18" opacity=".4" transform="translate(2 3)"/>
      <rect x="1" y="14" width="44" height="18" rx="7" fill="#8F4B27"/>
      <rect x="1" y="14" width="44" height="9" rx="5" fill="#B8693A"/>
      <path d="M8 19H38M6 27H36" stroke="#6B3418" stroke-width="1.500" stroke-linecap="round"/>
      <ellipse cx="42" cy="23" rx="4" ry="9" fill="#DC9460"/>
      <path d="M42 17Q38 20 42 23Q45 25 42 28" fill="none" stroke="#6B3418" stroke-width="1.600" stroke-linecap="round"/>
    </g>`,
  pepper: `
    <circle cx="16" cy="29" r="12" fill="#0A0D18" opacity=".4" transform="translate(2 3)"/>
    <circle cx="15" cy="28" r="12" fill="#3B2A22"/>
    <circle cx="11" cy="24" r="4.500" fill="#5E4638"/>
    <path d="M7 31Q15 36 22 30M9 21Q14 18 19 22" fill="none" stroke="#1E1410" stroke-width="1.500" stroke-linecap="round"/>
    <circle cx="33" cy="17" r="9.500" fill="#0A0D18" opacity=".4" transform="translate(2 3)"/>
    <circle cx="32" cy="16" r="9.500" fill="#4A362C"/>
    <circle cx="29" cy="13" r="3.600" fill="#6E5444"/>
    <path d="M25 19Q32 24 38 17" fill="none" stroke="#1E1410" stroke-width="1.400" stroke-linecap="round"/>`,
  bayleaf: `
    <g transform="rotate(-38 24 24)">
      <path d="M2 25Q22 9 47 24Q22 40 2 25z" fill="#0A0D18" opacity=".4" transform="translate(2 3)"/>
      <path d="M2 24Q22 8 47 23Q22 39 2 24z" fill="#7C8A3E"/>
      <path d="M2 24Q22 8 47 23Q24 17 2 24z" fill="#9AA84F"/>
      <path d="M2 24L47 23" stroke="#4E5A25" stroke-width="1.800" stroke-linecap="round"/>
      <path d="M8 24Q24 14 44 23M8 24Q24 33 44 23" fill="none" stroke="#5E6B2D" stroke-width="1.300" stroke-linecap="round"/>
      <path d="M2 24L-1 25" stroke="#4E5A25" stroke-width="2.400" stroke-linecap="round"/>
    </g>`,
  chilli: `
    <path d="M9 12C22 10 38 18 40 42C32 30 22 24 9 20z" fill="#0A0D18" opacity=".4" transform="translate(2 3)"/>
    <path d="M8 11C22 9 38 17 40 42C31 29 21 23 8 19z" fill="#5E8C4A"/>
    <path d="M8 11C22 9 36 15 40 32C30 20 20 15 8 14z" fill="#7BA85F"/>
    <path d="M13 14C24 15 32 22 37 34" fill="none" stroke="#F6EBD3" stroke-width="2" stroke-linecap="round"/>
    <path d="M16 15l2 2M22 17l2 2M28 21l2 2" stroke="#3F6234" stroke-width="1.500" stroke-linecap="round"/>
    <path d="M4 8Q9 5 12 10L9 20Q4 15 4 8z" fill="#3F6234"/>
    <path d="M4 8L1 5" stroke="#3F6234" stroke-width="2.500" stroke-linecap="round"/>`,
  staranise: (() => {
    let petals = '';
    for (let i = 0; i < 8; i++) {
      petals += `<path d="M0 -3Q-6.500 -12 0 -21Q6.500 -12 0 -3z" transform="rotate(${i * 45})" fill="#7A3A1C"/>`;
      petals += `<path d="M0 -4Q-3.500 -12 0 -19Q-1 -12 0 -4z" transform="rotate(${i * 45})" fill="#A8642C"/>`;
    }
    return `
    <g transform="translate(26 27)" opacity=".4" fill="#0A0D18">${petals.replace(/#\w{6}/g, '#0A0D18')}</g>
    <g transform="translate(24 24)">${petals}<circle r="5" fill="#5A2A14"/><ellipse cx="-1" cy="-1" rx="2.200" ry="3" fill="#D9A05F"/></g>`;
  })(),
};

export const spiceIds = Object.keys(EGGS);

export function spiceIcon(id, label = id) {
  if (!EGGS[id]) throw new Error(`Unknown spice: ${id}`);
  return `<svg class="spice-icon" viewBox="0 0 48 48" role="img" aria-label="${label}">${EGGS[id]}</svg>`;
}
