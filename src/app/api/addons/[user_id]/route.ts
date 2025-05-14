import { NextRequest } from 'next/server';
import * as dbApi from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: Promise<{ user_id: string }> }) {
    try {
        const { user_id } = await params;
        const user_addons = await dbApi.get_user_addons(+user_id);
        return new Response(JSON.stringify(user_addons), {
            status: 200,
        });
    } catch (err) {
        console.log(err);
        return new Response(JSON.stringify([]), {
            status: 200,
        });
    }
}
