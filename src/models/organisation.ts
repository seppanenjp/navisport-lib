import { User } from "./user";
import { CodeMap } from "./code-map";
import { Device } from "./device";
import { Series } from "./series";
import { Participant } from "./participant";
import { Event } from "./event";

export enum Licence {
  Basic = "Basic",
  Standard = "Standard",
  Premium = "Premium",
}

export enum OrganisationStatus {
  Active = "Active",
  Pending = "Pending",
  Disabled = "Disabled",
}

export class OrganisationSettings {
  finishControl: number;
  simpleMode: boolean;

  constructor() {
    this.finishControl = 100;
    this.simpleMode = true;
  }
}

export class Organisation {
  id: string;
  name: string;
  rastilippuToken?: string;
  checkoutMerchantId?: string;
  checkoutMerchantSecret?: string;
  externalApi?: string;
  externalApiKey?: string;
  onlineUrl?: string;
  homePage?: string;
  settings?: OrganisationSettings;
  licence: Licence;
  status: OrganisationStatus;
  profileImage?: string;
  paymentReference?: number; // Latest payment
  primaryEmail?: string;
  licenceExpiration: string; // Date;
  businessId?: string;
  phoneNumber?: string;
  postalAddress?: string;
  termsAndConditions?: string;
  vatPercentage: number;
  licenceUsage?: number;
  rentalChips?: string[];
  restrictions?: string[];
  updated?: string; // Date;

  users?: User[];
  codeMaps?: CodeMap[];
  events?: Event[];
  devices?: Device[];
  series?: Series[];
  participants?: Participant[];

  constructor() {
    this.rentalChips = [];
    this.restrictions = [];
    this.codeMaps = [];
    this.users = [];
    this.licence = Licence.Basic;
  }
}
