import { v4 } from "uuid";
import http from "http";
import {
  publicContainerClient,
  validAccessKeys,
  privateContainerClient,
} from "../config/azure.config";
import { pipeline, Readable } from "stream";
import { promisify } from "util";
import formidable from "formidable";

const pipelineAsync = promisify(pipeline);

export const handleFileUpload = async (
  req: http.IncomingMessage,
  res: http.ServerResponse
) => {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err: Error, _fields: any, files: any) => {
    if (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "File upload failed" }));
      return;
    }

    const { file } = files;

    if (file) {
      // Generate a unique file ID
      const fileId = v4();

      // Create a BlockBlobClient to store the file in the public container
      const blockBlobClient = publicContainerClient.getBlockBlobClient(fileId);

      // Convert the uploadStream promise to a readable stream
      const uploadStream: any = Readable.from([
        await (blockBlobClient as any).uploadStream(),
      ]);

      // Use pipeline to upload the file to Azure Blob Storage
      try {
        await pipelineAsync(file, uploadStream);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ fileId }));
        return;
      } catch (uploadError) {
        console.error("Error uploading the file:", uploadError);
      }
    }

    // If we reach here, there was an issue with the file upload
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "File upload failed" }));
  });
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

  // Set appropriate Content-Type based on the file type
  res.writeHead(200);

  // Stream the file to the response
  (blockBlobClient as any).downloadTo(res);
};

export const servePrivateFile = async (
  fileAccessKey: string,
  fileId: string,
  res: http.ServerResponse
) => {
  if (validAccessKeys.has(fileAccessKey)) {
    // The access key is valid, serve the private file

    const blockBlobClient = privateContainerClient.getBlockBlobClient(fileId);
    const exists = await blockBlobClient.exists();

    if (!exists) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    // Set appropriate Content-Type based on the file type
    res.writeHead(200);

    // Stream the file to the response
    (blockBlobClient as any).downloadTo(res);
    return;
  }

  // The access key is not valid, return a 403 Forbidden response
  res.writeHead(403);
  res.end("Forbidden");
};
