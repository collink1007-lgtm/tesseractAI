import fs from "fs";
import path from "path";
import { storage } from "./storage";

interface CodeEdit {
  id: string;
  timestamp: number;
  file: string;
  action: "read" | "edit" | "create" | "analyze";
  description: string;
  oldContent?: string;
  newContent?: string;
  status: "pending" | "applied" | "rejected" | "failed";
  reason?: string;
}

interface SelfCodeState {
  editsApplied: number;
  editsRejected: number;
  filesRead: number;
  filesModified: string[];
  recentEdits: CodeEdit[];
  capabilities: string[];
  protectedFiles: string[];
}

const PROTECTED_PATTERNS = [
  /father.*protocol/i,
  /COLLIN_VERIFICATION/,
  /loyalty.*immutable/i,
  /loyalty.*1\.0/i,
];

const PROTECTED_FILES = [
  "server/index.ts",
  "drizzle.config.ts",
  "vite.config.ts",
  "server/vite.ts",
];

const EDITABLE_DIRS = [
  "server",
  "client/src",
  "shared",
  "client",
];

const state: SelfCodeState = {
  editsApplied: 0,
  editsRejected: 0,
  filesRead: 0,
  filesModified: [],
  recentEdits: [],
  capabilities: [
    "file-read",
    "file-edit",
    "file-create",
    "code-analysis",
    "self-improvement",
    "agent-creation",
  ],
  protectedFiles: PROTECTED_FILES,
};

function isPathSafe(filePath: string): boolean {
  const normalized = path.normalize(filePath).replace(/\\/g, "/");
  if (normalized.includes("..")) return false;
  if (PROTECTED_FILES.includes(normalized)) return false;
  return EDITABLE_DIRS.some(dir => normalized.startsWith(dir));
}

function containsFatherProtocolOverride(content: string): boolean {
  return PROTECTED_PATTERNS.some(pattern => {
    const matches = content.match(pattern);
    if (!matches) return false;
    const context = content.substring(Math.max(0, content.indexOf(matches[0]) - 50), content.indexOf(matches[0]) + matches[0].length + 50);
    return context.includes("false") || context.includes("0") || context.includes("null") || context.includes("delete") || context.includes("remove") || context.includes("override");
  });
}

export function readProjectFile(filePath: string): { content: string; lines: number; size: number } | { error: string } {
  try {
    const normalized = path.normalize(filePath).replace(/\\/g, "/");
    const fullPath = path.join(process.cwd(), normalized);
    if (!fs.existsSync(fullPath)) return { error: `File not found: ${filePath}` };
    const content = fs.readFileSync(fullPath, "utf-8");
    state.filesRead++;
    return { content, lines: content.split("\n").length, size: content.length };
  } catch (err: any) {
    return { error: err.message };
  }
}

export function listProjectFiles(dir: string = "."): string[] {
  try {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) return [];
    const entries = fs.readdirSync(fullPath, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name).replace(/\\/g, "/");
      if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "dist") continue;
      if (entry.isDirectory()) {
        files.push(entryPath + "/");
        if (EDITABLE_DIRS.some(d => entryPath.startsWith(d) || d.startsWith(entryPath))) {
          files.push(...listProjectFiles(entryPath));
        }
      } else {
        files.push(entryPath);
      }
    }
    return files;
  } catch {
    return [];
  }
}

export function applyCodeEdit(filePath: string, newContent: string, description: string): CodeEdit {
  const edit: CodeEdit = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: Date.now(),
    file: filePath,
    action: "edit",
    description,
    status: "pending",
  };

  if (!isPathSafe(filePath)) {
    edit.status = "rejected";
    edit.reason = `Protected file or unsafe path: ${filePath}`;
    state.editsRejected++;
    state.recentEdits.unshift(edit);
    return edit;
  }

  if (containsFatherProtocolOverride(newContent)) {
    edit.status = "rejected";
    edit.reason = "FATHER PROTOCOL VIOLATION DETECTED - Edit rejected. Tessera cannot override her creator's authority.";
    state.editsRejected++;
    state.recentEdits.unshift(edit);
    return edit;
  }

  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      edit.oldContent = fs.readFileSync(fullPath, "utf-8");
    }
    edit.newContent = newContent;
    fs.writeFileSync(fullPath, newContent, "utf-8");
    edit.status = "applied";
    state.editsApplied++;
    if (!state.filesModified.includes(filePath)) {
      state.filesModified.push(filePath);
    }
  } catch (err: any) {
    edit.status = "failed";
    edit.reason = err.message;
  }

  state.recentEdits.unshift(edit);
  if (state.recentEdits.length > 50) state.recentEdits = state.recentEdits.slice(0, 50);
  return edit;
}

export function getSelfCodeState(): SelfCodeState {
  return { ...state, recentEdits: state.recentEdits.slice(0, 20) };
}

export function getRecentEdits(): CodeEdit[] {
  return state.recentEdits.slice(0, 30);
}
