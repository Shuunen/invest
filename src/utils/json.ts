// oxlint-disable typescript/no-unnecessary-type-parameters

/**
 * Safely parses a JSON string and returns the resulting object. If parsing fails, it logs the error and returns undefined.
 * @param jsonString - The JSON string to parse.
 * @returns The parsed object of type Type, or undefined if parsing fails.
 */
export function jsonParse<Type>(jsonString: string): Type | undefined {
  try {
    return JSON.parse(jsonString) as Type;
  } catch (error) {
    // oxlint-disable-next-line no-console
    console.error("Failed to parse JSON :", error);
    return undefined;
  }
}

const nbSpaces = 2;

/**
 * Safely stringifies a JavaScript object into a JSON string. If stringification fails, it logs the error and returns an empty string.
 * @param data - The data to stringify.
 * @returns A JSON string representation of the data, or an empty string if stringification fails.
 */
export function jsonStringify(data: unknown): string {
  try {
    return JSON.stringify(data, undefined, nbSpaces);
  } catch (error) {
    // oxlint-disable-next-line no-console
    console.error("Failed to stringify JSON :", error);
    return "";
  }
}
