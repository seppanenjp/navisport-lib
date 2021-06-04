import {
  Control,
  controlLabel,
  courseClassName,
  distanceToControl,
  geCourseClassDistance,
  getCourse,
  getCourseClass,
  getCourseClassControlAmount,
  getCourseClassCourses,
  getEventName,
} from "../../src";
import { TEST_EVENT } from "../../mock/event";

describe("Event tests", () => {
  test("Should get correct event name", () => {
    expect(getEventName(TEST_EVENT)).toBe(
      "Lapland O Week 2020, Etappi 1 - Jääkausiränni"
    );
    expect(getEventName({ ...TEST_EVENT, series: null })).toBe(
      "Etappi 1 - Jääkausiränni"
    );
  });

  test("Should get courseClass courses", () => {
    const courseClass = TEST_EVENT.courseClasses[0];
    expect(
      getCourseClassCourses(courseClass, TEST_EVENT.courses).length
    ).toEqual(1);
  });

  test("Should get courseClass distance", () => {
    const courseClass = TEST_EVENT.courseClasses[0];
    expect(geCourseClassDistance(TEST_EVENT.courses, courseClass)).toEqual(
      3700
    );
  });

  test("Should get courseClass control amount", () => {
    const courseClass = TEST_EVENT.courseClasses[0];
    expect(
      getCourseClassControlAmount(TEST_EVENT.courses, courseClass)
    ).toEqual(24);
  });

  test("Should get courseClass name", () => {
    const courseClass = TEST_EVENT.courseClasses[0];
    expect(courseClassName(TEST_EVENT.courses, courseClass)).toEqual(
      "A / 3.7km"
    );
  });

  test("Should get courseClass control amount", () => {
    const controls = TEST_EVENT.courses[0].controls;
    expect(distanceToControl(controls, controls[10])).toEqual(3705);
  });

  test("Should get courseClass", () => {
    const courseClassId = TEST_EVENT.courseClasses[0].id;
    expect(getCourseClass(courseClassId, TEST_EVENT.courseClasses)).toEqual(
      TEST_EVENT.courseClasses[0]
    );
  });

  test("Should get course", () => {
    const courseId = TEST_EVENT.courses[0].id;
    expect(getCourse(courseId, TEST_EVENT.courses)).toEqual(
      TEST_EVENT.courses[0]
    );
  });

  test("Should get control label", () => {
    expect(controlLabel(new Control(31))).toEqual(31);
    expect(controlLabel({ ...new Control(31), label: "32" })).toEqual("32");
  });
});
