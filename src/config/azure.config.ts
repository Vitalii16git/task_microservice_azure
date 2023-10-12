import { BlobServiceClient } from "@azure/storage-blob";

// Azure Blob Storage configuration
const connectionString =
  "DefaultEndpointsProtocol=https;AccountName=teststoragename1232;AccountKey=FH563ICDE8mJxfv3xZFpl7wp+gEZnkS/IGmkBBL5ZNNIrgfDBJdDS0CAANOn1huuZAMZt6E4Ye6d+AStfcV2rw==;EndpointSuffix=core.windows.net";
const publicContainerName = "publiccontainer";
const privateContainerName = "privatecontainer";

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
