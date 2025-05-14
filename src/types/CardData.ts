type CardData = {
    id?: number;
    stars: number;
    downloads: number;
    img: string;
    name: string;
    path?: string;
    is_blocked?: boolean;
};

export default CardData;
