"use client";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-900">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"></div>

      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight tracking-wide">
          The Art Of Performance<br />
          With Kyle Ferguson
        </h1>

        <div className="w-24 h-px bg-slate-400 mx-auto mb-8"></div>

        <p className="text-xl sm:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed font-light">
          Refine your craft. Find your voice.
        </p>

        <p className="text-base sm:text-lg text-slate-400 mb-12 max-w-2xl mx-auto font-light">
          Burlington, Vermont
        </p>

        <div className="flex justify-center">
          <a
            href="#contact"
            className="px-10 py-3 bg-slate-700 text-white font-medium text-base hover:bg-slate-600 transition-colors duration-200 border border-slate-600"
          >
            Get In Touch
          </a>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
    </section>
  );
}
