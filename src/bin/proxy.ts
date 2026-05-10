/**
 * CORS proxy
 */
import { execSync } from "node:child_process";
import http from "node:http";
import https from "node:https";

const targetHost = "www.justetf.com";
const port = 8010;
const pathPrefix = "/proxy";
const httpNoContent = 204;
const httpNotFound = 404;
const httpBadGateway = 502;
const upstreamTimeoutMs = 10_000;

/** In-memory cookie jar: name → raw "name=value" string */
const cookieJar = new Map<string, string>();

/** Headers that expose cross-origin identity — strip them all */
const stripHeaders = new Set(["connection", "host", "origin", "referer", "sec-fetch-dest", "sec-fetch-mode", "sec-fetch-site"]);

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
  const headers: Record<string, string | string[] | undefined> = Object.fromEntries(Object.entries(req.headers).filter(([name]) => !stripHeaders.has(name.toLowerCase())));
  headers.host = targetHost;
  const wicketBaseUrl = req.headers["wicket-ajax-baseurl"];
  headers.referer = wicketBaseUrl ? `https://${targetHost}/${String(wicketBaseUrl).replace(/^\//u, "")}` : `https://${targetHost}${upstreamPath}`;
  const storedCookies = buildCookieHeader();
  if (storedCookies) headers.cookie = storedCookies;
  return headers;
}

function handleProxyRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const upstreamPath = req.url?.slice(pathPrefix.length) || "/";
  const upstreamHeaders = buildUpstreamHeaders(req, upstreamPath);
  const options = {
    headers: upstreamHeaders,
    hostname: targetHost,
    method: req.method,
    path: upstreamPath,
    port: 443,
  };
  console.log(`Proxying ${req.method} ${upstreamPath}`);
  const proxyReq = https.request(options, proxyRes => {
    storeCookies(proxyRes.headers["set-cookie"]);
    const responseHeaders = Object.fromEntries(Object.entries(proxyRes.headers).filter(([name]) => name !== "set-cookie"));
    responseHeaders["access-control-allow-origin"] = "*";
    res.writeHead(proxyRes.statusCode ?? httpBadGateway, responseHeaders);
    proxyRes.on("error", streamErr => {
      console.error("Proxy response stream error:", streamErr.message);
      res.destroy(streamErr);
    });
    proxyRes.pipe(res);
  });
  proxyReq.setTimeout(upstreamTimeoutMs, () => {
    proxyReq.destroy(new Error("Upstream timeout"));
  });
  proxyReq.on("error", err => {
    console.error("Proxy error:", err.message);
    if (res.headersSent) res.destroy(err);
    else {
      res.writeHead(httpBadGateway);
      res.end("Upstream connection failed");
    }
  });
  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.writeHead(httpNoContent);
    res.end();
    return;
  }
  if (!req.url?.startsWith(`${pathPrefix}/`) && req.url !== pathPrefix) {
    res.writeHead(httpNotFound);
    res.end("Not found");
    return;
  }
  handleProxyRequest(req, res);
});

try {
  execSync(`fuser -k ${port}/tcp`, { stdio: "ignore" });
  console.log(`Killed existing process on port ${port}`);
} catch {
  // no process was using the port
}

// oxlint-disable-next-line vitest/require-hook
server.listen(port, "127.0.0.1", () => {
  console.log(`Proxy Active — http://localhost:${port}${pathPrefix} → https://${targetHost}`);
});
