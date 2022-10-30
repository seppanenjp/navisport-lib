import { Control } from "./control";
import { Result } from "./result";
import { v4 as uuid } from "uuid";
import { StringOrDate } from "./date";

export class Course {
  id: string;
  eventId: string;
  name: string;
  startNumber?: string;
  distance?: number;
  controls?: Control[];
  updated: StringOrDate;
  results?: Result[];

  constructor(id?: string) {
    this.name = "Uusi rata";
    this.id = id || uuid();
    this.controls = [];
    this.distance = 0;
  }
}
