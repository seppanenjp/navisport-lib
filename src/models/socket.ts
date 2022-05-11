export interface SocketMessage<T> {
  operation: SocketOperation;
  payload: T;
  replaceAll?: boolean;
  eventId?: string;
  subject: SocketSubject;
}

export enum SocketOperation {
  Update = "Update",
  Delete = "Delete",
}

export enum SocketSubject {
  Devices = "Devices",
  DeviceStatus = "Device status",
  DevicePing = "Device ping",
  DeviceCommand = "Device command",
  CourseClass = "CourseClass",
  Course = "Course",
  Result = "Result",
  Event = "Event",
  Participant = "Participant",
  Checkpoint = "Checkpoint",
  CodeMap = "CodeMap",
  Organisation = "Organisation",
  Chips = "Chips",
  Passing = "Passing",
}

export enum SocketEvent {
  CONNECT = "connect",
  CONNECTION = "connection",
  DISCONNECT = "disconnect",
  RECONNECT = "reconnect",
  MESSAGE = "socket message",
  JOIN = "join",
  JOINED = "joined",
  LEAVE = "leave",
  LEFT = "left",
}
