import { NextRequest } from 'next/server';
import * as steamApi from '@/lib/steamApi';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { publishedfileids } = body;
        return new Response(JSON.stringify(await steamApi.search(publishedfileids)), {
            status: 200,
        });
    } catch (err) {
        console.log(err);
        return new Response(null, {
            status: 400,
        });
    }
}

//src\bin\src\data\0\steamapps\workshop\content\4000\3138563659
//src\data\0\steamapps\workshop\content\4000\3138563659
