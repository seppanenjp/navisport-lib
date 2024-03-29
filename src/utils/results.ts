import {
  CourseClass,
  CourseClassType,
  PointSystem,
} from "../models/course-class";
import { PaymentState, Result, ResultStatus } from "../models/result";
import { Course } from "../models/course";
import { Control } from "../models/control";
import { ControlTime, ControlTimeStatus } from "../models/control-time";
import { cloneDeep, flatMap, last, uniqBy } from "lodash";
import { controlLabel, getCourse } from "./events";
import { Checkpoint } from "../models/checkpoint";
import { Passing } from "../models/passing";
import { clone, timeDifference } from "./common";
import { LowBatteryWarning } from "../models/chip-data";
import { Event } from "../models/event";
import { StringOrDate } from "../models/date";

export const readerControl = (controlTime: ControlTime): boolean =>
  controlTime.code === 250;

export const checkedControlTime = (controlTime?: ControlTime): boolean =>
  controlTime?.time === -1 || controlTime?.status === ControlTimeStatus.CHECKED;

export const getDuration = ({
  duration,
  massStartTime,
  finishClosingTime,
}: {
  duration?: number;
  massStartTime?: StringOrDate;
  finishClosingTime?: StringOrDate;
}): number => {
  if (duration) {
    return duration * 60;
  }
  const startTime: Date | undefined = massStartTime
    ? new Date(massStartTime)
    : undefined;
  const endTime: Date | undefined = finishClosingTime
    ? new Date(finishClosingTime)
    : undefined;
  return startTime && endTime
    ? (endTime.getTime() - startTime.getTime()) / 1000
    : Number.MAX_SAFE_INTEGER;
};

// Returns minutes
export const getPenaltyFromMissingControls = (
  result: Result,
  courseClass: CourseClass,
  course: Course
): number => {
  if (
    (courseClass.penalty ||
      course.controls.filter((control: Control) => Boolean(control.penalty))
        .length > 0) &&
    courseClass.type !== CourseClassType.ROGAINING
  ) {
    const numbers =
      result.controlTimes
        ?.filter((controlTime: ControlTime) => controlTime.number)
        .map((controlTime: ControlTime) => controlTime.number) || [];
    const controls = [...course.controls]
      .map((control: Control, index: number) => ({
        ...control,
        number: index + 1,
      }))
      .filter((control: Control) => !numbers.includes(control.number));
    return controls.length
      ? controls
          .map(
            (control: Control) =>
              Number(control.penalty) || Number(courseClass.penalty) || 0
          )
          .reduce((acc, curr) => curr + acc)
      : 0;
  }
  return 0;
};

export const getPenalty = (
  result: Result,
  courseClass: CourseClass,
  course: Course
): number =>
  courseClass.type === CourseClassType.ROGAINING
    ? getPenaltyPoints(result, courseClass)
    : getPenaltyFromMissingControls(result, courseClass, course);

export const getPenaltyPoints = (
  result: Result,
  courseClass: CourseClass
): number => {
  const maxTime = getDuration(courseClass);
  let penaltyPoints = 0;
  if (result.time > maxTime) {
    // Penalty points from overtime
    penaltyPoints =
      Math.ceil((result.time - maxTime) / 60) * (courseClass.penalty || 0);
  }
  // Add additional penalty points
  return (
    penaltyPoints +
    (result.additionalPenalty ? Number(result.additionalPenalty) : 0)
  );
};

// TODO: This is a bit too complex
export const getResultTime = (
  result: Result,
  courseClass: CourseClass,
  course: Course
): number => {
  if ([ResultStatus.NOTIME, ResultStatus.DNS].includes(result.status)) {
    return 0;
  }

  const startTime =
    courseClass.massStartTime || result.startTime || result.registerTime;

  const penalty =
    // Manual can't have penalty from missing controls
    (![ResultStatus.MANUAL, ResultStatus.REGISTERED].includes(result.status)
      ? 60 * getPenaltyFromMissingControls(result, courseClass, course)
      : 0) +
    // Additional penalty time if class is not Rogaining
    (result.additionalPenalty && courseClass.type !== CourseClassType.ROGAINING
      ? Number(result.additionalPenalty) * 60
      : 0);

  if (startTime && result.finishTime) {
    const time = timeDifference(startTime, result.finishTime) + penalty;
    return time.toPositiveOrZero();
  }

  if (![ResultStatus.MANUAL].includes(result.status)) {
    const lastPunch: ControlTime =
      result.controlTimes?.find(
        (controlTime: ControlTime) =>
          controlTime.number === course.controls.length
      ) || result.controlTimes?.find(readerControl);
    if (lastPunch?.offsetTime > 0) {
      // Last punch time + penalty min
      const time: number = lastPunch.offsetTime + penalty;
      return time.toPositiveOrZero();
    }
  }

  if (startTime && result.readTime) {
    const time = timeDifference(startTime, result.readTime) + penalty;
    return time.toPositiveOrZero();
  }
  return 0;
};

