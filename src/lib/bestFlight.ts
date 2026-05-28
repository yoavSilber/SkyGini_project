import type { FlightOption } from "./types";

// Total flying time across all legs of a flight option, in minutes.
export function totalDurationMinutes(option: FlightOption): number {
  return option.flights.reduce((sum, leg) => {
    const start = new Date(leg.departure_time).getTime();
    const end = new Date(leg.arrival_time).getTime();
    return sum + (end - start) / 60000;
  }, 0);
}

// Sort flight options: lowest price first.
// If two options have the same price (rounded to 2 decimals), shortest total duration wins.
export function sortByBest(options: FlightOption[]): FlightOption[] {
  return [...options].sort((a, b) => {
    const priceDiff = round2(a.price) - round2(b.price);
    if (priceDiff !== 0) return priceDiff;
    return totalDurationMinutes(a) - totalDurationMinutes(b);
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
