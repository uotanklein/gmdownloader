'use client';

import { Quicksand } from 'next/font/google';
import Input from '@/components/ui/Input';

const good_map = ['Good morning', 'Good day', 'Good evening', 'Good night'];

const get_time_of_day = () => {
    const now = new Date();
    const hours = now.getHours();
    if (hours >= 6 && hours < 12) {
        return 0;
    } else if (hours >= 12 && hours < 17) {
        return 1;
    } else if (hours >= 17 && hours < 24) {
        return 2;
    } else {
        return 3;
    }
};

const quicksand = Quicksand({
    weight: '600',
    variable: '--font-quicksand-sans',
    subsets: ['latin'],
});

const get_good_text = () => good_map[get_time_of_day()];
const anon_text = 'Anonymous';

export default function Header() {
    const top_text = `${get_good_text()}, ${anon_text}!`;
    return (
        <div className={`fixed w-full flex h-[70px] bg-[rgb(50,50,50)] p-[14px] box-border shadow-md`}>
            <div className='flex w-full items-center justify-between'>
                <div className='flex items-center'>
                    <button className='mr-[10px] hover:cursor-pointer'>
                        <svg xmlns='http://www.w3.org/2000/svg' width={45} height={45} viewBox='0 0 1024 1024' version='1.1'>
                            <path d='M512 512m-448 0a448 448 0 1 0 896 0 448 448 0 1 0-896 0Z' fill='#FFFFFF' />
                            <path d='M448 298.666667h128v426.666666h-128z' fill='#00000' />
                            <path d='M298.666667 448h426.666666v128H298.666667z' fill='#00000' />
                        </svg>
                    </button>
                    <p className={`${quicksand.className} text-xl mr-[15px]`}>{top_text}</p>
                </div>
                <Input name='search' placeholder='Search...' d='M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z' />
                <div className='w-15'>
                    {/* <button className='flex justify-center items-center hover:cursor-pointer'>
                        <svg
                            className='w-7 h-7 text-[rgb(127,127,127)] hover:text-white transition duration-300'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                                d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z'
                            />
                            <circle cx='12' cy='12' r='3' stroke='currentColor' strokeWidth='2' fill='none' />
                        </svg>
                    </button> */}
                </div>
            </div>
        </div>
    );
}
