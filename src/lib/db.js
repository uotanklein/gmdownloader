import { Pool } from 'pg';

const config = {
    user: 'postgres',
    password: '89869123',
    host: 'localhost',
    database: 'gmdownloader',
    port: 5432,
};

const pool = new Pool(config);

export const has_tbl = async (tbl_name) => {
    const result = await pool.query(`SELECT to_regclass('public.${tbl_name}');`);
    return result.rows[0].to_regclass !== null;
};

export const init_db = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                password TEXT UNIQUE NOT NULL
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS addons (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                workshop_id TEXT NOT NULL,
                path TEXT NOT NULL
            );
        `);
    } catch (err) {
        console.log(err);
        process.exit();
    }
};

export const save_user = async (name, password) => {
    try {
        const result = await pool.query(`INSERT INTO users (name, password) VALUES ($1, $2);`, [name, password]);
        return result.rows[0].id;
    } catch (err) {
        throw err;
    }
};

export const save_addon = async (user_id, addon_id, addon_path) => {
    try {
        const result = await pool.query(
            `INSERT INTO addons (user_id, workshop_id, path) 
             VALUES ($1, $2, $3) 
             RETURNING id;`,
            [user_id, addon_id, addon_path],
        );
        return result.rows[0].id;
    } catch (err) {
        throw err;
    }
};

export const get_user_addons = async (user_id) => {
    try {
        return (await pool.query(`SELECT id, workshop_id, path FROM addons WHERE user_id = $1;`, [user_id])).rows;
    } catch (err) {
        throw err;
    }
};
