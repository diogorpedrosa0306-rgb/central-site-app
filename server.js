const express = require("express");
const { Pool } = require("pg");
const crypto = require("crypto");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// CONEXÃO COM POSTGRESQL
// =========================

if (!process.env.DATABASE_URL) {
  console.error("ERRO: DATABASE_URL não foi configurada no Render.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,

  // Funciona com URL externa e também evita problemas
  // caso o Render forneça sslmode=require.
  ssl: process.env.DATABASE_URL.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : false
});

// =========================
// CRIAR TABELA AUTOMATICAMENTE
// =========================

async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("PostgreSQL conectado.");
    console.log("Tabela users verificada/criada.");
  } catch (error) {
    console.error("ERRO AO CONECTAR AO POSTGRESQL:");
    console.error(error);
    process.exit(1);
  }
}

// =========================
// TELA INICIAL
// =========================

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

  <p>
    Encontre serviços de forma simples e rápida.
  </p>

  <div class="buttons">

    <a href="/cadastro" class="button">
      Criar conta
    </a>

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

// =========================
// CADASTRO
// =========================

app.get("/cadastro", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pt-BR">

<head>

  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>Criar conta</title>

  <style>

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #f5f5f5;

      min-height: 100vh;

      display: flex;
      align-items: center;
      justify-content: center;

      padding: 20px;
    }

    .container {
      width: 100%;
      max-width: 420px;

      background: white;

      padding: 30px;

      border-radius: 15px;

      box-shadow: 0 3px 15px rgba(0,0,0,0.1);
    }

    h1 {
      text-align: center;
      margin-bottom: 10px;
    }

    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 25px;
    }

    label {
      display: block;
      font-weight: bold;
      margin-bottom: 7px;
    }

    input {
      width: 100%;

      padding: 14px;

      margin-bottom: 18px;

      border: 1px solid #ccc;

      border-radius: 8px;

      font-size: 16px;
    }

    button {
      width: 100%;

      padding: 14px;

      border: none;

      border-radius: 8px;

      background: #111;

      color: white;

      font-size: 16px;

      font-weight: bold;

      cursor: pointer;
    }

    .back {
      display: block;

      text-align: center;

      margin-top: 20px;

      color: #222;

      text-decoration: none;
    }

  </style>

</head>

<body>

<div class="container">

  <h1>Criar conta</h1>

  <p class="subtitle">
    Cadastre-se na Central Site App
  </p>

  <form action="/api/cadastro" method="POST">

    <label for="name">
      Nome
    </label>

    <input
      type="text"
      id="name"
      name="name"
      placeholder="Seu nome"
      maxlength="100"
      required
    >

    <label for="email">
      E-mail
    </label>

    <input
      type="email"
      id="email"
      name="email"
      placeholder="seu@email.com"
      maxlength="255"
      required
    >

    <label for="password">
      Senha
    </label>

    <input
      type="password"
      id="password"
      name="password"
      placeholder="Mínimo de 6 caracteres"
      minlength="6"
      required
    >

    <button type="submit">
      Criar conta
    </button>

  </form>

  <a href="/" class="back">
    ← Voltar
  </a>

</div>

</body>

