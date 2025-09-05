import { neon } from "@netlify/neon";

const sql = neon(); // automatically reads NETLIFY_DATABASE_URL

export async function handler(event, context) {
  try {
    const leaderboard = await sql`
      SELECT name, score 
      FROM leaderboard
      ORDER BY score DESC
      LIMIT 50
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(leaderboard)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: err.toString()
    };
  }
}