export function stripScheme(url = ''): string {
  return (url || '').replace(/^.+:\/\//, '');
}
