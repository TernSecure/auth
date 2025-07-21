import type { TernAuthEventPayload } from "@tern-secure/types";

type EventHandler<Events extends Record<string, unknown>, Key extends keyof Events> = (payload: Events[Key]) => void;

type EventBus<Events extends Record<string, unknown>> = {
    on: <Event extends keyof Events>(
        event: Event, 
        handler: EventHandler<Events, Event>, 
        opts?: { notify?: boolean }
    ) => () => void;
    emit: <Event extends keyof Events>(event: Event, payload: Events[Event]) => void;
    off: <Event extends keyof Events>(event: Event, handler: EventHandler<Events, Event>) => void;
    getListeners: <Event extends keyof Events>(event: Event) => Array<(...args: any[]) => void>;
};

export function createEventBus<Events extends Record<string, unknown>>(): EventBus<Events> {
    const eventToHandlersMap = new Map<keyof Events, Array<(...args: any[]) => void>>();
    const listeners = new Map<keyof Events, Set<EventHandler<Events, any>>>();
    
    return {
        on: <Event extends keyof Events>(
            event: Event, 
            handler: EventHandler<Events, Event>, 
            opts?: { notify?: boolean }
        ) => {
            if (!listeners.has(event)) {
                listeners.set(event, new Set());
            }
            listeners.get(event)!.add(handler);
            
            return () => {
                const eventListeners = listeners.get(event);
                if (eventListeners) {
                    eventListeners.delete(handler);
                    if (eventListeners.size === 0) {
                        listeners.delete(event);
                    }
                }
            };
        },
        emit: <Event extends keyof Events>(event: Event, payload: Events[Event]) => {
            const eventListeners = listeners.get(event);
            if (eventListeners) {
                eventListeners.forEach(handler => {
                    try {
                        handler(payload);
                    } catch (error) {
                        console.error(`Error in event handler for ${String(event)}:`, error);
                    }
                });
            }
        },
        off: <Event extends keyof Events>(event: Event, handler: EventHandler<Events, Event>) => {
            const eventListeners = listeners.get(event);
            if (eventListeners) {
                eventListeners.delete(handler);
                if (eventListeners.size === 0) {
                    listeners.delete(event);
                }
            }
        },
        getListeners: event => eventToHandlersMap.get(event) || [],
    };
}

export const ternEvents = {
    Status: 'status',
} satisfies Record<string, keyof TernAuthEventPayload>;

export function createTernAuthEventBus(): EventBus<TernAuthEventPayload> {
    return createEventBus<TernAuthEventPayload>();
}