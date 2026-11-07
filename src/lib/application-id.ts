const applicationIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when the value is a canonical UUID, the type of applications.id. */
export function isApplicationId(value: string): boolean {
  return applicationIdPattern.test(value);
}
