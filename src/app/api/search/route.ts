import { NextRequest } from 'next/server';
import * as steamApi from '@/lib/steamApi';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { publishedfileids } = body;
        const addonDetail = await steamApi.search(publishedfileids);
        return new Response(JSON.stringify(addonDetail.response.publishedfiledetails[0], null, 2), {
            status: 200,
        });
    } catch (err) {
        console.log(err);
        return new Response(null, {
            status: 400,
        });
    }
}
