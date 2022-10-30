import {
  calculatePoints,
  checkedControlTime,
  clearControlNumbers,
  clone,
  Control,
  ControlTime,
  ControlTimeStatus,
  countByStatus,
  CourseClassType,
  formatResultTime,
  getDuration,
  getMissingControls,
  getPenaltyFromMissingControls,
  getPenaltyPoints,
  getResultPositionAndDifference,
  getResultTime,
  getResultTimeDifference,
  getRogainingPoints,
  getStartTime,
  getStatusWeight,
  getTimeOffset,
  isFinishedRelayResult,
  isLoopControl,
  listLowBatteryWarnings,
  LoopControlType,
  parseResult,
  PointSystem,
  readerControl,
  resultSort,
  ResultStatus,
  validateControlTimes,
  pseudonymize,
} from "../../src";
import { courseClass1 } from "../../mock/course-class";
import { course1, courses } from "../../mock/course";
import { result1, result2, result3, results } from "../../mock/result";
import { last } from "lodash";
import { TEST_EVENT } from "../../mock/event";

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

      expect(validControlTimes[4].offsetTime).toEqual(265);
      expect(validControlTimes[4].split.time).toEqual(
        validControlTimes[4].offsetTime - validControlTimes[3].offsetTime
      );

      expect(validControlTimesWithSkip[4].offsetTime).toEqual(182);
      expect(validControlTimesWithSkip[4].split.time).toEqual(
        // Split should be calculated from 1 to 4 since we skip 2 and 3
        validControlTimesWithSkip[4].offsetTime -
          validControlTimesWithSkip[1].offsetTime
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
        validControlTimes[3].offsetTime -
          validControlTimesWithOffset[3].offsetTime
      ).toEqual(100);

      // Even offset time changes split times should be same as without offset
      expect(
        validControlTimes[3].split.time -
          validControlTimesWithOffset[3].split.time
      ).toEqual(0);
    });

    test("Should be valid with disabled control", () => {
      const controls = clone(course1.controls);
      const controlTimes = [...result1.controlTimes].splice(
        1,
        result1.controlTimes.length
      );
      controls[0].disabled = true;

      const controlTimesWithDisabledControl = validateControlTimes(
        { ...result1, controlTimes },
        courseClass1,
        {
          ...course1,
          controls,
        },
        0
      );
      expect(
        controlTimesWithDisabledControl.filter((controlTime: ControlTime) =>
          Boolean(controlTime.number)
        ).length
      ).toEqual(course1.controls.length);

      expect(
        controlTimesWithDisabledControl.find(
          (controlTime: ControlTime) => controlTime.code === controls[0].code
        )
      ).toBeDefined();
    });

    test("Should not modify controlTime default values", () => {
      const controlTimes1 = validateControlTimes(
        result1,
        courseClass1,
        course1,
        100
      );
      const controlTimes2 = validateControlTimes(
        { ...result1, controlTimes: controlTimes1 },
        courseClass1,
        course1,
        100
      );
      expect(controlTimes1).toEqual(controlTimes2);
    });
  });

  test("readerControl", () => {
    expect(readerControl({ code: 31, offsetTime: 100, time: 100 })).toBeFalsy();
    expect(
      readerControl({ code: 250, offsetTime: 100, time: 100 })
    ).toBeTruthy();
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
          { ...result1, controlTimes: validControlTimes },
          { ...courseClass1, penalty: 10 },
          course1
        )
      ).toEqual(0);
    });

    test("No penalty if courseClass penalty is 0", () => {
      expect(
        getPenaltyFromMissingControls(
          { ...result1, controlTimes: missingControls },
          courseClass1,
          course1
        )
      ).toEqual(0);
    });

    test("No penalty if courseClass is Rogaining", () => {
      expect(
        getPenaltyFromMissingControls(
          { ...result1, controlTimes: validControlTimes },
          { ...courseClass1, type: CourseClassType.ROGAINING, penalty: 10 },
          course1
        )
      ).toEqual(0);
    });

    test("Penalty if courseClass penalty > 0 and missing controls", () => {
      expect(
        getPenaltyFromMissingControls(
          { ...result1, controlTimes: missingControls },
          { ...courseClass1, penalty: 10 },
          course1
        )
      ).toEqual(10);
    });

    test("Penalty if missing controls and control has penalty", () => {
      expect(
        getPenaltyFromMissingControls(
          { ...result1, controlTimes: missingControls },
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

    test("Additional penalty", () => {
      expect(
        getPenaltyPoints(
          { ...result1, additionalPenalty: 10 },
          {
            ...courseClass1,
            penalty: undefined,
          }
        )
      ).toEqual(10);
    });
  });

  test("getMissingControls", () => {
    expect(
      getMissingControls(
        { ...result1, controlTimes: validControlTimes },
        courses
      ).length
    ).toEqual(0);

    expect(
      getMissingControls({ ...result1, controlTimes: missingControls }, courses)
        .length
    ).toEqual(1);

    expect(
      getMissingControls({ ...result1, controlTimes: missingControls }, [
        { ...course1, controls: [] },
      ]).length
    ).toEqual(0);
    expect(
      getMissingControls({ ...result1, controlTimes: missingControls }, [])
        .length
    ).toEqual(0);
  });

  test("getStartTime", () => {
    const resultStartTime = "2021-01-01T10:00:00.000Z";
    const courseClassStartTime = "2021-01-01T12:00:00.000Z";

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
    const testResult = clone(result1);
    parseResult(testResult, courseClass1, course1);
    expect(
      getRogainingPoints(
        testResult.controlTimes,
        course1.controls,
        PointSystem.NO_SYSTEM
      )
    ).toEqual(0);

    expect(
      getRogainingPoints(
        testResult.controlTimes,
        course1.controls,
        PointSystem.FIRST_CODE
      )
    ).toEqual(101);

    expect(
      getRogainingPoints(
        testResult.controlTimes,
        course1.controls,
        PointSystem.LAST_CODE
      )
    ).toEqual(115);

    expect(
      getRogainingPoints(
        testResult.controlTimes,
        course1.controls,
        PointSystem.ONE_POINT
      )
    ).toEqual(24);

    // Should work when punched same control again and course does not have same control two times
    expect(
      getRogainingPoints(
        [...testResult.controlTimes, testResult.controlTimes[0]],
        course1.controls,
        PointSystem.ONE_POINT
      )
    ).toEqual(24);
  });

  test("getResultTime", () => {
    expect(getResultTime(result1, courseClass1, course1)).toEqual(1526);
    expect(
      getResultTime(
        { ...result1, startTime: "2022-01-01 10:00:00", readTime: null },
        courseClass1,
        course1
      )
    ).toEqual(0);
    expect(
      getResultTime(
        {
          ...result1,
          startTime: "2022-01-01 10:00:00",
          finishTime: "2022-01-01 10:12:05",
        },
        courseClass1,
        course1
      )
    ).toEqual(725);
    expect(
      getResultTime(
        { ...result1, additionalPenalty: 10 },
        courseClass1,
        course1
      )
    ).toEqual(2126);
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
    // Expect to work with negative time
    expect(
      getResultTime(
        {
          ...result1,
          startTime: "2022-01-01 10:00:00",
          readTime: "2022-01-01 09:00:00",
        },
        courseClass1,
        course1
      )
    ).toEqual(0);

    expect(
      getResultTime(
        {
          ...result1,
          startTime: "2022-01-01 10:00:00",
          finishTime: "2022-01-01 09:00:00",
        },
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
      offsetTime: 10,
      time: 10,
      status: ControlTimeStatus.CHECKED,
    };

    const checked2: ControlTime = {
      code: 999,
      offsetTime: -1,
      time: -1,
    };

    expect([...result1.controlTimes, checked].find(checkedControlTime)).toEqual(
      checked
    );
    expect(
      [...result1.controlTimes, checked2].find(checkedControlTime)
    ).toEqual(checked2);

    expect(checkedControlTime(undefined)).toBeFalsy();
  });

  test("formatResultTime", () => {
    expect(formatResultTime(result1)).toEqual("22:43");
    expect(formatResultTime({ status: ResultStatus.NOTIME, time: 50 })).toEqual(
      "-"
    );
    expect(formatResultTime({ status: ResultStatus.OK, time: null })).toEqual(
      "-"
    );
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

  test("calculatePoints", () => {
    calculatePoints(TEST_EVENT.results, {
      ok: "1000 - (([RESULT].time - [FIRST_RESULT].time) / [FIRST_RESULT].time) * 1000",
      notOk: "1",
    });
    expect(TEST_EVENT.results[0].points).toEqual(1000);
    expect(TEST_EVENT.results[1].points).toEqual(853);
    expect(TEST_EVENT.results[2].points).toEqual(1);

    calculatePoints(TEST_EVENT.results, {});
    expect(TEST_EVENT.results[2].points).toEqual(null);
  });

  test("countByStatus", () => {
    expect(countByStatus(TEST_EVENT.results, ResultStatus.OK)).toEqual(2);
    expect(countByStatus(TEST_EVENT.results, ResultStatus.DSQ)).toEqual(1);
    expect(countByStatus(TEST_EVENT.results, ResultStatus.DNF)).toEqual(0);
  });

  test("clearControlNumbers", () => {
    const controlTimesWithNumbers = validateControlTimes(
      result1,
      courseClass1,
      course1,
      0
    );
    expect(
      controlTimesWithNumbers.some(
        (controlTime: ControlTime) => controlTime.number
      )
    ).toBeTruthy();
    const controlTimesWithoutNumbers = clearControlNumbers(
      controlTimesWithNumbers
    );
    expect(
      controlTimesWithoutNumbers.some(
        (controlTime: ControlTime) => controlTime.number
      )
    ).toBeFalsy();
  });

  test("getResultPositionAndDifference", () => {
    expect(getResultPositionAndDifference(result1, results)).toEqual({
      position: 1,
      difference: 0,
    });
    expect(getResultPositionAndDifference(result1, [])).toEqual({
      position: 1,
      difference: 0,
    });
    expect(getResultPositionAndDifference(result2, results)).toEqual({
      position: 2,
      difference: 200,
    });
    expect(getResultPositionAndDifference(result3, results)).toEqual({
      position: 3,
      difference: 0,
    });
  });

  test("getResultTimeDifference", () => {
    expect(getResultTimeDifference(result1, results)).toEqual(0);
    expect(getResultTimeDifference(result2, results)).toEqual(200);
    expect(getResultTimeDifference(result2, [])).toEqual(0);
  });

  test("resultSort", () => {
    expect(resultSort(result1, result2)).toEqual(-1);
    expect(resultSort(result2, result1)).toEqual(1);
    expect(resultSort(result2, result3)).toEqual(-1);
    expect(resultSort(result3, result2)).toEqual(1);
    expect(resultSort({ ...result2, points: 10 }, result1)).toEqual(-1);
    expect(resultSort(result2, { ...result1, points: 50 })).toEqual(1);
    expect(resultSort({ ...result2, time: 0 }, result1)).toEqual(1);
    expect(resultSort(result2, { ...result1, time: 0 })).toEqual(-1);
    expect(resultSort(result1, result1)).toEqual(0);
    expect([...results].sort(resultSort)).toEqual(results);
    expect([result2, result3, result1].sort(resultSort)).toEqual(results);
  });

  test("listLowBatteryWarnings", () => {
    expect(listLowBatteryWarnings(results)).toEqual([]);
    const resultWithLowBattery1 = clone(result1);
    const resultWithLowBattery2 = clone(result2);
    resultWithLowBattery1.controlTimes[3] = {
      code: 99,
      offsetTime: resultWithLowBattery1.controlTimes[2].offsetTime,
      time: resultWithLowBattery1.controlTimes[2].time,
    };
    resultWithLowBattery2.controlTimes[3] = {
      code: 99,
      offsetTime: resultWithLowBattery2.controlTimes[2].offsetTime,
      time: resultWithLowBattery2.controlTimes[2].time,
    };
    resultWithLowBattery2.controlTimes[8] = {
      code: 99,
      offsetTime: resultWithLowBattery2.controlTimes[7].offsetTime,
      time: resultWithLowBattery2.controlTimes[7].time,
    };

    expect(listLowBatteryWarnings([resultWithLowBattery1, result2])).toEqual([
      { code: resultWithLowBattery1.controlTimes[2].code, warningCount: 1 },
    ]);

    expect(
      listLowBatteryWarnings([resultWithLowBattery1, resultWithLowBattery2])
    ).toEqual([
      { code: resultWithLowBattery1.controlTimes[2].code, warningCount: 2 },
      { code: resultWithLowBattery2.controlTimes[7].code, warningCount: 1 },
    ]);

    // Should not trigger warning if control is not known (same timestamp as 99 control)
    resultWithLowBattery2.controlTimes[3] = {
      code: 99,
      offsetTime: resultWithLowBattery2.controlTimes[2].time + 2,
      time: resultWithLowBattery2.controlTimes[2].time + 2,
    };
    expect(
      listLowBatteryWarnings([resultWithLowBattery1, resultWithLowBattery2])
    ).toEqual([
      { code: resultWithLowBattery1.controlTimes[2].code, warningCount: 1 },
      { code: resultWithLowBattery2.controlTimes[7].code, warningCount: 1 },
    ]);

    // Should work with result without controlTimes

    expect(
      listLowBatteryWarnings([{ ...resultWithLowBattery1, controlTimes: null }])
    ).toEqual([]);
  });

  test("isLoopControl", () => {
    const controls = clone(course1.controls);
    expect(
      isLoopControl(controls[3], controls, LoopControlType.Begin)
    ).toBeFalsy();
    controls[3].code = 41;
    const loopControls = controls.filter(
      (control: Control) => control.code === 41
    );
    expect(
      isLoopControl(loopControls[0], controls, LoopControlType.Begin)
    ).toBeTruthy();
    expect(
      isLoopControl(loopControls[1], controls, LoopControlType.Begin)
    ).toBeFalsy();
    expect(
      isLoopControl(loopControls[1], controls, LoopControlType.End)
    ).toBeTruthy();
  });

  test("pseudonymize", () => {
    const publicResult = { ...result1, private: false };
    pseudonymize(publicResult);
    expect(publicResult.name).toEqual(result1.name);

    const privateResult = { ...result1, private: true };
    pseudonymize(privateResult);
    expect(privateResult.name).toEqual("N.N");
  });

  test("isFinishedRelayResult", () => {
    expect(isFinishedRelayResult({ ...result1 })).toBeFalsy();
    expect(
      isFinishedRelayResult({ ...result1, leg: 1, teamId: "Team 1" })
    ).toBeTruthy();
    expect(
      isFinishedRelayResult({
        ...result1,
        leg: 1,
        teamId: "Team 1",
        readTime: undefined,
      })
    ).toBeFalsy();
  });
});
