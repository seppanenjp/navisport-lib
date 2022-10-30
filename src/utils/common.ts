import {
  cloneDeep,
  isObject,
  isEqual,
  transform,
  pickBy,
  identity,
} from "lodash";
import { Time } from "../models/date";

export const validUUID = (uuid: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    uuid
  );

export const validEmail = (email: string): boolean =>
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
    String(email).toLowerCase()
  );

export const uuid = (): string =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

export const createRandomString = (length: number): string =>
  [...Array(length)].map(() => (~~(Math.random() * 36)).toString(36)).join("");

export const hasChanges = <T extends object>(a: T, b: T): boolean =>
  !isEqual(pickBy(a, identity), pickBy(b, identity));

export const difference = <T extends object>(a: T, b: T) => {
  const changes = (object, base) =>
    transform(object, (result, value, key) => {
      if (!isEqual(value, base[key])) {
        result[key] =
          isObject(value) && isObject(base[key])
            ? changes(value, base[key])
            : value;
      }
    });
  return changes(a, b);
};

export enum Precision {
  Seconds = "Seconds",
  Milliseconds = "Milliseconds",
}

export const timeDifference = (
  startTime: Time,
  endTime: Time,
  precision: Precision = Precision.Seconds
): number => {
  const time = new Date(endTime).getTime() - new Date(startTime).getTime();
  if (precision === Precision.Seconds) {
    return Math.floor(time / 1000);
  }
  return time;
};

export const combineDateAndTime = (date: Time, time: Time): Date => {
  return new Date(Date.parse(`${getDateValue(date)} ${getTimeValue(time)}`));
};

const getDateValue = (date: Time): string =>
  typeof date === "string"
    ? date.replace(" ", "T").split("T")[0]
    : new Date(date).toISOString().split("T")[0];

const getTimeValue = (time: Time): string => {
  if (typeof time === "string") {
    const values = time.replace(" ", "T").split("T");
    return values[values.length - 1];
  }
  return new Date(time).toISOString().split("T")[1];
};

export const clone = <T>(object: T): T => cloneDeep(object);
