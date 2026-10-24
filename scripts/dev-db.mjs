// Local MongoDB replica set for development without Atlas: node scripts/dev-db.mjs
// Data lives in .devdb/ and survives restarts.
import { mkdirSync } from "node:fs";
import { MongoMemoryReplSet } from "mongodb-memory-server";

mkdirSync(".devdb", { recursive: true });
const rs = await MongoMemoryReplSet.create({
  replSet: { count: 1, storageEngine: "wiredTiger" },
  instanceOpts: [{ port: 27027, dbPath: ".devdb" }],
});
console.log(`Dev MongoDB ready: ${rs.getUri()}`);
process.on("SIGINT", async () => (await rs.stop({ doCleanup: false }), process.exit(0)));
