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

export const readerControl = (controlTime: ControlTime): boolean =>
  controlTime.code === 250;

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
    courseClass.penalty ||
    (course.controls.filter((control: Control) => Boolean(control.penalty))
      .length > 0 &&
      courseClass.type !== CourseClassType.ROGAINING)
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
  if (courseClass.penalty && courseClass.type === CourseClassType.ROGAINING) {
    const maxTime = getDuration(courseClass);
    if (result.time > maxTime) {
      return Math.ceil((result.time - maxTime) / 60) * courseClass.penalty;
    }
  }
  return 0;
};

export const getResultTime = (
  result: Result,
  courseClass: CourseClass,
  course: Course
): number => {
  if ([ResultStatus.NOTIME, ResultStatus.DNS].includes(result.status)) {
    return 0;
  }
  const penalty =
    60 * getPenaltyFromMissingControls(result, courseClass, course) +
    (result.additionalPenalty ? 60 * Number(result.additionalPenalty) : 0);
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
  const startTime =
    courseClass.massStartTime || result.startTime || result.registerTime;
  if (startTime && result.readTime) {
    const time =
      Math.floor(
        (new Date(result.readTime).getTime() - new Date(startTime).getTime()) /
          1000
      ) + penalty;
    return time > 0 ? time : 0;
  }
  return 0;
};

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
      Math.floor((new Date(result.readTime).getTime() - startTime) / 1000)
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
  if (courseClass.type === CourseClassType.ROGAINING && result.time) {
    result.points = getRogainingPoints(
      result.parsedControlTimes,
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

export const clearControlNumbers = (controlTimes: ControlTime[]) =>
  controlTimes.forEach((controlTime: ControlTime) => delete controlTime.number);

export const validateControlTimes = (
  result: Result,
  courseClass: CourseClass,
  course: Course,
  offset: number
): ControlTime[] => {
  let skipTime = 0;
  const controlTimes = cloneDeep(result.controlTimes);
  let lastPunchTime: number = 0;
  for (const [index, control] of course.controls.entries()) {
    const isLast: boolean = index === course.controls.length - 1;
    const controlTime = controlTimes.find(
      (ct) =>
        !Boolean(ct.number) &&
        checkControlCode(ct.code, control.code) &&
        (courseClass.type !== CourseClassType.NOT_SPECIFIED ||
          isLast ||
          ct.time > lastPunchTime ||
          ct.time === -1 ||
          ct.status === ControlTimeStatus.CHECKED) // TODO: remove -1
    );
    if (controlTime) {
      controlTime.number = index + 1;
      controlTime.time =
        controlTime.time !== -1 || // TODO: remove -1
        controlTime.status === ControlTimeStatus.CHECKED
          ? controlTime.time - skipTime - offset
          : controlTime.time;
      controlTime.split = {
        time: controlTime.time - (lastPunchTime > 0 ? lastPunchTime : 0),
      };
      if (controlTime.time > 0 && !control.freeOrder) {
        if (control.skip) {
          skipTime += controlTime.split.time;
        }
        lastPunchTime = controlTime.time;
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
  controlPositions = false
): Result[] =>
  flatMap(
    courseClasses.map((courseClass: CourseClass) => {
      const classResults = results.filter(
        (result: Result) =>
          result.classId === courseClass.id &&
          result.status !== ResultStatus.REGISTERED // result.readTime //
      );
      courses
        .filter((course: Course) => courseClass.courseIds.includes(course.id))
        .forEach((course: Course) => {
          const courseResults = classResults.filter(
            (result: Result) => result.courseId === course.id
          );
          courseResults.forEach((result: Result) => {
            parseResult(result, courseClass, course);
          });
          if (controlPositions) {
            setControlPositions(courseResults, course);
          }
        });
      return setClassPositions(classResults);
    })
  ).concat(
    results.filter(
      (result: Result) =>
        result.status === ResultStatus.REGISTERED && result.registerTime
    )
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
    // Remove last control if punched..
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
      if (controlTime) {
        const legPosition = legTimes.indexOf(controlTime.time) + 1;
        if (legPosition > 0) {
          controlTime.position = legPosition;
          controlTime.difference = controlTime.time - legTimes[0];
        }
        const splitPosition = splitTimes.indexOf(controlTime.split.time) + 1;
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
  Number(punchCode) === Number(controlCode) ||
  (Array.isArray(controlCode) &&
    controlCode.map(Number).includes(Number(punchCode)));

export const getMissingControls = (
  result: Result,
  courses: Course[]
): Control[] => {
  const missing: Control[] = [];
  if (result?.parsedControlTimes && result?.courseId) {
    const course: Course = getCourse(result.courseId, courses);
    for (const [index, control] of course?.controls.entries()) {
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

export const getIOFStatus = (status: ResultStatus): string => {
  switch (status) {
    case ResultStatus.OK:
      return "OK";
    case ResultStatus.DSQ:
      return "Disqualified";
    case ResultStatus.DNF:
      return "DidNotFinish";
    case ResultStatus.NOTIME:
      return "NotCompeting";
    case ResultStatus.MANUAL:
      return "NotCompeting";
    case ResultStatus.DNS:
      return "NotCompeting";
    default:
      return "Inactive";
  }
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
