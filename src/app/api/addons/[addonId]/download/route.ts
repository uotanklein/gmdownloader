import { createAddonArchive } from '@/lib/addonStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
    params: Promise<{ addonId: string }>;
};

export async function GET(_: Request, { params }: RouteContext) {
    try {
        const { addonId } = await params;
        const archive = await createAddonArchive(addonId);

        return new Response(archive.buffer, {
            headers: {
                'Cache-Control': 'no-store',
                'Content-Type': 'application/zip',
                'Content-Length': archive.buffer.byteLength.toString(),
                'Content-Disposition': `attachment; filename="${archive.fileName}"`,
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось собрать архив.';
        return Response.json({ message }, { status: 400 });
    }
}
