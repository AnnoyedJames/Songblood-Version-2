// This script can be run with: node scripts/test-connection.js
const { Pool } = require("pg")
require("dotenv").config()

async function testConnection() {
  console.log("Testing Neon database connection...")

  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL environment variable is not set")
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 10000,
    query_timeout: 10000,
  })

  try {
    console.log("Attempting to connect...")
    const client = await pool.connect()
    console.log("✅ Successfully connected to the database")

    console.log("Running test query...")
    const result = await client.query("SELECT current_timestamp as time, current_database() as database")
    console.log("✅ Query executed successfully")
    console.log("Database:", result.rows[0].database)
    console.log("Server time:", result.rows[0].time)

    console.log("Testing connection to required tables...")
    const tables = ["hospital", "admin", "redblood_inventory", "plasma_inventory", "platelets_inventory"]

    for (const table of tables) {
      try {
        await client.query(`SELECT COUNT(*) FROM ${table}`)
        console.log(`✅ Table '${table}' exists and is accessible`)
      } catch (err) {
        console.error(`❌ Error accessing table '${table}':`, err.message)
      }
    }

    client.release()
    await pool.end()

    console.log("\n✅ Connection test completed successfully")
  } catch (err) {
    console.error("❌ Connection failed:", err.message)

    if (err.message.includes("timeout")) {
      console.error("\nPossible causes:")
      console.error("- Network connectivity issues")
      console.error("- Firewall blocking the connection")
      console.error("- Database server is down or unreachable")
    }

    if (err.message.includes("password authentication failed")) {
      console.error("\nPossible causes:")
      console.error("- Incorrect username or password in the DATABASE_URL")
      console.error("- User does not have access to the database")
    }

    console.error("\nTroubleshooting steps:")
    console.error("1. Verify the DATABASE_URL is correct")
    console.error("2. Check if the database server is running")
    console.error("3. Ensure network connectivity to the database server")
    console.error("4. Verify that the user has the necessary permissions")

    process.exit(1)
  }
}

testConnection()
