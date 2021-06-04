import { Control } from "./control";
import { Result } from "./result";
import { v4 as uuid } from "uuid";

export class Course {
  id: string;
  eventId: string;
  name: string;
  startNumber?: string;
  distance?: number;
  controls?: Control[];
  updated: string; // Date;
  results?: Result[];

  constructor(id?: string) {
    this.name = "Uusi rata";
    this.id = id || uuid();
    this.controls = [];
    this.distance = 0;
  }
}
