import { ensureWorkspace } from '@/lib/addonStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        await ensureWorkspace();
        return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось инициализировать хранилище.';
        return Response.json({ message }, { status: 500 });
    }
}
