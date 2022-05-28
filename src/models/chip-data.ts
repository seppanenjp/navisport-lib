import { ControlTime } from "./control-time";

export interface LowBatteryWarning {
  code: number;
  warningCount: number;
}

export class ChipData {
  startTime?: number;
  timestamp: number;
  number: string;
  holder: CardHolder = {};
  controlTimes: ControlTime[] = [];
  metadata: Metadata = {};
  constructor(chipNumber?: string) {
    if (chipNumber) {
      this.number = chipNumber;
    }
  }
}

export interface CardHolder {
  name?: string;
  club?: string;
  email?: string;
  gender?: string;
  phoneNumber?: string;
  nationality?: string;
}

export interface Metadata {
  disp1?: string;
  productionWeek?: number;
  productionYear?: number;
  etsInfo?: string;
  numOfDisturbance?: number;
  numOfTests?: number;
  numOfRaces?: number;
}