// TODO: save with result so no need to calculate again
export const getTimeOffset = (
  result: Result,
  courseClass: CourseClass
): number => {
  if (
    courseClass &&
    (result.startTime || courseClass.massStartTime) &&
    result.readTime &&
    result.controlTimes?.length
  ) {
    return (
      (result.controlTimes.find(readerControl)?.time ?? 0) -
      timeDifference(
        courseClass.massStartTime || result.startTime,
        result.readTime
      )
    );
  }
  return 0;
};

export const formatResultTime = ({
  status,
  time,
}: {
  status: ResultStatus;
  time?: number;
}): string =>
  [ResultStatus.NOTIME, ResultStatus.DNS].includes(status) || !time
    ? "-"
    : time?.toHms();

export const resultSort = (
  firstResult: Result,
  secondResult: Result
): number => {
  const {
    points: firstPoints,
    time: firstTime,
    status: firstStatus,
  } = firstResult;
  const {
    points: secondPoints,
    time: secondTime,
    status: secondStatus,
  } = secondResult;

  if (getStatusWeight(firstStatus) > getStatusWeight(secondStatus)) {
    return 1;
  }
  if (getStatusWeight(secondStatus) > getStatusWeight(firstStatus)) {
    return -1;
  }
  if (!firstTime || firstTime <= 0) {
    return 1;
  }
  if (!secondTime || secondTime <= 0) {
    return -1;
  }
  if (firstPoints > secondPoints) {
    return -1;
  }
  if (firstPoints < secondPoints) {
    return 1;
  }
  if (firstTime < secondTime) {
    return -1;
  }
  if (firstTime > secondTime) {
    return 1;
  }
  return 0;
};

export const getStatusWeight = (status: ResultStatus): number => {
  switch (status) {
    case ResultStatus.OK:
    case ResultStatus.UNKNOWN:
    case ResultStatus.REGISTERED:
    case ResultStatus.MANUAL:
      return 1;
    case ResultStatus.DSQ:
      return 2;
    case ResultStatus.DNF:
      return 3;
    case ResultStatus.NOTIME:
      return 4;
    case ResultStatus.DNS:
      return 5;
    default:
      return 6;
  }
};

export const parseResult = (
  result: Result,
  courseClass: CourseClass,
  course: Course
): void => {
  if (!courseClass || !course) {
    return; // Skip parsing if there is lacking information
  }

  // Set correct controlTimes
  if (result.controlTimes?.length && result.status !== ResultStatus.MANUAL) {
    const timeOffset = getTimeOffset(result, courseClass);
    result.controlTimes = validateControlTimes(
      result,
      courseClass,
      course,
      timeOffset
    );

    //.filter((controlTime) => controlTime.time >= -1);
  }
  // Set result time
  result.time = getResultTime(result, courseClass, course);

  // Set result points
  result.points = 0;
  if (courseClass.type === CourseClassType.ROGAINING && result.time) {
    // Check only punched controls as parsedControlTimes contains also controls that does not belong to course
    result.points = getRogainingPoints(
      result.controlTimes,
      course.controls,
      courseClass.pointSystem
    );
    result.points -= getPenaltyPoints(result, courseClass);
    result.points = result.points.toPositiveOrZero();
  }
};

export const setClassPositions = (results: Result[]): Result[] =>
  results.sort(resultSort).map((result: Result) => {
    return {
      ...result,
      position:
        results.findIndex(
          (r: Result) =>
            r.time === result.time && (r.points || 0) === (result.points || 0)
        ) + 1,
      difference: getResultTimeDifference(result, results),
    };
  });

