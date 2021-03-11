export enum ControlTimeStatus {
  CHECKED = "Checked",
}

export class ControlTime {
  number: number;
  code: number;
  time: number;
  difference?: number;
  position?: number;
  status?: ControlTimeStatus;
  split?: {
    time: number;
    position?: number;
    difference?: number;
  };

  constructor(code: number, time: number, controlNumber?: number) {
    this.code = code;
    this.time = time;
    this.number = controlNumber;
  }
}
