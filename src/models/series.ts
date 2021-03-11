import { Organisation } from "./organisation";

export enum SeriesType {
  INDIVIDUAL_EVENTS = "Individual events",
  MULTISTAGE = "Multistage",
}

export class Series {
  id: string;
  name: string;
  organisation: Organisation;
  organisationId: string;
  minExternalBibNumber?: number;
  maxExternalBibNumber?: number;
  seriesType: SeriesType;
  overallResults: boolean;
  updated: Date;
  events?: Event[];
}
