"use client";

export default function VideoShowcase() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          See Our Students Shine
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Watch performances from our talented students and get a glimpse into our classes.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div className="aspect-video bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
            <div className="text-center text-white">
              <svg className="w-20 h-20 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
              </svg>
              <p className="text-sm opacity-90">Student Showcase Reel</p>
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Winter 2024 Performances</h3>
            <p className="text-gray-600">Highlights from our recent scene study showcase featuring contemporary and classical works.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div className="aspect-video bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center">
            <div className="text-center text-white">
              <svg className="w-20 h-20 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
              </svg>
              <p className="text-sm opacity-90">Behind the Scenes</p>
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Inside Our Classes</h3>
            <p className="text-gray-600">A day in the life of our on-camera intensive program with professional coaching and feedback.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div className="aspect-video bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center">
            <div className="text-center text-white">
              <svg className="w-20 h-20 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
              </svg>
              <p className="text-sm opacity-90">Student Testimonials</p>
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Success Stories</h3>
            <p className="text-gray-600">Hear from actors who have transformed their craft and landed professional roles.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div className="aspect-video bg-gradient-to-br from-violet-400 to-indigo-400 flex items-center justify-center">
            <div className="text-center text-white">
              <svg className="w-20 h-20 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
              </svg>
              <p className="text-sm opacity-90">Technique Workshop</p>
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Method & Technique</h3>
            <p className="text-gray-600">Explore our approach to character building and emotional preparation techniques.</p>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-600 mb-4">
          Want to add your own video? Replace the placeholder divs with your YouTube or Vimeo embeds!
        </p>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 max-w-2xl mx-auto text-left">
          <p className="text-sm text-gray-700 font-mono">
            {'<iframe width="100%" height="315" src="https://www.youtube.com/embed/YOUR_VIDEO_ID" ...></iframe>'}
          </p>
        </div>
      </div>
    </section>
  );
}
