export default function Footer() {
  return (
    <footer className="bg-slate-900 text-gray-400 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-2">
            <h3 className="text-xl font-light text-white mb-4 tracking-wide">
              Kyle Ferguson Acting Classes
            </h3>
            <p className="text-gray-400 mb-6 leading-relaxed font-light">
              Professional acting training in Burlington, Vermont.
            </p>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4 text-sm tracking-wide">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#instructor" className="hover:text-white transition-colors">Instructor</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4 text-sm tracking-wide">Location</h4>
            <p className="text-gray-400 text-sm leading-relaxed">
              Burlington, Vermont
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Kyle Ferguson Acting Classes</p>
        </div>
      </div>
    </footer>
  );
}
