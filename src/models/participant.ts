import { Gender, PaymentState } from "./result";

export class Participant {
  id: string;
  sportId?: number;
  iofId?: number;
  externalId?: string;
  licenceNumber?: number;
  bibNumber?: number;
  name: string;
  club?: string;
  municipality?: string;
  birthYear?: number;
  nationality?: string;
  chip?: string;
  rentalChip?: boolean;
  email?: string;
  phoneNumber?: string;
  paymentState: PaymentState;
  paymentInfo?: string;
  paymentPrice?: number;
  paymentReference?: number;
  gender: Gender;
  organisationId: string;
  private: boolean;
  additionalInfo?: string;
  updated?: Date;
  constructor() {
    this.paymentState = PaymentState.NOT_PAID;
    this.gender = Gender.NOT_SPECIFIED;
  }
}
