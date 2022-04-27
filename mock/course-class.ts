import { CourseClass, CourseClassType, PointSystem } from "../src";
export const courseClass1: CourseClass = {
  id: "a6506e3b-2485-4bf4-b891-0a1526d43116",
  name: "A",
  eventId: "37ba302c-0146-44e8-b88a-0860630b5e4d",
  orderNumber: 1,
  checkpointIds: null,
  courseIds: ["eba4c981-e695-4b2e-bfb5-37419bdd043a"],
  pointSystem: PointSystem.NO_SYSTEM,
  type: CourseClassType.NOT_SPECIFIED,
  penalty: null,
  duration: null,
  updated: "2021-05-28T10:42:36.779Z",
  stages: [],
};

export const courseClass2: CourseClass = {
  id: "49fdb13e-d83c-43cc-b69e-a8747f13312c",
  name: "B",
  eventId: "37ba302c-0146-44e8-b88a-0860630b5e4d",
  orderNumber: 2,
  checkpointIds: null,
  courseIds: ["973b1459-3d60-468e-a758-1a027ca26c17"],
  pointSystem: PointSystem.NO_SYSTEM,
  type: CourseClassType.NOT_SPECIFIED,
  penalty: null,
  duration: null,
  updated: "2021-05-28T10:42:36.779Z",
  stages: [],
};
export const courseClasses: CourseClass[] = [courseClass1, courseClass2];
