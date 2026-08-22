const express = require("express");
const { Pool } = require("pg");
const crypto = require("crypto");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false
});

// Teste da conexão com o PostgreSQL
app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      status: "ok",
      database: "connected",
      time: result.rows[0].now
    });
  } catch (error) {
    console.error("Erro no PostgreSQL:", error);

    res.status(500).json({
      status: "error",
      database: "disconnected"
    });
  }
});

// Rota principal
app.get("/", (req, res) => {
  res.send("Central Site App está funcionando!");
});

// Cadastro de usuário
app.post("/api/cadastro", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Nome, e-mail e senha são obrigatórios."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "A senha deve ter pelo menos 6 caracteres."
      });
    }

    // Verifica se o e-mail já existe
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: "Este e-mail já está cadastrado."
      });
    }

    // Cria um hash seguro da senha
    const salt = crypto.randomBytes(16).toString("hex");

    const hashedPassword = await new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) {
          reject(err);
        } else {
          resolve(`${salt}:${derivedKey.toString("hex")}`);
        }
      });
    });

    // Salva o usuário no PostgreSQL
    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, hashedPassword]
    );

    res.status(201).json({
      message: "Usuário cadastrado com sucesso!",
      user: result.rows[0]
    });

  } catch (error) {
    console.error("Erro no cadastro:", error);

    res.status(500).json({
      error: "Erro ao cadastrar usuário."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
