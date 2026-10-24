// Starts an isolated MongoDB replica set and the production server for Playwright.
// The Mongo URI is written to e2e/.mongo-uri so tests can seed data directly.
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { MongoMemoryReplSet } from "mongodb-memory-server";

const rs = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
const uri = rs.getUri();
writeFileSync("e2e/.mongo-uri", uri);

const server = spawn("npx", ["next", "start", "-p", "3100"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, MONGODB_URI: uri, MONGODB_DB: "e2e", SESSION_PASSWORD: "e2e-session-password-at-least-32-chars!!",
    GOOGLE_CLIENT_ID: "e2e-client.apps.googleusercontent.com",
    GOOGLE_CLIENT_SECRET: "e2e-secret",
  },
});

const stop = async () => {
  server.kill();
  await rs.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
