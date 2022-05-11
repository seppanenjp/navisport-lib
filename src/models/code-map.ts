export class CodeMap {
  id: string;
  organisationId: string;
  name: string;
  codes: CodeMapCode[];
  updated?: string; // Date;

  constructor() {
    this.codes = [];
  }
}

export class CodeMapCode {
  external: string | number;
  internal: number | number[];
}
