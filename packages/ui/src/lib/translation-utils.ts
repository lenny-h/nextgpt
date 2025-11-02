export interface ErrorDictionary {
  [key: string]: string;
}

export function translateError(errors: ErrorDictionary, errorCode: string) {
  return errors[errorCode] || errorCode;
}

export async function checkResponse(
  response: Response,
  errors: ErrorDictionary
) {
  if (!response.ok) {
    const errorCode = await response.text();
    const errorMessage = translateError(errors, errorCode || "UNKNOWN_ERROR");
    throw new Error(errorMessage);
  }
}
