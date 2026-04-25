import { NextRequest } from 'next/server';
import { readAddonFile, readAddonFileRaw, writeAddonFile } from '@/lib/addonStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
    params: Promise<{ addonId: string }>;
};

export async function GET(req: NextRequest, { params }: RouteContext) {
    try {
        const { addonId } = await params;
        const filePath = req.nextUrl.searchParams.get('path');

        if (!filePath) {
            return Response.json({ message: 'Путь к файлу обязателен.' }, { status: 400 });
        }

        if (req.nextUrl.searchParams.get('raw') === '1') {
            const file = await readAddonFileRaw(addonId, filePath);
            return new Response(file.buffer, {
                headers: {
                    'Cache-Control': 'no-store',
                    'Content-Type': file.mimeType,
                    'Content-Length': file.buffer.byteLength.toString(),
                    'Content-Disposition': `inline; filename="${file.fileName}"`,
                },
            });
        }

        return Response.json(await readAddonFile(addonId, filePath), { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось прочитать файл.';
        return Response.json({ message }, { status: 400 });
    }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
    try {
        const { addonId } = await params;
        const body = await req.json();
        const filePath = typeof body?.path === 'string' ? body.path : '';
        const content = typeof body?.content === 'string' ? body.content : null;

        if (!filePath || content === null) {
            return Response.json({ message: 'Нужно передать path и content.' }, { status: 400 });
        }

        return Response.json(await writeAddonFile(addonId, filePath, content), { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось сохранить файл.';
        return Response.json({ message }, { status: 400 });
    }
}
