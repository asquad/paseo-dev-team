#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const home = os.homedir();
const isWindows = process.platform === "win32";
const stamp = new Date().toISOString().replace(/[-:.]/g, "");

const PROMPT_BEGIN = "[paseo-dev-team orchestration]";
const PROMPT_END = "[/paseo-dev-team orchestration]";
const LEGACY_PROMPT_BEGIN = "[Shared Paseo orchestration]";
const LEGACY_PROMPT_END = "[/Shared Paseo orchestration]";
const LEGACY_SKILLS = ["pr-ready"];
const LAUNCH_SETTINGS = ["provider", "model", "modeId", "thinkingOptionId", "featureValues"];

const HELP = `Usage: install [options]

Links the paseo-dev-team skills into ~/.agents/skills and ~/.claude/skills,
adds the team profiles and the orchestration prompt to the Paseo config, and
reloads Paseo. Safe to run again to update.

Options:
  --dry-run            Show what would change without changing anything.
  --uninstall          Remove the links, team profiles and prompt block.
  --skills-only        Only link the skills.
  --no-prompt          Do not add the orchestration prompt block.
  --reset-profiles     Overwrite the launch settings (provider, model, mode,
                       thinking, feature values) of existing team profiles
                       with the shipped values.
  --backup-conflicts   Move existing skill folders with the same names to
                       ~/.paseo-dev-team/backups/<time>/ instead of skipping.
  --replace-legacy     Also retire the pre-rename setup: move a pr-ready skill
                       folder to the backups, remove the old shared-* profiles
                       and the [Shared Paseo orchestration] prompt block.
  --paseo-home <dir>   Paseo home (default: $PASEO_HOME or ~/.paseo).
  -h, --help           Show this help.
`;

function parseArgs(argv) {
  const opts = {
    dryRun: false,
    uninstall: false,
    skillsOnly: false,
    prompt: true,
    resetProfiles: false,
    backupConflicts: false,
    replaceLegacy: false,
    paseoHome: process.env.PASEO_HOME || path.join(home, ".paseo"),
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--dry-run": opts.dryRun = true; break;
      case "--uninstall": opts.uninstall = true; break;
      case "--skills-only": opts.skillsOnly = true; break;
      case "--no-prompt": opts.prompt = false; break;
      case "--reset-profiles": opts.resetProfiles = true; break;
      case "--backup-conflicts": opts.backupConflicts = true; break;
      case "--replace-legacy": opts.replaceLegacy = true; break;
      case "--paseo-home":
        if (!argv[i + 1]) throw new Error("--paseo-home needs a directory");
        opts.paseoHome = path.resolve(argv[++i]);
        break;
      case "-h":
      case "--help":
        process.stdout.write(HELP);
        process.exit(0);
      default:
        throw new Error(`Unknown option: ${arg}\n\n${HELP}`);
    }
  }
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
let problems = 0;

function log(message) {
  console.log(message);
}

function warn(message) {
  problems++;
  console.log(`  ! ${message}`);
}

function act(description, fn) {
  log(`  ${opts.dryRun ? "would " : ""}${description}`);
  if (!opts.dryRun) fn();
}

function realpathOrNull(p) {
  try {
    return fs.realpathSync(p);
  } catch {
    return null;
  }
}

function lstatOrNull(p) {
  try {
    return fs.lstatSync(p);
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

function backupDir() {
  return path.join(home, ".paseo-dev-team", "backups", stamp);
}

function moveToBackup(source, label) {
  const dest = path.join(backupDir(), label, path.basename(source));
  act(`move ${source} -> ${dest}`, () => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(source, dest);
  });
}

function skillNames() {
  const dir = path.join(repoRoot, "skills");
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(dir, e.name, "SKILL.md")))
    .map((e) => e.name)
    .sort();
}

function skillTargets() {
  const candidates = [path.join(home, ".agents", "skills"), path.join(home, ".claude", "skills")];
  const seen = new Map();
  for (const dir of candidates) {
    if (lstatOrNull(dir)?.isSymbolicLink() && !realpathOrNull(dir)) {
      warn(`${dir} is a link to a missing folder; skipped (fix or remove that link yourself)`);
      continue;
    }
    const real = realpathOrNull(dir) ?? dir;
    const key = isWindows ? real.toLowerCase() : real;
    if (seen.has(key)) {
      log(`  ${dir} is the same folder as ${seen.get(key)}; linking once`);
      continue;
    }
    seen.set(key, dir);
  }
  return [...seen.values()];
}

function samePath(a, b) {
  if (!a || !b) return false;
  return isWindows ? a.toLowerCase() === b.toLowerCase() : a === b;
}

function isInside(child, parent) {
  const rel = isWindows ? path.relative(parent.toLowerCase(), child.toLowerCase()) : path.relative(parent, child);
  return rel === "" || (rel.split(path.sep)[0] !== ".." && !path.isAbsolute(rel));
}

