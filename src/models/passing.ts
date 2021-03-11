import { Device } from "./device";
import { Checkpoint } from "./checkpoint";
import { Result } from "./result";

export class Passing {
  id: string;
  result?: Result;
  resultId?: string;
  chip: string;
  device?: Device;
  deviceId?: string;
  checkpoint?: Checkpoint;
  checkpointId?: string;
  eventId: string;
  timestamp: Date;
  updated?: Date;
}
