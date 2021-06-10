import {
  Control,
  ControlTime,
  CourseClassType,
  getCourseClassCourses,
  getDuration,
  getPenaltyFromMissingControls,
  getPenaltyPoints,
  readerControl,
  validateControlTimes,
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

  const courseClass = TEST_EVENT.courseClasses[0];
  const course = getCourseClassCourses(courseClass, TEST_EVENT.courses)[0];
  const result = TEST_EVENT.results.find(
    (r) => r.classId === courseClass.id && r.courseId === course.id
  );

  const validControlTimes = validateControlTimes(result, courseClass, course);
  const missingControls = [...validControlTimes].splice(
    0,
    validControlTimes.length - 2
  );

  describe("Penalty from missing controls", () => {
    test("No penalty if no missing controls", () => {
      expect(
        getPenaltyFromMissingControls(
          { ...result, parsedControlTimes: validControlTimes },
          { ...courseClass, penalty: 10 },
          course
        )
      ).toEqual(0);
    });

    test("No penalty if courseClass penalty is 0", () => {
      expect(
        getPenaltyFromMissingControls(
          { ...result, parsedControlTimes: missingControls },
          courseClass,
          course
        )
      ).toEqual(0);
    });

    test("No penalty if courseClass is Rogaining", () => {
      expect(
        getPenaltyFromMissingControls(
          { ...result, parsedControlTimes: validControlTimes },
          { ...courseClass, type: CourseClassType.ROGAINING, penalty: 10 },
          course
        )
      ).toEqual(0);
    });

    test("Penalty if courseClass penalty > 0 and missing controls", () => {
      expect(
        getPenaltyFromMissingControls(
          { ...result, parsedControlTimes: missingControls },
          { ...courseClass, penalty: 10 },
          course
        )
      ).toEqual(10);
    });

    test("Penalty if missing controls and control has penalty", () => {
      expect(
        getPenaltyFromMissingControls(
          { ...result, parsedControlTimes: missingControls },
          courseClass,
          {
            ...course,
            controls: course.controls.map((control: Control) => ({
              ...control,
              penalty: 20,
            })),
          }
        )
      ).toEqual(20);
    });

    describe("Penalty points", () => {
      test("No penalty if courseClass is not Rogaining", () => {
        expect(getPenaltyPoints(result, courseClass)).toEqual(0);
      });

      test("No penalty if penalty is 0", () => {
        expect(
          getPenaltyPoints(result, {
            ...courseClass,
            type: CourseClassType.ROGAINING,
          })
        ).toEqual(0);
      });

      test("No penalty if no overtime", () => {
        expect(
          getPenaltyPoints(
            { ...result, time: 3000 },
            {
              ...courseClass,
              type: CourseClassType.ROGAINING,
              penalty: 10,
              duration: 50,
            }
          )
        ).toEqual(0);
      });

      test("Penalty no overtime", () => {
        expect(
          getPenaltyPoints(
            { ...result, time: 3000 },
            {
              ...courseClass,
              type: CourseClassType.ROGAINING,
              penalty: 10,
              duration: 49,
            }
          )
        ).toEqual(10);
      });
    });
  });
});
