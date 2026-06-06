import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const host = process.env.HOST || "0.0.0.0";
const port = Number.parseInt(process.env.PORT || "4173", 10);

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
]);

function getNetworkUrls() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((entry) => entry && entry.family === "IPv4" && !entry.internal)
    .map((entry) => `http://${entry.address}:${port}`);
}

function resolveRequestPath(requestUrl, requestHost) {
  const url = new URL(requestUrl || "/", `http://${requestHost || "localhost"}`);
  const decodedPath = decodeURIComponent(url.pathname);
  const sitePath = decodedPath === "/" ? "/index.html" : decodedPath;
  const filePath = resolve(root, `.${sitePath}`);

  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    return null;
  }

  return filePath;
}

function sendText(response, statusCode, text) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(text);
}

const server = createServer(async (request, response) => {
  let filePath;

  try {
    filePath = resolveRequestPath(request.url, request.headers.host);
  } catch {
    sendText(response, 400, "Bad request");
    return;
  }

  if (!filePath) {
    sendText(response, 403, "Forbidden");
    return;
  }

  try {
    const fileStats = await stat(filePath);

    if (!fileStats.isFile()) {
      sendText(response, 404, "Not found");
      return;
    }

    const contentType = mimeTypes.get(extname(filePath).toLowerCase()) || "application/octet-stream";
    response.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": fileStats.size,
      "Cache-Control": filePath.endsWith("index.html")
        ? "no-cache"
        : "public, max-age=3600",
    });
    createReadStream(filePath).pipe(response);
  } catch {
    sendText(response, 404, "Not found");
  }
});

server.listen(port, host, () => {
  const localUrl = `http://localhost:${port}`;
  const networkUrls = getNetworkUrls();

  console.log(`Serving Into the Typing from ${root}`);
  console.log(`Local:   ${localUrl}`);

  if (networkUrls.length) {
    console.log(`Network: ${networkUrls.join(", ")}`);
  }
});
