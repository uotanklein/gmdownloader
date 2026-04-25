import { NextRequest } from 'next/server';
import { extractWorkshopId, fetchWorkshopDetails } from '@/lib/workshop';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const query = typeof body?.query === 'string' ? body.query : String(body?.publishedfileids ?? '');
        const workshopId = extractWorkshopId(query);

        if (!workshopId) {
            return Response.json({ message: 'Укажите корректную ссылку на Steam Workshop или numeric ID.' }, { status: 400 });
        }

        const details = await fetchWorkshopDetails(workshopId);
        return Response.json(details, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось получить данные аддона.';
        return Response.json({ message }, { status: 400 });
    }
}
