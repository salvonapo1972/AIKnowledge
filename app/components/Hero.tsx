"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowDown, BookOpen } from "lucide-react";
import Link from 'next/link';
import { useState} from 'react';
export default function Hero() {

  return (
    <section className="relative h-screen overflow-hidden">

      {/* Background */}

      <Image
        src="/AIKnowledge.png"
        alt="Hero"
        fill
        priority
        className="object-cover scale-105"
      />

      {/* Overlay */}

      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#F8F5F0]" />

      {/* Luce */}

      <div className="absolute left-1/2 top-24 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-300/20 blur-[140px]" />

      {/* Content */}

      <div className="container relative z-20 flex h-full flex-col items-center justify-center text-center text-white">

        

        <motion.h1
          initial={{ opacity:0,y:40 }}
          animate={{ opacity:1,y:0 }}
          transition={{ delay:.2,duration:.8 }}
          className="max-w-5xl text-6xl font-bold leading-tight md:text-8xl"
        >
         
        </motion.h1>

        

        <motion.div
          initial={{ opacity:0,y:30 }}
          animate={{ opacity:1,y:0 }}
          transition={{ delay:.8 }}
          className="mt-14 flex flex-col gap-4 sm:flex-row"
        >
        <Link href="/chat">
          <button  className="btn-primary flex items-center gap-2">

            <BookOpen size={20}/>

            Chat

          </button>
          </Link>

          

        </motion.div>

      </div>

      {/* Scroll */}

      

    </section>
  );
}
