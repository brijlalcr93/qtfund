import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import Pricing from '../components/Pricing';
import ProfitSplit from '../components/ProfitSplit';
import Features from '../components/Features';
import WhyChooseUs from '../components/WhyChooseUs';
import LiveStats from '../components/LiveStats';
import Testimonials from '../components/Testimonials';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <main style={{ width: '100%' }}>
      <Hero />
      <HowItWorks />
      <Pricing />
      <ProfitSplit />
      <Features />
      <WhyChooseUs />
      {/* <LiveStats /> */}
      {/* <Testimonials /> */}
      <CTA />
      <Footer />
    </main>
  );
}
