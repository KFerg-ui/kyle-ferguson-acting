"use client";

import { useState } from "react";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    experience: "",
    message: ""
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("https://formspree.io/f/xzddbwzv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: "", email: "", phone: "", experience: "", message: "" });
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-light text-gray-900 mb-6 tracking-wide">
            Contact
          </h2>
          <div className="w-16 h-px bg-slate-800 mx-auto mb-8"></div>
          <p className="text-lg text-gray-700 font-light leading-relaxed">
            Get in touch to learn more about classes and availability.
          </p>
        </div>

        <div className="bg-white border border-gray-200 p-8 sm:p-12">
          {submitted ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h3>
              <p className="text-gray-600">We've received your message and will get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none transition-all"
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none transition-all"
                    placeholder="jane@example.com"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none transition-all"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Level
                  </label>
                  <select
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none transition-all bg-white"
                  >
                    <option value="">Select level...</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="professional">Professional</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none transition-all resize-none"
                  placeholder="Tell us about your goals and which class interests you..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-8 py-4 bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Sending..." : "Send Message"}
              </button>

              <p className="text-sm text-gray-500 text-center">
                We respect your privacy and will never share your information.
              </p>
            </form>
          )}
        </div>

        <div className="mt-12 grid sm:grid-cols-3 gap-8 text-center text-gray-700">
          <div>
            <h4 className="font-medium mb-2 text-gray-900">Email</h4>
            <p className="text-sm">ferguson.kd@gmail.com</p>
          </div>

          <div>
            <h4 className="font-medium mb-2 text-gray-900">Contact Me On Signal</h4>
            <p className="text-sm">
              <a href="https://signal.me/#eu/dYIRy5FRJfM04vwwnHs5Q9WZkZvTCghpTfMBXuNnM6nZGyLybt1FlrMqlIR780ks" className="text-slate-700 hover:text-slate-900 transition-colors">
  Click to message
</a>
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2 text-gray-900">Response Time</h4>
            <p className="text-sm">Within 24 hours</p>
          </div>
        </div>
      </div>
    </section>
  );
}
