import { Passing } from "./passing";
import { Course } from "./course";
import { ControlTime } from "./control-time";
import { CourseClass } from "./course-class";
import { User } from "./user";
import { FeatureCollection } from "geojson";
import { Event } from "./event";

export enum ResultStatus {
  OK = "Ok",
  DNS = "Dns",
  DNF = "Dnf",
  DSQ = "Dsq",
  MANUAL = "Manual",
  NOTIME = "No time",
  UNKNOWN = "Unknown",
  REGISTERED = "Registered",
}

export enum PaymentState {
  PAID = "Paid",
  NOT_PAID = "Not paid",
  PENDING = "Pending",
}

export enum Gender {
  MALE = "Male",
  FEMALE = "Female",
  NOT_SPECIFIED = "Not specified",
}

export enum ResultType {
  INDIVIDUAL = "Individual",
  TEAM = "Team",
}

export class Result {
  id: string;
  seriesId?: string;
  sportId?: number;
  iofId?: number;
  externalId?: string;
  licenceNumber?: number;
  bibNumber?: number;
  teamId?: string;
  event: Event;
  eventId: string;
  course?: Course;
  courseId?: string;
  courseClass?: CourseClass;
  classId?: string;
  user?: User;
  userId?: string;
  leg?: number;
  registerTime?: string; // Date;
  startTime?: string; // Date;
  readTime?: string; // Date;
  controlTimes?: ControlTime[];
  name: string;
  club?: string;
  municipality?: string;
  birthYear?: number;
  nationality?: string;
  chip?: string;
  secondaryChip?: string;
  rentalChip?: boolean;
  email?: string;
  phoneNumber?: string;
  paymentState: PaymentState;
  paymentInfo?: string;
  paymentPrice?: number;
  gender: Gender;
  resultType: ResultType;
  private: boolean;
  status: ResultStatus;
  registered: boolean;
  additionalPenalty?: number;
  additionalInfo?: string;
  paymentCategory?: string;
  paymentReference?: number;
  transactionId?: string;
  route?: FeatureCollection;
  time?: number;
  position?: number;
  points?: number;
  updated: string; // Date;
  passings?: Passing[];
  parsedControlTimes?: ControlTime[];
  difference?: number;

  // This is only for frontend use
  syncTime: Date;

  constructor() {
    this.resultType = ResultType.INDIVIDUAL;
    this.status = ResultStatus.REGISTERED;
    this.gender = Gender.NOT_SPECIFIED;
    this.paymentState = PaymentState.NOT_PAID;
    this.controlTimes = [];
    this.parsedControlTimes = [];
    this.nationality = "FIN";
    this.registered = false;
    this.private = false;
  }
}
