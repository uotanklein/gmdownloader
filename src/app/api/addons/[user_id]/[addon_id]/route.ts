import { NextRequest } from 'next/server';
import * as steamApi from '@/lib/steamApi';

export async function POST(_: NextRequest, { params }: { params: Promise<{ user_id: string; addon_id: string }> }) {
    try {
        const { user_id, addon_id } = await params;
        await (await steamApi.get_addon_downloader(+user_id, +addon_id)).do();
        return new Response(null, {
            status: 200,
        });
    } catch (error) {
        console.log(error);
        return new Response(null, {
            status: 400,
        });
    }
}
