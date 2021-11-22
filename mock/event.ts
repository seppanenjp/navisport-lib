import {
  Classification,
  Event,
  EventState,
  EventType,
  RaceType,
  Series,
  SeriesType,
  Sport,
} from "../src";
import { courseClasses } from "./course-class";
import { courses } from "./course";
import { results } from "./result";

export const series: Series = {
  id: "c8e366f6-40b2-4237-9d4c-86c793da7d00",
  name: "Lapland O Week 2020",
  organisationId: "",
  seriesType: SeriesType.INDIVIDUAL_EVENTS,
  overallResults: false,
};

export const TEST_EVENT: Event = {
  id: "37ba302c-0146-44e8-b88a-0860630b5e4d",
  name: "Etappi 1 - Jääkausiränni",
  begin: "2020-07-27T04:00:21.000Z",
  ending: "2020-07-27T15:00:46.000Z",
  address: "Ankkuri, 95970 Kolari",
  latitude: 67.580421444661,
  longitude: 24.201979637146,
  logoUrl: undefined,
  homePage: "https://www.laplandoweek.com/",
  classification: Classification.LOCAL,
  eventType: EventType.MOTION,
  raceType: RaceType.INDIVIDUAL,
  hasRentalChips: false,
  maxAttendeeCount: 0,
  organisationId: "",
  sport: Sport.ORIENTEERING,
  state: EventState.COMPLETE,
  private: false,
  series,
  courseClasses,
  courses,
  results,
};
