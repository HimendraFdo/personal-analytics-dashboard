import path from "node:path";

type CdpResponse<T = unknown> = {
  id?: number;
  result?: T;
  error?: { message: string };
};

type RuntimeEvaluateResult<T> = {
  result: {
    value?: T;
    objectId?: string;
  };
};

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const cdpUrl = process.env.QA_CDP_URL ?? "http://localhost:9223";
const statementFile = path.resolve(
  process.cwd(),
  process.env.QA_STATEMENT_FILE ??
    ".qa-money-import-fixtures/synthetic-bank-statement.png"
);
const fixturePath =
  process.env.MONEY_IMPORT_EXTRACT_FIXTURE_PATH ??
  "lib/money-import/fixtures/synthetic-bank-statement.json";
const targetUrl = `${baseUrl.replace(/\/$/, "")}/entries?metric=money`;

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
    const payload = JSON.stringify({ id, method, params });

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (value: unknown) => void, reject });
      this.socket.send(payload);
    });
  }

  close() {
    this.socket.close();
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function evaluate<T>(client: CdpClient, expression: string) {
  const result = await client.send<RuntimeEvaluateResult<T>>("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  return result.result.value as T;
}

async function waitFor<T>(
  client: CdpClient,
  expression: string,
  description: string,
  timeoutMs = 15000
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const value = await evaluate<T>(client, expression);
    if (value) {
      return value;
    }
    await sleep(250);
  }

  throw new Error(`Timed out waiting for ${description}`);
}

async function setFileInput(client: CdpClient) {
  const result = await client.send<RuntimeEvaluateResult<unknown>>(
    "Runtime.evaluate",
    {
      expression:
        "document.querySelector('[data-testid=\"money-import-file-input\"]')",
      returnByValue: false,
    }
  );
  const objectId = result.result.objectId;

  if (!objectId) {
    throw new Error("Money import file input was not found");
  }

  await client.send("DOM.setFileInputFiles", {
    objectId,
    files: [statementFile],
  });
}

async function main() {
  const client = await connect();

  try {
    console.log(`Using extraction fixture: ${fixturePath}`);
    console.log(`Uploading statement file: ${statementFile}`);

    await client.send("Runtime.enable");
    await client.send("DOM.enable");
    await client.send("Page.enable");
    await client.send("Page.navigate", { url: targetUrl });

    await waitFor<boolean>(
      client,
      "document.readyState === 'complete'",
      "page load"
    );

    const signedIn = await waitFor<boolean>(
      client,
      "Boolean(document.querySelector('[data-testid=\"money-import-panel\"]')) || location.pathname.includes('/sign-in')",
      "money import panel or sign-in redirect"
    );

    if (!signedIn) {
      throw new Error("Unexpected navigation state");
    }

    const isSignIn = await evaluate<boolean>(
      client,
      "location.pathname.includes('/sign-in')"
    );
    if (isSignIn) {
      throw new Error(
        "Browser is not signed in. Sign in to the local app, then rerun this script."
      );
    }

    await setFileInput(client);
    await evaluate<void>(
      client,
      "document.querySelector('[data-testid=\"money-import-extract\"]').click()"
    );
    await waitFor<boolean>(
      client,
      "document.body.innerText.includes('Corner Coffee') && document.body.innerText.includes('Market Groceries')",
      "fixture rows to appear"
    );

    await evaluate<void>(
      client,
      "document.querySelector('[data-testid=\"money-import-commit\"]').click()"
    );
    await waitFor<boolean>(
      client,
      "document.body.innerText.includes('Imported 3 money entries.')",
      "import success message"
    );
    await waitFor<boolean>(
      client,
      "[...document.querySelectorAll('[data-testid=\"entry-list-item\"]')].some((item) => item.textContent.includes('Corner Coffee'))",
      "imported entry in history"
    );

    console.log("Money import QA passed.");
  } finally {
    client.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
