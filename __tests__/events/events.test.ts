import {
  Control,
  controlLabel,
  distanceToControl,
  Event,
  getCourse,
  getCourseClass,
  getCourseClassControlAmount,
  getCourseClassCourses,
  getCourseClassDistance,
  getCourseClassName,
  getEventName,
  isRastilippuEvent,
  multiDayEvent,
} from "../../src";
import { TEST_EVENT } from "../../mock/event";
import { courseClass1 } from "../../mock/course-class";
import { course1 } from "../../mock/course";

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
    expect(
      getCourseClassCourses(courseClass1, TEST_EVENT.courses).length
    ).toEqual(1);
    expect(getCourseClassCourses(courseClass1, []).length).toEqual(0);
    expect(getCourseClassCourses("", TEST_EVENT.courses).length).toEqual(0);
  });

  test("getCourseClassDistance", () => {
    expect(getCourseClassDistance(TEST_EVENT.courses, courseClass1)).toEqual(
      3700
    );
  });

  test("getCourseClassControlAmount", () => {
    expect(
      getCourseClassControlAmount(TEST_EVENT.courses, courseClass1)
    ).toEqual(24);
    expect(getCourseClassControlAmount([], courseClass1)).toEqual(0);
  });

  test("getCourseClassName", () => {
    expect(getCourseClassName(TEST_EVENT.courses, courseClass1)).toEqual(
      "A / 3.7km"
    );
  });

  test("distanceToControl", () => {
    const controls = TEST_EVENT.courses[0].controls;
    expect(distanceToControl(controls, controls[10])).toEqual(1606);
    expect(distanceToControl(controls, controls[controls.length + 1])).toEqual(
      0
    );
  });

  test("getCourseClass", () => {
    expect(getCourseClass(courseClass1.id, TEST_EVENT.courseClasses)).toEqual(
      courseClass1
    );
  });

  test("getCourse", () => {
    expect(getCourse(course1.id, TEST_EVENT.courses)).toEqual(course1);
  });

  test("controlLabel", () => {
    expect(controlLabel(new Control(31))).toEqual(31);
    expect(controlLabel({ ...new Control(31), label: "32" })).toEqual("32");
  });

  test("isRastilippuEvent", () => {
    expect(isRastilippuEvent(TEST_EVENT)).toBeFalsy();
    expect(
      isRastilippuEvent({ ...new Event(), externalApplication: "Rastilippu" })
    ).toBeTruthy();
  });

  test("multiDayEvent", () => {
    expect(multiDayEvent(TEST_EVENT)).toBeFalsy();
    expect(
      multiDayEvent({
        ...new Event(),
        begin: "2000-01-01T10:00:00Z",
        ending: "2000-01-02T10:00:00Z",
      })
    );
  });
});
