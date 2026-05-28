import type { FlightOption } from "./types";

// Sum of flying time across every leg of the option, in minutes.
export function totalDurationMinutes(option: FlightOption): number {
  return option.flights.reduce((sum, leg) => {
    const start = new Date(leg.departure_time).getTime();
    const end = new Date(leg.arrival_time).getTime();
    return sum + (end - start) / 60000;
  }, 0);
}

// Best = lowest price. On a price tie, shortest total duration wins.
// Prices are rounded to 2 decimals before comparison to avoid float-precision mismatches.
export function pickBestIndex(options: FlightOption[]): number | null {
  if (options.length === 0) return null;

  let bestIdx = 0;
  let bestPrice = round2(options[0].price);
  let bestDur = totalDurationMinutes(options[0]);

  for (let i = 1; i < options.length; i++) {
    const price = round2(options[i].price);
    const dur = totalDurationMinutes(options[i]);

    if (price < bestPrice) {
      bestIdx = i;
      bestPrice = price;
      bestDur = dur;
    } else if (price === bestPrice && dur < bestDur) {
      bestIdx = i;
      bestDur = dur;
    }
  }

  return bestIdx;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
