"use strict";

const net = require("node:net");
const express = require("express");
const { loadConfig } = require("./config");
const {
  loadCountryInfo,
  loadMmdbReaders,
  normalizeLookupResult,
} = require("./services/geoip");

const VERSION = "1.0.0-node";
const LOOKUP_ERROR_MESSAGE =
  "IPv4 or IPv6 address is in an incorrect format. Dotted decimal for IPv4 or textual representation for IPv6 are required.";

function isValidIpAddress(ip) {
  return net.isIP(ip) !== 0;
}

function extractIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return String(forwardedFor[0]).split(",")[0].trim();
  }

  const remoteAddress =
    req.socket?.remoteAddress || req.connection?.remoteAddress || "";
  return String(remoteAddress).replace(/^::ffff:/, "");
}

async function createRedisClient(config) {
  if (!config.lookupPubsub) {
    return null;
  }

  const { createClient } = require("redis");
  const client = createClient({ url: config.redisUrl });

  client.on("error", (err) => {
    console.error("Redis error:", err.message);
  });

  await client.connect().catch((err) => {
    console.error("Redis connection failed:", err.message);
  });

  return client;
}

async function publishLookup(redisClient, value) {
  if (!redisClient) {
    return;
  }

  try {
    await redisClient.publish("mmdb-server::lookup", String(value));
  } catch (_error) {}
}

async function startServer() {
  const config = loadConfig();
  const readers = loadMmdbReaders(config.mmdbPaths);
  const countryInfo = loadCountryInfo(config.countryFilePath);
  const redisClient = await createRedisClient(config);

  const app = express();
  app.set("trust proxy", true);

  app.get("/geolookup/:value", async (req, res, next) => {
    try {
      const value = req.params.value;
      const sourceIp = extractIp(req);
      const userAgent = req.get("user-agent") || "";

      if (!isValidIpAddress(value)) {
        res.status(422).json(LOOKUP_ERROR_MESSAGE);
        return;
      }

      await publishLookup(
        redisClient,
        `${value} via ${sourceIp} using ${userAgent}`,
      );

      res.json(normalizeLookupResult(value, readers, countryInfo));
    } catch (error) {
      next(error);
    }
  });

  app.get("/", (req, res, next) => {
    try {
      const ip = extractIp(req);
      res.json(normalizeLookupResult(ip, readers, countryInfo));
    } catch (error) {
      next(error);
    }
  });

  app.get("/raw", (req, res) => {
    res.type("text/plain").send(extractIp(req));
  });

  app.head("/raw", (req, res) => {
    res.setHeader("X-IP", extractIp(req));
    res.status(200).end();
  });

  app.use((error, _req, res, _next) => {
    console.error("Unhandled request error:", error);
    res.status(500).json({ error: "Internal server error" });
  });

  const server = app.listen(config.port, () => {
    console.log(`Serving on port ${config.port}... (version: ${VERSION})`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      if (redisClient) {
        await redisClient.quit().catch(() => {});
      }
      process.exit(0);
    });
  };

  process.on("SIGINT", () => {
    shutdown("SIGINT").catch(() => process.exit(1));
  });

  process.on("SIGTERM", () => {
    shutdown("SIGTERM").catch(() => process.exit(1));
  });
}

module.exports = {
  startServer,
};
