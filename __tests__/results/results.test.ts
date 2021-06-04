import { ControlTime, getDuration, readerControl } from "../../src";

describe("Result tests", () => {
  test("Should check correct reader control", () => {
    expect(readerControl(new ControlTime(31, 100))).toEqual(false);
    expect(readerControl(new ControlTime(250, 100))).toEqual(true);
  });

  test("Should get correct duration", () => {
    // Input minutes ->  Returns seconds
    expect(getDuration({ duration: 100 })).toEqual(6000);
    expect(
      getDuration({
        massStartTime: "2020-01-01T10:00:00Z",
        finishClosingTime: "2020-01-01T12:00:00Z",
      })
    ).toEqual(7200);

    expect(getDuration({})).toEqual(Number.MAX_SAFE_INTEGER);
  });
});