function linkSkills(targets) {
  log("Skills");
  const names = skillNames();
  for (const targetDir of targets) {
    if (!fs.existsSync(targetDir)) {
      act(`create ${targetDir}`, () => fs.mkdirSync(targetDir, { recursive: true }));
    }
    for (const name of names) {
      const source = path.join(repoRoot, "skills", name);
      const dest = path.join(targetDir, name);
      const stat = lstatOrNull(dest);
      if (!stat) {
        act(`link ${dest} -> ${source}`, () => fs.symlinkSync(source, dest, isWindows ? "junction" : "dir"));
        continue;
      }
      if (stat.isSymbolicLink() && samePath(realpathOrNull(dest), realpathOrNull(source))) {
        log(`  ok ${dest}`);
        continue;
      }
      if (stat.isSymbolicLink()) {
        act(`relink ${dest} -> ${source}`, () => {
          fs.unlinkSync(dest);
          fs.symlinkSync(source, dest, isWindows ? "junction" : "dir");
        });
        continue;
      }
      if (opts.backupConflicts) {
        moveToBackup(dest, path.basename(path.dirname(targetDir)));
        act(`link ${dest} -> ${source}`, () => fs.symlinkSync(source, dest, isWindows ? "junction" : "dir"));
      } else {
        warn(`${dest} already exists and is not a link to this repo; skipped (use --backup-conflicts)`);
      }
    }
    for (const legacy of LEGACY_SKILLS) {
      const dest = path.join(targetDir, legacy);
      if (!lstatOrNull(dest)) continue;
      if (opts.replaceLegacy) {
        if (lstatOrNull(dest).isSymbolicLink()) {
          act(`remove legacy link ${dest}`, () => fs.unlinkSync(dest));
        } else {
          moveToBackup(dest, path.basename(path.dirname(targetDir)));
        }
      } else {
        log(`  note: legacy skill ${dest} is still installed; retire it with --replace-legacy`);
      }
    }
  }
}

function unlinkSkills(targets) {
  log("Skills");
  const names = new Set(skillNames());
  for (const targetDir of targets) {
    for (const name of names) {
      const dest = path.join(targetDir, name);
      const stat = lstatOrNull(dest);
      if (!stat) continue;
      const source = path.join(repoRoot, "skills", name);
      if (stat.isSymbolicLink() && samePath(realpathOrNull(dest), realpathOrNull(source))) {
        act(`remove link ${dest}`, () => fs.unlinkSync(dest));
      } else {
        log(`  keep ${dest} (not a link to this repo)`);
      }
    }
  }
}

function loadTeam() {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, "profiles", "team.json"), "utf8"));
}

function loadPrompt() {
  const body = fs.readFileSync(path.join(repoRoot, "paseo", "orchestration-prompt.md"), "utf8").trim();
  return `${PROMPT_BEGIN}\n${body}\n${PROMPT_END}`;
}

function removeBlock(text, begin, end) {
  const start = text.indexOf(begin);
  if (start < 0) return { text, found: false };
  const stop = text.indexOf(end, start);
  if (stop < 0) throw new Error(`appendSystemPrompt has "${begin}" without "${end}"; fix it by hand first`);
  const before = text.slice(0, start).replace(/\s+$/, "");
  const after = text.slice(stop + end.length).replace(/^\s+/, "");
  return { text: before && after ? `${before}\n\n${after}` : before || after, found: true };
}

function upsertBlock(text, block) {
  const start = text.indexOf(PROMPT_BEGIN);
  if (start >= 0) {
    const stop = text.indexOf(PROMPT_END, start);
    if (stop < 0) throw new Error(`appendSystemPrompt has "${PROMPT_BEGIN}" without "${PROMPT_END}"; fix it by hand first`);
    return text.slice(0, start) + block + text.slice(stop + PROMPT_END.length);
  }
  return text.trim() ? `${block}\n\n${text.replace(/^\s+/, "")}` : block;
}

function preflight() {
  const targets = skillTargets();
  if (!opts.uninstall) {
    const repoReal = realpathOrNull(repoRoot) ?? repoRoot;
    for (const dir of targets) {
      const real = realpathOrNull(dir);
      if (real && isInside(repoReal, real)) {
        throw new Error(
          `this clone (${repoReal}) is inside the skills folder ${dir}, so installing could move or shadow it. ` +
            "Commit and push any work in it, clone the repository outside the skills folders and run the " +
            "installer from that clone (README: Upgrading from pr-ready). Nothing was changed.",
        );
      }
    }
  }
  const state = { targets };
  if (opts.skillsOnly) return state;
  state.team = loadTeam();
  if (opts.prompt && !opts.uninstall) state.prompt = loadPrompt();
  state.configPath = path.join(opts.paseoHome, "config.json");
  if (fs.existsSync(state.configPath)) {
    state.original = fs.readFileSync(state.configPath, "utf8");
    try {
      state.config = JSON.parse(state.original.replace(/^﻿/, ""));
    } catch (err) {
      throw new Error(`${state.configPath} is not valid JSON (${err.message}). Nothing was changed.`);
    }
  }
  return state;
}

