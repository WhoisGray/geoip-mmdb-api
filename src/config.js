"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }
  return /^(1|true|yes|on)$/i.test(String(value));
}

function parseEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex < 1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function requireFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`[config] Missing ${label}: ${filePath}`);
  }
}

function loadConfig() {
  parseEnvFile(path.join(ROOT_DIR, ".env"));

  const mmdbEntries = String(
    process.env.MMDB_FILES || "db/GeoOpen-Country.mmdb,db/GeoOpen-Country-ASN.mmdb",
  )
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (mmdbEntries.length === 0) {
    throw new Error("[config] MMDB_FILES must include at least one path.");
  }

  const mmdbPaths = mmdbEntries.map((entry) => path.resolve(ROOT_DIR, entry));
  mmdbPaths.forEach((filePath) => requireFile(filePath, "MMDB file"));

  const countryFilePath = path.resolve(
    ROOT_DIR,
    process.env.COUNTRY_FILE || "db/country.json",
  );
  requireFile(countryFilePath, "country file");

  return {
    rootDir: ROOT_DIR,
    port: Number.parseInt(process.env.PORT || "8000", 10) || 8000,
    lookupPubsub: parseBoolean(process.env.LOOKUP_PUBSUB, false),
    redisUrl: process.env.REDIS_URL || "redis://127.0.0.1:6379",
    mmdbPaths,
    countryFilePath,
  };
}

module.exports = {
  loadConfig,
};
