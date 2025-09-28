export interface ErrorDictionary {
  [key: string]: string;
}

export function translateError(
  errors: ErrorDictionary,
  error: string,
  customErrors?: ErrorDictionary
) {
  if (customErrors) {
    return customErrors[error] || errors[error] || error;
  }

  return errors[error] || error;
}

export function checkResponse(
  response: Response,
  errors: ErrorDictionary,
  customErrors?: ErrorDictionary
) {
  if (!response.ok) {
    const errorMessage = translateError(
      errors,
      response.status.toString(),
      customErrors
    );
    throw new Error(errorMessage);
  }
}
