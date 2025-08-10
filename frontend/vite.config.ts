import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type ViteDevServer } from "vite"
import fsp from "fs/promises"
import type { IncomingMessage, ServerResponse } from "node:http"

// https://vite.dev/config/
function dataApiPlugin() {
  return {
    name: "cellar-data-api",
    configureServer(server: ViteDevServer) {
      const DATA_DIR = path.resolve(__dirname, "data")
      const DATA_FILE = path.resolve(DATA_DIR, "cellar-data.json")

      async function ensureFile() {
        try {
          await fsp.stat(DATA_FILE)
        } catch {
          const initial = { wines: [], fermentationLogs: [], storageLocations: [] }
          await fsp.mkdir(DATA_DIR, { recursive: true })
          await fsp.writeFile(DATA_FILE, JSON.stringify(initial, null, 2), "utf-8")
        }
      }

      type NextFunction = (err?: unknown) => void

      server.middlewares.use("/api/data", async (req: IncomingMessage, res: ServerResponse, next: NextFunction) => {
        try {
          await ensureFile()
          if (req.method === "GET") {
            const buf = await fsp.readFile(DATA_FILE)
            res.setHeader("Content-Type", "application/json")
            res.end(buf)
            return
          }
          if (req.method === "POST") {
            let body = ""
            req.on("data", (chunk: Buffer) => {
              body += chunk
            })
            req.on("end", async () => {
              try {
                const parsed = JSON.parse(body || "{}")
                if (!parsed || typeof parsed !== "object") {
                  res.statusCode = 400
                  res.end("Invalid JSON")
                  return
                }
                await fsp.writeFile(DATA_FILE, JSON.stringify(parsed, null, 2), "utf-8")
                res.setHeader("Content-Type", "application/json")
                res.end(JSON.stringify({ ok: true }))
              } catch {
                res.statusCode = 400
                res.end("Invalid JSON")
              }
            })
            return
          }
          next()
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("/api/data error:", err)
          res.statusCode = 500
          res.end("Server error")
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), dataApiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})