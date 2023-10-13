import { v4 } from "uuid";
import http from "http";
import {
  publicContainerClient,
  validAccessKeys,
  privateContainerClient,
  privateContainerName,
} from "../config/azure.config";
import {
  BlockBlobClient,
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { IncomingForm, Files, Fields } from "formidable";
import fs from "fs";

export const handleFileUpload = async (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  pathname: string
) => {
  const form = new IncomingForm();

  form.parse(
    req,
    async (err: Error, _fields: Fields, files: Files | Buffer) => {
      if (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "File upload failed" }));
        return;
      }
      const { file } = files as Files;

      if (file) {
        // Generate a unique file ID
        const fileId = v4();

        const blockBlobClient: BlockBlobClient =
          pathname === "/upload"
            ? publicContainerClient.getBlockBlobClient(fileId)
            : privateContainerClient.getBlockBlobClient(fileId);

        await Promise.all(
          file.map(async (fileItem) => {
            const readStream = fs.createReadStream(fileItem.filepath);

            await blockBlobClient.uploadStream(readStream, fileItem.size);
          })
        );

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ fileId }));
        return;
      }

      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "File upload failed" }));
    }
  );
  return;
};

export const servePublicFile = async (
  fileId: string,
  res: http.ServerResponse
) => {
  const blockBlobClient = publicContainerClient.getBlockBlobClient(fileId);
  const exists = await blockBlobClient.exists();

  if (!exists) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  res.writeHead(200);

  // Stream the file to the response
  const response = await blockBlobClient.download(0);

  // Pipe the file content to the HTTP response
  response.readableStreamBody!.pipe(res);
};

export const servePrivateFile = async (
  accessKey: string,
  fileId: string,
  res: http.ServerResponse
) => {
  if (!validAccessKeys.has(accessKey)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  const accountName: string = process.env.ACCOUNT_NAME as string;

  const sharedKeyCredential = new StorageSharedKeyCredential(
    accountName,
    accessKey
  );

  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    sharedKeyCredential
  );
  const containerClient =
    blobServiceClient.getContainerClient(privateContainerName);

  // Serve the private file

  const blobClient = containerClient.getBlobClient(fileId);
  const response = await blobClient.download();

  const contentLength: number | undefined = response.contentLength;

  if (contentLength !== undefined) {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Length", contentLength.toString());
  }

  response.readableStreamBody!.pipe(res);
};
