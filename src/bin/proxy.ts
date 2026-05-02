/**
 * CORS proxy
 */
import http from "node:http";
import https from "node:https";

const TARGET_HOST = "www.justetf.com";
const PORT = 8010;
const PATH_PREFIX = "/proxy";
const HTTP_NO_CONTENT = 204;
const HTTP_NOT_FOUND = 404;
const HTTP_BAD_GATEWAY = 502;
const UPSTREAM_TIMEOUT_MS = 10_000;

/** In-memory cookie jar: name → raw "name=value" string */
const cookieJar = new Map<string, string>();

/** Headers that expose cross-origin identity — strip them all */
const STRIP_HEADERS = new Set(["connection", "host", "origin", "referer", "sec-fetch-dest", "sec-fetch-mode", "sec-fetch-site"]);

function storeCookies(setCookieHeaders: string | string[] | undefined) {
  if (!setCookieHeaders) return;
  const headers = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
  for (const header of headers) {
    const nameValue = header.split(";")[0].trim();
    const name = nameValue.split("=")[0].trim();
    cookieJar.set(name, nameValue);
  }
}

function buildCookieHeader() {
  return [...cookieJar.values()].join("; ");
}

function buildUpstreamHeaders(req: http.IncomingMessage, upstreamPath: string): Record<string, string | string[] | undefined> {
  const headers: Record<string, string | string[] | undefined> = Object.fromEntries(Object.entries(req.headers).filter(([name]) => !STRIP_HEADERS.has(name.toLowerCase())));
  headers.host = TARGET_HOST;
  const wicketBaseUrl = req.headers["wicket-ajax-baseurl"];
  headers.referer = wicketBaseUrl ? `https://${TARGET_HOST}/${wicketBaseUrl}` : `https://${TARGET_HOST}${upstreamPath}`;
  const storedCookies = buildCookieHeader();
  if (storedCookies) headers.cookie = storedCookies;
  return headers;
}

function handleProxyRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const upstreamPath = req.url?.slice(PATH_PREFIX.length) || "/";
  const upstreamHeaders = buildUpstreamHeaders(req, upstreamPath);
  const options = {
    headers: upstreamHeaders,
    hostname: TARGET_HOST,
    method: req.method,
    path: upstreamPath,
    port: 443,
  };
  console.log(`Proxying ${req.method} ${upstreamPath}`);
  const proxyReq = https.request(options, proxyRes => {
    storeCookies(proxyRes.headers["set-cookie"]);
    const responseHeaders = Object.fromEntries(Object.entries(proxyRes.headers).filter(([name]) => name !== "set-cookie"));
    responseHeaders["access-control-allow-origin"] = "*";
    res.writeHead(proxyRes.statusCode ?? HTTP_BAD_GATEWAY, responseHeaders);
    proxyRes.on("error", streamErr => {
      console.error("Proxy response stream error:", streamErr.message);
      res.destroy(streamErr);
    });
    proxyRes.pipe(res);
  });
  proxyReq.setTimeout(UPSTREAM_TIMEOUT_MS, () => {
    proxyReq.destroy(new Error("Upstream timeout"));
  });
  proxyReq.on("error", err => {
    console.error("Proxy error:", err.message);
    if (!res.headersSent) res.writeHead(HTTP_BAD_GATEWAY);
    res.end("Upstream connection failed");
  });
  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.writeHead(HTTP_NO_CONTENT);
    res.end();
    return;
  }
  if (!req.url?.startsWith(PATH_PREFIX)) {
    res.writeHead(HTTP_NOT_FOUND);
    res.end("Not found");
    return;
  }
  handleProxyRequest(req, res);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Proxy Active — http://localhost:${PORT}${PATH_PREFIX} → https://${TARGET_HOST}`);
});