export const getResultPositionAndDifference = (
  result: Result,
  results: Result[]
): { difference: number; position: number } => {
  const updatedResult: Result = setClassPositions(results.add(result)).find(
    (r) => r.id === result.id
  );
  return {
    difference: updatedResult.difference,
    position: updatedResult.position,
  };
};

export const clearControlNumbers = (
  controlTimes: ControlTime[]
): ControlTime[] =>
  controlTimes.map((controlTime: ControlTime) => ({
    ...controlTime,
    number: undefined,
  }));

export const validateControlTimes = (
  result: Result,
  courseClass: CourseClass,
  course: Course,
  offset: number,
  forceUpdate = true
): ControlTime[] => {
  let skipTime = 0;
  let controlTimes = cloneDeep(result.controlTimes);
  let lastPunchTime = 0;
  // let isInsideLoop = false;
  // Skip calculation if controlTimes already has control numbers
  if (
    !forceUpdate &&
    controlTimes.some((controlTime: ControlTime) => controlTime.number)
  ) {
    return controlTimes;
  }

  controlTimes = clearControlNumbers(controlTimes);

  /* const checkIfInsideLoop = (control: Control, isCurrentlyInside: boolean) => {
    if (
      !isCurrentlyInside &&
      isLoopControl(control, course.controls, LoopControlType.Begin)
    ) {
      return true;
    } else if (
      isCurrentlyInside &&
      isLoopControl(control, course.controls, LoopControlType.End)
    ) {
      return false;
    }
    return isCurrentlyInside;
  };*/

  for (const [index, control] of course.controls.entries()) {
    const controlTime = controlTimes.find(
      (ct) =>
        !ct.number &&
        checkControlCode(ct.code, control.code) &&
        (courseClass.type !== CourseClassType.NOT_SPECIFIED ||
          ct.time > lastPunchTime + skipTime + offset ||
          checkedControlTime(ct))
    );
    // If not inside loop -> check that controlTime.code is not inside loop
    // If inside loop -> check that controlTime.code is inside loop

    // If missed the first loop control

    /*
    if (
      isLoopControl(control, course.controls, LoopControlType.Begin) &&
      course.controls.length > index + 1
    ) {
      console.log("Is checking loop control", control);
      // Check that next control is valid!
      const nextControl = course.controls[index + 1];
      console.log("next control should be", nextControl.code);
      const nextPunch = controlTimes[controlTimes.indexOf(controlTime) + 1];
      console.log("next punch is", nextPunch?.code);
      // If not then we are not punching correct loop control
      if (!checkControlCode(nextPunch?.code, nextControl.code)) {
        console.log("not correct next punch");
        continue;
      }
    }
*/

    if (controlTime) {
      controlTime.number = index + 1;
      controlTime.offsetTime = checkedControlTime(controlTime)
        ? controlTime.time
        : controlTime.time - offset;
      controlTime.split = {
        time:
          controlTime.offsetTime -
          skipTime -
          (lastPunchTime > 0 ? lastPunchTime : 0),
      };

      if (controlTime.offsetTime >= 0 && !control.freeOrder) {
        if (control.skip) {
          skipTime += controlTime.split.time;
          controlTime.split.time = 0;
        }

        controlTime.offsetTime -= skipTime;
        lastPunchTime = controlTime.offsetTime;
      }
    } else {
      // If not controlTime and control is disabled then add controlTime as checked!
      if (control.disabled) {
        controlTimes.push({
          ...{
            code: Array.isArray(control.code) ? control.code[0] : control.code,
            time: 0,
            offsetTime: 0,
            number: index + 1,
          },
          status: ControlTimeStatus.CHECKED,
        });
      }
    }

    // Update inside loop status
    //  isInsideLoop = checkIfInsideLoop(control, isInsideLoop);
  }
  // TODO: check if offsetTime needs also skiptime?
  /* const reader = controlTimes.find(readerControl);
  if (reader) {
    reader.offsetTime -= offset;
  } */
  return controlTimes;
};

