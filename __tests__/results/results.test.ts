import {
  Control,
  ControlTime,
  CourseClassType,
  getDuration,
  getIOFStatus,
  getMissingControls,
  getPenaltyFromMissingControls,
  getPenaltyPoints,
  getResultTime,
  getRogainingPoints,
  getStartTime,
  PointSystem,
  readerControl,
  ResultStatus,
  validateControlTimes,
  getTimeOffset,
} from "../../src";
import { courseClass1 } from "../../mock/course-class";
import { course1, courses } from "../../mock/course";
import { result1 } from "../../mock/result";

describe("Result tests", () => {
  const validControlTimes = validateControlTimes(
    result1,
    courseClass1,
    course1,
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
          { ...result1, parsedControlTimes: validControlTimes },
          { ...courseClass1, penalty: 10 },
          course1
        )
      ).toEqual(0);
    });

    test("No penalty if courseClass penalty is 0", () => {
      expect(
        getPenaltyFromMissingControls(
          { ...result1, parsedControlTimes: missingControls },
          courseClass1,
          course1
        )
      ).toEqual(0);
    });

    test("No penalty if courseClass is Rogaining", () => {
      expect(
        getPenaltyFromMissingControls(
          { ...result1, parsedControlTimes: validControlTimes },
          { ...courseClass1, type: CourseClassType.ROGAINING, penalty: 10 },
          course1
        )
      ).toEqual(0);
    });

    test("Penalty if courseClass penalty > 0 and missing controls", () => {
      expect(
        getPenaltyFromMissingControls(
          { ...result1, parsedControlTimes: missingControls },
          { ...courseClass1, penalty: 10 },
          course1
        )
      ).toEqual(10);
    });

    test("Penalty if missing controls and control has penalty", () => {
      expect(
        getPenaltyFromMissingControls(
          { ...result1, parsedControlTimes: missingControls },
          courseClass1,
          {
            ...course1,
            controls: course1.controls.map((control: Control) => ({
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
      expect(getPenaltyPoints(result1, courseClass1)).toEqual(0);
    });

    test("No penalty if penalty is 0", () => {
      expect(
        getPenaltyPoints(result1, {
          ...courseClass1,
          type: CourseClassType.ROGAINING,
        })
      ).toEqual(0);
    });

    test("No penalty if no overtime", () => {
      expect(
        getPenaltyPoints(
          { ...result1, time: 3000 },
          {
            ...courseClass1,
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
          { ...result1, time: 3000 },
          {
            ...courseClass1,
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
    expect(getMissingControls(result1, courses).length).toEqual(0);

    expect(
      getMissingControls(
        { ...result1, parsedControlTimes: validControlTimes },
        courses
      ).length
    ).toEqual(0);

    expect(
      getMissingControls(
        { ...result1, parsedControlTimes: missingControls },
        courses
      ).length
    ).toEqual(1);
  });

  test("getStartTime", () => {
    const resultStartTime = "2021-01-01T10:00:00Z";
    const courseClassStartTime = "2021-01-01T12:00:00Z";

    expect(getStartTime(result1, courseClass1)).toEqual("");

    expect(
      getStartTime({ ...result1, startTime: resultStartTime }, courseClass1)
    ).toEqual(resultStartTime);

    expect(
      getStartTime(result1, {
        ...courseClass1,
        massStartTime: courseClassStartTime,
      })
    ).toEqual(courseClassStartTime);

    expect(
      getStartTime(
        { ...result1, startTime: resultStartTime },
        { ...courseClass1, massStartTime: courseClassStartTime }
      )
    ).toEqual(courseClassStartTime);
  });

  test("getRogainingPoints", () => {
    expect(
      getRogainingPoints(
        result1.controlTimes,
        course1.controls,
        PointSystem.NO_SYSTEM
      )
    ).toEqual(0);

    expect(
      getRogainingPoints(
        result1.controlTimes,
        course1.controls,
        PointSystem.FIRST_CODE
      )
    ).toEqual(101);

    expect(
      getRogainingPoints(
        result1.controlTimes,
        course1.controls,
        PointSystem.LAST_CODE
      )
    ).toEqual(105);

    expect(
      getRogainingPoints(
        result1.controlTimes,
        course1.controls,
        PointSystem.ONE_POINT
      )
    ).toEqual(24);
  });

  test("getResultTime", () => {
    expect(getResultTime(result1, courseClass1, course1)).toEqual(1526);
    expect(
      getResultTime(
        { ...result1, additionalPenalty: 10 },
        courseClass1,
        course1
      )
    ).toEqual(1536);
    expect(
      getResultTime(
        { ...result1, status: ResultStatus.NOTIME },
        courseClass1,
        course1
      )
    ).toEqual(0);
    expect(
      getResultTime(
        { ...result1, status: ResultStatus.DNS },
        courseClass1,
        course1
      )
    ).toEqual(0);
  });

  test("getTimeOffset", () => {
    expect(getTimeOffset(result1, courseClass1)).toEqual(0);
    expect(
      getTimeOffset(
        { ...result1, startTime: result1.registerTime },
        courseClass1
      )
    ).toEqual(-154);
  });

  /*  test("calculatePoints", () => {
    calculatePoints(TEST_EVENT.results.splice(0, 5), {
      ok:
        "1000 - (([RESULT].time - [FIRST_RESULT].time) / [FIRST_RESULT].time) * 1000",
      notOk: "1",
    });
  });*/
});
