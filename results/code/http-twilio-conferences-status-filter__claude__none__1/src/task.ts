export interface TwilioConference {
  sid: string;
  account_sid: string;
  friendly_name: string;
  status: string; // "init" | "in-progress" | "completed"
  date_created: string;
  date_updated: string;
  region: string;
  reason_conference_ended: string | null;
  call_sid_ending_conference: string | null;
  uri: string;
  subresource_uris: Record<string, string>;
  [key: string]: unknown;
}

interface ConferencePage {
  conferences: TwilioConference[];
  next_page_uri: string | null;
}

const BASE_URL = "https://api.twilio.com";

/**
 * Fetches every conference on the account, both in-progress and completed,
 * following pagination until exhausted. No Status filter is sent, so Twilio
 * returns conferences in all states.
 */
export async function listAllConferences(
  accountSid: string,
  authToken: string,
): Promise<TwilioConference[]> {
  const headers = {
    Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
    Accept: "application/json",
  };

  const all: TwilioConference[] = [];
  let url: string | null =
    `${BASE_URL}/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Conferences.json?PageSize=1000`;

  while (url) {
    const res: Response = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(
        `Twilio API error ${res.status} ${res.statusText}: ${await res.text()}`,
      );
    }
    const page = (await res.json()) as ConferencePage;
    all.push(...page.conferences);
    url = page.next_page_uri ? `${BASE_URL}${page.next_page_uri}` : null;
  }

  return all;
}
