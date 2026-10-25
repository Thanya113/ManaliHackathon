"use client";

import React from "react";

/**
 * AnimatedGoldBackground
 * Renders an ambient, animated bullion-gold and champagne background.
 * Uses flowing gradient orbs, subtle breathing light, and a precision micro-grid.
 */
export const AnimatedGoldBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Dynamic Golden Ambient Orbs */}
      <div className="absolute -top-24 -left-24 w-[34rem] h-[34rem] rounded-full bg-gradient-to-br from-amber-300/40 via-yellow-200/30 to-amber-100/10 blur-3xl animate-auric-float-1" />
      <div className="absolute top-1/4 -right-28 w-[38rem] h-[38rem] rounded-full bg-gradient-to-bl from-amber-200/45 via-orange-100/35 to-yellow-100/10 blur-3xl animate-auric-float-2" />
      <div className="absolute -bottom-32 left-1/3 w-[36rem] h-[36rem] rounded-full bg-gradient-to-tr from-yellow-300/35 via-amber-200/30 to-amber-50/10 blur-3xl animate-auric-pulse" />
      <div className="absolute top-2/3 -left-20 w-[26rem] h-[26rem] rounded-full bg-gradient-to-r from-amber-200/30 to-yellow-100/20 blur-2xl animate-auric-float-1" />

      {/* Subtle Golden Shimmer Wave Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-amber-50/30" />

      {/* Precision Bullion Geometric Micro-Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#b45309_0.75px,transparent_0.75px)] [background-size:24px_24px] opacity-[0.045]" />
    </div>
  );
};
