import {
  hasChanges,
  uuid,
  validEmail,
  validUUID,
  difference,
  createRandomString,
  clone,
  timeDifference,
  combineDateAndTime,
} from "../../src";

require("../../src");

describe("Common tests", () => {
  test("Array add", () => {
    const item = { a: 1, b: 2 };
    const arr = [item];
    // Add twice should check if already exists
    expect(arr.add(item).length).toEqual(1);
    // Check that item is replaced with correct id property
    expect(arr.add({ ...item, b: 3 }, "a").length).toEqual(1);
    // Different object with different id property
    expect(arr.add({ a: 2, b: 4 }, "a").length).toEqual(2);
    // Should add item if idProperty is not defined correctly
    expect(arr.add({ ...item, b: 3 }, "c").length).toEqual(2);
  });

  test("Array remove", () => {
    const item = { a: "1", b: "2" };
    const arr = [item];

    expect([...arr].remove(item).length).toEqual(0);
    expect([...arr].remove(item.a, "a").length).toEqual(0);
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

  test("capitalize", () => {
    expect("abba".capitalize()).toEqual("Abba");
    expect("".capitalize()).toEqual("");
    expect("cAPITALIZE".capitalize()).toEqual("Capitalize");
  });

  test("validEmail", () => {
    expect(validEmail("foo@bar.local")).toEqual(true);
    expect(validEmail("foo@local")).toEqual(false);
  });

  test("validUuid", () => {
    expect(validUUID(uuid())).toEqual(true);
    expect(validUUID("12412-4124-124-24-2124")).toEqual(false);
  });

  test("createRandomString", () => {
    expect(createRandomString(4).length).toEqual(4);
    expect(createRandomString(10)).not.toEqual(createRandomString(10));
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

  test("timeDifference", () => {
    const t1 = new Date();
    const t2 = new Date(t1.getTime() + 1000);
    expect(timeDifference(t1, t2)).toEqual(1);
    expect(timeDifference(t1, t2, true)).toEqual(1000);

    const t3 = "2000-01-01 10:00:00";
    const t4 = "2000-01-01 10:00:05";
    expect(timeDifference(t3, t4)).toEqual(5);
    expect(timeDifference(t3, t4, true)).toEqual(5000);

    const t5 = 1000;
    const t6 = 2000;
    expect(timeDifference(t5, t6)).toEqual(1);
    expect(timeDifference(t5, t6, true)).toEqual(1000);
  });

  test("combineDateAndTime", () => {
    expect(
      combineDateAndTime("2000-01-01 10:00:00", "2020-02-03 18:00:00")
    ).toEqual(new Date("2000-01-01 18:00:00"));
    expect(combineDateAndTime("2020-01-01", "13:00:00")).toEqual(
      new Date("2020-01-01 13:00:00")
    );
    expect(
      combineDateAndTime(new Date("2020-01-01T10:00:00Z"), "16:00:00")
    ).toEqual(new Date("2020-01-01 16:00:00"));
    expect(
      combineDateAndTime(
        new Date("2020-01-01T10:00:00Z"),
        "2030-03-02T18:00:00Z"
      )
    ).toEqual(new Date("2020-01-01T18:00:00Z"));
  });
});
