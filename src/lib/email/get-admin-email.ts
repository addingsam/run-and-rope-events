import { TEAM_CONTACT_EMAIL } from "@/lib/constants";

/** Legacy inbox — migrate any env still pointing here to the team address. */
const LEGACY_TEAM_INBOX = "samanthaaddington1@gmail.com";

function normalizeTeamInbox(value: string | undefined) {
  const email = value?.trim().toLowerCase();
  if (!email || email === LEGACY_TEAM_INBOX) {
    return TEAM_CONTACT_EMAIL;
  }
  return email;
}

export function getAdminEmail() {
  return normalizeTeamInbox(process.env.ADMIN_EMAIL);
}
