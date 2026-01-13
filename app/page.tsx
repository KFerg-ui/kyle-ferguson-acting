import Hero from "@/components/Hero";
import InstructorBio from "@/components/InstructorBio";
import About from "@/components/About";
import Components from "@/components/Components";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Hero />
      <InstructorBio />
      <About />
      <Components />
      <ContactForm />
      <Footer />
    </main>
  );
}
