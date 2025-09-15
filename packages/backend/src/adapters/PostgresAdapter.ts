import { authLogger } from "../utils/logger";
import type { DisabledUserAdapter, DisabledUserRecord, PostgresConfig } from "./types";

export class PostgresAdapter implements DisabledUserAdapter {
  private config: PostgresConfig;
  private tableName: string;

  constructor(config: PostgresConfig) {
    this.config = config;
    this.tableName = config.table || 'disabled_users';
  }

  getDisabledUser = async(uid: string): Promise<DisabledUserRecord | null> => {
    try {
      // For edge runtime, we'll use fetch to call a REST API endpoint
      // This avoids the need for full postgres client libraries in edge
      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.token}`,
        },
        body: JSON.stringify({
          query: `SELECT uid, email, disabled_time as "disabledTime" FROM ${this.tableName} WHERE uid = $1`,
          params: [uid],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.rows && result.rows.length > 0) {
        const row = result.rows[0];
        const disabledUser: DisabledUserRecord = {
          uid: row.uid,
          email: row.email,
          disabledTime: row.disabledTime,
        };
        
        authLogger.debug(`Found disabled user: ${uid}`);
        return disabledUser;
      }

      authLogger.debug(`No disabled user found: ${uid}`);
      return null;
    } catch (error) {
      authLogger.error('Failed to fetch disabled user from Postgres:', error);
      return null;
    }
  }
}