"use client";

import Image from "next/image";

export default function CareerChatbot() {
  return (
    <button
      type="button"
      aria-label="Open CareerPath AI"
      className="fixed bottom-6 right-6 z-50 h-16 w-16 overflow-hidden rounded-full border border-gray-200 bg-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
    >
      <Image
        src="/images/careerpath-rat-chatbot-logo.png"
        alt="CareerPath AI"
        fill
        sizes="64px"
        className="object-cover"
      />
    </button>
  );
}