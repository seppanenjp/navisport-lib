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
  updated: Date;
  results?: Result[];

  constructor(id?: string) {
    this.name = "Uusi rata";
    if (id) {
      this.id = id;
    } else {
      this.id = uuid();
    }
    this.controls = [];
    this.distance = 0;
  }
}
