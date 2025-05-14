'use client';
import { useState, ChangeEvent, useEffect } from 'react';
import cn from 'classnames';
import LoadAnim from '@/components/ui/LoadAnim';
import InputList from '@/components/ui/InputList';
import axios from 'axios';
import InputElData from '@/types/InputElData';
export default function Input(props: { name: string; placeholder: string; d: string; update_cards?: () => void }) {
    const user_id = 0;
    const { name, placeholder, d, update_cards } = props;
    const [text, setText] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [addonData, setAddonData] = useState<InputElData | null>(null);
    const [isLoading, setLoading] = useState(false);
    const changeHandler = (e: ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value);
    };

    const clickHandler = () => {
        if (text) {
            setText('');
        }
    };

    const buttonClassNames = cn('absolute', 'left-2', 'top-1/2', 'transform', '-translate-y-1/2', 'text-[rgb(127,127,127)]', 'transition', 'duration-300', {
        'text-white': isFocused,
    });

    const els = [];

    if (addonData) {
        els.push(addonData);
    }

    const has_input_list = els.length > 0;

    useEffect(() => {
        console.log(text);
        if (!text) return;
        const fetch_fn = async () => {
            try {
                const url = new URL(text);
                const id = url.searchParams.get('id');
                if (id) {
                    const response = await axios.post('/api/search', {
                        publishedfileids: +id,
                    });

                    const creator_app_id = response?.data?.creator_app_id;

                    if (creator_app_id === 4000) {
                        const { title, preview_url } = response.data;
                        setAddonData({
                            id: +id,
                            text: title,
                            icon: preview_url,
                        });
                    } else {
                        throw new Error('Invalid url');
                    }
                } else {
                    throw new Error('Invalid url');
                }
            } catch {
                setAddonData(null);
            }
        };

        fetch_fn();
    }, [text]);

    const input_cn = cn(
        'formkit-input',
        'text-sm',
        'block',
        'w-full',
        'pl-10',
        'pr-10',
        'p-2.5',
        'bg-[rgb(71,71,71)]',
        'placeholder-[rgb(127,127,127)]',
        'text-white',
        'outline',
        'outline-transparent',
        'focus:outline-[rgb(18,124,255)]',
        'transition',
        'duration-300',
        'rounded-t-lg',
        {
            'rounded-b-lg': !has_input_list,
        },
    );

    return (
        <div className='relative w-[40vw] shadow-md mr-[15px]'>
            <input className={input_cn} name={name} placeholder={placeholder} value={text ?? ''} onChange={changeHandler} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} />
            <button className={buttonClassNames} type='button' onClick={clickHandler}>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d={text == '' ? d : 'M6 18L18 6M6 6l12 12'} />
                </svg>
            </button>
            <InputList
                els_data={els}
                hide={!has_input_list}
                on_click={(el_data) => {
                    clickHandler();
                    setLoading(true);

                    axios
                        .post(`/api/addons/${user_id}/${el_data.id}`)
                        .then(() => {
                            try {
                                const audio = new Audio('/audio/public_sound_success.ogg');
                                audio.play();
                                if (update_cards) {
                                    update_cards();
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        })
                        .catch((err) => {
                            console.log(err);
                            try {
                                const audio = new Audio('/audio/public_sound_error.wav');
                                audio.play();
                            } catch (err) {
                                console.log(err);
                            }
                        })
                        .finally(() => {
                            setLoading(false);
                        });
                }}
            />
            <LoadAnim hide={!isLoading} />
        </div>
    );
}
