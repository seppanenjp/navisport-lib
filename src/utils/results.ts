import {
  CourseClass,
  CourseClassType,
  PointSystem,
} from "../models/course-class";
import { PaymentState, Result, ResultStatus } from "../models/result";
import { Course } from "../models/course";
import { Control } from "../models/control";
import { ControlTime, ControlTimeStatus } from "../models/control-time";
import { cloneDeep, flatMap, last } from "lodash";
import { controlLabel, getCourse } from "./events";
import { Checkpoint } from "../models/checkpoint";
import { Passing } from "../models/passing";
import { timeDifference } from "./common";

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
  massStartTime?: string | Date;
  finishClosingTime?: string | Date;
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
    const numbers = result.parsedControlTimes?.length
      ? result.parsedControlTimes
          .filter((controlTime: ControlTime) => controlTime.number)
          .map((controlTime: ControlTime) => controlTime.number)
      : [];
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
    (result.status !== ResultStatus.MANUAL
      ? 60 * getPenaltyFromMissingControls(result, courseClass, course)
      : 0) +
    // Additional penalty time if class is not Rogaining
    (result.additionalPenalty && courseClass.type !== CourseClassType.ROGAINING
      ? Number(result.additionalPenalty) * 60
      : 0);

  if (startTime && result.finishTime) {
    const time = timeDifference(startTime, result.finishTime) + penalty;
    return time > 0 ? time : 0;
  }

  if (![ResultStatus.MANUAL].includes(result.status)) {
    const lastPunch: ControlTime =
      result.parsedControlTimes?.find(
        (controlTime: ControlTime) =>
          controlTime.number === course.controls.length
      ) || result.parsedControlTimes?.find(readerControl);
    if (lastPunch?.time > 0) {
      // Last punch time + penalty min
      const time: number = lastPunch.time + penalty;
      return time > 0 ? time : 0;
    }
  }

  if (startTime && result.readTime) {
    const time = timeDifference(startTime, result.readTime) + penalty;
    return time > 0 ? time : 0;
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
    const startTime = courseClass.massStartTime
      ? new Date(courseClass.massStartTime).getTime()
      : new Date(result.startTime).getTime();
    return (
      (result.controlTimes.find(readerControl)?.time ?? 0) -
      timeDifference(startTime, result.readTime)
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

export const resultSort = (firstResult: Result, secondResult: Result) => {
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
    result.parsedControlTimes = validateControlTimes(
      result,
      courseClass,
      course,
      timeOffset
    ).filter((controlTime) => controlTime.time >= -1);
  }
  // Set result time
  result.time = getResultTime(result, courseClass, course);

  // Set result points
  result.points = 0;
  if (courseClass.type === CourseClassType.ROGAINING && result.time) {
    // Check only punched controls as parsedControlTimes contains also controls that does not belong to course
    result.points = getRogainingPoints(
      result.parsedControlTimes?.filter(
        (controlTime: ControlTime) => controlTime.number
      ),
      course.controls,
      courseClass.pointSystem
    );
    result.points -= getPenaltyPoints(result, courseClass);
    result.points = result.points > 0 ? result.points : 0;
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
      difference: getTimeDifference(results, result),
    };
  });

export const getResultPositionAndDifference = (
  result: Result,
  results: Result[]
): { difference: number; position: number } => {
  const updatedResult = setClassPositions(results.add(result)).find(
    (r) => r.id === result.id
  );
  return {
    difference: updatedResult?.difference,
    position: updatedResult?.position,
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
  offset: number
): ControlTime[] => {
  let skipTime = 0;
  const controlTimes = cloneDeep(result.controlTimes);
  let lastPunchTime = 0;
  for (const [index, control] of course.controls.entries()) {
    // const isLast: boolean = index === course.controls.length - 1;
    const controlTime = controlTimes.find(
      (ct) =>
        !ct.number &&
        checkControlCode(ct.code, control.code) &&
        (courseClass.type !== CourseClassType.NOT_SPECIFIED ||
          // isLast || // This takes first "last" control if multiple found (is wrong then?)
          ct.time > lastPunchTime + skipTime + offset ||
          checkedControlTime(ct))
    );
    if (controlTime) {
      controlTime.number = index + 1;
      controlTime.time = checkedControlTime(controlTime)
        ? controlTime.time
        : controlTime.time - offset;
      controlTime.split = {
        time:
          controlTime.time - skipTime - (lastPunchTime > 0 ? lastPunchTime : 0),
      };

      if (controlTime.time >= 0 && !control.freeOrder) {
        if (control.skip) {
          skipTime += controlTime.split.time;
          controlTime.split.time = 0;
        }

        controlTime.time -= skipTime;
        lastPunchTime = controlTime.time;
      }
    } else {
      // If not controlTime and control is disabled then add controlTime as checked!
      if (control.disabled) {
        controlTimes.push({
          ...new ControlTime(
            Array.isArray(control.code) ? control.code[0] : control.code,
            0,
            index + 1
          ),
          status: ControlTimeStatus.CHECKED,
        });
      }
    }
  }
  const reader = controlTimes.find(readerControl);
  if (reader) {
    reader.time -= offset;
  }
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
            if (result.status !== ResultStatus.REGISTERED) {
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

export const getTimeDifference = (results: Result[], result: Result): number =>
  result && results.length ? result.time - results[0].time : 0;

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
  const lastControl: number | number[] = last(controls)?.code;

  controlTimes = [...controlTimes];
  controlTimes.pop(); // Remove reader (250)
  const index = controlTimes.findIndex(
    (control) =>
      control.code === lastControl ||
      (Array.isArray(lastControl) && lastControl.includes(control.code))
  );
  if (index >= 0) {
    // Remove last control if punched
    controlTimes.splice(index, 1);
  }
  return controlTimes.length
    ? controlTimes
        .map((controlTime: ControlTime) => {
          const control = controls.find((c) =>
            checkControlCode(controlTime.code, c.code)
          );
          if (!control) {
            return 0;
          }
          const code = controlLabel(control);
          if (system === PointSystem.FIRST_CODE) {
            // Get first char
            return Number(code.toString()[0]);
          } else if (system === PointSystem.LAST_CODE) {
            // const points = Number(last(code.toString()));
            // Get last char or 10 if points 0
            // return points > 0 ? points : 10;

            // Get last char
            return Number(last(code.toString()));
          } else {
            return 1;
          }
        })
        .reduce((acc, curr) => curr + acc)
    : 0;
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
      const controlTime = result.parsedControlTimes?.find(
        (c) => c.number === index + 1 && c.time > 0
      );
      if (controlTime) {
        legTimes.push(controlTime.time);
        splitTimes.push(controlTime.split.time);
      }
    });
    legTimes.sort((a, b) => a - b);
    splitTimes.sort((a, b) => a - b);
    results.forEach((result: Result) => {
      const controlTime = result.parsedControlTimes?.find(
        (c) => c.number === index + 1
      );
      if (controlTime && !checkedControlTime(controlTime)) {
        const legPosition = legTimes.indexOf(controlTime.time) + 1;
        if (legPosition > 0) {
          controlTime.position = legPosition;
          controlTime.difference = controlTime.time - legTimes[0];
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
  if (result?.parsedControlTimes && result?.courseId) {
    const course: Course = getCourse(result.courseId, courses);
    if (!course?.controls) {
      return missing;
    }
    for (const [index, control] of course.controls.entries()) {
      const controlTime = result.parsedControlTimes.find(
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
): string => courseClass.massStartTime || result.startTime || "";

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
