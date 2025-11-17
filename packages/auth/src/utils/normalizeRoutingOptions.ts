import type { RoutingOptions, RoutingStrategy } from '@tern-secure/types';

const errorPrefix = 'TernSecureJs:';

export function ternInvalidRoutingStrategy(strategy?: string): never {
  throw new Error(`${errorPrefix} Invalid routing strategy, path cannot be used in tandem with ${strategy}.`);
}

export const normalizeRoutingOptions = ({
  routing,
  path,
}: {
  routing?: RoutingStrategy;
  path?: string;
}): RoutingOptions => {
  if (!!path && !routing) {
    return { routing: 'path', path };
  }

  if (routing !== 'path' && !!path) {
    return ternInvalidRoutingStrategy(routing);
  }

  return { routing, path } as RoutingOptions;
};
