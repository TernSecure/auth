type EventHandler<Events extends Record<string, unknown>, Key extends keyof Events> = (payload: Events[Key]) => void;

type EventBus<Events extends Record<string, unknown>> = {
    on: <Event extends keyof Events>(
        event: Event, 
        handler: EventHandler<Events, Event>, 
        opts?: { notify?: boolean }
    ) => void;
    emit: <Event extends keyof Events>(event: Event, payload: Events[Event]) => void;
    off: <Event extends keyof Events>(event: Event, handler?: EventHandler<Events, Event>) => void;
    getListeners: <Event extends keyof Events>(event: Event) => Array<(...args: any[]) => void>;
};

/**
 * @internal
*/
type InternalOn = <Events extends Record<string, unknown>, Event extends keyof Events>(
    eventToHandlersMap: Map<keyof Events, Array<(...args: any[]) => void>>,
    latestPayloadMap: Map<keyof Events, any>,
    event: Event, 
    handler: EventHandler<Events, Event>,
    opts?: { notify?: boolean }
) => void;


/**
 * @internal
*/
type InternalOff = <Events extends Record<string, unknown>, Event extends keyof Events>(
    eventToHandlersMap: Map<keyof Events, Array<(...args: any[]) => void>>,
    event: Event, 
    handler?: EventHandler<Events, Event>
) => void;


/**
 * @internal
 */
type InternalDispatch = <Events extends Record<string, unknown>, Event extends keyof Events>(
  eventToHandlersMap: Map<keyof Events, Array<(...args: any[]) => void>>,
  event: Event,
  payload: Events[Event],
) => void;


/**
 * @internal
*/
const _off: InternalOff = (eventToHandlersMap, event, handler) => {
    const handlers = eventToHandlersMap.get(event);
    if (handlers) {
        if (handler) {
            handlers.splice(handlers.indexOf(handler) >>> 0, 1);
        } else {
            eventToHandlersMap.set(event, []);
        }
    };
};


/**
 * @internal
*/
const _on: InternalOn = (eventToHandlersMap, latestPayloadMap, event, handler, opts) => {
    const { notify } = opts || {};
    let handlers = eventToHandlersMap.get(event);

    if (!handlers) {
        handlers = [];
        eventToHandlersMap.set(event, handlers);
    }

    handlers.push(handler);
    if (notify && latestPayloadMap.has(event)) {
        handler(latestPayloadMap.get(event));
    }
};

/**
 * @internal
*/

const _dispatch: InternalDispatch = (eventToHandlersMap, event, payload) =>
  (eventToHandlersMap.get(event) || []).map(h => h(payload));


export const createEventBus = <Events extends Record<string, unknown>>(): EventBus<Events> =>{
    const eventToHandlersMap = new Map<keyof Events, Array<(...args: any[]) => void>>();
    const latestPayloadMap = new Map<keyof Events, any>();
    const eventToPredispatchHandlersMap = new Map<keyof Events, Array<(...args: any[]) => void>>();

    const emit: EventBus<Events>['emit'] = (event, payload) => {
        latestPayloadMap.set(event, payload);
        _dispatch(eventToPredispatchHandlersMap, event, payload);
        _dispatch(eventToHandlersMap, event, payload);
};

    return {
        on: (...args) => _on(eventToHandlersMap, latestPayloadMap, ...args),
        emit,
        off: (...args) => _off(eventToHandlersMap, ...args),
        getListeners: event => eventToHandlersMap.get(event) || [],
    };
}