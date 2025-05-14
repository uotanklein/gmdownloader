'use client';
import { useSelector } from 'react-redux';
import Nav from '@/components/Nav';
import List from '@/components/List';
import type { RootState } from '@/lib/store';
import { btns } from '@/lib/btnInfo';
import { useEffect, useState } from 'react';
import CardData from '@/types/CardData';

export default function Header() {
    const user_id = 0;
    const [cards, setCards] = useState<Array<CardData>>([]);
    const activeBtnID = useSelector((state: RootState) => state.nav.activeBtn);

    useEffect(() => {
        const async_fn = async () => {
            const btnInfo = btns[activeBtnID];
            if (btnInfo) {
                setCards(await btnInfo.init(btnInfo, user_id, activeBtnID));
            }
        };
        async_fn();
    }, [activeBtnID]);

    return (
        <div className={`h-full p-[25px] pt-[95px] flex`}>
            <Nav />
            <List cards={cards} />
        </div>
    );
}
