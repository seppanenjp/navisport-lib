import { Passing } from "./passing";
import { Event } from "./event";
import { StringOrDate } from "./date";

export enum CheckpointType {
  START = "Start",
  CHECKPOINT = "Checkpoint",
  FINISH = "Finish",
}

export class Checkpoint {
  id: string;
  name: string;
  devices: string[];
  group?: string;
  code?: string;
  type: CheckpointType;
  classId: string;
  event?: Event;
  eventId: string;
  passings?: Passing[];
  orderNumber: number;
  distance?: number;
  updated?: StringOrDate;

  constructor() {
    this.type = CheckpointType.CHECKPOINT;
    this.devices = [];
  }
}
