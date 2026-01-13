export default function About() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto bg-slate-50">
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl font-light text-gray-900 mb-6 tracking-wide">
          Approach
        </h2>
        <div className="w-16 h-px bg-slate-800 mx-auto mb-8"></div>
        <p className="text-lg text-gray-700 max-w-3xl mx-auto font-light leading-relaxed">
          I focus on giving actors practical tools that can be applied immediately in auditions and performances. My approach combines classical techniques with modern methods to help actors build confidence, versatility, and authenticity in performance.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-12">
        <div className="text-center">
          <h3 className="text-xl font-medium text-gray-900 mb-4 tracking-wide">Personalized Attention</h3>
          <p className="text-gray-600 leading-relaxed">
            Small class sizes ensure individual coaching and feedback tailored to your growth as an actor.
          </p>
        </div>

        <div className="text-center">
          <h3 className="text-xl font-medium text-gray-900 mb-4 tracking-wide">Living Characters</h3>
          <p className="text-gray-600 leading-relaxed">
            Performance is a fine balance between preparation and discovery. I help you develop the tools you need to bring characters to life in the moment.
          </p>
        </div>

        <div className="text-center">
          <h3 className="text-xl font-medium text-gray-900 mb-4 tracking-wide">Collaborative Environment</h3>
          <p className="text-gray-600 leading-relaxed">
            Train in a focused environment where actors support each other's development and artistic growth.
          </p>
        </div>
      </div>
    </section>
  );
}
