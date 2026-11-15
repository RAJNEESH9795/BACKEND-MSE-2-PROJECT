
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

let mongoReplicaSet;

beforeAll(async () => {
  mongoReplicaSet = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      storageEngine: "wiredTiger",
    },
  });

  const mongoUri = mongoReplicaSet.getUri();

  await mongoose.connect(mongoUri);

  console.log(
    "MongoDB topology:",
    mongoose.connection.client.topology.description.type
  );
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();

  if (mongoReplicaSet) {
    await mongoReplicaSet.stop();
  }
}, 30000);
