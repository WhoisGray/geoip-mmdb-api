"use strict";

const fs = require("node:fs");
const { Reader } = require("maxmind");

function loadCountryInfo(countryFilePath) {
  return JSON.parse(fs.readFileSync(countryFilePath, "utf8"));
}

function loadMmdbReaders(mmdbPaths) {
  return mmdbPaths.map((mmdbPath) => {
    const buffer = fs.readFileSync(mmdbPath);
    return new Reader(buffer);
  });
}

function safeLookup(reader, ip) {
  const value = reader.get(ip);
  if (value && typeof value === "object") {
    return value;
  }
  return {};
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return undefined;
}

function normalizeLookupResult(ip, readers, countryInfo) {
  const records = readers.map((reader) => safeLookup(reader, ip));

  const countryIsoCode = firstDefined(
    ...records.map((record) => record.country?.iso_code),
    "Unknown",
  );

  const countryDetails =
    countryIsoCode && countryIsoCode !== "Unknown"
      ? countryInfo[countryIsoCode] || {}
      : {};

  const asn = firstDefined(
    ...records.map((record) =>
      firstDefined(
        record?.country?.autonomous_system_number,
        record?.country?.AutonomousSystemNumber,
      ),
    ),
  );

  console.log("%c⧭", "color: #733d00", records);

  console.log("%c⧭", "color: #00bf00", asn);
  const asOrganization = firstDefined(
    ...records.map((record) =>
      firstDefined(
        record?.country?.autonomous_system_organization,
        record?.country?.AutonomousSystemOrganization,
      ),
    ),
  );

  return {
    ip,
    country_iso_code: countryIsoCode || "Unknown",
    country_name: countryDetails.Country || "Unknown",
    country_alpha3_code: countryDetails["Alpha-3 code"] || null,
    country_numeric_code: countryDetails["Numeric code"] || null,
    asn: asn || null,
    as_organization: asOrganization || null,
  };
}

module.exports = {
  loadCountryInfo,
  loadMmdbReaders,
  normalizeLookupResult,
};
