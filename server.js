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

// Tela inicial
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Central Site App</title>

      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: Arial, sans-serif;
          background: #f5f5f5;
          color: #222;
        }

        header {
          background: #111;
          color: white;
          padding: 20px;
          text-align: center;
        }

        header h1 {
          font-size: 28px;
        }

        .hero {
          text-align: center;
          padding: 60px 20px;
          background: white;
        }

        .hero h2 {
          font-size: 32px;
          margin-bottom: 15px;
        }

        .hero p {
          font-size: 18px;
          color: #666;
          margin-bottom: 30px;
        }

        .buttons {
          display: flex;
          justify-content: center;
          gap: 15px;
          flex-wrap: wrap;
        }

        .button {
          display: inline-block;
          padding: 14px 25px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          background: #111;
          color: white;
        }

        .button.secondary {
          background: #e5e5e5;
          color: #111;
        }

        .services {
          padding: 40px 20px;
          max-width: 900px;
          margin: auto;
        }

        .services h2 {
          text-align: center;
          margin-bottom: 25px;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .card {
          background: white;
          padding: 30px 20px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        }

        .card .icon {
          font-size: 40px;
          margin-bottom: 15px;
        }

        .card h3 {
          margin-bottom: 8px;
        }

        .card p {
          color: #666;
        }
      </style>
    </head>

    <body>

      <header>
        <h1>Central Site App</h1>
      </header>

      <section class="hero">
        <h2>Bem-vindo!</h2>
        <p>Encontre serviços de forma simples e rápida.</p>

        <div class="buttons">
          <a href="#" class="button">Entrar</a>
          <a href="#" class="button secondary">Criar conta</a>
        </div>
      </section>

      <section class="services">
        <h2>Nossos serviços</h2>

        <div class="cards">

          <div class="card">
            <div class="icon">✂️</div>
            <h3>Corte de cabelo</h3>
            <p>Encontre profissionais próximos.</p>
          </div>

          <div class="card">
            <div class="icon">🏍️</div>
            <h3>Moto táxi</h3>
            <p>Transporte rápido e fácil.</p>
          </div>

          <div class="card">
            <div class="icon">🚗</div>
            <h3>Uber</h3>
            <p>Serviços de transporte.</p>
          </div>

          <div class="card">
            <div class="icon">🛠️</div>
            <h3>Outros serviços</h3>
            <p>Em breve teremos mais opções.</p>
          </div>

        </div>
      </section>

    </body>
    </html>
  `);
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

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: "Este e-mail já está cadastrado."
      });
    }

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
