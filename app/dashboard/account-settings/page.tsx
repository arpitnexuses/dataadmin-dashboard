"use client"

import { motion } from "framer-motion"

const words = ["COMING", "SOON"]

export default function AccountSettingsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white -mt-32">
      <div className="overflow-hidden">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-8xl font-bold text-black tracking-wider"
        >
          {words.map((word, wordIndex) => (
            <span key={wordIndex} className="inline-block mr-12">
              {word.split("").map((letter, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: (wordIndex * word.length + index) * 0.2,
                    duration: 0.8,
                    type: "spring",
                    stiffness: 100
                  }}
                  className="inline-block"
                >
                  {letter}
                </motion.span>
              ))}
            </span>
          ))}
        </motion.h1>
      </div>
    </div>
  )
} 