import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { userExerciseSchema, type UserExercise } from "@/features/library/schema";
import {
  userDietPlanSchema,
  type UserDietPlan,
} from "@/features/nutrition/schema";
import {
  recipeSchema,
  userFoodSchema,
  type Recipe,
  type UserFood,
} from "@/features/pantry/schema";
import {
  userRoutineSchema,
  type UserRoutine,
} from "@/features/routines/schema";
import {
  supplementSchema,
  type Supplement,
} from "@/features/supplements/schema";
import { authMiddleware } from "./auth";
import { db } from "./db/client";
import { userDocuments } from "./db/schema";

/**
 * Sync for everything you authored — one set of endpoints across five
 * collections, because their access patterns are identical and the rows are
 * opaque documents either way. See `db/schema.ts` for why they share a table.
 */

/**
 * The schema each kind is validated against, and which field carries its key.
 *
 * `keyField` rather than an extractor function: the five parsed row types form
 * a union, and calling a union of extractors on it doesn't typecheck without
 * a cast that claims every document has both an `id` and a `slug` — which a
 * recipe doesn't. Reading a named field off the object needs no such lie.
 */
const KINDS = {
  exercise: { schema: userExerciseSchema, keyField: "id" },
  routine: { schema: userRoutineSchema, keyField: "slug" },
  food: { schema: userFoodSchema, keyField: "id" },
  recipe: { schema: recipeSchema, keyField: "id" },
  diet: { schema: userDietPlanSchema, keyField: "slug" },
  // The sixth kind, and the one that proves the shape: it needed no migration,
  // no table and no new endpoint — which is what sharing one document table
  // was for.
  supplement: { schema: supplementSchema, keyField: "id" },
} as const;

/**
 * Every shape a document can be.
 *
 * Spelled as a union of the five concrete types rather than a
 * `Record<string, unknown>`: Start typechecks a server function's return for
 * serializability, and an `unknown` value fails that — rightly, since it
 * could be anything. The caller narrows by the kind it asked for.
 */
export type DocumentRow =
  | UserExercise
  | UserRoutine
  | UserFood
  | Recipe
  | UserDietPlan
  | Supplement;

export type DocumentKind = keyof typeof KINDS;
const documentKindSchema = z.enum(
  Object.keys(KINDS) as [DocumentKind, ...DocumentKind[]],
);

/**
 * Rows arrive as `unknown` and are parsed by the kind's own schema in the
 * handler rather than by the validator.
 *
 * A discriminated union over five kinds would type the payload precisely and
 * is a page of generics to express; parsing inside the handler throws on
 * exactly the same bad input, which is what the validation is *for*.
 */
const rowsInput = z.object({
  kind: documentKindSchema,
  rows: z.array(z.unknown()).min(1),
});

function parseRows(kind: DocumentKind, rows: Array<unknown>) {
  const { schema, keyField } = KINDS[kind];
  return rows.map((row) => {
    // Throws on anything the client shouldn't have sent — the boundary check.
    const parsed = schema.parse(row) as DocumentRow;
    const key = (parsed as Record<string, unknown>)[keyField];
    return { id: String(key), data: parsed };
  });
}

export const fetchDocuments = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ kind: documentKindSchema }))
  .handler(async ({ context, data }): Promise<Array<DocumentRow>> => {
    const rows = await db()
      .select({ data: userDocuments.data })
      .from(userDocuments)
      .where(
        and(
          eq(userDocuments.userId, context.userId),
          eq(userDocuments.kind, data.kind),
        ),
      );
    // Parsed on the way out too: a row written by an older version of the app
    // shouldn't hand an unknown shape to a collection. A row that no longer
    // fits is dropped rather than thrown on — one stale document must not
    // take the whole collection down with it.
    const { schema } = KINDS[data.kind];
    return rows
      .map((row) => schema.safeParse(row.data))
      .filter((result) => result.success)
      .map((result): DocumentRow => result.data);
  });

export const upsertDocuments = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(rowsInput)
  .handler(async ({ context, data }) => {
    const rows = parseRows(data.kind, data.rows);
    await db()
      .insert(userDocuments)
      .values(
        rows.map((row) => ({
          userId: context.userId,
          kind: data.kind,
          id: row.id,
          data: row.data,
        })),
      )
      .onConflictDoUpdate({
        target: [userDocuments.userId, userDocuments.kind, userDocuments.id],
        set: { data: sql`excluded.data` },
      });
  });

export const deleteDocuments = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({ kind: documentKindSchema, ids: z.array(z.string()).min(1) }),
  )
  .handler(async ({ context, data }) => {
    await db()
      .delete(userDocuments)
      .where(
        and(
          eq(userDocuments.userId, context.userId),
          eq(userDocuments.kind, data.kind),
          inArray(userDocuments.id, data.ids),
        ),
      );
  });
