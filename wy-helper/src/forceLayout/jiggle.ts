import { GetValue } from "wy-helper";

export default function (random: GetValue<number>) {
  return (random() - 0.5) * 1e-6;
}