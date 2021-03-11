import { Passing } from "./passing";

export enum CheckpointType {
  START = "Start",
  CHECKPOINT = "Checkpoint",
  FINISH = "Finish",
}

export class Checkpoint {
  id: string;
  name: string;
  devices: string[];
  code?: number;
  type: CheckpointType;
  classId: string;
  event?: Event;
  eventId: string;
  passings?: Passing[];
  orderNumber: number;
  distance?: number;
  updated?: Date;

  constructor() {
    this.devices = [];
  }
}
