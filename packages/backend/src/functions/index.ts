import type { UserRecord } from 'firebase-admin/auth';
import * as functions from 'firebase-functions/v1';

export interface PostgresSyncOptions {
  /**
   * A function that executes a SQL query.
   * Compatible with 'pg' Pool.query or Client.query.
   * You can pass `pool.query.bind(pool)` here.
   */
  query: (text: string, params?: any[]) => Promise<any>;
  
  /**
   * The name of the table to insert users into.
   * @example 'users'
   * @example 'public.profiles'
   */
  tableName: string;

  /**
   * Map Firebase UserRecord fields to your database columns.
   * Key: Firebase field (e.g., 'uid', 'email', 'displayName', 'photoURL')
   * Value: Database column name
   */
  fieldMapping: Partial<Record<keyof UserRecord, string>>;

  /**
   * Optional: Add extra static values or computed values.
   * @example { role: 'user', created_at: new Date() }
   */
  extraFields?: (user: UserRecord) => Record<string, any>;
  
  /**
   * Optional: Callback to run after successful sync
   */
  onSuccess?: (user: UserRecord) => Promise<void>;

  /**
   * Optional: Callback to run on error
   */
  onError?: (error: any, user: UserRecord) => Promise<void>;
}

/**
 * Creates a Firebase Authentication Trigger that syncs new users to a Postgres database.
 * 
 * @example
 * export const syncUser = createPostgresSync({
 *   query: pool.query.bind(pool),
 *   tableName: 'users',
 *   fieldMapping: {
 *     uid: 'id',
 *     email: 'email',
 *     displayName: 'full_name'
 *   }
 * });
 */
export const createPostgresSync = (options: PostgresSyncOptions) => {
  return functions.auth.user().onCreate(async (user) => {
    const { query, tableName, fieldMapping, extraFields, onSuccess, onError } = options;

    try {
      const columns: string[] = [];
      const values: any[] = [];
      const placeholders: string[] = [];

      // Handle mapped fields
      Object.entries(fieldMapping).forEach(([userField, dbColumn]) => {
        if (dbColumn) {
          columns.push(dbColumn);
          values.push((user as any)[userField]);
          placeholders.push(`$${values.length}`);
        }
      });

      // Handle extra fields
      if (extraFields) {
        const extras = extraFields(user);
        Object.entries(extras).forEach(([column, value]) => {
          columns.push(column);
          values.push(value);
          placeholders.push(`$${values.length}`);
        });
      }

      if (columns.length === 0) {
        console.warn('createPostgresSync: No fields mapped for insertion.');
        return;
      }

      const queryText = `
        INSERT INTO ${tableName} (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        ON CONFLICT DO NOTHING
      `;

      await query(queryText, values);

      if (onSuccess) {
        await onSuccess(user);
      }
    } catch (error) {
      console.error('createPostgresSync: Failed to sync user', error);
      if (onError) {
        await onError(error, user);
      } else {
        throw error;
      }
    }
  });
};

export interface GenericSyncOptions {
  /**
   * Map Firebase UserRecord fields to your database columns/fields.
   * Key: Firebase field (e.g., 'uid', 'email')
   * Value: Your database field name
   */
  fieldMapping: Partial<Record<keyof UserRecord, string>>;

  /**
   * Optional: Add extra static values or computed values.
   */
  extraFields?: (user: UserRecord) => Record<string, any>;

  /**
   * Function to save the mapped data to your database.
   * Receives a plain object with the mapped keys and values.
   */
  syncFn: (data: Record<string, any>, user: UserRecord) => Promise<void>;

  /**
   * Optional: Callback to run on error
   */
  onError?: (error: any, user: UserRecord) => Promise<void>;
}

/**
 * Creates a generic Firebase Authentication Trigger for syncing users to any database (Prisma, Drizzle, Mongo, etc).
 * 
 * @example
 * export const syncUser = createGenericSync({
 *   fieldMapping: { uid: 'id', email: 'email' },
 *   syncFn: async (data) => {
 *     await prisma.user.create({ data });
 *   }
 * });
 */
export const createGenericSync = (options: GenericSyncOptions) => {
  return functions.auth.user().onCreate(async (user) => {
    const { fieldMapping, extraFields, syncFn, onError } = options;

    try {
      const data: Record<string, any> = {};

      // Handle mapped fields
      Object.entries(fieldMapping).forEach(([userField, dbField]) => {
        if (dbField) {
          data[dbField] = (user as any)[userField];
        }
      });

      // Handle extra fields
      if (extraFields) {
        const extras = extraFields(user);
        Object.assign(data, extras);
      }

      await syncFn(data, user);

    } catch (error) {
      console.error('createGenericSync: Failed to sync user', error);
      if (onError) {
        await onError(error, user);
      } else {
        throw error;
      }
    }
  });
};
