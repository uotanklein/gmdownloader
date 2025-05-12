'use server';

import { Pool } from 'pg';

const config = {
    user: 'postgres',
    password: '89869123',
    host: 'localhost',
    database: 'gmdownloader',
    port: 5432,
};

const pool = new Pool(config);

export const has_tbl = async (tbl_name: string): Promise<boolean> => {
    const result = await pool.query(`SELECT to_regclass('public.${tbl_name}');`);
    return result.rows[0].to_regclass !== null;
};

export const init_db = async () => {
    console.log(await has_tbl('aboba'));
};

init_db();
