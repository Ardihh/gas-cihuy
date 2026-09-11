"use client"
import { useState } from "react";

export function Calculator({ harga, totalSewa}) {
    const [lamaSewa, settotalSewa] = useState(totalSewa);
    const totalBiaya = harga * lamaSewa; 
    return(
        <div className="rounded-xl border p-4">
            <h3 className="p-4 flex flex-col gap-2">
                Total Biaya
            </h3>
                <p className="text-2xl font-bold">Total Hari: {lamaSewa}</p>
                <p className="text-2xl font-bold">Harga per Hari: Rp{harga}</p>
                <p className="text-2xl font-bold">Total harga Rp{totalBiaya.toLocaleString("id-ID")}</p>
            <div className="flex flex-row gap-2">
                <buttton className="border rounded-2xl p-3"onClick={() => settotalSewa(lamaSewa + 1)} >+</buttton>
                <buttton className="border rounded-2xl p-3"onClick={() => settotalSewa(Math.max(1, lamaSewa - 1))} >-</buttton>
            </div>
        </div>
    )
}