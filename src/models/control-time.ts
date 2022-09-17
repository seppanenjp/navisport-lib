export enum ControlTimeStatus {
  CHECKED = "Checked",
}

export interface ControlTime {
  code: number;
  time: number;

  timeWithOffset?: number;

  number?: number;

  difference?: number; // Leg difference if relay
  position?: number; // Leg position if relay

  totalPosition?: number; // For relay
  totalDifference?: number; // For relay

  status?: ControlTimeStatus;

  timestamp?: Date;

  split?: {
    pace?: number;
    distance?: number;
    time: number;
    position?: number;
    difference?: number;
  };
}
