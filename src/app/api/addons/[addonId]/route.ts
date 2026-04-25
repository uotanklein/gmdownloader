import { getAddonDetails, removeAddon } from '@/lib/addonStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
    params: Promise<{ addonId: string }>;
};

export async function GET(_: Request, { params }: RouteContext) {
    try {
        const { addonId } = await params;
        return Response.json(await getAddonDetails(addonId), { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось загрузить содержимое аддона.';
        return Response.json({ message }, { status: 404 });
    }
}

export async function DELETE(_: Request, { params }: RouteContext) {
    try {
        const { addonId } = await params;
        await removeAddon(addonId);
        return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось удалить аддон.';
        return Response.json({ message }, { status: 400 });
    }
}
