export class Control {
  number?: number;
  code: number | number[];
  distance: number;
  freeOrder: boolean;
  skip: boolean;
  label?: string;
  latitude?: number;
  longitude?: number;
  penalty?: number;

  constructor(
    code: number,
    distance: number = null,
    freeOrder: boolean = false,
    skip: boolean = false,
    label = null
  ) {
    this.code = code;
    this.distance = distance;
    this.freeOrder = freeOrder;
    this.skip = skip;
    this.label = label;
  }
}
