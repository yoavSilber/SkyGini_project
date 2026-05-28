export type SearchParams = {
  origin: string;
  destination: string;
  departDate: string;
  arriveDate: string;
};

export type FlightLeg = {
  airline: string;
  departure_time: string;
  arrival_time: string;
};

export type FlightOption = {
  flights: FlightLeg[];
  price: number;
};
