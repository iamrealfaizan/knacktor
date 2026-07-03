import { MongoClient, type MongoClientOptions } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is not set in .env.local");
}

const uri = process.env.MONGODB_URI;

// Serverless-friendly options: a small pool with a warm connection avoids
// repeated Atlas TLS handshakes per invocation; a bounded selection timeout
// fails fast instead of hanging a lambda for 30s when Atlas is unreachable.
const options: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 1,
  serverSelectionTimeoutMS: 5000,
};

// Cache the connection on globalThis in ALL environments. In development this
// survives HMR; in production (Vercel) it survives warm lambda re-invocations —
// previously prod created a fresh client per module load, paying the handshake
// on every cold-ish start.
const g = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

if (!g._mongoClientPromise) {
  g._mongoClientPromise = new MongoClient(uri, options).connect();
}

const clientPromise: Promise<MongoClient> = g._mongoClientPromise;

export default clientPromise;
