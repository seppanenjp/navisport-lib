export * from "./models/user";
export * from "./models/checkpoint";
export * from "./models/chip-data";
export * from "./models/code-map";
export * from "./models/control";
export * from "./models/course";
export * from "./models/control-time";
export * from "./models/device";
export * from "./models/organisation";
export * from "./models/passing";
export * from "./models/result";
export * from "./models/series";
export * from "./models/participant";
export * from "./models/event";
export * from "./models/course-class";
export * from "./models/socket";
export * from "./models/link";
export * from "./models/map-information";
export * from "./models/participant-metadata";

export * from "./utils/results";
export * from "./utils/events";

export {};

declare global {
  interface Array<T> {
    add(item: any | any[], idProperty?: string): Array<T>;
    remove(item: any, idProperty?: string): Array<T>;
    extend(items: any[]): void;
  }

  interface String {
    toSeconds(): number | null;
  }

  interface Number {
    toHms(format?: HMSFormat): string | null;
    padZero(): number;
  }
}

Array.prototype.add = function (items, idProperty = "id") {
  let _self = [...this];
  if (!_self) {
    return _self;
  }
  if (!Array.isArray(items)) {
    items = [items];
  }
  items.forEach((item) => {
    _self = _self.remove(item, idProperty);
    _self.push(item);
  });
  return _self;
};

Array.prototype.remove = function (item, idProperty = "id") {
  return (this as Array<any>)?.filter(
    (i) =>
      !(
        i === item ||
        (i[idProperty] &&
          i[idProperty] ===
            (typeof item === "string" ? item : item[idProperty]))
      )
  );
};

Array.prototype.extend = function (items = []) {
  items.forEach((item) => this.push(item));
};

String.prototype.toSeconds = function () {
  if (this.trim()) {
    const p = this.replace(/\./g, ":").split(":");
    let seconds = 0;
    let minutes = 1;

    while (p.length > 0) {
      seconds += minutes * parseInt(p.pop(), 10);
      minutes *= 60;
    }
    if (!isNaN(seconds)) {
      return seconds;
    }
  }
  return null;
};

export enum HMSFormat {
  Short = "Short",
  Full = "Full",
}

Number.prototype.toHms = function (format: HMSFormat = HMSFormat.Short) {
  if (this < 0) {
    return null;
  }
  const minutes: number = Math.floor(this / 60);
  const seconds: number = this - minutes * 60;
  const hours: number = Math.floor(minutes / 60);
  return format === HMSFormat.Short
    ? minutes >= 60
      ? `${hours}:${(minutes - hours * 60).padZero()}:${seconds.padZero()}`
      : `${minutes}:${seconds.padZero()}`
    : `${hours.padZero()}:${(
        minutes -
        hours * 60
      ).padZero()}:${seconds.padZero()}`;
};

Number.prototype.padZero = function () {
  return this.toString().padStart(2, "0");
};
