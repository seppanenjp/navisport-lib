import { CourseClass } from "../models/course-class";
import { Course } from "../models/course";
import { Control } from "../models/control";
import { Event } from "../models/event";

export const getEventName = ({
  name,
  series,
}: {
  name: string;
  series?: { name: string };
}): string => (series ? `${series.name}, ${name}` : name);

export const geCourseClassDistance = (
  event: Event,
  courseClass: CourseClass
): number => {
  const courses = event.courses.filter((c) =>
    courseClass.courseIds.includes(c.id)
  );
  if (courses.length) {
    const distances: number[] = courses.map((course: Course) => {
      return course.distance;
    });
    return Math.max(...distances) || 0;
  }
  return 0;
};

export const getCourseClassControlAmount = (
  event: Event,
  courseClass: CourseClass
): number => {
  const courses = event.courses.filter((c) =>
    courseClass.courseIds.includes(c.id)
  );
  if (courses.length) {
    const amount: number[] = courses.map((course: Course) => {
      return course.controls.length > 0 ? course.controls.length - 1 : 0;
    });
    return Math.max(...amount) || 0;
  }
  return 0;
};

export const controlLabel = (control: Control): string | number | number[] =>
  control.label ? control.label : control.code;

export const courseClassName = (
  event: Event,
  courseClass: CourseClass
): string =>
  `${courseClass.name} / ${
    (geCourseClassDistance(event, courseClass) || 0) / 1000
  }km`;

export const getCourseClass = (
  classId: string,
  courseClasses: CourseClass[]
): CourseClass => courseClasses.find((c) => c.id === classId);

export const getCourse = (courseId: string, courses: Course[]): Course =>
  courses.find((c) => c.id === courseId);

export const getCourseClassCourses = (
  classId: string,
  courses: Course[],
  courseClasses: CourseClass[]
): Course[] => {
  const courseClass: CourseClass | undefined = getCourseClass(
    classId,
    courseClasses
  );
  if (courseClass) {
    return courses.filter((c) => courseClass.courseIds.includes(c.id));
  }
  return [];
};

export const distanceToControl = (
  controls: Control[],
  control: Control
): number => {
  let distance = 0;
  controls.forEach((c) => {
    distance += c.distance;
    if (c === control) {
      return;
    }
  });
  return distance;
};
