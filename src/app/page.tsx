'use client';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import { btns } from '@/lib/btnInfo';
import { useEffect, useState } from 'react';
import CardData from '@/types/CardData';
import Header from '@/components/Header';
import Bottom from '@/components/Bottom';

export default function Home() {
    const user_id = 0;
    const [cards, setCards] = useState<Array<CardData>>([]);
    const activeBtnID = useSelector((state: RootState) => state.nav.activeBtn);

    const update_cards = () => {
        const async_fn = async () => {
            const btnInfo = btns[activeBtnID];
            if (btnInfo) {
                setCards(await btnInfo.init(btnInfo, user_id, activeBtnID));
            }
        };
        async_fn();
    };

    useEffect(update_cards, [activeBtnID]);

    return (
        <div className='min-w-[800px] min-h-[700px] h-full bg-[rgb(26,26,26)]'>
            <Header update_cards={update_cards} />
            <Bottom cards={cards} />
        </div>
    );
}