function updatePaseoConfig({ team, prompt, configPath, original, config }) {
  log(`Paseo config (${opts.paseoHome})`);
  if (!config) {
    warn(`${configPath} not found; start Paseo once, then run the installer again`);
    return false;
  }
  config.daemon ??= {};
  const daemon = config.daemon;
  const teamIds = new Set(team.profiles.map((p) => p.id));
  let profiles = Array.isArray(daemon.agentProfiles) ? daemon.agentProfiles : [];

  if (opts.uninstall) {
    for (const p of profiles.filter((p) => teamIds.has(p.id))) log(`  remove profile ${p.id}`);
    profiles = profiles.filter((p) => !teamIds.has(p.id));
  } else {
    for (const shipped of team.profiles) {
      const index = profiles.findIndex((p) => p.id === shipped.id);
      if (index < 0) {
        log(`  add profile ${shipped.id} (${shipped.provider}/${shipped.model})`);
        profiles.push({ ...shipped });
        continue;
      }
      const existing = profiles[index];
      const merged = { ...existing, ...shipped };
      for (const key of LAUNCH_SETTINGS) {
        if (!opts.resetProfiles && key in existing) merged[key] = existing[key];
        else if (key in shipped) merged[key] = shipped[key];
        else delete merged[key];
      }
      if (JSON.stringify(merged) !== JSON.stringify(existing)) {
        log(`  update profile ${shipped.id}${opts.resetProfiles ? " (settings reset)" : " (keeping your launch settings)"}`);
      }
      profiles[index] = merged;
    }
    if (opts.replaceLegacy) {
      for (const p of profiles.filter((p) => team.legacyIds.includes(p.id))) log(`  remove legacy profile ${p.id} (${p.name})`);
      profiles = profiles.filter((p) => !team.legacyIds.includes(p.id));
    } else {
      const legacy = profiles.filter((p) => team.legacyIds.includes(p.id));
      if (legacy.length) log(`  note: ${legacy.length} legacy shared-* profiles remain; remove them with --replace-legacy`);
    }
  }
  daemon.agentProfiles = profiles;

  if (opts.prompt || opts.uninstall) {
    let text = typeof daemon.appendSystemPrompt === "string" ? daemon.appendSystemPrompt : "";
    if (opts.uninstall) {
      const result = removeBlock(text, PROMPT_BEGIN, PROMPT_END);
      if (result.found) log("  remove orchestration prompt block");
      text = result.text;
    } else {
      if (opts.replaceLegacy) {
        const result = removeBlock(text, LEGACY_PROMPT_BEGIN, LEGACY_PROMPT_END);
        if (result.found) log("  remove legacy [Shared Paseo orchestration] prompt block");
        text = result.text;
      } else if (text.includes(LEGACY_PROMPT_BEGIN)) {
        warn("a legacy [Shared Paseo orchestration] block is in appendSystemPrompt; it conflicts with this one (use --replace-legacy)");
      }
      const updated = upsertBlock(text, prompt);
      if (updated !== text) log("  write orchestration prompt block");
      text = updated;
    }
    if (text) daemon.appendSystemPrompt = text;
    else delete daemon.appendSystemPrompt;
  }

  const output = JSON.stringify(config, null, 2) + (original.endsWith("\n") ? "\n" : "");
  if (output === original) {
    log("  no changes");
    return false;
  }
  const backup = `${configPath}.bak-paseo-dev-team-${stamp}`;
  act(`back up config to ${backup}`, () => fs.copyFileSync(configPath, backup, fs.constants.COPYFILE_EXCL));
  act(`write ${configPath}`, () => {
    const tmp = `${configPath}.tmp-paseo-dev-team`;
    if (isWindows) {
      fs.writeFileSync(tmp, output, { encoding: "utf8" });
    } else {
      const mode = fs.statSync(configPath).mode & 0o777;
      fs.writeFileSync(tmp, output, { encoding: "utf8", mode });
      fs.chmodSync(tmp, mode);
    }
    fs.renameSync(tmp, configPath);
  });
  return true;
}

function reloadPaseo() {
  if (opts.dryRun) {
    log(`  would run: paseo --home ${opts.paseoHome} reload`);
    return;
  }
  const args = ["--home", opts.paseoHome, "reload"];
  const result = isWindows
    ? spawnSync("paseo", args.map((a) => `"${a}"`), { encoding: "utf8", shell: true })
    : spawnSync("paseo", args, { encoding: "utf8" });
  if (result.status === 0) {
    log(`  ${(result.stdout || "paseo reloaded").trim()}`);
  } else {
    warn("could not run `paseo reload`; run it yourself or restart Paseo to load the profiles");
  }
}

try {
  log(`paseo-dev-team ${opts.uninstall ? "uninstall" : "install"} from ${repoRoot}${opts.dryRun ? " (dry run)" : ""}`);
  const state = preflight();
  if (opts.uninstall) unlinkSkills(state.targets);
  else linkSkills(state.targets);
  if (!opts.skillsOnly && updatePaseoConfig(state)) reloadPaseo();
  if (!opts.uninstall) {
    log(`Personal settings: ${path.join(home, ".config", "paseo-dev-team", "config.json")} (optional, see README)`);
  }
  log(problems ? `Done with ${problems} warning(s).` : "Done.");
  process.exit(problems ? 2 : 0);
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
