import { NextRequest } from 'next/server';
import * as steamApi from '@/lib/steamApi';

export async function POST(_: NextRequest, { params }: { params: Promise<{ user_id: string; addon_id: string }> }) {
    try {
        const { user_id, addon_id } = await params;
        new steamApi.AddonDownloader(+user_id, +addon_id).do();
        return new Response(null, {
            status: 200,
        });
    } catch (error) {
        return new Response(
            JSON.stringify({
                error,
            }),
            {
                status: 400,
            },
        );
    }
}