export const resultsWithTimeAndPosition = (
  courses: Course[] = [],
  courseClasses: CourseClass[] = [],
  results: Result[] = [],
  controlPositions = false,
  checkpointPositions = false
): Result[] =>
  flatMap(
    courseClasses.map((courseClass: CourseClass) => {
      const classResults = results.filter(
        (result: Result) => result.classId === courseClass.id
        // result.readTime //
      );
      courses
        .filter((course: Course) => courseClass.courseIds.includes(course.id))
        .forEach((course: Course) => {
          const courseResults = classResults.filter(
            (result: Result) => result.courseId === course.id
          );
          // Use default course if no course selected and class have only one course
          if (courseClass.courseIds.length === 1) {
            classResults
              .filter((result: Result) => !result.courseId)
              .forEach(
                (result: Result) => (result.courseId = courseClass.courseIds[0])
              );
          }

          courseResults.forEach((result: Result) => {
            if (
              result.status !== ResultStatus.REGISTERED ||
              (result.status === ResultStatus.REGISTERED && result.finishTime)
            ) {
              // TODO: return result insted of modify
              parseResult(result, courseClass, course);
            }
          });
          if (controlPositions) {
            // TODO: return result insted of modify
            setControlPositions(courseResults, course);
          }
        });
      if (checkpointPositions && courseClass.checkpoints) {
        courseClass.checkpoints.forEach((checkPoint: Checkpoint) =>
          // TODO: return result insted of modify
          setCheckpointPositions(classResults, checkPoint)
        );
      }
      /*if(event.pointSystem && courseClass.type !== CourseClassType.ROGAINING) {
        calculatePoints(classResults, event.pointSystem)
      }*/
      return setClassPositions(classResults);
    })
  );

export const getResultTimeDifference = (
  result: Result,
  results: Result[]
): number =>
  result && results.length
    ? (result.time - results[0].time).toPositiveOrZero()
    : 0;

export const countByStatus = (
  results: Result[],
  status: ResultStatus
): number =>
  results?.filter((result: Result) => result.status === status).length || 0;

export const getRogainingPoints = (
  controlTimes: ControlTime[],
  controls: Control[],
  system: PointSystem
): number => {
  if (system === PointSystem.NO_SYSTEM || !controlTimes?.length) {
    return 0;
  }

  controlTimes = [...controlTimes].filter(
    (controlTime: ControlTime) =>
      controlTime.number && controlTime.number !== controls.length // Remove last control
  );
  return controlTimes.length
    ? uniqBy(controlTimes, "number")
        .map((controlTime: ControlTime) => {
          const control = controls[controlTime.number - 1];
          const code = controlLabel(control);
          if (system === PointSystem.FIRST_CODE) {
            // Get first char
            return Number(code.toString()[0]);
          } else if (system === PointSystem.LAST_CODE) {
            const points = Number(last(code.toString()));
            // Get last char or 10 if points 0
            return points > 0 ? points : 10;
          }
          return 1;
        })
        .reduce((acc, curr) => curr + acc, 0)
    : 0;
};

export const listLowBatteryWarnings = (
  results: Result[]
): LowBatteryWarning[] => {
  const warnings: LowBatteryWarning[] = [];
  flatMap(
    results.map((result: Result) => {
      const batteryWarnings =
        result.controlTimes?.filter(
          (controlTime: ControlTime) => controlTime.code === 99
        ) || [];
      const codes = [];
      batteryWarnings.forEach((batteryWarning: ControlTime) => {
        const control = result.controlTimes.find(
          (controlTime: ControlTime) =>
            controlTime.time === batteryWarning.time && controlTime.code !== 99
        );
        control && codes.push(control.code);
      });
      return codes;
    })
  ).forEach((punchCode: number) => {
    const existing = warnings.find(({ code }) => code === punchCode);
    existing
      ? (existing.warningCount += 1)
      : warnings.push({ code: punchCode, warningCount: 1 });
  });
  return warnings;
};

export const setControlPositions = (
  results: Result[],
  course: Course
): void => {
  results = results.filter((r) => r.status === ResultStatus.OK);
  for (const [index] of course.controls.entries()) {
    const legTimes: number[] = [];
    const splitTimes: number[] = [];
    results.forEach((result: Result) => {
      const controlTime = result.controlTimes?.find(
        (c) => c.number === index + 1 && c.offsetTime > 0
      );
      if (controlTime) {
        legTimes.push(controlTime.offsetTime);
        splitTimes.push(controlTime.split.time);
      }
    });
    legTimes.sort((a, b) => a - b);
    splitTimes.sort((a, b) => a - b);
    results.forEach((result: Result) => {
      const controlTime = result.controlTimes?.find(
        (c) => c.number === index + 1
      );
      if (controlTime && !checkedControlTime(controlTime)) {
        const legPosition = legTimes.indexOf(controlTime.offsetTime) + 1;
        if (legPosition > 0) {
          controlTime.position = legPosition;
          controlTime.difference = controlTime.offsetTime - legTimes[0];
        }
        const splitPosition = controlTime.split?.time
          ? splitTimes.indexOf(controlTime.split.time) + 1
          : 0;
        if (splitPosition > 0) {
          controlTime.split.position = splitPosition;
          controlTime.split.difference = controlTime.split.time - splitTimes[0];
        }
      }
    });
  }
};

