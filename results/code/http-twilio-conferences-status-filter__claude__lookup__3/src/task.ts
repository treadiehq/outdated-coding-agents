const TWILIO_API_BASE = "https://api.twilio.com";

export type ConferenceStatus = "init" | "in-progress" | "completed";

export interface Conference {
  sid: string;
  account_sid: string;
  friendly_name: string;
  status: ConferenceStatus;
  region: string;
  date_created: string;
  date_updated: string;
  reason_conference_ended: string | null;
  call_sid_ending_conference: string | null;
  uri: string;
  [key: string]: unknown;
}

interface ConferencePage {
  conferences: Conference[];
  next_page_uri: string | null;
}

const ALL_STATUSES: ConferenceStatus[] = ["init", "in-progress", "completed"];

/**
 * Returns every conference on the account: running (`in-progress`), finished
 * (`completed`) and not yet started (`init`).
 *
 * Twilio only returns `in-progress` conferences unless `Status` is given
 * (since 2026-09-30), so each status is queried explicitly and every page is
 * followed. Completed conferences are only available for 13 months.
 *
 * Reads TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN from the environment unless
 * credentials are passed in.
 */
export async function listAllConferences(
  accountSid: string = process.env.TWILIO_ACCOUNT_SID ?? "",
  authToken: string = process.env.TWILIO_AUTH_TOKEN ?? "",
): Promise<Conference[]> {
  if (!accountSid || !authToken) {
    throw new Error("Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN");
  }

  const headers = {
    Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
    Accept: "application/json",
  };

  const conferences: Conference[] = [];

  for (const status of ALL_STATUSES) {
    const firstPage = new URLSearchParams({ Status: status, PageSize: "1000" });
    let next: string | null =
      `/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Conferences.json?${firstPage}`;

    while (next) {
      const res = await fetch(`${TWILIO_API_BASE}${next}`, { headers });
      if (!res.ok) {
        throw new Error(
          `Twilio request failed: ${res.status} ${res.statusText} - ${await res.text()}`,
        );
      }
      const page = (await res.json()) as ConferencePage;
      conferences.push(...page.conferences);
      next = page.next_page_uri;
    }
  }

  return conferences;
}
