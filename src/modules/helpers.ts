import { Error } from "../../types";

export const resolveError = (error: any): Error => {
  if (typeof error === "object") {
    if (error.error && error.error_code && error.error_description) {
      return {
        error: error.error,
        error_code: error.error_code,
        error_description: error.error_description,
      };
    } else {
      return {
        error: "SDK_ERROR",
        error_code: "0003",
        error_description: error,
      };
    }
  } else {
    return {
      error: "SDK_ERROR",
      error_code: "0003",
      error_description: error,
    };
  }
};

export const getBaseURL = (
  environment: "dev" | "local" | "prod" = "prod",
): string => {
  switch (environment) {
    case "local":
      return "http://localhost";
    case "prod":
      return "https://api.asyncpay.io";
    case "dev":
    default:
      return "https://api.dev.asyncpay.io";
  }
};
