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
  getIOFStatus,
  ResultStatus,
  getMissingControls,
  getStartTime,
  calculatePoints,
} from "../../src";
import { TEST_EVENT } from "../../mock/event";

describe("Result tests", () => {
  const courseClass = TEST_EVENT.courseClasses[0];
  const course = getCourseClassCourses(courseClass, TEST_EVENT.courses)[0];
  const result = TEST_EVENT.results.find(
    (r) => r.classId === courseClass.id && r.courseId === course.id
  );
  const validControlTimes = validateControlTimes(
    result,
    courseClass,
    course,
    0
  );
  const missingControls = [...validControlTimes].splice(
    0,
    validControlTimes.length - 2
  );

  test("readerControl", () => {
    expect(readerControl(new ControlTime(31, 100))).toEqual(false);
    expect(readerControl(new ControlTime(250, 100))).toEqual(true);
  });

  test("getDuration", () => {
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

  describe("getPenaltyFromMissingControls", () => {
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
  });

  describe("getPenaltyPoints", () => {
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

  test("getIOFStatus", () => {
    expect(getIOFStatus(ResultStatus.OK)).toEqual("OK");
    expect(getIOFStatus(ResultStatus.DSQ)).toEqual("Disqualified");
    expect(getIOFStatus(ResultStatus.DNF)).toEqual("DidNotFinish");
    expect(getIOFStatus(ResultStatus.NOTIME)).toEqual("NotCompeting");
    expect(getIOFStatus(ResultStatus.MANUAL)).toEqual("NotCompeting");
    expect(getIOFStatus(ResultStatus.DNS)).toEqual("NotCompeting");
    expect(getIOFStatus("Foo" as ResultStatus)).toEqual("Inactive");
  });

  test("getMissingControls", () => {
    expect(getMissingControls(result, TEST_EVENT.courses).length).toEqual(0);

    expect(
      getMissingControls(
        { ...result, parsedControlTimes: validControlTimes },
        TEST_EVENT.courses
      ).length
    ).toEqual(0);

    expect(
      getMissingControls(
        { ...result, parsedControlTimes: missingControls },
        TEST_EVENT.courses
      ).length
    ).toEqual(1);
  });

  test("getStartTime", () => {
    const resultStartTime = "2021-01-01T10:00:00Z";
    const courseClassStartTime = "2021-01-01T12:00:00Z";

    expect(getStartTime(result, courseClass)).toEqual("");

    expect(
      getStartTime({ ...result, startTime: resultStartTime }, courseClass)
    ).toEqual(resultStartTime);

    expect(
      getStartTime(result, {
        ...courseClass,
        massStartTime: courseClassStartTime,
      })
    ).toEqual(courseClassStartTime);

    expect(
      getStartTime(
        { ...result, startTime: resultStartTime },
        { ...courseClass, massStartTime: courseClassStartTime }
      )
    ).toEqual(courseClassStartTime);
  });

  /*  test("calculatePoints", () => {
    calculatePoints(TEST_EVENT.results.splice(0, 5), {
      ok:
        "1000 - (([RESULT].time - [FIRST_RESULT].time) / [FIRST_RESULT].time) * 1000",
      notOk: "1",
    });
  });*/
});
