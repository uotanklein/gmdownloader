import { Quicksand } from 'next/font/google';
import CardData from '@/types/CardData';
import Image from 'next/image';

const quicksand = Quicksand({
    weight: '600',
    variable: '--font-quicksand-sans',
    subsets: ['latin'],
});

export default function Card(props: { 'card-data': CardData }) {
    const green_clr_classname = 'text-[rgb(107,183,76)]';
    const { stars, img, name, downloads } = props['card-data'];
    const get_star_svg = (id: number) => (
        <svg key={id} width='15' height='15' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg' fill='currentColor' className={`${id < stars ? green_clr_classname : 'text-[rgb(41,63,88)]'}`}>
            <polygon points='50,5 61,38 95,38 67,59 78,91 50,70 22,91 33,59 5,38 39,38' />
        </svg>
    );

    const get_stars = (count: number) => {
        const arr = [];
        for (let i = 0; i < count; i += 1) {
            arr.push(get_star_svg(i));
        }
        return arr;
    };

    const max_stars = Math.max(5, stars);
    return (
        <button className='w-[230px] h-[300px] bg-transparent hover:bg-[rgba(255,255,255,0.2)] rounded transition duration-300 p-[10px] hover:cursor-pointer'>
            <div className='w-full h-[35px] flex justify-between items-center mb-[10px]'>
                <div className='flex'>
                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' width='20' height='20' fill='currentColor' className={`${green_clr_classname} mr-[5px]`}>
                        <path d='M286 241h-60c-8.291 0-15 6.709-15 15v135h-30c-5.684 0-10.869 3.208-13.418 8.291-2.534 5.083-1.992 11.162 1.421 15.703l75 91c2.827 3.779 7.28 6.006 11.997 6.006s9.17-2.227 11.997-6.006l75-91c3.413-4.541 3.955-10.62 1.421-15.703-2.549-5.083-7.734-8.291-13.418-8.291h-30v-135c0-8.291-6.709-15-15-15z' />
                        <path d='M419.491 151.015c-6.167-30.205-30.703-53.848-62.446-58.872-13.096-52.72-61.011-92.143-116.045-92.143-54.917 0-102.305 38.837-115.737 91.117-1.407-.073-2.827-.117-4.263-.117-66.167 0-121 53.833-121 120s54.833 120 121 120h60v-75c0-24.814 20.186-45 45-45h60c24.814 0 45 20.186 45 45v75h90c49.629 0 91-40.371 91-90 0-50.127-42.06-91.23-92.509-89.985z' />
                    </svg>
                    <p className={`${quicksand.variable} text-base flex justify-center items-center h-[20px]`}>{downloads}</p>
                </div>
                <div className='flex'>{get_stars(max_stars)}</div>
            </div>
            <Image src={`${img}`} width={230} height={190} alt='img' className='mb-[15px] shadow-md w-[230px] h-[200px]' />
            <div className='flex justify-center items-center'>
                <p className={`${quicksand.variable} text-lg text-center`}>{name}</p>
            </div>
        </button>
    );
}
