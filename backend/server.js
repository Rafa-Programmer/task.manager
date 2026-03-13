const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3000;
const SECRET = "Segredo_super_simples";

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./database.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      user_id INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token em falta" });
  }

  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido" });
    }
    req.user = user;
    next();
  });
}
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Preenche todos os campos" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [name, email, hashedPassword],
    function (err) {
      if (err) {
        return res.status(400).json({ error: "Email já existe" });
      }

      res.json({ message: "Utilizador criado com sucesso" });
    }
  );
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: "Utilizador não encontrado" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ error: "Password incorreta" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, name: user.name });
  });
});

app.get("/tasks", authenticateToken, (req, res) => {
  db.all(
    "SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC",
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Erro ao buscar tarefa" });
      }
      res.json(rows);
    }
  );
});

app.post("/tasks", authenticateToken, (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Título obrigatório" });
  }

  db.run(
    "INSERT INTO tasks (title, completed, user_id) VALUES (?, 0, ?)",
    [title, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Erro ao criar tarefa" });
      }

      res.json({
        id: this.lastID,
        title,
        completed: 0,
      });
    }
  );
});

app.put("/tasks/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;

  db.run(
    "UPDATE tasks SET title = ?, completed = ? WHERE id = ? AND user_id = ?",
    [title, completed ? 1 : 0, id, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Erro ao atualizar tarefa" });
      }
      res.json({ message: "Tarefa atualizada" });
    }
  );
});

app.delete("/tasks/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run(
    "DELETE FROM tasks WHERE id = ? AND user_id = ?",
    [id, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Erro ao apagar tarefa" });
      }
      res.json({ message: "Tarefa apagada" });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
});