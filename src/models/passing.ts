import { Device } from "./device";
import { Checkpoint } from "./checkpoint";
import { Result } from "./result";
import { StringOrDate } from "./date";

export class Passing {
  id: string;
  result?: Result;
  resultId?: string;
  chip: string;
  device?: Device;
  deviceId?: string;
  checkpoint?: Checkpoint;
  checkpointId?: string;
  eventId?: string;
  timestamp: StringOrDate;
  time?: number;
  position?: number;
  difference?: number;
  updated?: StringOrDate;
}
