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
export * from "./utils/common";
export * from "./data/countries";

export {};

declare global {
  interface Array<T> {
    add(item: T | T[], idProperty?: string): Array<T>;
    remove(item: T | string, idProperty?: string): Array<T>;
    extend(items: T[]): void;
  }

  interface String {
    toSeconds(): number | null;
    urlify(): string;
    capitalize(): string;
  }

  interface Number {
    toHms(format?: HMSFormat): string | null;
    padZero(): number;
    toPositiveOrZero(): number;
  }
}

Array.prototype.add = function <T>(items: T | T[], idProperty = "id") {
  const _self = [...this];
  (Array.isArray(items) ? items : [items]).forEach((item: T) => {
    const idx = _self.findIndex(
      (it) =>
        (it[idProperty] && // Check that item id property is not undefined
          item[idProperty] &&
          it[idProperty] === item[idProperty]) ||
        it === item
    );
    idx !== -1 ? (_self[idx] = item) : _self.push(item);
  });
  return _self; // [...new Map(_self.map((v) => [v[idProperty], v])).values()];
};

Array.prototype.remove = function <T>(item, idProperty = "id") {
  return [...this].filter(
    (it: T) =>
      !(
        it === item ||
        (it[idProperty] &&
          it[idProperty] ===
            (typeof item === "string" ? item : item[idProperty]))
      )
  );
};

// TODO: remove this
Array.prototype.extend = function <T>(items: T[] = []) {
  items.forEach((item) => this.push(item));
};

String.prototype.toSeconds = function () {
  if (this.trim()) {
    const p = this.split(":");
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

String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
};

String.prototype.urlify = function () {
  return this.toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/([\u0300-\u036f]|[^0-9a-zA-Z])/g, "");
};

export enum HMSFormat {
  Short = "Short",
  Full = "Full",
  MinutesAndSeconds = "Minutes and seconds",
}

Number.prototype.toHms = function (format: HMSFormat = HMSFormat.Short) {
  if (this < 0) {
    return null;
  }
  const minutes: number = Math.floor(this / 60);
  const seconds: number = this - minutes * 60;
  const hours: number = Math.floor(minutes / 60);
  switch (format) {
    case HMSFormat.MinutesAndSeconds:
      return `${minutes.padZero()}:${seconds.padZero()}`;
    case HMSFormat.Short:
      return minutes >= 60
        ? `${hours}:${(minutes - hours * 60).padZero()}:${seconds.padZero()}`
        : `${minutes}:${seconds.padZero()}`;
    case HMSFormat.Full:
      return `${hours.padZero()}:${(
        minutes -
        hours * 60
      ).padZero()}:${seconds.padZero()}`;
  }
};

Number.prototype.padZero = function () {
  return this.toString().padStart(2, "0");
};

Number.prototype.toPositiveOrZero = function () {
  return this < 0 ? 0 : this;
};
