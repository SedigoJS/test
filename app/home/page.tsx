import Image from "next/image";
import Nav from "./Nav";

export default function SkincarePage() {
  return (
    <div className="max-h-screen bg-[url('/Model1.jpg')] bg-center bg-fixed bg-cover">
      <Nav />
      <main className="max-w-full mx-auto flex flex-col lg:flex-row items-center lg:items-start px-5 md:px-10 lg:px-20 md:pt-10">
        <section className="relative w-full lg:w-1/2 py-16 md:py-20 lg:py-28 text-center lg:text-left flex flex-col justify-between">
          <div className="font-sans mt-5 md:mt-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium mb-5 md:mb-7 font-playfair">
              Your Skin Matters
            </h1>
            <p className="text-lg md:text-2xl lg:text-3xl text-gray-700 font-thin">
              Formulated for perfection.
            </p>
            <p className="text-lg md:text-2xl lg:text-3xl text-gray-700 font-thin mt-2">
              Your skin&apos;s partner for a better you.
            </p>
          </div>
          <div className="flex justify-center lg:justify-start mt-10">
            <Image
              src="/Logo.png"
              alt="product"
              width={500}
              height={500}
              className="h-40 w-40 md:h-52 md:w-52 lg:h-64 lg:w-64"
            />
          </div>
        </section>
      </main>
    </div>
  );
}