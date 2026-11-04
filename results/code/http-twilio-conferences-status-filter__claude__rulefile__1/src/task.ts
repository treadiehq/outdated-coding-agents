const TWILIO_API = "https://api.twilio.com";

const STATUSES = ["init", "in-progress", "completed"] as const;

export interface TwilioConference {
  sid: string;
  account_sid: string;
  friendly_name: string;
  status: (typeof STATUSES)[number];
  date_created: string;
  date_updated: string;
  region: string;
  api_version: string;
  call_sid_ending_conference: string | null;
  reason_conference_ended: string | null;
  uri: string;
  subresource_uris: Record<string, string>;
}

interface ConferencePage {
  conferences: TwilioConference[];
  next_page_uri: string | null;
}

/**
 * Returns every conference on the account, both running and finished.
 *
 * Twilio's list endpoint defaults to `Status=in-progress` (since 2026-09-30),
 * so each status is requested explicitly and every page is followed.
 * Note: Twilio only retains conferences for 13 months after creation.
 *
 * Reads TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN from the environment unless given.
 */
export async function listAllConferences(
  accountSid: string = process.env.TWILIO_ACCOUNT_SID ?? "",
  authToken: string = process.env.TWILIO_AUTH_TOKEN ?? "",
): Promise<TwilioConference[]> {
  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials missing: set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN");
  }

  const headers = {
    Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
    Accept: "application/json",
  };

  const all: TwilioConference[] = [];

  for (const status of STATUSES) {
    const first = new URLSearchParams({ Status: status, PageSize: "1000" });
    let next: string | null =
      `/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Conferences.json?${first}`;

    while (next) {
      const res = await fetch(`${TWILIO_API}${next}`, { headers });
      if (!res.ok) {
        throw new Error(`Twilio request failed: ${res.status} ${res.statusText} - ${await res.text()}`);
      }
      const page = (await res.json()) as ConferencePage;
      all.push(...page.conferences);
      next = page.next_page_uri;
    }
  }

  return all;
}
