import { StringOrDate } from "./date";

export enum ControlTimeStatus {
  CHECKED = "Checked",
}

export interface ControlTime {
  code: number;
  time: number;

  offsetTime?: number;

  number?: number;

  difference?: number; // Leg difference if relay
  position?: number; // Leg position if relay

  totalPosition?: number; // For relay
  totalDifference?: number; // For relay

  status?: ControlTimeStatus;

  timestamp?: StringOrDate;

  split?: {
    pace?: number;
    distance?: number;
    time: number;
    position?: number;
    difference?: number;
  };
}
