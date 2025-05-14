'use client';
import Image from 'next/image';
import cn from 'classnames';
import { Quicksand } from 'next/font/google';
import InputElData from '@/types/InputElData';

const quicksand = Quicksand({
    weight: '600',
    variable: '--font-quicksand-sans',
    subsets: ['latin'],
});

export default function InputList(props: { els_data: Array<InputElData>; hide: boolean; on_click?: (el_data: InputElData) => void }) {
    const { els_data, hide, on_click } = props;

    const input_list_cn = cn('absolute', 'flex', 'flex-col', 'w-full', 'top-[41px]', 'transition', 'duration-300', {
        'pointer-events-none': hide,
        'opacity-0': hide,
    });

    const handlerClick = (el_data: InputElData) => {
        if (on_click) {
            on_click(el_data);
        }
    };

    return (
        <div className={input_list_cn}>
            {els_data.map((el_data, id) => {
                const is_last = id == els_data.length - 1;
                const el_cn = cn('w-full', 'h-[70px]', 'p-[17px]', 'bg-[rgb(71,71,71)]', 'hover:bg-[rgb(57,57,57)]', 'transition', 'duration-300', 'flex', 'hover:cursor-pointer', {
                    'rounded-b-lg': is_last,
                });
                return (
                    <button key={id} className={el_cn} onClick={() => handlerClick(el_data)}>
                        <Image src={`${el_data.icon}`} width={40} height={40} alt='input_el_icon' className='w-[40px] h-[40px] mr-[15px]' unoptimized />
                        <p className={`${quicksand.variable} text-xl flex justify-start items-center`}>{el_data.text}</p>
                    </button>
                );
            })}
        </div>
    );
}
