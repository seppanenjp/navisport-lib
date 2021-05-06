import { Passing } from "./passing";
import { Event } from "./event";

export enum CheckpointType {
  START = "Start",
  CHECKPOINT = "Checkpoint",
  FINISH = "Finish",
}

export class Checkpoint {
  id: string;
  name: string;
  devices: string[];
  code?: string;
  type: CheckpointType;
  classId: string;
  event?: Event;
  eventId: string;
  passings?: Passing[];
  orderNumber: number;
  distance?: number;
  updated?: string; // Date;

  constructor() {
    this.type = CheckpointType.CHECKPOINT;
    this.devices = [];
  }
}
