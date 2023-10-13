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

  if (req.method === "POST" && pathname === "/upload") {
    handleFileUpload(req, res);
    return;
  }

  if (req.method === "GET") {
    const segments = pathname.split("/");
    if (segments.length === 2) {
      servePublicFile(segments[1], res);
      return;
    }

    if (segments.length === 3) {
      servePrivateFile(segments[1], segments[2], res);
      return;
    }
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
