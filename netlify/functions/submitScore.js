import { neon } from "@netlify/neon";

const sql = neon();

export async function handler(event, context) {
  try {
    const { name, score } = event.queryStringParameters || {};

    if (!name || !score) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing name or score" }),
      };
    }

    await sql`
      INSERT INTO leaderboard (name, score)
      VALUES (${name}, ${Number(score)})
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Score added successfully" }),
    };
  } catch (err) {
    console.error("DB error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
