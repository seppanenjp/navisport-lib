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
  external: number;
  internal: number;

  constructor() {}
}
