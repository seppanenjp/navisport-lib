export interface MapInformation {
  scale: number;
  positionTopLeft: MapPosition;
  positionTopRight: MapPosition;
  positionBottomLeft: MapPosition;
  positionBottomRight: MapPosition;
  controlInformation: ControlInformation[];
}

export interface MapPosition {
  latitude: number;
  longitude: number;
}
export interface ControlInformation {
  id: string;
  latitude: number;
  longitude: number;
  type: ControlInformationType;
}

export enum ControlInformationType {
  START = "Start",
  CONTROL = "Control",
  FINISH = "Finish",
}
