import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("saju.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    gender TEXT,
    birth_date TEXT,
    calendar_type TEXT,
    birth_time TEXT,
    time_known INTEGER,
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    category TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(profile_id) REFERENCES profiles(id)
  );

  CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    role TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(profile_id) REFERENCES profiles(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/profile", (req, res) => {
    const { name, gender, birthDate, calendarType, birthTime, timeKnown, location } = req.body;
    const stmt = db.prepare(`
      INSERT INTO profiles (name, gender, birth_date, calendar_type, birth_time, time_known, location)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, gender, birthDate, calendarType, birthTime, timeKnown ? 1 : 0, location);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/profile/:id", (req, res) => {
    const profile = db.prepare("SELECT * FROM profiles WHERE id = ?").get(req.params.id);
    res.json(profile);
  });

  app.post("/api/readings", (req, res) => {
    const { profileId, category, content } = req.body;
    const stmt = db.prepare("INSERT INTO readings (profile_id, category, content) VALUES (?, ?, ?)");
    const info = stmt.run(profileId, category, content);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/readings/:profileId", (req, res) => {
    const readings = db.prepare("SELECT * FROM readings WHERE profile_id = ? ORDER BY created_at DESC").all(req.params.profileId);
    res.json(readings);
  });

  app.post("/api/chats", (req, res) => {
    const { profileId, role, message } = req.body;
    const stmt = db.prepare("INSERT INTO chats (profile_id, role, message) VALUES (?, ?, ?)");
    const info = stmt.run(profileId, role, message);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/chats/:profileId", (req, res) => {
    const chats = db.prepare("SELECT * FROM chats WHERE profile_id = ? ORDER BY created_at ASC").all(req.params.profileId);
    res.json(chats);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
