import { Course } from "./course";
import { Checkpoint } from "./checkpoint";
import { Result } from "./result";

export enum CourseClassType {
  NOT_SPECIFIED = "Not specified",
  ROGAINING = "Rogaining",
}

export enum PointSystem {
  FIRST_CODE = "First code",
  LAST_CODE = "Last code",
  ONE_POINT = "One point",
  NO_SYSTEM = "No system",
}

export class CourseClass {
  id: string;
  name: string;
  eventId: string;
  orderNumber: number;
  legs?: number;
  massStartTime?: Date;
  secondMassStartTime?: Date;
  finishClosingTime?: Date;
  firstStartNumber?: number;
  firstStartTime?: Date;
  startInterval?: number;
  checkpoints?: Checkpoint[];
  checkpointIds: string[];
  courseIds: string[]; // Create sloppy relation
  pointSystem: PointSystem;
  type: CourseClassType;
  penalty?: number;
  duration?: number;
  results?: Result[];
  courses?: Course[];
  updated?: Date;

  constructor(name = "Uusi sarja") {
    this.name = name;
    this.pointSystem = PointSystem.NO_SYSTEM;
    this.type = CourseClassType.NOT_SPECIFIED;
    this.courseIds = [];
  }
}
