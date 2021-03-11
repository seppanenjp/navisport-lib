import { Organisation } from "./organisation";
import { Gender, Result } from "./result";

export enum UserRole {
  ADMIN = "Admin",
  USER = "User",
}

export class User {
  id: string;
  facebookId?: string;
  googleId?: string;
  password: string;
  username: string;
  email: string;
  name: string;
  sportId?: number;
  iofId?: number;
  externalId?: string;
  licenceNumber?: number;
  club?: string;
  municipality?: string;
  birthYear?: number;
  nationality?: string;
  chip?: string;
  phoneNumber?: string;
  gender: Gender;
  resetKey?: string;
  private?: boolean;
  role: UserRole;
  organisation?: Organisation;
  organisationId?: string;
  results?: Result[];
  registrations?: Result[];
  lastLogin: Date;
  updated?: Date;

  constructor() {
    this.role = UserRole.USER;
  }
}
