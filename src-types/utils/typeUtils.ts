export function oneOfType<T extends any[]>(
  value: any,
  types: T,
): value is T[number] {
  return types.includes(value);
}
