import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import type { Recipe } from "../../types/recipe.ts";

export interface AppSchema extends DBSchema {
  recipes: {
    key: string;
    value: Recipe;
    indexes: { byUpdatedAt: number };
  };
}

const DB_NAME = "pizzateig";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AppSchema>> | null = null;

export function getDB(): Promise<IDBPDatabase<AppSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<AppSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, _oldVersion, _newVersion, _tx) {
        if (!db.objectStoreNames.contains("recipes")) {
          const store = db.createObjectStore("recipes", { keyPath: "id" });
          store.createIndex("byUpdatedAt", "updatedAt");
        }
      },
    });
  }
  return dbPromise;
}

/** Test helper: wipe all stores in the current DB. */
export async function clearAll(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(Array.from(db.objectStoreNames), "readwrite");
  await Promise.all(Array.from(db.objectStoreNames).map((name) => tx.objectStore(name).clear()));
  await tx.done;
  notifyMutation("*");
}

/** Notify subscribers of mutations. Channels are per-store. */
export function notifyMutation(storeName: string): void {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(`db:${storeName}`);
  channel.postMessage({ type: "mutation", at: Date.now() });
  channel.close();
}
