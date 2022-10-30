import { Organisation } from "./organisation";
import { Event, PaymentCategory } from "./event";
import { Passing } from "./passing";
import { StringOrDate } from "./date";

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
  updated?: StringOrDate;
  events?: Event[];
  passings?: Passing[];
  paymentCategories?: PaymentCategory[];

  constructor() {
    this.seriesType = SeriesType.INDIVIDUAL_EVENTS;
    this.overallResults = false;
    this.paymentCategories = [];
  }
}