</html>
  `);
});

// =========================
// TESTAR BANCO
// =========================

app.get("/api/health", async (req, res) => {

  try {

    const result = await pool.query(
      "SELECT NOW()"
    );

    res.json({
      status: "ok",
      database: "connected",
      time: result.rows[0].now
    });

  } catch (error) {

    console.error("Erro PostgreSQL:", error);

    res.status(500).json({
      status: "error",
      database: "disconnected",
      error: error.message
    });

  }

});

// =========================
// CADASTRO DE USUÁRIO
// =========================

app.post("/api/cadastro", async (req, res) => {

  try {

    const { name, email, password } = req.body;

    // Verificação dos campos

    if (!name || !email || !password) {

      return res.status(400).send(`
        <h2>Preencha todos os campos.</h2>
        <a href="/cadastro">Voltar</a>
      `);

    }

    // Verificação da senha

    if (password.length < 6) {

      return res.status(400).send(`
        <h2>A senha precisa ter pelo menos 6 caracteres.</h2>
        <a href="/cadastro">Voltar</a>
      `);

    }

    // Limpa os dados

    const cleanName = name.trim();

    const normalizedEmail =
      email.trim().toLowerCase();

    // Verifica se usuário já existe

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {

      return res.status(409).send(`
        <h2>Este e-mail já está cadastrado.</h2>

        <a href="/cadastro">
          Voltar
        </a>
      `);

    }

    // =========================
    // CRIPTOGRAFIA DA SENHA
    // =========================

    const salt =
      crypto.randomBytes(16).toString("hex");

    const hashedPassword =
      await new Promise((resolve, reject) => {

        crypto.scrypt(
          password,
          salt,
          64,
          (err, derivedKey) => {

            if (err) {
              reject(err);
            } else {

              resolve(
                `${salt}:${derivedKey.toString("hex")}`
              );

            }

          }
        );

      });

    // =========================
    // SALVAR USUÁRIO
    // =========================

    const result = await pool.query(
      `
      INSERT INTO users
      (name, email, password)

      VALUES
      ($1, $2, $3)

      RETURNING
      id,
      name,
      email,
      created_at
      `,
      [
        cleanName,
        normalizedEmail,
        hashedPassword
      ]
    );

    console.log(
      "Usuário criado:",
      result.rows[0].email
    );

    // =========================
    // SUCESSO
    // =========================

    res.status(201).send(`
<!DOCTYPE html>

<html lang="pt-BR">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
>

<title>Cadastro realizado</title>

<style>

body {

  font-family: Arial, sans-serif;

  background: #f5f5f5;

  text-align: center;

  padding: 60px 20px;

}

.box {

  max-width: 450px;

  margin: auto;

  background: white;

  padding: 40px 25px;

  border-radius: 15px;

}

h1 {
  margin-bottom: 15px;
}

p {

  color: #555;

  margin-bottom: 25px;

}

a {

  display: inline-block;

  background: #111;

  color: white;

  padding: 14px 25px;

  border-radius: 8px;

  text-decoration: none;

  font-weight: bold;

}

</style>

</head>

<body>

<div class="box">

<h1>
Cadastro realizado! 🎉
</h1>

<p>
Bem-vindo, ${cleanName}!
</p>

<a href="/">
Ir para o início
</a>

</div>

</body>

</html>
    `);

  } catch (error) {

    console.error(
      "ERRO COMPLETO NO CADASTRO:"
    );

    console.error(error);

    res.status(500).send(`
      <h2>Erro ao cadastrar usuário.</h2>

      <p>
        Verifique os logs do servidor.
      </p>

      <a href="/cadastro">
        Tentar novamente
      </a>
    `);

  }

});

// =========================
// INICIAR SERVIDOR
// =========================

const PORT =
  process.env.PORT || 3000;

async function startServer() {

  await initDatabase();

  app.listen(
    PORT,
    "0.0.0.0",
    () => {

      console.log(
        `Servidor rodando na porta ${PORT}`
      );

    }
  );

}

startServer();
    console.log("Tabela users pronta.");
  } catch (error) {
    console.error("Erro ao criar tabela users:", error);
    throw error;
  }
}

// =========================
// TELA INICIAL
// =========================

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pt-BR">

<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

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
      grid-template-columns:
        repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .card {
      background: white;
      padding: 30px 20px;
      border-radius: 12px;
      text-align: center;
      box-shadow:
        0 2px 10px rgba(0, 0, 0, 0.08);
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

    <p>
      Encontre serviços de forma simples e rápida.
    </p>

    <div class="buttons">

      <a href="/login" class="button">
        Entrar
      </a>

      <a href="/cadastro" class="button secondary">
        Criar conta
      </a>

    </div>

  </section>

  <section class="services">

    <h2>Nossos serviços</h2>

    <div class="cards">

      <div class="card">
        <div class="icon">✂️</div>
        <h3>Corte de cabelo</h3>
        <p>
          Encontre profissionais próximos.
        </p>
      </div>

      <div class="card">
        <div class="icon">🏍️</div>
        <h3>Moto táxi</h3>
        <p>
          Transporte rápido e fácil.
        </p>
      </div>

      <div class="card">
        <div class="icon">🚗</div>
        <h3>Uber</h3>
        <p>
          Serviços de transporte.
        </p>
      </div>

      <div class="card">
        <div class="icon">🛠️</div>
        <h3>Outros serviços</h3>
        <p>
          Em breve teremos mais opções.
        </p>
      </div>

    </div>

  </section>

</body>
</html>
  `);
});

