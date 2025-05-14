'use client';
import CardData from '@/types/CardData';
import Nav from '@/components/Nav';
import List from '@/components/List';

export default function Bottom(props: { cards: Array<CardData> }) {
    const { cards } = props;
    return (
        <div className={`h-full p-[25px] pt-[95px] flex`}>
            <Nav />
            <List cards={cards} />
        </div>
    );
}
