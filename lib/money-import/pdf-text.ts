import { inflateSync } from "node:zlib";

const MAX_EXTRACTED_PDF_TEXT_CHARS = 60_000;

function decodePdfLiteralString(value: string) {
  let decoded = "";

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char !== "\\") {
      decoded += char;
      continue;
    }

    const next = value[index + 1];
    index += 1;

    if (next === "n") decoded += "\n";
    else if (next === "r") decoded += "\r";
    else if (next === "t") decoded += "\t";
    else if (next === "b") decoded += "\b";
    else if (next === "f") decoded += "\f";
    else if (next === "\r" && value[index + 1] === "\n") index += 1;
    else if (next === "\n" || next === "\r") decoded += "";
    else if (next && /[0-7]/.test(next)) {
      let octal = next;
      for (let count = 0; count < 2 && /[0-7]/.test(value[index + 1] ?? ""); count += 1) {
        index += 1;
        octal += value[index];
      }
      decoded += String.fromCharCode(Number.parseInt(octal, 8));
    } else {
      decoded += next ?? "";
    }
  }

  return decoded;
}

function decodePdfHexString(value: string) {
  const normalized = value.replace(/\s+/g, "");
  const padded = normalized.length % 2 === 0 ? normalized : `${normalized}0`;
  const bytes = [];

  for (let index = 0; index < padded.length; index += 2) {
    bytes.push(Number.parseInt(padded.slice(index, index + 2), 16));
  }

  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    let decoded = "";
    for (let index = 2; index + 1 < bytes.length; index += 2) {
      decoded += String.fromCharCode((bytes[index] << 8) | bytes[index + 1]);
    }
    return decoded;
  }

  return Buffer.from(bytes).toString("latin1");
}

function extractPdfStrings(value: string) {
  const strings: string[] = [];
  const tokenPattern = /\((?:\\.|[^\\()])*\)|<[\da-fA-F\s]+>/g;

  for (const match of value.matchAll(tokenPattern)) {
    const token = match[0];
    const decoded = token.startsWith("(")
      ? decodePdfLiteralString(token.slice(1, -1))
      : decodePdfHexString(token.slice(1, -1));
    const trimmed = decoded.replace(/\s+/g, " ").trim();

    if (trimmed) {
      strings.push(trimmed);
    }
  }

  return strings;
}

function extractTextFromStream(stream: string) {
  const strings: string[] = [];

  for (const match of stream.matchAll(/\[(.*?)\]\s*TJ/gs)) {
    strings.push(...extractPdfStrings(match[1]));
  }

  for (const match of stream.matchAll(/(\((?:\\.|[^\\()])*\)|<[\da-fA-F\s]+>)\s*Tj/g)) {
    strings.push(...extractPdfStrings(match[1]));
  }

  return strings;
}

function getPdfStreams(bytes: Buffer) {
  const pdf = bytes.toString("latin1");
  const streams: Buffer[] = [];

  for (const match of pdf.matchAll(/stream\r?\n/g)) {
    const start = match.index + match[0].length;
    const end = pdf.indexOf("endstream", start);
    if (end < 0) {
      continue;
    }

    let stream = bytes.subarray(start, end);
    while (stream.length > 0 && (stream[stream.length - 1] === 0x0a || stream[stream.length - 1] === 0x0d)) {
      stream = stream.subarray(0, -1);
    }
    streams.push(stream);
  }

  return streams;
}

export function extractTextFromPdf(bytes: Buffer) {
  const strings: string[] = [];

  for (const stream of getPdfStreams(bytes)) {
    const candidates = [stream];

    try {
      candidates.unshift(inflateSync(stream));
    } catch {
      // Some streams are uncompressed or binary image data.
    }

    for (const candidate of candidates) {
      strings.push(...extractTextFromStream(candidate.toString("latin1")));
    }
  }

  const text = strings.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return text.slice(0, MAX_EXTRACTED_PDF_TEXT_CHARS);
}
