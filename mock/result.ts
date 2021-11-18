import { Gender, PaymentState, Result, ResultStatus, ResultType } from "../src";

export const result1: Result = {
  id: "TEST_ID",
  name: "Testaaja Timppa",
  seriesId: null,
  bibNumber: null,
  club: "Testiseura",
  teamId: null,
  eventId: "37ba302c-0146-44e8-b88a-0860630b5e4d",
  courseId: "eba4c981-e695-4b2e-bfb5-37419bdd043a",
  classId: "a6506e3b-2485-4bf4-b891-0a1526d43116",
  leg: null,
  chip: "123456",
  registerTime: "2020-07-27T09:15:24.833Z",
  readTime: "2020-07-27T09:40:51.518Z",
  startTime: null,
  controlTimes: [
    { code: 56, time: 62 },
    { code: 54, time: 81 },
    { code: 31, time: 114 },
    {
      code: 32,
      time: 164,
    },
    {
      code: 35,
      time: 265,
    },
    {
      code: 46,
      time: 292,
    },
    {
      code: 41,
      time: 331,
    },
    {
      code: 40,
      time: 358,
    },
    { code: 39, time: 397 },
    { code: 61, time: 449 },
    { code: 43, time: 569 },
    {
      code: 62,
      time: 602,
    },
    {
      code: 58,
      time: 629,
    },
    { code: 44, time: 919 },
    { code: 45, time: 944 },
    {
      code: 34,
      time: 970,
    },
    { code: 59, time: 996 },
    {
      code: 48,
      time: 1099,
    },
    {
      code: 49,
      time: 1150,
    },
    {
      code: 47,
      time: 1202,
    },
    {
      code: 52,
      time: 1231,
    },
    { code: 51, time: 1265 },
    { code: 55, time: 1305 },
    {
      code: 145,
      time: 1345,
    },
    { code: 105, time: 1363 },
    {
      code: 250,
      time: 1372,
    },
  ],
  municipality: null,
  nationality: "FIN",
  additionalPenalty: null,
  status: ResultStatus.OK,
  registered: true,
  time: 1363,
  position: 1,
  points: 0,
  resultType: ResultType.INDIVIDUAL,
  private: false,
  gender: Gender.NOT_SPECIFIED,
  paymentState: PaymentState.NOT_PAID,
  updated: "2020-07-27T15:00:00.000Z",
};

export const results: Result[] = [result1];