// =========================
// TELA DE CADASTRO
// =========================

app.get("/cadastro", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pt-BR">

<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>Criar conta - Central Site App</title>

  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: Arial, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    .container {
      width: 100%;
      max-width: 420px;
      background: white;
      padding: 30px;
      border-radius: 15px;
      box-shadow:
        0 3px 15px rgba(0, 0, 0, 0.1);
    }

    h1 {
      text-align: center;
      margin-bottom: 10px;
    }

    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 25px;
    }

    label {
      display: block;
      margin-bottom: 7px;
      font-weight: bold;
    }

    input {
      width: 100%;
      padding: 14px;
      margin-bottom: 18px;
      border: 1px solid #ccc;
      border-radius: 8px;
      font-size: 16px;
    }

    button {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 8px;
      background: #111;
      color: white;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
    }

    .back {
      display: block;
      text-align: center;
      margin-top: 20px;
      color: #222;
      text-decoration: none;
    }
  </style>
</head>

<body>

  <div class="container">

    <h1>Criar conta</h1>

    <p class="subtitle">
      Cadastre-se na Central Site App
    </p>

    <form action="/api/cadastro" method="POST">

      <label for="name">
        Nome
      </label>

      <input
        type="text"
        id="name"
        name="name"
        placeholder="Seu nome"
        required
      >

      <label for="email">
        E-mail
      </label>

      <input
        type="email"
        id="email"
        name="email"
        placeholder="seu@email.com"
        required
      >

      <label for="password">
        Senha
      </label>

      <input
        type="password"
        id="password"
        name="password"
        placeholder="Mínimo de 6 caracteres"
        minlength="6"
        required
      >

      <button type="submit">
        Criar conta
      </button>

    </form>

    <a href="/" class="back">
      ← Voltar para o início
    </a>

  </div>

</body>
</html>
  `);
});

// =========================
// TELA DE LOGIN
// =========================

app.get("/login", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pt-BR">

<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>Entrar - Central Site App</title>

  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: Arial, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    .container {
      width: 100%;
      max-width: 420px;
      background: white;
      padding: 30px;
      border-radius: 15px;
      box-shadow:
        0 3px 15px rgba(0, 0, 0, 0.1);
    }

    h1 {
      text-align: center;
      margin-bottom: 25px;
    }

    label {
      display: block;
      margin-bottom: 7px;
      font-weight: bold;
    }

    input {
      width: 100%;
      padding: 14px;
      margin-bottom: 18px;
      border: 1px solid #ccc;
      border-radius: 8px;
      font-size: 16px;
    }

    button {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 8px;
      background: #111;
      color: white;
      font-size: 16px;
      font-weight: bold;
    }

    .back {
      display: block;
      text-align: center;
      margin-top: 20px;
      color: #222;
      text-decoration: none;
    }
  </style>
</head>

<body>

  <div class="container">

    <h1>Entrar</h1>

    <form action="/api/login" method="POST">

      <label for="email">
        E-mail
      </label>

      <input
        type="email"
        id="email"
        name="email"
        placeholder="seu@email.com"
        required
      >

      <label for="password">
        Senha
      </label>

      <input
        type="password"
        id="password"
        name="password"
        placeholder="Sua senha"
        required
      >

      <button type="submit">
        Entrar
      </button>

    </form>

    <a href="/" class="back">
      ← Voltar para o início
    </a>

  </div>

</body>
</html>
  `);
});

