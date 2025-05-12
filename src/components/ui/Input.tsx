import { useState, ChangeEvent } from 'react';
import cn from 'classnames';
export default function Input(props: { name: string; placeholder: string; d: string }) {
    const { name, placeholder, d } = props;
    const [text, setText] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const changeHandler = (e: ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value);
    };

    const clickHandler = () => {
        if (text == '') {
            return;
        }
        setText('');
    };

    const buttonClassNames = cn('absolute', 'left-2', 'top-1/2', 'transform', '-translate-y-1/2', 'text-[rgb(127,127,127)]', 'transition', 'duration-300', {
        'text-white': isFocused,
    });

    return (
        <div className='relative w-[40vw] shadow-md mr-[15px]'>
            <input
                className='formkit-input text-sm rounded-lg block w-full pl-10 pr-10 p-2.5 bg-[rgb(71,71,71)] placeholder-[rgb(127,127,127)] text-white outline outline-transparent focus:outline-[rgb(18,124,255)] transition duration-300'
                name={name}
                placeholder={placeholder}
                value={text ?? ''}
                onChange={changeHandler}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            />
            <button className={buttonClassNames} type='button' onClick={clickHandler}>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d={text == '' ? d : 'M6 18L18 6M6 6l12 12'} />
                </svg>
            </button>
        </div>
    );
}
