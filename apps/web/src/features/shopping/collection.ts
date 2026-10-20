import {
  createCollection,
  localStorageCollectionOptions,
} from "@tanstack/react-db";
import { forkCollection } from "@/lib/synced-collection";
import {
  deleteDocuments,
  fetchDocuments,
  upsertDocuments,
} from "@/server/documents";
import {
  planFoodItemId,
  shoppingItemSchema,
  stockItemSchema,
  type ShoppingItem,
  type StockItem,
  type StockItemInput,
} from "./schema";

/**
 * What you keep at home, and what's on the list.
 *
 * The tenth and eleventh `user_documents` kinds — the same no-migration
 * route supplements, extras and habits took.
 */
const localStock = createCollection(
  localStorageCollectionOptions({
    storageKey: "natty.stock.v1",
    getKey: (item) => item.id,
    schema: stockItemSchema,
  }),
);

const localShopping = createCollection(
  localStorageCollectionOptions({
    storageKey: "natty.shopping.v1",
    getKey: (item) => item.id,
    schema: shoppingItemSchema,
  }),
);

export const stockFork = forkCollection({
  queryKey: "stock",
  local: localStock,
  getKey: (item) => item.id,
  fetch: async () =>
    (await fetchDocuments({ data: { kind: "stock" } })) as StockItem[],
  upsert: (rows) => upsertDocuments({ data: { kind: "stock", rows } }),
  remove: (ids) => deleteDocuments({ data: { kind: "stock", ids } }),
});

export const shoppingFork = forkCollection({
  queryKey: "shopping",
  local: localShopping,
  getKey: (item) => item.id,
  fetch: async () =>
    (await fetchDocuments({ data: { kind: "shopping" } })) as ShoppingItem[],
  upsert: (rows) => upsertDocuments({ data: { kind: "shopping", rows } }),
  remove: (ids) => deleteDocuments({ data: { kind: "shopping", ids } }),
});

export const stock = () => stockFork.active();
export const shoppingItems = () => shoppingFork.active();

export function createStockItem(input: StockItemInput) {
  const item: StockItem = {
    ...input,
    id: `stock:${crypto.randomUUID()}`,
    createdAt: Date.now(),
  };
  return { item, transaction: stock().insert(item) };
}

export function updateStockItem(id: string, patch: StockItemInput) {
  return stock().update(id, (draft) => {
    draft.name = patch.name;
    draft.unit = patch.unit;
    draft.packageSize = patch.packageSize;
    draft.onHand = patch.onHand;
    draft.countedAt = patch.countedAt;
    draft.uses = patch.uses;
    draft.dailyUse = patch.dailyUse;
  });
}

/**
 * Say how much there is right now — "I bought two bags", "it's empty",
 * "about half left". All three are the same write: a fresh count.
 *
 * `remaining` is the derived figure the caller already shows, so buying adds
 * to what the app thinks is left rather than to the stale `onHand`.
 */
export function recountStock(id: string, amount: number) {
  return stock().update(id, (draft) => {
    draft.onHand = Math.max(0, amount);
    draft.countedAt = Date.now();
  });
}

/** Returns the row too, so the toast can offer an undo. */
export function deleteStockItem(id: string) {
  const item = stock().get(id);
  return { item, transaction: stock().delete(id) };
}

export function restoreStockItem(item: StockItem) {
  return stock().insert(item);
}

export function addManualItem(name: string, quantity?: string) {
  const item: ShoppingItem = {
    id: `shop:${crypto.randomUUID()}`,
    source: { kind: "manual", name, quantity },
    createdAt: Date.now(),
  };
  return shoppingItems().insert(item);
}

export function setManualChecked(id: string, checked: boolean) {
  return shoppingItems().update(id, (draft) => {
    draft.checkedAt = checked ? Date.now() : undefined;
  });
}

export function removeShoppingItems(ids: string[]) {
  if (ids.length === 0) return undefined;
  return shoppingItems().delete(ids);
}

/** Tick or untick a plan-derived row. One row per food, reused. */
export function setPlanFoodChecked(foodId: string, checked: boolean) {
  const id = planFoodItemId(foodId);
  const existing = shoppingItems().get(id);
  if (existing === undefined) {
    if (!checked) return undefined;
    return shoppingItems().insert({
      id,
      source: { kind: "planFood", foodId },
      checkedAt: Date.now(),
      createdAt: Date.now(),
    });
  }
  return shoppingItems().update(id, (draft) => {
    draft.checkedAt = checked ? Date.now() : undefined;
  });
}
