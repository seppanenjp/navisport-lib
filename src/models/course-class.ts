import { Course } from "./course";
import { Checkpoint } from "./checkpoint";
import { Result } from "./result";
import { uuid } from "../utils/common";
import { StringOrDate } from "./date";

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

export interface CourseClassStage {
  classId: string;
  orderNumber: number;
  qualifyCount?: number;
}

export class CourseClass {
  id: string;
  name: string;
  eventId: string;
  orderNumber: number;
  legs?: number;
  massStartTime?: StringOrDate;
  secondMassStartTime?: StringOrDate;
  finishClosingTime?: StringOrDate;
  firstStartNumber?: number;
  firstStartTime?: StringOrDate;
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
  stages: CourseClassStage[];
  updated?: StringOrDate;

  constructor(name = "Uusi sarja") {
    this.id = uuid();
    this.name = name;
    this.pointSystem = PointSystem.NO_SYSTEM;
    this.type = CourseClassType.NOT_SPECIFIED;
    this.courseIds = [];
    this.stages = [];
  }
}
