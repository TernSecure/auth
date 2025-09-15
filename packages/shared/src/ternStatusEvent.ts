import type { TernAuthEventPayload } from "@tern-secure/types";

import { createEventBus } from "./eventBus";


export const ternEvents = {
    Status: 'status',
} satisfies Record<string, keyof TernAuthEventPayload>;

export function createTernAuthEventBus() {
    return createEventBus<TernAuthEventPayload>();
}