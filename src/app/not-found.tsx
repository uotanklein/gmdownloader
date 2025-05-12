
import { Geist } from "next/font/google";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

export default function NotFound() {
    return <div className="flex justify-center items-center h-full"><p className={`${geistSans.variable} text-9xl`}>404</p></div>
}