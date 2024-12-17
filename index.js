require("dotenv").config();
const pg = require("pg");
const express = require("express");
const morgan = require("morgan");
const app = express();
const client = new pg.Client(process.env.DATABASE_URL);

// Middleware
app.use(express.json());
app.use(morgan("dev"));

// Connect
const createFlavorsTable = async () => {
    try {
      console.log("Setting up the database...");
  
      await client.query("DROP TABLE IF EXISTS flavors");
  
      // Create the table
      const createTableQuery = `
        CREATE TABLE flavors (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          is_favorite BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await client.query(createTableQuery);
      console.log("Created 'flavors' table successfully.");
  
      //initial data
      const seedDataQuery = `
        INSERT INTO flavors (name, is_favorite) VALUES
        ('Vanilla', true),
        ('Chocolate', false),
        ('Strawberry', true),
        ('Mint Chocolate', false);
      `;
      await client.query(seedDataQuery);
      console.log("Seeded 'flavors' table with initial data.");
    } catch (err) {
      console.error("Error setting up the database:", err);
    }
  };
  
  client.connect()
    .then(async () => {
      console.log("Connected to the database.");
      await createFlavorsTable();
    })
    .catch(err => console.error("Database connection error", err));
  

// Routes

// GET - Retrieve all flavors
app.get("/api/flavors", async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM flavors");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch flavors" });
  }
});

// GET 
app.get("/api/flavors/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await client.query("SELECT * FROM flavors WHERE id = $1", [id]);
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "Flavor not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch flavor" });
  }
});

// POST 
app.post("/api/flavors", async (req, res) => {
  const { name, is_favorite } = req.body;
  try {
    const result = await client.query(
      "INSERT INTO flavors (name, is_favorite, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING *",
      [name, is_favorite]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create flavor" });
  }
});

// PUT 
app.put("/api/flavors/:id", async (req, res) => {
  const { id } = req.params;
  const { name, is_favorite } = req.body;
  try {
    const result = await client.query(
      "UPDATE flavors SET name = $1, is_favorite = $2, updated_at = NOW() WHERE id = $3 RETURNING *",
      [name, is_favorite, id]
    );
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "Flavor not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update flavor" });
  }
});

// DELETE 
app.delete("/api/flavors/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await client.query("DELETE FROM flavors WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: "Flavor not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete flavor" });
  }
});

// Start 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});