import { BlobServiceClient } from "@azure/storage-blob";

// Azure Blob Storage configuration
const connectionString: string = process.env.CONNECTION_STRING as string;
const publicContainerName: string = process.env.PUBLIC_CONTAINER as string;
export const privateContainerName: string = process.env
  .PRIVATE_CONTAINER as string;

export const validAccessKeys = new Set([
  process.env.VALID_KEY1,
  process.env.VALID_KEY2,
]);

const blobServiceClient =
  BlobServiceClient.fromConnectionString(connectionString);
export const publicContainerClient =
  blobServiceClient.getContainerClient(publicContainerName);
export const privateContainerClient =
  blobServiceClient.getContainerClient(privateContainerName);