// =========================
// TESTE DO POSTGRESQL
// =========================

app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      status: "ok",
      database: "connected",
      time: result.rows[0].now
    });

  } catch (error) {

    console.error(
      "Erro no PostgreSQL:",
      error
    );

    res.status(500).json({
      status: "error",
      database: "disconnected"
    });
  }
});

// =========================
// CADASTRO DE USUÁRIO
// =========================

app.post("/api/cadastro", async (req, res) => {

  try {

    const {
      name,
      email,
      password
    } = req.body;

    // Verifica os campos
    if (!name || !email || !password) {

      return res.status(400).send(`
        <h2>Preencha todos os campos.</h2>
        <a href="/cadastro">
          Voltar
        </a>
      `);
    }

    // Verifica tamanho da senha
    if (password.length < 6) {

      return res.status(400).send(`
        <h2>
          A senha deve ter pelo menos 6 caracteres.
        </h2>

        <a href="/cadastro">
          Voltar
        </a>
      `);
    }

    // Limpa os dados
    const normalizedEmail =
      email.trim().toLowerCase();

    const normalizedName =
      name.trim();

    // Verifica se o e-mail já existe
    const existingUser = await pool.query(
      `
      SELECT id
      FROM users
      WHERE email = $1
      `,
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {

      return res.status(409).send(`
        <h2>
          Este e-mail já está cadastrado.
        </h2>

        <a href="/cadastro">
          Voltar
        </a>
      `);
    }

    // =========================
    // CRIPTOGRAFAR SENHA
    // =========================

    const salt =
      crypto.randomBytes(16).toString("hex");

    const hashedPassword =
      await new Promise((resolve, reject) => {

        crypto.scrypt(
          password,
          salt,
          64,
          (err, derivedKey) => {

            if (err) {
              reject(err);
            } else {

              resolve(
                `${salt}:${derivedKey.toString("hex")}`
              );

            }

          }
        );

      });

    // =========================
    // SALVAR USUÁRIO
    // =========================

    const result = await pool.query(
      `
      INSERT INTO users
        (name, email, password)

      VALUES
        ($1, $2, $3)

      RETURNING
        id,
        name,
        email,
        created_at
      `,
      [
        normalizedName,
        normalizedEmail,
        hashedPassword
      ]
    );

    // =========================
    // SUCESSO
    // =========================

    res.status(201).send(`
<!DOCTYPE html>
<html lang="pt-BR">

<head>

  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>Cadastro realizado</title>

  <style>

    body {
      font-family: Arial, sans-serif;
      background: #f5f5f5;
      text-align: center;
      padding: 60px 20px;
    }

    .box {
      max-width: 450px;
      margin: auto;
      background: white;
      padding: 40px 25px;
      border-radius: 15px;
    }

    h1 {
      margin-bottom: 15px;
    }

    p {
      color: #555;
      margin-bottom: 25px;
    }

    a {
      display: inline-block;
      background: #111;
      color: white;
      padding: 14px 25px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: bold;
    }

  </style>

</head>

<body>

  <div class="box">

    <h1>
      Cadastro realizado! 🎉
    </h1>

    <p>
      Bem-vindo, ${normalizedName}!
    </p>

    <p>
      Sua conta foi criada com sucesso.
    </p>

    <a href="/">
      Ir para o início
    </a>

  </div>

</body>

</html>
    `);

  } catch (error) {

    console.error(
      "ERRO DETALHADO NO CADASTRO:",
      error
    );

    res.status(500).send(`
<!DOCTYPE html>
<html lang="pt-BR">

<head>
  <meta charset="UTF-8">
  <title>Erro</title>
</head>

<body
  style="
    font-family: Arial;
    text-align: center;
    padding: 50px 20px;
  "
>

  <h2>
    Erro ao cadastrar usuário.
  </h2>

  <p>
    Verifique os logs do servidor.
  </p>

  <a href="/cadastro">
    Tentar novamente
  </a>

</body>

</html>
    `);

  }

});

// =========================
// LOGIN
// =========================

app.post("/api/login", async (req, res) => {

  try {

    const {
      email,
      password
    } = req.body;

    if (!email || !password) {

      return res.status(400).send(`
        <h2>
          Informe e-mail e senha.
        </h2>

        <a href="/login">
          Voltar
        </a>
      `);
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        password

      FROM users

      WHERE email = $1
      `,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {

      return res.status(401).send(`
        <h2>
          E-mail ou senha incorretos.
        </h2>

        <a href="/login">
          Tentar novamente
        </a>
      `);
    }

    const user = result.rows[0];

    const parts =
      user.password.split(":");

    const salt = parts[0];

    const storedHash = parts[1];

    const loginHash =
      await new Promise((resolve, reject) => {

        crypto.scrypt(
          password,
          salt,
          64,
          (err, derivedKey) => {

            if (err) {
              reject(err);
            } else {

              resolve(
                derivedKey.toString("hex")
              );

            }

          }
        );

      });

    if (loginHash !== storedHash) {

      return res.status(401).send(`
        <h2>
          E-mail ou senha incorretos.
        </h2>

        <a href="/login">
          Tentar novamente
        </a>
      `);
    }

    res.send(`
<!DOCTYPE html>
<html lang="pt-BR">

<head>

  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>Login</title>

</head>

<body
  style="
    font-family: Arial;
    text-align: center;
    padding: 60px 20px;
  "
>

  <h1>
    Login realizado! 🎉
  </h1>

  <p>
    Bem-vindo, ${user.name}!
  </p>

  <br>

  <a href="/">
    Ir para o início
  </a>

</body>

</html>
    `);

  } catch (error) {

    console.error(
      "Erro no login:",
      error
    );

    res.status(500).send(`
      <h2>Erro ao fazer login.</h2>

      <a href="/login">
        Tentar novamente
      </a>
    `);

  }

});

// =========================
// SERVIDOR
// =========================

const PORT =
  process.env.PORT || 3000;

// Primeiro cria a tabela.
// Depois inicia o servidor.

async function startServer() {

  try {

    await createTables();

    app.listen(
      PORT,
      "0.0.0.0",
      () => {

        console.log(
          `Servidor rodando na porta ${PORT}`
        );

      }
    );

  } catch (error) {

    console.error(
      "Não foi possível iniciar o servidor:",
      error
    );

    process.exit(1);
  }

}

startServer();          box-sizing: border-box;
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

        <p>
          Encontre serviços de forma simples e rápida.
        </p>

        <div class="buttons">
          <a href="#" class="button">
            Entrar
          </a>

          <a href="/cadastro" class="button secondary">
            Criar conta
          </a>
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

// =========================
// TELA DE CADASTRO
// =========================

app.get("/cadastro", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">

      <title>Criar conta - Central Site App</title>

      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: Arial, sans-serif;
          background: #f5f5f5;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }

        .container {
          width: 100%;
          max-width: 420px;
          background: white;
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 3px 15px rgba(0,0,0,0.1);
        }

        h1 {
          text-align: center;
          margin-bottom: 10px;
        }

        .subtitle {
          text-align: center;
          color: #666;
          margin-bottom: 25px;
        }

        label {
          display: block;
          margin-bottom: 7px;
          font-weight: bold;
        }

        input {
          width: 100%;
          padding: 14px;
          margin-bottom: 18px;
          border: 1px solid #ccc;
          border-radius: 8px;
          font-size: 16px;
        }

        button {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 8px;
          background: #111;
          color: white;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
        }

        .back {
          display: block;
          text-align: center;
          margin-top: 20px;
          color: #222;
          text-decoration: none;
        }
      </style>
    </head>

    <body>

      <div class="container">

        <h1>Criar conta</h1>

        <p class="subtitle">
          Cadastre-se na Central Site App
        </p>

        <form action="/api/cadastro" method="POST">

          <label for="name">
            Nome
          </label>

          <input
            type="text"
            id="name"
            name="name"
            placeholder="Seu nome"
            required
          >

          <label for="email">
            E-mail
          </label>

          <input
            type="email"
            id="email"
            name="email"
            placeholder="seu@email.com"
            required
          >

          <label for="password">
            Senha
          </label>

          <input
            type="password"
            id="password"
            name="password"
            placeholder="Mínimo de 6 caracteres"
            minlength="6"
            required
          >

          <button type="submit">
            Criar conta
          </button>

        </form>

        <a href="/" class="back">
          ← Voltar para o início
        </a>

      </div>

    </body>
    </html>
  `);
});

// =========================
// TESTE DO POSTGRESQL
// =========================

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

// =========================
// CADASTRO DE USUÁRIO
// =========================

app.post("/api/cadastro", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validação
    if (!name || !email || !password) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>Erro</title>
        </head>

        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h2>Preencha todos os campos.</h2>
          <br>
          <a href="/cadastro">Voltar</a>
        </body>
        </html>
      `);
    }

    // Validação da senha
    if (password.length < 6) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>Erro</title>
        </head>

        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h2>A senha deve ter pelo menos 6 caracteres.</h2>
          <br>
          <a href="/cadastro">Voltar</a>
        </body>
        </html>
      `);
    }

    // Normaliza o e-mail
    const normalizedEmail = email.trim().toLowerCase();

    // Verifica se o e-mail já existe
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>E-mail já cadastrado</title>
        </head>

        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h2>Este e-mail já está cadastrado.</h2>
          <br>
          <a href="/cadastro">Voltar</a>
        </body>
        </html>
      `);
    }

    // =========================
    // HASH DA SENHA
    // =========================

    const salt = crypto.randomBytes(16).toString("hex");

    const hashedPassword = await new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {

        if (err) {
          reject(err);
        } else {
          resolve(
            `${salt}:${derivedKey.toString("hex")}`
          );
        }

      });
    });

    // =========================
    // SALVA NO POSTGRESQL
    // =========================

    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [
        name.trim(),
        normalizedEmail,
        hashedPassword
      ]
    );

    // =========================
    // SUCESSO
    // =========================

    res.status(201).send(`
      <!DOCTYPE html>
      <html lang="pt-BR">

      <head>
        <meta charset="UTF-8">

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        >

        <title>Cadastro realizado</title>

        <style>
          body {
            font-family: Arial, sans-serif;
            background: #f5f5f5;
            text-align: center;
            padding: 60px 20px;
          }

          .box {
            max-width: 450px;
            margin: auto;
            background: white;
            padding: 40px 25px;
            border-radius: 15px;
            box-shadow: 0 3px 15px rgba(0,0,0,0.1);
          }

          h1 {
            margin-bottom: 15px;
          }

          p {
            color: #555;
            margin-bottom: 25px;
          }

          a {
            display: inline-block;
            background: #111;
            color: white;
            padding: 14px 25px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
          }
        </style>
      </head>

      <body>

        <div class="box">

          <h1>
            Cadastro realizado! 🎉
          </h1>

          <p>
            Bem-vindo, ${result.rows[0].name}!
          </p>

          <a href="/">
            Ir para o início
          </a>

        </div>

      </body>
      </html>
    `);

  } catch (error) {

    console.error("Erro no cadastro:", error);

    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="pt-BR">

      <head>
        <meta charset="UTF-8">
        <title>Erro</title>
      </head>

      <body style="font-family: Arial; text-align: center; padding: 50px;">

        <h2>
          Erro ao cadastrar usuário.
        </h2>

        <p>
          Verifique a conexão com o banco de dados.
        </p>

        <br>

        <a href="/cadastro">
          Tentar novamente
        </a>

      </body>
      </html>
    `);
  }
});

// =========================
// SERVIDOR
// =========================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
