import Image from "next/image";

export default function InstructorBio() {
  return (
    <section id="instructor" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-light text-gray-900 mb-4 tracking-wide">
            Instructor
          </h2>
          <div className="w-16 h-px bg-slate-800 mx-auto"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <h3 className="text-3xl font-light text-gray-900 mb-6 tracking-wide">
              Kyle Ferguson
            </h3>

            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p className="text-lg">
                Kyle is an actor and teacher based in Burlington, Vermont. He studied Theater at The College of William & Mary in Virginia, and received additional training at the Royal Academy of Dramatic Arts in London, The Tom Todoroff School in Los Angeles.
              </p>

              <p className="text-lg">
                He is a veteran of the Vermont theater community, having appeared in featured roles for Vermont Repertory Theatre, Vermont Stage, and Lyric Theater.
              </p>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-6 tracking-wide">Training & Education</h4>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-slate-400 mr-3">•</span>
                    <span>Bachelor of Arts in Theater - The College of William & Mary, Virginia</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-slate-400 mr-3">•</span>
                    <span>Royal Academy of Dramatic Arts (RADA), London</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-slate-400 mr-3">•</span>
                    <span>Commedia dell'Arte Intensive with John Rudlin</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-slate-400 mr-3">•</span>
                    <span>The Tom Todoroff School, Los Angeles</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-6 tracking-wide">Theater Credits</h4>
                <div className="space-y-2 text-gray-700">
                  <p>Vermont Repertory Theatre</p>
                  <p>Vermont Stage</p>
                  <p>Lyric Theater</p>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="relative">
              <div className="relative bg-gray-200 overflow-hidden aspect-[3/4] border border-gray-200">
                <Image
                  src="/images/kyle-headshot.jpg"
                  alt="Kyle Ferguson"
                  fill
                  className="object-cover grayscale"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
