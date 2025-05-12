'use client';
import { useSelector } from 'react-redux';
import Nav from '@/components/Nav';
import List from '@/components/List';
import type { RootState } from '@/lib/store';
import { btns } from '@/lib/btnInfo';

export default function Header() {
    const activeBtnID = useSelector((state: RootState) => state.nav.activeBtn);
    const btnInfo = btns[activeBtnID];
    const cardsArr = btnInfo.init(btnInfo, activeBtnID);
    return (
        <div className={`h-full p-[25px] pt-[95px] flex`}>
            <Nav />
            <List cards={cardsArr} />
        </div>
    );
}

//https://images.steamusercontent.com/ugc/16018413186234570228/9B8CA6C5914AC328AEFFB5C9D66AE2C0806BCC04/?imw=5000&imh=5000&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=false
