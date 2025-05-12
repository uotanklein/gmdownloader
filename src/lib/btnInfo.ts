import CardData from '@/types/CardData';

export type BtnInfo = {
    text: string;
    init: (btnInfo: BtnInfo, id: number) => Array<CardData>;
};

export const btns: Array<BtnInfo> = [
    {
        text: 'My Workshop',
        init: () => {
            return [
                {
                    stars: 10,
                    downloads: 300,
                    img: '/billy.gif',
                    name: 'First Item',
                },
            ];
        },
    },
    {
        text: 'My Workshop2',
        init: () => {
            return [
                {
                    stars: 10,
                    downloads: 300,
                    img: '/billy.gif',
                    name: 'Billy',
                },
            ];
        },
    },
];
