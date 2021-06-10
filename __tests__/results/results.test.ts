import {
  ControlTime,
  getDuration,
  readerControl,
  getCourseClassCourses,
  getPenaltyFromMissingControls,
} from "../../src";
import { TEST_EVENT } from "../../mock/event";

describe("Result tests", () => {
  test("Should check correct reader control", () => {
    expect(readerControl(new ControlTime(31, 100))).toEqual(false);
    expect(readerControl(new ControlTime(250, 100))).toEqual(true);
  });

  test("Should get correct duration", () => {
    // Input minutes ->  Returns seconds
    expect(getDuration({ duration: 100 })).toEqual(6000);
    expect(
      getDuration({
        massStartTime: "2020-01-01T10:00:00Z",
        finishClosingTime: "2020-01-01T12:00:00Z",
      })
    ).toEqual(7200);

    expect(getDuration({})).toEqual(Number.MAX_SAFE_INTEGER);
  });

  describe("Should get penalty from missing controls", () => {
    test("No penalty if no missing controls", () => {
      const courseClass = TEST_EVENT.courseClasses[0];
      const course = getCourseClassCourses(courseClass, TEST_EVENT.courses)[0];
      const result = TEST_EVENT.results.find(
        (r) => r.classId === courseClass.id && r.courseId === course.id
      );
      expect(
        getPenaltyFromMissingControls(result, courseClass, course)
      ).toEqual(0);
    });

    test("No penalty if courseClass penalty is 0", () => {});

    test("No penalty if courseClass is Rogaining", () => {});

    test("Penalty if courseClass penalty > 0 and missing controls", () => {});
  });
});
