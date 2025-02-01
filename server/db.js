import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  database: "listhit",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function addUserToList(ids, listId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const listResult = await client.query(
      "SELECT * FROM lists WHERE listid = $1",
      [listId]
    );
    if (listResult.rows.length === 0) {
      await client.query("INSERT INTO lists (listid, userid) VALUES ($1, $2)", [
        listId,
        ids,
      ]);
    } else {
      const userIds = !listResult.rows[0] ? [] : listResult.rows[0].userId;
      await ids.forEach(async (id) => {
        if (userIds && !userIds.includes(id)) {
          userIds.push(id);
          await client.query("UPDATE lists SET userid = $1 WHERE listid = $2", [
            userIds,
            listId,
          ]);
        }
      });
    }
    await client.query("COMMIT");
  } catch (err) {
    console.log(err);
  } finally {
    client.release();
  }
}

export async function deleteList(listId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM lists WHERE listid = $1", [listId]);
    await client.query("COMMIT");
  } catch (err) {
    console.log(err);
    await client.query("ROLLBACK");
  } finally {
    client.release();
  }
}

export async function getAllUserIds(listId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT userid FROM lists WHERE listid = $1 LIMIT 1",
      [listId]
    );
    return result.rows[0].userid;
  } catch (err) {
    console.log(err);
    return [];
  } finally {
    client.release();
  }
}

export async function addNotAckMessages(listId, type, data, to) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    console.log("adding to updates", to);
    await client.query(
      "INSERT INTO updates (listid, to_userid, updatetype, updatedata) VALUES ($1, $2, $3, $4)",
      [listId, to, type, data]
    );
    await client.query("COMMIT");
  } catch (err) {
    console.log(err);
    await client.query("ROLLBACK");
  } finally {
    client.release();
  }
}

export async function getNotAckMessages(id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT updatedata, updateid FROM updates WHERE to_userid = $1",
      [id]
    );
    return result.rows.map((row) => [JSON.parse(row.updatedata), row.updateid]);
  } catch (err) {
    console.log(err);
    return [];
  } finally {
    client.release();
  }
}

export async function deleteNotAckMessages(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM updates WHERE to_userid = $1", [id]);
    await client.query("COMMIT");
  } catch (err) {
    console.log(err);
    await client.query("ROLLBACK");
  } finally {
    client.release();
  }
}

(async function checkConnection() {
  console.log((await pool.query("SELECT NOW()")).rows[0]);
})();
