const REQUIRED_API_ENV = ["API_BASE_URL", "API_PROJECT_ID", "API_KEY"];

export class ApiConfigurationError extends Error {
  constructor(missingFields) {
    super(`Missing required server API configuration: ${missingFields.join(", ")}.`);
    this.name = "ApiConfigurationError";
    this.missingFields = missingFields;
  }
}

export function readApiConfiguration(env = process.env) {
  const missingFields = REQUIRED_API_ENV.filter(
    (field) => typeof env?.[field] !== "string" || env[field].trim() === "",
  );

  if (missingFields.length > 0) {
    throw new ApiConfigurationError(missingFields);
  }

  const base = env.API_BASE_URL.trim().replace(/\/+$/, "");
  const project = env.API_PROJECT_ID.trim().replace(/^\/+|\/+$/g, "");
  const apiKey = env.API_KEY.trim();

  if (!base || !project || !apiKey) {
    throw new ApiConfigurationError(REQUIRED_API_ENV.filter((field) => {
      if (field === "API_BASE_URL") return !base;
      if (field === "API_PROJECT_ID") return !project;
      return !apiKey;
    }));
  }

  return { base, project, apiKey };
}
