import { deflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { extractTextFromPdf } from "./pdf-text";

function compressedTextPdf(lines: string[]) {
  const stream = deflateSync(["BT", ...lines.map((line) => `(${line})Tj`), "ET"].join("\n"));

  return Buffer.concat([
    Buffer.from("%PDF-1.7\n1 0 obj\n<< /Filter /FlateDecode >>\nstream\n"),
    stream,
    Buffer.from("\nendstream\nendobj\n%%EOF"),
  ]);
}

describe("extractTextFromPdf", () => {
  it("extracts text from compressed PDF text streams", () => {
    const text = extractTextFromPdf(
      compressedTextPdf(["11 Apr", "NEW WORLD TE RAPA 4230", "7.99"])
    );

    expect(text).toContain("11 Apr");
    expect(text).toContain("NEW WORLD TE RAPA 4230");
    expect(text).toContain("7.99");
  });
});
