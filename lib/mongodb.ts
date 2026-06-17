import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is not set in .env.local");
}

const uri = process.env.MONGODB_URI;

// Cast globalThis to preserve the connection across HMR in development
const g = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!g._mongoClientPromise) {
    g._mongoClientPromise = new MongoClient(uri).connect();
  }
  clientPromise = g._mongoClientPromise;
} else {
  clientPromise = new MongoClient(uri).connect();
}

export default clientPromise;
