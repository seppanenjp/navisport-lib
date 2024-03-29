import { Checkpoint } from "./checkpoint";
import { Passing } from "./passing";
import { Event } from "./event";
import { StringOrDate } from "./date";

export enum DeviceMode {
  EMIT_USB = "EMIT USB",
  ECU = "ECU",
}

export enum DeviceType {
  MOBILE = "MOBILE",
  RASPBERRY = "RASPBERRY",
}

export enum ApplicationMode {
  AUTOMATON_START = "Automaton start",
  AUTOMATON_FINISH = "Automaton finish",
  AUTOMATON_FULL = "Automaton full",
  ONLINE_CONTROL = "Online control",
  START_TIMER = "Start timer",
  MANUAL = "Manual",
  EVENTS = "Events",
  UNKNOWN = "Unknown",
}

export interface DeviceCommand {
  id: string;
  name?: string;
  type: DeviceCommandType;
  mode?: ApplicationMode;
  message?: string;
}

export enum DeviceCommandType {
  SPEAK = "Speak",
  CHANGE_MODE = "Change mode",
  CHANGE_NAME = "Change name",
  SEND_LOGS = "Send logs",
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
  applicationMode?: ApplicationMode;
  applicationVersion?: string;
  serialStatus: boolean;
  deviceType: DeviceType;
  updated?: StringOrDate;

  constructor() {
    this.mode = DeviceMode.EMIT_USB;
    this.deviceType = DeviceType.MOBILE;
  }
}
