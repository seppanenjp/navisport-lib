import { Gender } from "./result";
import { StringOrDate } from "./date";

export class ParticipantMetadata {
  chip: string;
  sportId?: number;
  iofId?: number;
  licenceNumber?: number;
  name: string;
  club?: string;
  municipality?: string;
  birthYear?: number;
  nationality?: string;
  email?: string;
  phoneNumber?: string;
  gender: Gender;
  updated?: StringOrDate;
}
