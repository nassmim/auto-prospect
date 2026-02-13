/**
 * Gets the integer or float value of a string
 */
export const customParseInt = (
  val: string | null | undefined,
  parseToFloat: boolean = false,
) => {
  if (!val) return null;
  return parseToFloat ? parseFloat(val) : parseInt(val);
};
