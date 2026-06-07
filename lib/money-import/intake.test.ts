import { describe, expect, it } from "vitest";
import { intakeStatementFile } from "./intake";

describe("intakeStatementFile", () => {
  it("accepts a supported file when the declared type matches the content", async () => {
    const file = new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
      "statement.png",
      { type: "image/png" }
    );

    const intake = await intakeStatementFile(file);

    expect(intake.fileKind).toBe("image");
    expect(intake.mimeType).toBe("image/png");
  });

  it("rejects a supported mime type when the file bytes do not match", async () => {
    const file = new File(["not really a png"], "statement.png", {
      type: "image/png",
    });

    await expect(intakeStatementFile(file)).rejects.toThrow(
      "Statement file type does not match content"
    );
  });
});
