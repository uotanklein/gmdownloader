const WORKSHOP_ENDPOINT = 'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/';
const GARRY_S_MOD_APP_ID = 4000;

type SteamWorkshopPayload = {
    response?: {
        publishedfiledetails?: Array<{
            result?: number;
            title?: string;
            preview_url?: string;
            subscriptions?: number | string;
            favorited?: number | string;
            creator_app_id?: number;
        }>;
    };
};

export type WorkshopDetails = {
    workshopId: string;
    title: string;
    previewUrl: string;
    subscriptions: number;
    favorited: number;
};

export function extractWorkshopId(input: string) {
    const normalized = input.trim();

    if (!normalized) {
        return null;
    }

    if (/^\d+$/.test(normalized)) {
        return normalized;
    }

    try {
        const url = new URL(normalized);
        const id = url.searchParams.get('id');
        if (id && /^\d+$/.test(id)) {
            return id;
        }
    } catch {
        const fallback = normalized.match(/\b(\d{5,})\b/);
        return fallback?.[1] ?? null;
    }

    return null;
}

export async function fetchWorkshopDetails(workshopId: string): Promise<WorkshopDetails> {
    const params = new URLSearchParams();
    params.set('itemcount', '1');
    params.set('publishedfileids[0]', workshopId);

    const response = await fetch(WORKSHOP_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
        cache: 'no-store',
    });

    if (!response.ok) {
        throw new Error('Steam Workshop временно не отвечает.');
    }

    const payload = (await response.json()) as SteamWorkshopPayload;
    const details = payload.response?.publishedfiledetails?.[0];

    if (!details || details.result !== 1) {
        throw new Error('Аддон не найден в Steam Workshop.');
    }

    if (details.creator_app_id !== GARRY_S_MOD_APP_ID) {
        throw new Error('Этот Workshop item не относится к Garry\'s Mod.');
    }

    return {
        workshopId,
        title: details.title?.trim() || `Addon ${workshopId}`,
        previewUrl: details.preview_url || '/logo.png',
        subscriptions: Number(details.subscriptions ?? 0),
        favorited: Number(details.favorited ?? 0),
    };
}
