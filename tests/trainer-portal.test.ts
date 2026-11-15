import { beforeEach, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildFallbackTrainerAssist,
  segmentSyllablesHeuristic,
} from "../src/lib/ai/fallback-quiz";
import { clearMemoryMetaForTests } from "../src/lib/db/idb";
import { nfc, nfd } from "../src/lib/tone/normalize";
import {
  buildApprovedGlossaryEntry,
  buildPendingSubmission,
  listQueuedSubmissions,
  listTrainerSubmissions,
  submitTrainerEntry,
  validateTrainerEntryDraft,
} from "../src/lib/trainer/submissions";
import { isTrainerAssist } from "../src/types/guards";

beforeEach(() => {
  clearMemoryMetaForTests();
});

describe("Native Speaker Trainer Portal (U-13)", () => {
  test("validates and normalizes NFC drafts including syllable-tone parity", () => {
    const nfdHeadword = nfd("Wọn kò rí i");
    const valid = validateTrainerEntryDraft({
      dialectId: "yo-ijebu",
      headword: nfdHeadword,
      standardForm: nfd("Wọ́n ò rí i"),
      glossEn: "They did not see it",
      syllables: [nfd("Wọn"), nfd("kò"), nfd("rí"), "i"],
      tonePattern: ["M", "L", "H", "M"],
      exampleLine: nfd("Wọn kò rí i ní ọjà."),
      exampleGlossEn: "They did not see it at the market.",
      scenarioIds: ["yo-ijebu-market-bargain"],
    });

    expect(valid.valid).toBe(true);
    expect(valid.errors.length).toBe(0);
    expect(valid.normalizedDraft.headword).toBe(nfc("Wọn kò rí i"));
    expect(valid.normalizedDraft.scenarioIds).toEqual([
      "yo-ijebu-market-bargain",
    ]);

    const mismatch = validateTrainerEntryDraft({
      dialectId: "yo-ijebu",
      headword: "Ọba",
      glossEn: "King",
      syllables: ["Ọ", "ba"],
      tonePattern: ["M"],
    });
    expect(mismatch.valid).toBe(false);
    expect(mismatch.errors.some((e) => e.includes("Tone pattern length"))).toBe(
      true,
    );

    const halfExample = validateTrainerEntryDraft({
      dialectId: "yo-ijebu",
      headword: "Ọba",
      glossEn: "King",
      syllables: ["Ọ", "ba"],
      tonePattern: ["M", "M"],
      exampleLine: "Ọba ń bọ̀.",
      exampleGlossEn: "",
    });
    expect(halfExample.valid).toBe(false);
  });

  test("enforces two-trainer rule and rejects self-approval", () => {
    const pending = buildPendingSubmission({
      submissionId: "sub-test-001",
      submittedBy: "trainer-ada",
      draft: {
        dialectId: "ig-owerri",
        headword: "Nnọọ",
        glossEn: "Welcome",
        syllables: ["N", "nọ", "ọ"],
        tonePattern: ["M", "M", "M"],
        scenarioIds: ["ig-owerri-family-visit"],
      },
      now: 1_700_000_000_000,
    });

    expect(pending.status).toBe("pending");
    expect(pending.submittedBy).toBe("trainer-ada");

    expect(() =>
      buildApprovedGlossaryEntry({
        submission: pending,
        reviewerUid: "trainer-ada",
      }),
    ).toThrow("Self-approval is not permitted");

    const approved = buildApprovedGlossaryEntry({
      submission: pending,
      reviewerUid: "trainer-chidi",
      now: 1_700_000_100_000,
    });

    expect(approved.verified).toBe(true);
    expect(approved.source).toBe("trainer");
    expect(approved.verifiedBy).toEqual(["trainer-ada", "trainer-chidi"]);
    expect(approved.scenarioIds).toEqual(["ig-owerri-family-visit"]);
  });

  test("queues submissions locally with pendingSync when offline", async () => {
    const { submission, synced } = await submitTrainerEntry({
      submittedBy: "trainer-tunde",
      online: false,
      draft: {
        dialectId: "yo-ekiti",
        headword: "Ẹ kú àbọ̀",
        glossEn: "Welcome back",
        syllables: ["Ẹ", "kú", "à", "bọ̀"],
        tonePattern: ["M", "H", "L", "L"],
        scenarioIds: ["yo-ekiti-compound-greeting"],
      },
    });

    expect(synced).toBe(false);
    expect(submission.pendingSync).toBe(true);
    expect(submission.status).toBe("pending");

    const queued = await listQueuedSubmissions();
    expect(queued.length).toBe(1);
    expect(queued[0]?.submissionId).toBe(submission.submissionId);
    expect(queued[0]?.pendingSync).toBe(true);

    const listed = await listTrainerSubmissions({
      dialectId: "yo-ekiti",
      status: "pending",
      online: false,
    });
    expect(listed.some((item) => item.headword === nfc("Ẹ kú àbọ̀"))).toBe(true);
  });

  test("buildFallbackTrainerAssist produces valid schema-compliant advice without overwriting user edits", () => {
    const segmented = segmentSyllablesHeuristic("Àlàáfíà");
    expect(segmented.length).toBeGreaterThanOrEqual(4);

    const nfdWarningAssist = buildFallbackTrainerAssist(
      nfd("Àlàáfíà"),
      "yo-ijebu",
    );
    expect(isTrainerAssist(nfdWarningAssist)).toBe(true);
    expect(
      nfdWarningAssist.warnings.some((w) => w.includes("Unicode NFC")),
    ).toBe(true);

    const unmarkedYorubaAssist = buildFallbackTrainerAssist("oba", "yo-ijebu");
    expect(isTrainerAssist(unmarkedYorubaAssist)).toBe(true);
    expect(
      unmarkedYorubaAssist.warnings.some((w) => w.includes("tone marks")),
    ).toBe(true);

    const hausaAssist = buildFallbackTrainerAssist("Sannu", "ha-kano");
    expect(isTrainerAssist(hausaAssist)).toBe(true);
    expect(hausaAssist.warnings.length).toBe(0);
  });

  test("Remote Config dialect rule promotion documentation exists and follows style rules", () => {
    const docPath = resolve(
      process.cwd(),
      "docs/remote-config-dialect-promotion.md",
    );
    const content = readFileSync(docPath, "utf8");
    expect(content).toContain("dialect_rules_json");
    expect(content).toContain("isDialectRulesMap");
    expect(content.includes("\u2014")).toBe(false);
  });
});
