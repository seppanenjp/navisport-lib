import {
  cloneDeep,
  isObject,
  isEqual,
  transform,
  pickBy,
  identity,
} from "lodash";

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

export const timeDifference = (
  startTime: string | number | Date,
  endTime: string | number | Date,
  milliseconds?: boolean // TODO use precision enum
): number => {
  const time = new Date(endTime).getTime() - new Date(startTime).getTime();
  if (!milliseconds) {
    return Math.floor(time / 1000);
  }
  return time;
};

export const combineDateAndTime = (
  date: string | number | Date,
  time: string | number | Date
): Date => {
  return new Date(Date.parse(`${getDateValue(date)} ${getTimeValue(time)}`));
};

const getDateValue = (date: string | number | Date): string => {
  switch (typeof date) {
    case "string":
      return date.replace(" ", "T").split("T")[0];
    case "number":
    default:
      return new Date(date).toISOString().split("T")[0];
  }
};

const getTimeValue = (time: string | number | Date): string => {
  switch (typeof time) {
    case "string": {
      const values = time.replace(" ", "T").split("T");
      return values[values.length - 1];
    }
    case "number":
    default:
      return new Date(time).toISOString().split("T")[1];
  }
};

export const clone = <T>(object: T): T => cloneDeep(object);