export const checkControlCode = (
  punchCode: number,
  controlCode: number | number[]
): boolean =>
  Array.isArray(controlCode)
    ? controlCode.map(Number).includes(Number(punchCode))
    : Number(punchCode) === Number(controlCode);

export const getMissingControls = (
  result: Result,
  courses: Course[]
): Control[] => {
  const missing: Control[] = [];
  if (result?.controlTimes && result?.courseId) {
    const course: Course = getCourse(result.courseId, courses);
    if (!course?.controls) {
      return missing;
    }
    for (const [index, control] of course.controls.entries()) {
      const controlTime = result.controlTimes.find(
        (c) => c.number === index + 1
      );
      if (!controlTime) {
        missing.push({ ...control, number: index + 1 });
      }
    }
  }
  return missing;
};

export const getStartTime = (
  result: Result,
  courseClass: CourseClass
): string =>
  courseClass.massStartTime || result.startTime
    ? new Date(courseClass.massStartTime || result.startTime).toISOString()
    : "";

export const cloneRegistration = (
  registration: Result,
  eventId?: string,
  classId?: string,
  courseId?: string
): Result => ({
  ...new Result(),
  name: registration.name,
  club: registration.club,
  eventId,
  classId,
  courseId,
  userId: registration.userId,
  nationality: registration.nationality,
  secondaryChip: registration.secondaryChip,
  sportId: registration.sportId,
  iofId: registration.iofId,
  externalId: registration.externalId,
  licenceNumber: registration.licenceNumber,
  bibNumber: registration.bibNumber,
  birthYear: registration.birthYear,
  paymentState: PaymentState.PAID,
  seriesId: registration.seriesId,
  chip: registration.chip,
  rentalChip: registration.rentalChip,
  email: registration.email,
  phoneNumber: registration.phoneNumber,
  gender: registration.gender,
  private: registration.private || false,
  registered: true,
  municipality: registration.municipality,
});

export const setCheckpointPositions = (
  results: Result[],
  checkpoint: Checkpoint
): void => {
  const passings: Passing[] = [];
  const times: number[] = [];
  results.forEach((result: Result) => {
    const passing = result.passings?.find(
      (p: Passing) => p.checkpointId === checkpoint.id
    );
    if (passing) {
      passings.push(passing);
      times.push(passing.time);
    }
  });
  times.sort((a, b) => a - b);
  passings.forEach((passing: Passing) => {
    passing.position = times.indexOf(passing.time) + 1;
    passing.difference = passing.time - times[0];
  });
};

export const smartResultSort = (
  firstResult: Result,
  secondResult: Result
): number => {
  const {
    points: firstPoints,
    time: firstTime,
    status: firstStatus,
    startTime: firstStarTime,
  } = firstResult;
  const {
    points: secondPoints,
    time: secondTime,
    status: secondStatus,
    startTime: secondStartTime,
  } = secondResult;

  // First sort by status Ok, DNS, DSQ
  // Then check if some differences with times or points
  // If not finished then should check last passing
  // If not last passing then sort by start times

  if (getStatusWeight(firstStatus) > getStatusWeight(secondStatus)) {
    return 1;
  }
  if (getStatusWeight(secondStatus) > getStatusWeight(firstStatus)) {
    return -1;
  }

  if (firstPoints > secondPoints) {
    return -1;
  }
  if (firstPoints < secondPoints) {
    return 1;
  }

  // Sort between final results
  if (firstTime && secondTime) {
    if (firstTime < secondTime) {
      return -1;
    }
    if (firstTime > secondTime) {
      return 1;
    }
  }

  // Sort with passings
  const firstPassingSort = passingSort(firstResult, secondResult);
  if (firstPassingSort) {
    return firstPassingSort;
  }
  const secondPassingSort = passingSort(secondResult, firstResult);
  if (secondPassingSort) {
    return secondPassingSort * -1;
  }

  // Result in finish should always be better than result without any passings
  if (firstTime && !secondTime) {
    return -1;
  }
  if (secondTime && !firstTime) {
    return 1;
  }

  // If nothing else then sort with startTimes
  if (firstStarTime && secondStartTime) {
    const d1 = new Date(firstStarTime);
    const d2 = new Date(secondStartTime);
    if (d1 < d2) {
      return -1;
    } else if (d2 < d1) {
      return 1;
    }
  }
  return 0;
};

