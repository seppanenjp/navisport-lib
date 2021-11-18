import { Organisation } from "./organisation";
import { Event } from "./event";

export enum SeriesType {
  INDIVIDUAL_EVENTS = "Individual events",
  MULTISTAGE = "Multistage",
}

export class Series {
  id: string;
  name: string;
  organisation?: Organisation;
  organisationId: string;
  minExternalBibNumber?: number;
  maxExternalBibNumber?: number;
  seriesType: SeriesType;
  overallResults: boolean;
  updated?: string; // Date;
  events?: Event[];

  constructor() {
    this.seriesType = SeriesType.INDIVIDUAL_EVENTS;
    this.overallResults = false;
  }
}
