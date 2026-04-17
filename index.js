"use strict";

const { startServer } = require("./src/server");

startServer().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