const passingSort = (firstResult: Result, secondResult: Result): number => {
  const firstPassing = last(firstResult.passings);
  if (firstPassing) {
    const secondPassing = secondResult.passings.find(
      (passing: Passing) => passing.checkpointId === firstPassing.checkpointId
    );
    if (firstPassing && secondPassing) {
      if (firstPassing.position > secondPassing.position) {
        return 1;
      }
      if (secondPassing.position > firstPassing.position) {
        return -1;
      }
    } else {
      return -1;
    }
  }
  return 0;
};

interface CalculationSystem {
  ok?: string;
  notOk?: string;
}

export const calculatePoints = (
  results: Result[],
  system: CalculationSystem
): void => {
  results.forEach((result: Result) => {
    if (
      [ResultStatus.OK, ResultStatus.MANUAL].includes(result.status) &&
      system.ok
    ) {
      setPoints(system.ok, results, result);
    } else if (result.status !== ResultStatus.REGISTERED && system.notOk) {
      setPoints(system.notOk, results, result);
    } else {
      result.points = null;
    }
  });
};

const setPoints = (
  systemString: string,
  results: Result[],
  result: Result
): void =>
  Function(
    "results",
    "result",
    systemString
      ? `result.points = Math.round(${systemString
          .replace(/\[FIRST_RESULT]/g, "results[0]")
          .replace(/\[RESULT]/g, "result")})`
      : null
  )(results, result);

export enum LoopControlType {
  Begin = "Begin",
  End = "End",
}

export const isLoopControl = (
  control: Control,
  controls: Control[],
  loopControlType?: LoopControlType
): boolean => {
  const loopControls = controls.filter((c: Control) => c.code === control.code);
  if (loopControls.length > 1) {
    return loopControlType
      ? loopControlType === LoopControlType.Begin
        ? loopControls.indexOf(control) % 2 === 0 // Every second control is loop control begin
        : loopControls.indexOf(control) % 2 !== 0
      : true;
  }
  return false;
};

export const hasCorrectPunchedControlTimes = (
  controlTimes: ControlTime[]
): boolean => getValidControlTimes(controlTimes).length > 0;

export const getValidControlTimes = (
  controlTimes: ControlTime[]
): ControlTime[] =>
  controlTimes.filter((controlTime: ControlTime) => controlTime.number);

export const validFinishTime = (result: Result, course: Course): boolean => {
  if (result.finishTime && result.readTime) {
    // Time is valid if difference between result finishTime and calculated finishTime is less than 5sec
    const calculatedFinishTime = calculateFinishTimeFromReader(result, course);
    return timeDifference(result.startTime, calculatedFinishTime) < 5;
  }
  return true;
};

export const calculateFinishTimeFromReader = (
  result: Result,
  course: Course
): Date => {
  const readControlTime = result.controlTimes?.find(readerControl);
  const lastControl = last(course.controls);
  const lastControlTime =
    last(
      result.controlTimes.filter((controlTime: ControlTime) =>
        checkControlCode(controlTime.code, lastControl?.code)
      )
    ) || readControlTime;

  if (!readControlTime || !lastControlTime) {
    return null;
  }

  const finishTime = new Date(result.readTime);
  finishTime.setTime(
    finishTime.getTime() - (readControlTime.time - lastControlTime.time) * 1000
  );
  return finishTime;
};

export const isFinishedRelayResult = (result: Result): boolean =>
  Boolean(
    ((result.readTime && result.controlTimes) || result.finishTime) &&
      result.leg &&
      result.teamId
  );

export const pseudonymize = (result: Result): void => {
  if (result.private) {
    result.name = "N.N";
    result.club = "";
  }
};

