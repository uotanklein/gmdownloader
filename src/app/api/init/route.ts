import { NextRequest } from 'next/server';
import * as db from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        await db.init_db();
        return new Response(null, {
            status: 200,
        });
    } catch (err) {
        return new Response(null, {
            status: 400,
        });
    }
}
