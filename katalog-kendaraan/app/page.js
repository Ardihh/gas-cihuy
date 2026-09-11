"use client"
import { useState } from "react";
import VehicleCard from "./components/VehicleCard";
import {kendaraan} from "./data";
import Navbar from "./components/NavBar";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import { Calculator } from "./components/Calculator";


export default function Home() {
  const [filter, setFilter] = useState("semua");
  const ditampilkan =
    filter === "semua" ? kendaraan : kendaraan.filter((kendaraan) => kendaraan.status === filter);
   
  return (
   <>
   <div>
    <Navbar/>
    <Hero/>
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Katalog Kendaraan</h2>
        <div className="flex-row gap-4 mb-6 flex items-center">
          <span className="border rounded-full p-2" onClick={() => setFilter("semua")}>Semua</span>
          <span className="border rounded-full p-2" onClick={() => setFilter("disewa")}>Tidak tersedia</span>
          <span className="border rounded-full p-2" onClick={() => setFilter("tersedia")}>Tersedia</span>
        </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {ditampilkan.map((kendaraan) => (
          <VehicleCard
            id={kendaraan.id}
            key={kendaraan.id}
            nama={kendaraan.nama}
            jenis={kendaraan.jenis}
            harga={kendaraan.harga}
            gambar={kendaraan.gambar}
            status={kendaraan.status}
          />
        ))}
      </div>
    </div>
    <Calculator harga={200000} totalSewa={1}/>
    <Footer/>
   </div>
 
   </>
  )
}
