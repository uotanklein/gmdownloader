import cn from 'classnames';
import { Quicksand } from 'next/font/google';

const quicksand = Quicksand({
    weight: '600',
    variable: '--font-quicksand-sans',
    subsets: ['latin'],
});

type NavBtnProps = {
    text: string;
    onClick?: () => void;
    active?: boolean;
};

export default function NavBtn({ text, onClick, active }: NavBtnProps) {
    const classNames = cn(
        'w-full',
        'h-[40px]',
        'rounded',
        quicksand.variable,
        'text-lg',
        'flex',
        'justify-start',
        'items-center',
        'pl-[10px]',
        'transition',
        'duration-300',
        'hover:cursor-pointer',
        'hover:text-white',
        'mb-2',
        {
            'shadow-md': active,
            'bg-[rgba(255,255,255,0.06)]': active,
            'text-white': active,
            'bg-transparent': !active,
            'text-[rgba(255,255,255,0.6)]': !active,
        },
    );

    return (
        <button className={classNames} onClick={onClick}>
            {text}
        </button>
    );
}
