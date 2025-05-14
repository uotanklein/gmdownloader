import Header from '@/components/Header';
import Bottom from '@/components/Bottom';

export default function Home() {
    return (
        <div className='min-w-[800px] min-h-[700px] h-full bg-[rgb(26,26,26)]'>
            <Header />
            <Bottom />
        </div>
    );
}
