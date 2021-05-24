export function createIdGenerator(): () => string {
  let i = 0;
  return () => `PGT${i++}`;
}
