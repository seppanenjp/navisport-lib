import { CourseClass } from "../models/course-class";
import { Course } from "../models/course";
import { Control } from "../models/control";

export const getEventName = ({
  name,
  series,
}: {
  name: string;
  series?: { name: string };
}): string => (series ? `${series.name}, ${name}` : name);

export const geCourseClassDistance = (
  courses: Course[],
  courseClass: CourseClass
): number => {
  const courseClassCourses = getCourseClassCourses(courseClass, courses);
  return courseClassCourses.length
    ? Math.max(
        ...courseClassCourses.map((course: Course) => course.distance)
      ) || 0
    : 0;
};

export const getCourseClassControlAmount = (
  courses: Course[],
  courseClass: CourseClass
): number => {
  const courseClassCourses = getCourseClassCourses(courseClass, courses);
  if (courses.length) {
    const amount: number[] = courseClassCourses.map((course: Course) => {
      return course.controls.length > 0 ? course.controls.length - 1 : 0;
    });
    return Math.max(...amount) || 0;
  }
  return 0;
};

export const controlLabel = (control: Control): string | number | number[] =>
  control.label ? control.label : control.code;

export const courseClassName = (
  courses: Course[],
  courseClass: CourseClass
): string =>
  `${courseClass.name} / ${
    (geCourseClassDistance(courses, courseClass) || 0) / 1000
  }km`;

export const getCourseClass = (
  classId: string,
  courseClasses: CourseClass[]
): CourseClass => courseClasses.find((c) => c.id === classId);

export const getCourse = (courseId: string, courses: Course[]): Course =>
  courses.find((c) => c.id === courseId);

export const getCourseClassCourses = (
  courseClass: string | CourseClass,
  courses: Course[],
  courseClasses: CourseClass[] = []
): Course[] => {
  const currentClass: CourseClass | undefined =
    typeof courseClass === "string"
      ? getCourseClass(courseClass, courseClasses)
      : courseClass;
  if (currentClass) {
    return courses.filter((c) => currentClass.courseIds.includes(c.id));
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
