import {
  Control,
  controlLabel,
  courseClassName,
  distanceToControl,
  getCourseClassDistance,
  getCourse,
  getCourseClass,
  getCourseClassControlAmount,
  getCourseClassCourses,
  getEventName,
  isRastilippuEvent,
} from "../../src";
import { TEST_EVENT } from "../../mock/event";
import { Event } from "../../src";

describe("Event tests", () => {
  test("getEventName", () => {
    expect(getEventName(TEST_EVENT)).toBe(
      "Lapland O Week 2020, Etappi 1 - Jääkausiränni"
    );
    expect(getEventName({ ...TEST_EVENT, series: null })).toBe(
      "Etappi 1 - Jääkausiränni"
    );
  });

  test("getCourseClassCourses", () => {
    const courseClass = TEST_EVENT.courseClasses[0];
    expect(
      getCourseClassCourses(courseClass, TEST_EVENT.courses).length
    ).toEqual(1);
    expect(getCourseClassCourses(courseClass, []).length).toEqual(0);
    expect(getCourseClassCourses("", TEST_EVENT.courses).length).toEqual(0);
  });

  test("getCourseClassDistance", () => {
    const courseClass = TEST_EVENT.courseClasses[0];
    expect(getCourseClassDistance(TEST_EVENT.courses, courseClass)).toEqual(
      3700
    );
  });

  test("getCourseClassControlAmount", () => {
    const courseClass = TEST_EVENT.courseClasses[0];
    expect(
      getCourseClassControlAmount(TEST_EVENT.courses, courseClass)
    ).toEqual(24);
    expect(getCourseClassControlAmount([], courseClass)).toEqual(0);
  });

  test("courseClassName", () => {
    const courseClass = TEST_EVENT.courseClasses[0];
    expect(courseClassName(TEST_EVENT.courses, courseClass)).toEqual(
      "A / 3.7km"
    );
  });

  test("distanceToControl", () => {
    const controls = TEST_EVENT.courses[0].controls;
    expect(distanceToControl(controls, controls[10])).toEqual(1606);
  });

  test("getCourseClass", () => {
    const courseClassId = TEST_EVENT.courseClasses[0].id;
    expect(getCourseClass(courseClassId, TEST_EVENT.courseClasses)).toEqual(
      TEST_EVENT.courseClasses[0]
    );
  });

  test("getCourse", () => {
    const courseId = TEST_EVENT.courses[0].id;
    expect(getCourse(courseId, TEST_EVENT.courses)).toEqual(
      TEST_EVENT.courses[0]
    );
  });

  test("controlLabel", () => {
    expect(controlLabel(new Control(31))).toEqual(31);
    expect(controlLabel({ ...new Control(31), label: "32" })).toEqual("32");
  });

  test("isRastilippuEvent", () => {
    expect(isRastilippuEvent(TEST_EVENT)).toEqual(false);
    expect(
      isRastilippuEvent({ ...new Event(), externalApplication: "Rastilippu" })
    ).toEqual(true);
  });
});
