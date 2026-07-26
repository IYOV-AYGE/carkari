import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CarculatorWidget } from "@/components/CarculatorWidget";

export const metadata = {
  title: "Carculator — estimez votre budget location",
  description: "Estimez en 10 secondes le budget de votre location de voiture au Maroc.",
};

export default function CarculatorPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-brand-950/[0.03] px-4 py-12">
        <CarculatorWidget />
      </main>
      <Footer />
    </>
  );
}
