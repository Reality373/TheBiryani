// The printable recipe on the end card, built from cookbook.js (the one source of the recipe).
import { method, ingredients } from './cookbook.js';

// One entry per method step. The time goes in brackets at the end of the step.
export const recipe = method.map(({ step, time, why }) => ({
  step: time ? `${step.replace(/\.$/, '')} (${time}).` : step,
  why: why ?? '',
}));

// Everything to buy, grouped by the chapter that uses it, in chapter order.
const headings = { onions: 'Onions', marinade: 'Marinade', rice: 'Rice', layers: 'Layers', seal: 'Seal' };
export const shopping = Object.entries(headings).map(([ch, heading]) => ({
  heading,
  items: ingredients[ch].map(({ name, amount }) => ({ name, amount })),
}));
