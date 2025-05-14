'use client';
import Card from '@/components/ui/Card';
import CardData from '@/types/CardData';

export default function List(props: { cards: Array<CardData> }) {
    return (
        <div className='flex-1 flex flex-wrap gap-x-8'>
            {props.cards.map((data, id) => (
                <Card key={id} card-data={data} />
            ))}
        </div>
    );
}
