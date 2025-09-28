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
    const { error } = await response.json();
    const errorMessage = translateError(
      errors,
      error?.errorCode || "UNKNOWN_ERROR"
    );
    throw new Error(errorMessage);
  }
}
