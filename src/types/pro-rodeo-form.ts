export type SanctioningBody = "WPRA" | "PRCA";

export interface ProRodeoFormInput {
  rodeoName: string;
  sanctioningBody: SanctioningBody;
  city: string;
  state: string;
  startDate: string;
  endDate: string;
  externalLink: string;
  adminPassword: string;
}

export const EMPTY_PRO_RODEO_FORM: Omit<ProRodeoFormInput, "adminPassword"> = {
  rodeoName: "",
  sanctioningBody: "WPRA",
  city: "",
  state: "",
  startDate: "",
  endDate: "",
  externalLink: "",
};
