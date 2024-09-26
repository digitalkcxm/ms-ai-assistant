export type EnvVars = {
  PORT?: number;

  DB_HOST: string;
  DB_READ_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_DATABASE: string;

  GCLOUD_SERVICE_ACCOUNT_EMAIL: string;
  GCLOUD_SERVICE_ACCOUNT_PRIVATE_KEY: string;
  GCLOUD_PROJECT_ID: string;
  GCLOUD_LOCATION: string;
};
