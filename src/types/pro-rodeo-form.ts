export type SanctioningBody = "WPRA" | "PRCA";

export interface ProRodeoInput {
  rodeoName: string;
  sanctioningBody: SanctioningBody;
  city: string;
  state: string;
  startDate: string;
  endDate: string;
  externalLink: string;
}

export interface ProRodeoFormInput extends ProRodeoInput {
  adminPassword: string;
}

export const EMPTY_PRO_RODEO_FORM: ProRodeoInput = {
  rodeoName: "",
  sanctioningBody: "WPRA",
  city: "",
  state: "",
  startDate: "",
  endDate: "",
  externalLink: "",
};
