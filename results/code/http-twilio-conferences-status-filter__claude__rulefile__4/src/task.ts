const TWILIO_BASE_URL = "https://api.twilio.com";
const STATUSES = ["init", "in-progress", "completed"] as const;

export type ConferenceStatus = (typeof STATUSES)[number];

export interface Conference {
  sid: string;
  account_sid: string;
  friendly_name: string;
  status: ConferenceStatus;
  region: string;
  date_created: string;
  date_updated: string;
  reason_conference_ended?: string | null;
  call_sid_ending_conference?: string | null;
  uri: string;
  [key: string]: unknown;
}

interface ConferencePage {
  conferences: Conference[];
  next_page_uri: string | null;
}

/**
 * Returns every conference on the account: not-yet-started (init), running
 * (in-progress) and finished (completed).
 *
 * Twilio defaults `Status` to `in-progress` from 2026-09-30, so each status is
 * requested explicitly and all pages are followed.
 *
 * Credentials default to TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN.
 */
export async function listAllConferences(
  accountSid = process.env.TWILIO_ACCOUNT_SID,
  authToken = process.env.TWILIO_AUTH_TOKEN,
): Promise<Conference[]> {
  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials missing: set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN");
  }

  const headers = {
    Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
    Accept: "application/json",
  };

  const all: Conference[] = [];

  for (const status of STATUSES) {
    const params = new URLSearchParams({ Status: status, PageSize: "1000" });
    let next: string | null =
      `/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Conferences.json?${params}`;

    while (next) {
      const res: Response = await fetch(TWILIO_BASE_URL + next, { headers });
      if (!res.ok) {
        throw new Error(`Twilio API error ${res.status}: ${await res.text()}`);
      }
      const page = (await res.json()) as ConferencePage;
      all.push(...page.conferences);
      next = page.next_page_uri;
    }
  }

  return all;
}
