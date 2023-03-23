import { CourseClass } from "./course-class";
import { Course } from "./course";
import { Organisation } from "./organisation";
import { Checkpoint } from "./checkpoint";
import { Result } from "./result";
import { Device } from "./device";
import { Passing } from "./passing";
import { MapInformation } from "./map-information";
import { Series } from "./series";
import { Link } from "./link";
import { StringOrDate } from "./date";

export enum Sport {
  ORIENTEERING = "Orienteering",
  RUNNING = "Running",
  MULTISPORT = "Multisport",
  SKIING = "Skiing",
  TRIATHLON = "Triathlon",
}

export enum Classification {
  INTERNATIONAL = "International",
  NATIONAL = "National",
  REGIONAL = "Regional",
  LOCAL = "Local",
  VIRTUAL = "Virtual",
  PRIVATE = "Private",
}

export enum RaceType {
  INDIVIDUAL = "Individual",
  TEAM = "Team",
  RELAY = "Relay",
}

export enum EventType {
  TRAINING = "Training",
  RACE = "Race",
  MOTION = "Motion",
}

export enum EventState {
  DRAFT = "Draft",
  ONLINE = "Online",
  COMPLETE = "Complete",
}

export class Event {
  id: string;
  name: string;
  series?: Series;
  seriesId?: string;
  begin: StringOrDate;
  ending: StringOrDate;
  sport: Sport;
  classification: Classification;
  raceType: RaceType;
  eventType: EventType;
  address?: string;
  latitude?: number;
  longitude?: number;
  externalApplication?: string;
  winsplitsPassword?: string;
  winsplitsId?: number;
  maxAttendeeCount: number;
  description?: string;
  instructions?: string;
  invitation?: string;
  homePage?: string;
  logoUrl?: string;
  startListPublication?: StringOrDate;
  mapPublication?: StringOrDate;
  mapImageUploaded?: StringOrDate;
  organisation?: Organisation;
  organisationId: string;
  stageNumber?: number;
  state: EventState;
  mapInformation?: MapInformation;
  hasRentalChips: boolean;
  registrationSettings?: RegistrationFormField[];
  links?: Link[];
  registrationBegin?: StringOrDate;
  registrationEnding?: StringOrDate;
  courses?: Course[];
  courseClasses?: CourseClass[];
  results?: Result[];
  checkpoints?: Checkpoint[];
  devices?: Device[];
  passings?: Passing[];
  paymentCategories?: PaymentCategory[];
  private = false;
  updated?: StringOrDate;

  constructor() {
    this.courseClasses = [];
    this.courses = [];
    this.checkpoints = [];
    this.results = [];
    this.sport = Sport.ORIENTEERING;
    this.raceType = RaceType.INDIVIDUAL;
    this.eventType = EventType.MOTION;
    this.classification = Classification.LOCAL;
    this.mapInformation = createMapInformation();
    this.registrationSettings = createRegistrationSettings();
    this.paymentCategories = [];
    this.passings = [];
  }
}

export enum CategoryType {
  SINGLE_EVENT = "Single event",
  SERIES = "Series",
}

export class PaymentCategory {
  id: string;
  event?: Event;
  eventId?: string;
  seriesId?: string;
  series?: Series;
  name: string;
  price?: number;
  onlinePayment?: boolean;
  additionalInformation?: string;
  categoryType: CategoryType;
  updated?: Date;

  constructor() {
    this.additionalInformation = "";
  }
}

export interface RegistrationFormField {
  key: string;
  visible: boolean;
  required: boolean;
}

export const createMapInformation = (): MapInformation => {
  return {
    scale: 0,
    positionBottomRight: {
      latitude: null,
      longitude: null,
    },
    positionBottomLeft: {
      latitude: null,
      longitude: null,
    },
    positionTopRight: {
      latitude: null,
      longitude: null,
    },
    positionTopLeft: {
      latitude: null,
      longitude: null,
    },
    controlInformation: [],
  };
};
export const createRegistrationSettings = (): RegistrationFormField[] => {
  return [
    {
      key: "email",
      visible: true,
      required: true,
    },
    {
      key: "phoneNumber",
      visible: false,
      required: false,
    },
    {
      key: "club",
      visible: true,
      required: false,
    },
    {
      key: "classId",
      visible: true,
      required: false,
    },
    {
      key: "courseId",
      visible: false,
      required: false,
    },
    {
      key: "chip",
      visible: true,
      required: false,
    },
    {
      key: "birthYear",
      visible: false,
      required: false,
    },
    {
      key: "licenceNumber",
      visible: false,
      required: false,
    },
    {
      key: "iofId",
      visible: false,
      required: false,
    },
    {
      key: "nationality",
      visible: true,
      required: false,
    },
    {
      key: "gender",
      visible: false,
      required: false,
    },
    {
      key: "additionalInfo",
      visible: false,
      required: false,
    },
  ];
};
