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
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
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

export const hasChanges = (a: any, b: any): boolean =>
  !isEqual(pickBy(a, identity), pickBy(b, identity));

export const difference = (a, b) => {
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

export const clone = <T>(object: T): T => cloneDeep(object);
