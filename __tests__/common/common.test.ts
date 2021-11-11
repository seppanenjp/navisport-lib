import * as global from "../../src";
import {
  hasChanges,
  uuid,
  validEmail,
  validUUID,
  difference,
  createRandomString,
  clone,
} from "../../src";
require("../../src");

describe("Common tests", () => {
  test("Array add", () => {
    const arr = [];
    const item = { a: 1, b: 2 };
    expect(arr.add(item).length).toEqual(1);
    // Add twice should check if already exists
    expect(arr.add(item).length).toEqual(1);
  });

  test("Array remove", () => {
    const item = { a: "1", b: "2" };
    const arr = [item];

    expect([...arr].remove(item).length).toEqual(0);
  });

  test("Array extend", () => {
    const arr = [{ a: "1", b: "2" }];
    arr.extend([{ a: "2", b: "1" }]);
    expect(arr.length).toEqual(2);
  });

  test("toSeconds", () => {
    expect("60".toSeconds()).toEqual(60);
    expect("060".toSeconds()).toEqual(60);

    expect("1:20".toSeconds()).toEqual(80);
    expect("01:20".toSeconds()).toEqual(80);

    expect("1:00:00".toSeconds()).toEqual(3600);
    expect("1:10:00".toSeconds()).toEqual(4200);
    expect("1:10:10".toSeconds()).toEqual(4210);
    expect("01:10:10".toSeconds()).toEqual(4210);

    expect("01:10:10.250".toSeconds()).toEqual(4210);
    expect("01:10:10.510".toSeconds()).toEqual(4210);

    expect("".toSeconds()).toEqual(null);
    expect("TMP".toSeconds()).toEqual(null);
  });

  test("toHms", () => {
    expect(Number(50).toHms()).toEqual("0:50");
    expect(Number(60).toHms()).toEqual("1:00");

    expect(Number(3600).toHms()).toEqual("1:00:00");
    expect(Number(4210).toHms()).toEqual("1:10:10");
    expect(Number(-10).toHms()).toEqual(null);
  });

  test("urlify", () => {
    expect("Ääkköset on kivoja".urlify()).toEqual("aakkosetonkivoja");
    expect("ÅLAND on Affenanmaa".urlify()).toEqual("alandonaffenanmaa");
  });

  test("validEmail", () => {
    expect(validEmail("foo@bar.local")).toEqual(true);
    expect(validEmail("foo@local")).toEqual(false);
  });

  test("validUuid", () => {
    expect(validUUID(uuid())).toEqual(true);
  });

  test("createRandomString", () => {
    expect(createRandomString(4).length).toEqual(4);
  });

  test("hasChanges", () => {
    const testObject = {
      value: "value",
      valueObject: {
        value: "value",
      },
    };
    expect(hasChanges(testObject, { ...testObject, value: "" })).toEqual(true);
    expect(hasChanges(testObject, { ...testObject })).toEqual(false);
  });

  test("difference", () => {
    const testObject = {
      value: "value",
      valueObject: {
        value: "value",
      },
    };
    expect(difference(testObject, { ...testObject, value: "" })).toEqual({
      value: "value",
    });
    expect(
      difference(testObject, {
        ...testObject,
        valueObject: {
          value: "",
        },
      })
    ).toEqual({
      valueObject: {
        value: "value",
      },
    });
    expect(difference(testObject, { ...testObject })).toEqual({});
  });

  test("clone", () => {
    const testObject = {
      value: "value",
    };
    const testObject2 = testObject;
    expect(testObject === testObject2).toEqual(true);
    expect(testObject === clone(testObject2)).toEqual(false);
  });
});
