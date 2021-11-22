import {
  checkedControlTime,
  Control,
  ControlTime,
  ControlTimeStatus,
  CourseClassType,
  formatResultTime,
  getDuration,
  getIOFStatus,
  getMissingControls,
  getPenaltyFromMissingControls,
  getPenaltyPoints,
  getResultTime,
  getRogainingPoints,
  getStartTime,
  getStatusWeight,
  getTimeOffset,
  PointSystem,
  readerControl,
  ResultStatus,
  validateControlTimes,
  clone,
} from "../../src";
import { courseClass1 } from "../../mock/course-class";
import { course1, courses } from "../../mock/course";
import { result1 } from "../../mock/result";
import { last } from "lodash";

describe("Result tests", () => {
  const validControlTimes = validateControlTimes(
    result1,
    courseClass1,
    course1,
    0
  );

  // Missing first control
  const missingControls = [...validControlTimes].splice(
    1,
    validControlTimes.length
  );

  describe("validateControlTimes", () => {
    test("All punched controls should have correct number", () => {
      expect(
        validControlTimes.filter((controlTime: ControlTime) =>
          Boolean(controlTime.number)
        ).length
      ).toEqual(course1.controls.length);
      expect(validControlTimes[validControlTimes.length - 2].number).toEqual(
        course1.controls.length
      );

      expect(
        validControlTimes.filter((controlTime: ControlTime) =>
          Boolean(controlTime.number)
        ).length
      ).toEqual(course1.controls.length);

      expect(missingControls[0].number).toEqual(2);
    });

    /*test("Validate all controls if Rogaining", () => {
      const rogainingClass = {
        ...courseClass1,
        type: CourseClassType.ROGAINING,
      };

      // expect(validateControlTimes(result1, course1, rogainingClass))
    });*/

    test("Checked control times have correct number", () => {
      const controlTimes = clone(result1.controlTimes);
      controlTimes[4].status = ControlTimeStatus.CHECKED;
      controlTimes[4].time = 0;

      const checkedControlTimes = validateControlTimes(
        { ...result1, controlTimes },
        courseClass1,
        course1,
        0
      );

      expect(
        checkedControlTimes.filter((controlTime: ControlTime) =>
          Boolean(controlTime.number)
        ).length
      ).toEqual(course1.controls.length);

      expect(checkedControlTimes[4].number).toEqual(5);
    });

    test("Controls with freeOrder are validated correctly", () => {
      const controls = clone(course1.controls);
      controls[2].freeOrder = true;
      controls[3].freeOrder = true;

      // Swap controls
      [controls[2], controls[3]] = [controls[3], controls[2]];

      const validControlTimesWithFreeOrder = validateControlTimes(
        result1,
        courseClass1,
        { ...course1, controls },
        0
      ).filter((controlTime: ControlTime) => Boolean(controlTime.number));

      expect(
        validControlTimesWithFreeOrder.filter((controlTime: ControlTime) =>
          Boolean(controlTime.number)
        ).length
      ).toEqual(course1.controls.length);

      expect(validControlTimesWithFreeOrder[2].number).toEqual(4);
      expect(validControlTimesWithFreeOrder[3].number).toEqual(3);
    });

    test("Controls with skip should reduce control times", () => {
      const controls = clone(course1.controls);
      controls[2].skip = true;
      controls[3].skip = true;

      const validControlTimesWithSkip = validateControlTimes(
        result1,
        courseClass1,
        { ...course1, controls },
        0
      );

      expect(validControlTimes[2].split.time).toEqual(33);
      expect(validControlTimes[3].split.time).toEqual(50);

      expect(validControlTimesWithSkip[2].split.time).toEqual(0);
      expect(validControlTimesWithSkip[3].split.time).toEqual(0);

      expect(validControlTimes[4].time).toEqual(265);
      expect(validControlTimes[4].split.time).toEqual(
        validControlTimes[4].time - validControlTimes[3].time
      );

      expect(validControlTimesWithSkip[4].time).toEqual(182);
      expect(validControlTimesWithSkip[4].split.time).toEqual(
        // Split should be calculated from 1 to 4 since we skip 2 and 3
        validControlTimesWithSkip[4].time - validControlTimesWithSkip[1].time
      );
    });

    test("Control times should have correct offset times", () => {
      const validControlTimesWithOffset = validateControlTimes(
        result1,
        courseClass1,
        course1,
        100
      );
      expect(
        validControlTimes[3].time - validControlTimesWithOffset[3].time
      ).toEqual(100);

      // Even offset time changes split times should be same as without offset
      expect(
        validControlTimes[3].split.time -
          validControlTimesWithOffset[3].split.time
      ).toEqual(0);
    });

    // TODO: much more tests here!
  });

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

  test("readerControl", () => {
    expect(result1.controlTimes.find(readerControl)).toEqual(
      last(result1.controlTimes)
    );
  });

  test("checkedControlTime", () => {
    const checked: ControlTime = {
      code: 999,
      time: 10,
      status: ControlTimeStatus.CHECKED,
    };

    const checked2: ControlTime = {
      code: 999,
      time: -1,
    };

    expect([...result1.controlTimes, checked].find(checkedControlTime)).toEqual(
      checked
    );
    expect(
      [...result1.controlTimes, checked2].find(checkedControlTime)
    ).toEqual(checked2);

    expect(checkedControlTime(undefined)).toEqual(false);
  });

  test("formatResultTime", () => {
    expect(formatResultTime(result1)).toEqual("22:43");
    expect(
      formatResultTime({ ...result1, status: ResultStatus.NOTIME })
    ).toEqual("-");
    expect(formatResultTime({ ...result1, time: null })).toEqual("-");
  });

  test("getStatusWeight", () => {
    expect(getStatusWeight(ResultStatus.OK)).toEqual(1);
    expect(getStatusWeight(ResultStatus.DSQ)).toEqual(2);
    expect(getStatusWeight(ResultStatus.DNF)).toEqual(3);
    expect(getStatusWeight(ResultStatus.NOTIME)).toEqual(4);
    expect(getStatusWeight(ResultStatus.MANUAL)).toEqual(1);
    expect(getStatusWeight(ResultStatus.DNS)).toEqual(5);
    expect(getStatusWeight("Foo" as ResultStatus)).toEqual(6);
  });
  /*  test("calculatePoints", () => {
    calculatePoints(TEST_EVENT.results.splice(0, 5), {
      ok:
        "1000 - (([RESULT].time - [FIRST_RESULT].time) / [FIRST_RESULT].time) * 1000",
      notOk: "1",
    });
  });*/
});