export const suggestCourseClass = (
  result: Result,
  event: Event,
  forceSuggest = false
): void => {
  // If originalClass does not have correct punches then check if some other class has
  const originalClassId = result.classId;
  const originalCourseId = result.courseId;

  let correctClassFound = false;

  // Trigger suggest by clearing class & course
  if (forceSuggest) {
    result.courseId = null;
    result.classId = null;
  }

  if (!result.controlTimes?.length) {
    // If manual timing with classId and without courseId
    if (result.classId && !result.courseId) {
      const courseClass = event.courseClasses.find(
        (c) => c.id === result.classId
      );
      const course = event.courses.filter((c: Course) =>
        courseClass.courseIds.includes(c.id)
      )[0];
      result.courseId = course?.id;
    }
    return;
  }
  // Check that course belongs to courseClass
  if (result.courseId && result.classId) {
    const courseClass = event.courseClasses.find(
      (c) => c.id === result.classId
    );
    if (!courseClass.courseIds.includes(result.courseId)) {
      result.courseId = null;
    }
  }

  if (!result.courseId) {
    let suggestedCourse: Course;
    let suggestedClass: CourseClass;
    let commonControls = 0;
    let courses: Course[] = clone(event.courses);
    if (result.classId) {
      suggestedClass = event.courseClasses.find((c) => c.id === result.classId);
      if (suggestedClass.courseIds?.length === 1) {
        result.courseId = suggestedClass.courseIds[0];
        return;
      }
      courses = courses.filter((c) => suggestedClass.courseIds.includes(c.id));
    }
    const sortedCourses: Course[] = courses.sort(sortByControlCount);
    for (const course of sortedCourses) {
      if (
        course.controls &&
        course.controls.length &&
        course.controls[0].code !== 0
      ) {
        let courseClass: CourseClass = suggestedClass;
        if (!result.classId) {
          courseClass = event.courseClasses.find((c: CourseClass) =>
            c.courseIds.includes(course.id)
          );
        }
        if (!courseClass) {
          // Course without courseClass
          continue;
        }
        const controlTimes = validateControlTimes(
          result,
          courseClass,
          course,
          0
        ).filter((controlTime: ControlTime) => controlTime.number);
        const newCommon = controlTimes.length / course.controls.length;
        if (
          newCommon >= commonControls ||
          (suggestedCourse &&
            controlTimes.length > suggestedCourse.controls.length) // TODO: handle case where multiple broken controls
        ) {
          if (
            suggestedClass?.type === CourseClassType.ROGAINING && // Comparison between two Rogaining courses
            courseClass.type === CourseClassType.ROGAINING
          ) {
            const finalTime = last(controlTimes)?.offsetTime || 0; // TODO: should get correct final time
            const suggestedDuration = getDuration(suggestedClass);
            const duration = getDuration(courseClass);
            if (
              (finalTime > suggestedDuration && duration > suggestedDuration) ||
              (finalTime <= duration && duration < suggestedDuration)
            ) {
              commonControls = newCommon;
              suggestedClass = courseClass;
              suggestedCourse = course;

              // Result has full match to suggested course
              correctClassFound = commonControls === 1;
            }
          } else if (
            courseClass.type !== CourseClassType.ROGAINING ||
            (courseClass.type === CourseClassType.ROGAINING &&
              commonControls < 1)
          ) {
            // Select Rogaining only if no suitable course found
            commonControls = newCommon;
            suggestedCourse = course;
            suggestedClass = courseClass;
            // Result has full match to suggested course
            correctClassFound = commonControls === 1;
          }
        }
      }
    }

    if (suggestedCourse && suggestedClass) {
      result.courseId = suggestedCourse.id;
      result.classId = suggestedClass.id;

      // If result does not belong to any other class then just use original
      if (
        forceSuggest &&
        !correctClassFound &&
        originalClassId &&
        originalCourseId
      ) {
        result.courseId = originalCourseId;
        result.classId = originalClassId;
      }
    } else {
      const courseClass = event.courseClasses[0];
      result.classId = courseClass.id;
      result.courseId = courseClass.courseIds[0];
    }
  }
};

const sortByControlCount = (a: Course, b: Course) => {
  if (a.controls.length < b.controls.length) {
    return -1;
  } else if (a.controls.length > b.controls.length) {
    return 1;
  }
  return 0;
};

export const compareControlTimes = (
  c1: ControlTime[],
  c2: ControlTime[]
): boolean =>
  JSON.stringify(c1.slice(0, c1.length - 1)) ===
  JSON.stringify(c2.slice(0, c2.length - 1));
