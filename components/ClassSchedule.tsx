"use client";

import { useState } from "react";

interface ClassType {
  id: number;
  title: string;
  level: string;
  schedule: string;
  duration: string;
  price: string;
  spots: number;
  description: string;
}

export default function ClassSchedule() {
  const classes: ClassType[] = [
    {
      id: 1,
      title: "Scene Study Fundamentals",
      level: "Beginner",
      schedule: "Tuesdays & Thursdays, 6:00 PM - 8:00 PM",
      duration: "8 weeks",
      price: "$450",
      spots: 3,
      description: "Build a strong foundation in scene analysis, character development, and emotional authenticity."
    },
    {
      id: 2,
      title: "On-Camera Intensive",
      level: "Intermediate",
      schedule: "Wednesdays, 7:00 PM - 9:30 PM",
      duration: "6 weeks",
      price: "$550",
      spots: 5,
      description: "Master the nuances of screen acting with professional camera equipment and real-time feedback."
    },
    {
      id: 3,
      title: "Audition Bootcamp",
      level: "All Levels",
      schedule: "Saturdays, 10:00 AM - 1:00 PM",
      duration: "4 weeks",
      price: "$380",
      spots: 2,
      description: "Sharpen your audition skills with cold reading, self-tape techniques, and casting director insights."
    },
    {
      id: 4,
      title: "Advanced Scene Work",
      level: "Advanced",
      schedule: "Mondays, 7:00 PM - 10:00 PM",
      duration: "10 weeks",
      price: "$650",
      spots: 4,
      description: "Deep dive into complex characters and challenging material with professional performance opportunities."
    }
  ];

  const [selectedClass, setSelectedClass] = useState<number | null>(null);

  return (
    <section id="classes" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-light text-gray-900 mb-6 tracking-wide">
            Classes
          </h2>
          <div className="w-16 h-px bg-slate-800 mx-auto mb-8"></div>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto font-light leading-relaxed">
            All classes include personalized feedback and performance opportunities.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {classes.map((classItem) => (
            <div
              key={classItem.id}
              className="border border-gray-200 overflow-hidden hover:border-slate-400 transition-colors duration-200"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-light text-gray-900 mb-3 tracking-wide">
                      {classItem.title}
                    </h3>
                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium">
                      {classItem.level}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-light text-gray-900">{classItem.price}</p>
                    <p className="text-sm text-gray-500 mt-1">{classItem.duration}</p>
                  </div>
                </div>

                <p className="text-gray-600 mb-6 leading-relaxed">
                  {classItem.description}
                </p>

                <div className="space-y-2 mb-6 text-sm text-gray-600">
                  <p>{classItem.schedule}</p>
                  <p className="font-medium text-gray-900">
                    {classItem.spots} {classItem.spots === 1 ? 'spot' : 'spots'} remaining
                  </p>
                </div>

                <button
                  onClick={() => setSelectedClass(classItem.id)}
                  className="w-full px-6 py-3 bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors duration-200"
                >
                  Inquire
                </button>
              </div>
            </div>
          ))}
        </div>

        {selectedClass && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 max-w-md w-full border border-gray-200">
              <h3 className="text-2xl font-light text-gray-900 mb-4 tracking-wide">Class Inquiry</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                To inquire about this class, please contact us using the form below. We'll respond within 24 hours.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setSelectedClass(null);
                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex-1 px-6 py-3 bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors"
                >
                  Contact
                </button>
                <button
                  onClick={() => setSelectedClass(null)}
                  className="px-6 py-3 border border-slate-300 text-gray-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
