import fs from "node:fs";

type CdpResponse<T = unknown> = {
  id?: number;
  result?: T;
  error?: { message: string };
};

type RuntimeEvaluateResult<T> = {
  result: {
    value?: T;
  };
};

const env = Object.fromEntries(
  fs
    .readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .map((line) => {
      const index = line.indexOf("=");
      if (index < 1 || line.trim().startsWith("#")) {
        return null;
      }

      const key = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim().replace(/^"|"$/g, "");
      return [key, value] as const;
    })
    .filter((item): item is readonly [string, string] => Boolean(item))
);

const cdpUrl = process.env.QA_CDP_URL ?? "http://localhost:9223";
const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const userId =
  process.env.QA_CLERK_USER_ID ?? "user_3En4mayzSFEdRO11HI5Q4GGJUQ3";
const clerkSecretKey = process.env.CLERK_SECRET_KEY ?? env.CLERK_SECRET_KEY;

class CdpClient {
  private nextId = 0;
  private readonly pending = new Map<
    number,
    { resolve: (value: unknown) => void; reject: (error: Error) => void }
  >();

  constructor(private readonly socket: WebSocket) {
    socket.onmessage = (event) => {
      const message = JSON.parse(String(event.data)) as CdpResponse;
      if (!message.id || !this.pending.has(message.id)) {
        return;
      }

      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);

      if (!pending) {
        return;
      }

      if (message.error) {
        pending.reject(new Error(message.error.message));
        return;
      }

      pending.resolve(message.result);
    };
  }

  send<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    const id = ++this.nextId;

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (value: unknown) => void, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket.close();
  }
}

async function createSignInToken() {
  if (!clerkSecretKey) {
    throw new Error("CLERK_SECRET_KEY is not configured");
  }

  const response = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clerkSecretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      expires_in_seconds: 300,
    }),
  });

  if (!response.ok) {
    throw new Error(`Clerk sign-in token request failed: ${response.status}`);
  }

  const body = (await response.json()) as { token?: string };
  if (!body.token) {
    throw new Error("Clerk response did not include a sign-in token");
  }

  return body.token;
}

async function connect() {
  const targets = (await fetch(`${cdpUrl}/json/list`).then((response) =>
    response.json()
  )) as Array<{ type: string; webSocketDebuggerUrl: string }>;
  const target = targets.find((item) => item.type === "page");

  if (!target) {
    throw new Error(`No Chrome page target found at ${cdpUrl}`);
  }

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise<void>((resolve, reject) => {
    socket.onopen = () => resolve();
    socket.onerror = () => reject(new Error("Failed to connect to Chrome CDP"));
  });

  return new CdpClient(socket);
}

async function main() {
  const token = await createSignInToken();
  const client = await connect();

  try {
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Page.navigate", {
      url: `${baseUrl.replace(/\/$/, "")}/sign-in?__clerk_ticket=${encodeURIComponent(
        token
      )}`,
    });
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const result = await client.send<RuntimeEvaluateResult<string>>(
      "Runtime.evaluate",
      {
        expression: "location.href",
        returnByValue: true,
      }
    );
    console.log(`Chrome sign-in token navigation complete: ${result.result.value}`);
  } finally {
    client.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
