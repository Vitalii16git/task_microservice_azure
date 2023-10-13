import dotenv from "dotenv";
dotenv.config();
import http from "http";
import url from "url";
import {
  handleFileUpload,
  servePublicFile,
  servePrivateFile,
} from "./service/main.service";

const port = process.env.PORT || 4023;

// Create an HTTP server
const server = http.createServer((req, res) => {
  const requestUrl = url.parse(req.url!, true);
  const pathname = requestUrl.pathname!;

  // enable pathnames /upload, /upload_private
  if (req.method === "POST" && pathname.startsWith("/upload")) {
    handleFileUpload(req, res, pathname);

    return;
  }

  if (req.method === "GET") {
    const fileAccessQuery = requestUrl.query["file-access-key"];
    const fileIdQuery = requestUrl.query["file-unique-id"];

    const accessKey: string | undefined = Array.isArray(fileAccessQuery)
      ? (fileAccessQuery[0] as string)
      : (fileAccessQuery as string | undefined);

    const fileId: string | undefined = Array.isArray(fileIdQuery)
      ? (fileIdQuery[0] as string)
      : (fileIdQuery as string | undefined);

    if (accessKey && fileId) {
      // Handle file access with accessKey and fileId
      servePrivateFile(accessKey, fileId, res);
      return;
    }
    if (fileId && !accessKey) {
      // Handle public file access with only fileId
      servePublicFile(fileId, res);
      return;
    }
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
