import { useRef, useState } from "react";
import type { FlightOption, SearchParams } from "./lib/types";
import { sortByBest, totalDurationMinutes } from "./lib/bestFlight";
import "./index.css";

const API_URL = "/api/search"; // Vite proxies this to api.skygini.com (avoids CORS)
const IATA = /^[A-Z]{3}$/;

export default function App() {
  // Form fields
  const [origin, setOrigin] = useState("TLV");
  const [destination, setDestination] = useState("JFK");
  const [departDate, setDepartDate] = useState("2026-09-01");
  const [arriveDate, setArriveDate] = useState("2026-09-08");

  // UI state
  const [results, setResults] = useState<FlightOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  // In-memory cache: key = "ORIGIN|DEST|departDate|arriveDate"
  // useRef keeps the Map across renders without triggering re-renders.
  const cache = useRef<Map<string, FlightOption[]>>(new Map());

  function validate(): string | null {
    if (!IATA.test(origin)) return "Origin must be exactly 3 letters (e.g. TLV).";
    if (!IATA.test(destination)) return "Destination must be exactly 3 letters (e.g. JFK).";
    if (origin === destination) return "Origin and destination must be different.";
    if (!departDate || !arriveDate) return "Both dates are required.";
    if (departDate > arriveDate) return "Return date must be on or after departure date.";
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError(null);
    setResults(null);
    setFromCache(false);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const params: SearchParams = { origin, destination, departDate, arriveDate };
    const cacheKey = `${origin}|${destination}|${departDate}|${arriveDate}`;

    // Check cache before making a network call
    const cached = cache.current.get(cacheKey);
    if (cached) {
      setResults(cached); // already sorted from first fetch
      setFromCache(true);
      return;
    }

    // Fetch from the SkyGini API
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        setError(`Search failed (status ${res.status}). Please try again.`);
        return;
      }

      const options = (await res.json()) as FlightOption[];

      // Sort: lowest price first, shortest duration as tiebreak.
      // After sorting, index 0 is always the Best Flight.
      const sorted = sortByBest(options);

      cache.current.set(cacheKey, sorted);
      setResults(sorted);
    } catch {
      setError("Could not reach the SkyGini API. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>SkyGini Flight Search</h1>

      <form onSubmit={onSubmit} className="form">
        <label>
          Origin
          <input
            value={origin}
            onChange={(e) => setOrigin(e.target.value.toUpperCase())}
            maxLength={3}
            placeholder="TLV"
          />
        </label>

        <label>
          Destination
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value.toUpperCase())}
            maxLength={3}
            placeholder="JFK"
          />
        </label>

        <label>
          Departure
          <input
            type="date"
            value={departDate}
            onChange={(e) => setDepartDate(e.target.value)}
          />
        </label>

        <label>
          Return
          <input
            type="date"
            value={arriveDate}
            onChange={(e) => setArriveDate(e.target.value)}
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {results !== null && results.length === 0 && (
        <p>No flights found for this route and dates.</p>
      )}

      {results !== null && results.length > 0 && (
        <>
          <h2>
            Results ({results.length})
            {fromCache && <span className="cached"> (cached)</span>}
          </h2>

          <table>
            <thead>
              <tr>
                <th>Outbound</th>
                <th>Return</th>
                <th>Airlines</th>
                <th>Total Duration</th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {results.map((option, i) => {
                const airlines = [...new Set(option.flights.map((f) => f.airline))].join(", ");
                const outbound = option.flights[0];
                const returnFlight = option.flights[option.flights.length - 1];
                const outboundDur = legDurationMinutes(outbound);
                const returnDur = legDurationMinutes(returnFlight);
                const totalDur = totalDurationMinutes(option);
                const isBest = i === 0; // after sorting, index 0 is always the best

                return (
                  <tr key={i} className={isBest ? "best-row" : undefined}>
                    <td>{formatDateTime(outbound.departure_time)} → {formatDateTime(outbound.arrival_time)} ({formatDuration(outboundDur)})</td>
                    <td>{formatDateTime(returnFlight.departure_time)} → {formatDateTime(returnFlight.arrival_time)} ({formatDuration(returnDur)})</td>
                    <td>{airlines}</td>
                    <td>{formatDuration(totalDur)}</td>
                    <td>${option.price.toFixed(2)}</td>
                    <td>{isBest && <span className="badge">Best</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

function legDurationMinutes(leg: { departure_time: string; arrival_time: string }): number {
  return (new Date(leg.arrival_time).getTime() - new Date(leg.departure_time).getTime()) / 60000;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(minutes: number): string {
  const total = Math.round(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}h ${m}m`;
}
