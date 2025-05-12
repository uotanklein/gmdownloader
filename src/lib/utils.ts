
import { useEffect, useState } from "react";

type scr_size_t = {width: number, height: number};

const ref_w = 1920, ref_h = 1080

export function scr_scale_w(scr_w: number, w: number): number {
    return scr_w * w / ref_w
}

export function scr_scale_h(scr_h: number, h: number): number {
    return scr_h * h / ref_h
}

export function scr_scale(scr_w: number, scr_h: number, w: number, h: number): [number, number] {
    return [scr_scale_w(scr_w, w), scr_scale_h(scr_h, h)]
}

const getWinSize = (): scr_size_t => {
    const { width, height } = window.screen;
    return { width, height };
};
  
export function useWinSize(): scr_size_t | undefined {
    const [winSize, setWinSize] = useState<scr_size_t>();
    useEffect(() => {
      const handleResize = () => setWinSize(getWinSize());
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
    return winSize;
}