import { NextRequest } from 'next/server';
import { listAddons } from '@/lib/addonStore';
import { importAddon } from '@/lib/addonService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        return Response.json(await listAddons(), { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось получить список аддонов.';
        return Response.json({ message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const query = typeof body?.query === 'string' ? body.query : typeof body?.workshopId === 'string' ? body.workshopId : '';

        if (!query.trim()) {
            return Response.json({ message: 'Нужна ссылка на Workshop или numeric ID.' }, { status: 400 });
        }

        const addon = await importAddon(query);
        return Response.json(addon, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось скачать аддон.';
        return Response.json({ message }, { status: 400 });
    }
}
