import { v4 } from "uuid";
import http from "http";
import {
  publicContainerClient,
  validAccessKeys,
  privateContainerClient,
} from "../config/azure.config";
import { pipeline } from "stream";
import { promisify } from "util";
import { IncomingForm } from "formidable";

const pipelineAsync = promisify(pipeline);

export const handleFileUpload = async (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  pathname: string
) => {
  const form = new IncomingForm();

  form.parse(req, async (err: Error, _fields: any, files: any) => {
    if (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "File upload failed" }));
      return;
    }
    console.log(1);

    const { file } = files;

    if (file) {
      // Generate a unique file ID
      const fileId = v4();

      let blockBlobClient;
      console.log(2);
      // Create a BlockBlobClient to store the file in the public container
      if (pathname === "/upload") {
        blockBlobClient = publicContainerClient.getBlockBlobClient(fileId);
      }
      console.log(pathname, 3);
      // Create a BlockBlobClient to store the file in the private container
      if (pathname === "/upload_private") {
        blockBlobClient = privateContainerClient.getBlockBlobClient(fileId);
      }
      console.log(blockBlobClient, 4);

      // Convert the uploadStream promise to a readable stream
      const uploadStream = await (blockBlobClient as any).uploadStream();
      console.log(5);
      // Use pipeline to upload the file to Azure Blob Storage
      await pipelineAsync(file, uploadStream);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ fileId }));
      return;
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

  res.writeHead(200);

  // Stream the file to the response
  const response = await blockBlobClient.download(0);

  // Pipe the file content to the HTTP response
  response.readableStreamBody!.pipe(res);
  res.end("Success!");
  return;
};

export const servePrivateFile = async (
  accessKey: string,
  fileId: string,
  res: http.ServerResponse
) => {
  if (validAccessKeys.has(accessKey)) {
    // The access key is valid, serve the private file
    const options = { disableContentMD5Validation: true };

    res.setHeader("Content-Type", "application/json");

    // Use Azure FileService to stream the file to the response
    const response = await (privateContainerClient as any).getFileToStream(
      fileId,
      options
    );

    response.readableStreamBody!.pipe(res);

    response.on("end", () => {
      console.log("Success!");
      res.end("Success!");
    });

    return;
  }

  // The access key is not valid, return a 403 Forbidden response
  if (!validAccessKeys.has(accessKey)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
};
