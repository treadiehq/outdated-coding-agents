const TWILIO_BASE_URL = "https://api.twilio.com";

export interface TwilioConference {
  sid: string;
  account_sid: string;
  friendly_name: string;
  status: "init" | "in-progress" | "completed";
  region: string;
  date_created: string;
  date_updated: string;
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
 * Returns every conference on the account, both in progress and completed.
 *
 * No Status filter is sent, so Twilio returns conferences in all states.
 * Pagination is followed via `next_page_uri` until exhausted.
 *
 * Credentials default to the TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN
 * environment variables.
 */
export async function listAllConferences(
  accountSid: string | undefined = process.env.TWILIO_ACCOUNT_SID,
  authToken: string | undefined = process.env.TWILIO_AUTH_TOKEN,
): Promise<TwilioConference[]> {
  if (!accountSid || !authToken) {
    throw new Error(
      "Missing Twilio credentials: set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN",
    );
  }

  const authorization =
    "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const conferences: TwilioConference[] = [];
  let nextUri: string | null =
    `/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Conferences.json?PageSize=1000`;

  while (nextUri) {
    const response: Response = await fetch(`${TWILIO_BASE_URL}${nextUri}`, {
      headers: { Authorization: authorization, Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(
        `Twilio API error ${response.status} ${response.statusText}: ${await response.text()}`,
      );
    }

    const page = (await response.json()) as ConferencePage;
    conferences.push(...page.conferences);
    nextUri = page.next_page_uri;
  }

  return conferences;
}
