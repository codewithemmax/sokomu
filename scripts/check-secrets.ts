import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

interface Finding {
  file: string;
  reason: string;
}

const FORBIDDEN_FILE_PATTERNS: ReadonlyArray<{ pattern: RegExp; label: string }> = [
  { pattern: /(^|\/)\.env(\.|$)/, label: "Environment file (only .env.example is allowed)" },
  { pattern: /(^|\/)serviceAccountKey\.json$/i, label: "Firebase service account key" },
  { pattern: /(^|\/)google-services\.json$/i, label: "Android Firebase config" },
  { pattern: /(^|\/)GoogleService-Info\.plist$/i, label: "iOS Firebase config" },
  { pattern: /firebase-adminsdk.*\.json$/i, label: "Firebase Admin SDK credential" },
  { pattern: /(^|\/)\.firebase(\/|$)/, label: "Firebase CLI cache directory" },
];

const SECRET_CONTENT_PATTERNS: ReadonlyArray<{ pattern: RegExp; label: string }> = [
  { pattern: /AIza[0-9A-Za-z_-]{30,}/, label: "Google/Firebase API key (AIza...)" },
  { pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, label: "Private key block" },
  { pattern: /"client_secret"\s*:\s*"(?!your-|placeholder|<)[^"]{8,}"/i, label: "OAuth client_secret value" },
  { pattern: /"private_key"\s*:\s*"[^"]{20,}"/i, label: "Service account private_key value" },
  { pattern: /\bgh[po]_[A-Za-z0-9]{30,}\b/, label: "GitHub personal/OAuth token" },
];

const BINARY_EXTENSIONS = /\.(ico|png|jpg|jpeg|webp|gif|woff2?|ttf|eot|pdf|zip|docx)$/i;

function getCandidateFiles(): string[] {
  const tracked = execSync("git ls-files", { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
  const staged = execSync("git diff --cached --name-only --diff-filter=ACMR", { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
  return Array.from(new Set([...tracked, ...staged]));
}

function scan(): Finding[] {
  const findings: Finding[] = [];
  const files = getCandidateFiles();

  for (const file of files) {
    if (file !== ".env.example") {
      for (const rule of FORBIDDEN_FILE_PATTERNS) {
        if (rule.pattern.test(file)) {
          findings.push({ file, reason: rule.label });
        }
      }
    }

    if (file === "scripts/check-secrets.ts" || BINARY_EXTENSIONS.test(file) || !existsSync(file)) {
      continue;
    }

    const content = readFileSync(file, "utf8");
    for (const rule of SECRET_CONTENT_PATTERNS) {
      if (rule.pattern.test(content)) {
        findings.push({ file, reason: rule.label });
      }
    }
  }

  return findings;
}

const findings = scan();
if (findings.length > 0) {
  console.error("Secret check failed. Findings:");
  for (const item of findings) {
    console.error(` - ${item.file}: ${item.reason}`);
  }
  process.exit(1);
}

console.log("Secret check passed: 0 exposed secrets or forbidden files.");
