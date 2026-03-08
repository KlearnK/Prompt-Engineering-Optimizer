import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";

export function serveStatic(app: express.Express) {
  const distPath = path.resolve(process.cwd(), "client", "dist");
  
  if (!fs.existsSync(distPath)) {
    throw new Error(`Could not find the build directory: ${distPath}`);
  }

  app.use(express.static(distPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

export async function setupVite(app: express.Express, server: createServer) {
  const { createServer: createViteServer } = await import("vite");
  
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });

  app.use(vite.middlewares);
}
