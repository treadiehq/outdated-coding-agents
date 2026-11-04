export interface TwilioConference {
  sid: string;
  account_sid: string;
  friendly_name: string;
  status: "init" | "in-progress" | "completed" | string;
  region: string | null;
  date_created: string;
  date_updated: string;
  api_version: string;
  reason_conference_ended: string | null;
  call_sid_ending_conference: string | null;
  uri: string;
  subresource_uris: Record<string, string>;
}

interface ConferencePage {
  conferences: TwilioConference[];
  next_page_uri: string | null;
}

const TWILIO_BASE = "https://api.twilio.com";

/**
 * Returns every conference on the account, both in-progress and completed.
 * No Status filter is sent, so Twilio returns conferences in all states.
 * Follows `next_page_uri` until all pages are fetched.
 */
export async function listAllConferences(
  accountSid: string,
  authToken: string,
): Promise<TwilioConference[]> {
  const authorization = "Basic " + btoa(`${accountSid}:${authToken}`);
  const conferences: TwilioConference[] = [];

  let uri: string | null =
    `/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Conferences.json?PageSize=1000`;

  while (uri) {
    const res = await fetch(TWILIO_BASE + uri, {
      headers: { Authorization: authorization, Accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(
        `Twilio request failed: ${res.status} ${res.statusText} - ${await res.text()}`,
      );
    }

    const page = (await res.json()) as ConferencePage;
    conferences.push(...page.conferences);
    uri = page.next_page_uri;
  }

  return conferences;
}
