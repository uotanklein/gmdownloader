import CardData from '@/types/CardData';
import axios from 'axios';

type DBAddon = {
    id: number;
    workshop_id: number;
    path: string;
    user_id?: number;
};

export type BtnInfo = {
    text: string;
    init: (btnInfo: BtnInfo, user_id: number, btn_id: number) => Promise<Array<CardData>>;
};

const billy_card: CardData = {
    stars: 10,
    downloads: 300,
    img: '/billy.gif',
    name: 'Billy',
    is_blocked: true,
};

export const btns: Array<BtnInfo> = [
    {
        text: 'Addons',
        init: async (_, user_id) => {
            try {
                const response = await axios.get(`/api/addons/${user_id}`);
                const data = await Promise.all(
                    response.data.map(async (addon_data: DBAddon) => {
                        const { id, workshop_id, path } = addon_data;
                        try {
                            const res = await axios.post('/api/search', {
                                publishedfileids: workshop_id,
                            });

                            const { title, preview_url, subscriptions, favorited } = res.data;

                            return {
                                id,
                                path,
                                stars: Math.min(favorited / 500, 5),
                                downloads: subscriptions,
                                img: preview_url,
                                name: title,
                            };
                        } catch (err) {
                            console.error('Error fetching addon details:', err);
                            throw err;
                        }
                    }),
                );
                data.unshift(billy_card);
                return data;
            } catch (err) {
                console.error('Error fetching addons:', err);
                throw err;
            }
        },
    },
];
