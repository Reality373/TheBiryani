// Art for chapter V, The Wait: the shared room in deep night. Chapter logic comes later.
import { room } from './room.js';

export default function art(params) {
  return { planes: room({ mood: 'night', seed: 3 }) };
}
