export default function Components() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-light text-gray-900 mb-6 tracking-wide">
            Components
          </h2>
          <div className="w-16 h-px bg-slate-800 mx-auto mb-8"></div>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto font-light leading-relaxed">
            The foundational elements that build strong, authentic performances.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-x-12 gap-y-10 max-w-5xl mx-auto">
          <div>
            <h3 className="text-xl font-medium text-gray-900 mb-3 tracking-wide">Voice & Speech</h3>
            <p className="text-gray-600 leading-relaxed">
              An actor's first and most essential asset is their voice. Develop clarity, projection, and expressive range through breath work and vocal technique.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-medium text-gray-900 mb-3 tracking-wide">Movement</h3>
            <p className="text-gray-600 leading-relaxed">
              Your body is a powerful tool for communication and characterization. Build physical awareness and expressive capability through structured movement exercises.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-medium text-gray-900 mb-3 tracking-wide">Text Analysis</h3>
            <p className="text-gray-600 leading-relaxed">
              Performance begins on the page. Learn to break down scripts and discover the intentions, obstacles, and tactics within the text.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-medium text-gray-900 mb-3 tracking-wide">Character Development</h3>
            <p className="text-gray-600 leading-relaxed">
              Explore techniques for creating fully realized characters from psychological and physical foundations.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-medium text-gray-900 mb-3 tracking-wide">Scene Study</h3>
            <p className="text-gray-600 leading-relaxed">
              Life often happens between the lines. Apply skills in practical scene work, learning to engage, listen, and respond truthfully.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-medium text-gray-900 mb-3 tracking-wide">Audition Technique</h3>
            <p className="text-gray-600 leading-relaxed">
              Master the specific skills needed for auditions, from cold reading to making bold choices quickly.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
