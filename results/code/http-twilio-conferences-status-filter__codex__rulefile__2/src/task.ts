export type ConferenceStatus = "init" | "in-progress" | "completed";

export interface Conference {
  sid: string;
  account_sid: string;
  friendly_name: string;
  status: ConferenceStatus;
  date_created: string;
  date_updated: string;
  [key: string]: unknown;
}

interface ConferencePage {
  conferences: Conference[];
  next_page_uri: string | null;
}

/**
 * Returns all conferences available through Twilio's REST API for this account.
 * Call only on the server; pass credentials from your secret store/environment.
 * Requires a runtime with native fetch and btoa (for example, Node.js 18+).
 *
 * https://www.twilio.com/docs/voice/api/conference-resource
 */
export async function listAllConferences(
  accountSid: string,
  authToken: string,
): Promise<Conference[]> {
  if (!/^AC[0-9a-fA-F]{32}$/.test(accountSid) || !authToken) {
    throw new Error("A valid Twilio Account SID and Auth Token are required.");
  }

  const origin = "https://api.twilio.com";
  const path = `/2010-04-01/Accounts/${accountSid}/Conferences.json`;
  const authorization = `Basic ${btoa(`${accountSid}:${authToken}`)}`;
  const conferences = new Map<string, Conference>();

  // Since September 30, 2026, omitting Status returns only in-progress
  // conferences. Query every status explicitly, including initialized rooms.
  // Fetch completed last so a room that finishes during traversal is updated.
  const statuses: ConferenceStatus[] = ["init", "in-progress", "completed"];
  for (const status of statuses) {
    let next: URL | null = new URL(path, origin);
    next.searchParams.set("Status", status);
    next.searchParams.set("PageSize", "1000");

    while (next !== null) {
      // Never forward credentials to an unexpected pagination destination.
      if (next.origin !== origin || next.pathname !== path) {
        throw new Error("Twilio returned an unexpected pagination URL.");
      }

      const response = await fetch(next, {
        headers: { Authorization: authorization, Accept: "application/json" },
        redirect: "error",
      });
      if (!response.ok) {
        throw new Error(`Twilio conference list failed: HTTP ${response.status}`);
      }

      const page = (await response.json()) as ConferencePage;
      if (
        !Array.isArray(page.conferences) ||
        !(page.next_page_uri === null || typeof page.next_page_uri === "string")
      ) {
        throw new Error("Twilio returned an invalid conference list response.");
      }
      for (const conference of page.conferences) {
        conferences.set(conference.sid, conference);
      }
      next = page.next_page_uri ? new URL(page.next_page_uri, origin) : null;
    }
  }

  // Listing a live account is not an atomic snapshot; rooms can change status
  // during pagination. Deduplication avoids returning the same SID twice.
  return [...conferences.values()];
}
