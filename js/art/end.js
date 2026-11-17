// Art for the end card: the shared room in the moon mood (rain easing, the moon out). The card covers the room
// once it opens; the three lines play over it first. art(params) -> { planes }.
import { room } from './room.js';

export default function art() {
  return { planes: room({ mood: 'moon', seed: 9 }) };
}
