'use client';

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Quicksand } from 'next/font/google';
import NavBtn from '@/components/ui/NavBtn';
import Image from 'next/image';
import Link from 'next/link';
import type { RootState } from '@/lib/store';
import { activeBtn } from '@/lib/features/activeBtn';
import { btns } from '@/lib/btnInfo';

const quicksand = Quicksand({
    weight: '600',
    variable: '--font-quicksand-sans',
    subsets: ['latin'],
});

const logo_link = '/logo.png';
const git_link = 'https://github.com/uotanklein/workshop-downloader';
export default function Nav() {
    const activeBtnID = useSelector((state: RootState) => state.nav.activeBtn);
    const dispatch = useDispatch();

    const handleClick = (id: number) => {
        dispatch(activeBtn(id));
    };

    return (
        <div className={`w-[270px] h-full min-h-[370px] flex flex-col justify-between mr-[40px]`}>
            <div>
                {btns.map((btnInfo, id) => {
                    return <NavBtn key={id} text={btnInfo.text} onClick={() => handleClick(id)} active={activeBtnID === id} />;
                })}
            </div>
            <Link href={git_link} className='flex flex-col justify-center items-center hover:cursor-pointer'>
                <Image src={`${logo_link}`} width={50} height={50} alt='icon' className='mb-[10px] mask-radial-at-center mask-radial-from-100%' />
                <p className={`${quicksand.className} text-xl flex`}>gmdownloader</p>
            </Link>
        </div>
    );
}
