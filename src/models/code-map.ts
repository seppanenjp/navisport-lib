import { StringOrDate } from "./date";

export class CodeMap {
  id: string;
  organisationId: string;
  name: string;
  codes: CodeMapCode[];
  updated?: StringOrDate;

  constructor() {
    this.codes = [];
  }
}

export class CodeMapCode {
  external: string | number;
  internal: number | number[];
}
