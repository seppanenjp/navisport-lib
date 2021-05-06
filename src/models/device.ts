import { Checkpoint } from "./checkpoint";
import { Passing } from "./passing";
import { Event } from "./event";

export enum DeviceMode {
  EMIT_USB = "EMIT USB",
  ECU = "ECU",
}

export enum DeviceType {
  MOBILE = "MOBILE",
  RASPBERRY = "RASPBERRY",
}

export class Device {
  id: string;
  name?: string;
  event?: Event;
  eventId?: string;
  organisationId?: string;
  checkpoints?: Checkpoint[];
  passings?: Passing[];
  mode: DeviceMode;
  batteryLevel?: number;
  deviceType: DeviceType;
  updated?: string; // Date;

  constructor() {
    this.mode = DeviceMode.EMIT_USB;
    this.deviceType = DeviceType.MOBILE;
  }
}
