import React from "react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const data = [
  {
    name: "Anti-Acne Serum",
    price: "800",
    description:
      "A product formulated to give you clearer skin and prevents it from breaking out.",
    image: "/Product 2.jpg",
  },
  {
    name: "Anti-Acne Wash Foam",
    price: "1,000",
    description:
      "A product formulated to give you clearer skin and prevents it from breaking out.",
    image: "/Product 1.jpg",
  },
  {
    name: "Anti-Acne Toner",
    price: "650",
    description:
      "A product formulated to give you clearer skin and prevents it from breaking out.",
    image: "/Product 1.jpg",
  },
  {
    name: "Anti-Acne Cream",
    price: "500",
    description:
      "A product formulated to give you clearer skin and prevents it from breaking out.",
    image: "/Product 2.jpg",
  },
  {
    name: "Anti-Acne Serum",
    price: "800",
    description:
      "A product formulated to give you clearer skin and prevents it from breaking out.",
    image: "/Product 2.jpg",
  },
  {
    name: "Anti-Acne Wash Foam",
    price: "1,000",
    description:
      "A product formulated to give you clearer skin and prevents it from breaking out.",
    image: "/Product 1.jpg",
  },
];

const Product = () => {
  return (
    <div className="bg-slate-50 font-gigasan">
      <section className="py-12 px-4 sm:px-8 md:px-16 lg:px-40">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 font-playfair text-black">
          — PRODUCTS —
        </h2>

        <Tabs defaultValue="anti-acne" className="w-full mb-8 font-gigasan">
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-3 mb-10">
            <TabsTrigger value="brightening" className="text-base sm:text-lg opacity-50 data-[state=active]:opacity-100 data-[state=active]:border-b-2 data-[state=active]:border-blue-200">
              Brightening
            </TabsTrigger>
            <TabsTrigger value="anti-acne" className="text-base sm:text-lg opacity-50 data-[state=active]:opacity-100 data-[state=active]:border-b-2 data-[state=active]:border-blue-200">
              Anti-Acne
            </TabsTrigger>
            <TabsTrigger value="anti-aging" className="text-base sm:text-lg opacity-50 data-[state=active]:opacity-100 data-[state=active]:border-b-2 data-[state=active]:border-blue-200">
              Anti-Aging
            </TabsTrigger>
          </TabsList>

          <TabsContent value="anti-acne" className="mt-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8"> 
              {data.map((product, i) => (
                <div key={i} className="relative h-[400px] sm:h-[450px] rounded-xl shadow-lg">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={1000}
                    height={1000}
                    className="h-full w-full rounded-xl object-cover"
                  />
                  <div className="absolute bottom-0 bg-white w-full flex flex-col justify-between items-center px-6 py-4 sm:py-5 rounded-xl rounded-t-3xl">
                    <div>
                      <h3 className="font-playfair text-lg sm:text-xl md:text-2xl mb-1 sm:mb-2 text-black">
                        {product.name}
                      </h3>
                      <p className="font-thin text-xs sm:text-sm md:text-base mb-2 sm:mb-4 text-black">
                        {product.description}
                      </p>
                    </div>
                    <div className="flex justify-between items-center w-full">
                      <p className="text-sm sm:text-base md:text-lg font-meduim text-black">₱ {product.price}</p>
                      <Image
                        src="/Shopee Logo.png"
                        alt="Shopee"
                        width={1000}
                        height={1000}
                        className="cursor-pointer w-7 sm:w-8 md:w-9 h-7 sm:h-8 md:h-9"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="brightening">
            <div className="text-center text-gray-500">Brightening products coming soon</div>
          </TabsContent>

          <TabsContent value="anti-aging">
            <div className="text-center text-gray-500">Anti-aging products coming soon</div>
          </TabsContent>
        </Tabs>
      </section>



      <div className="w-full font-gigasan">
        {/* Section 1 */}
        <section className="w-full flex flex-col md:flex-row items-center">
          <div className="relative w-full md:w-[60%] h-64 md:h-full">
            <Image
              src="/Model 2.jpg"
              alt="Skincare Routine"
              width={1000} 
              height={1000} 
              className="object-cover md:w-full md:h-full"
            />
          </div>
          <div className="flex items-center w-full md:w-[40%] p-6 md:px-10">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-black">
                Your skin&apos;s partner for a better you.
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600">
                Formulated with key ingredients to help you achieve the perfect
                look. The result: impossibly smooth, luminescent skin that glows
                with a healthy-looking complexion.
              </p>
            </div>
          </div>
        </section>
        {/* Section 2 */}
        <section className="w-full flex flex-col-reverse md:flex-row items-center">
          <div className="flex items-center w-full pt-40 md:pt-0 md:w-[60%] p-6 md:px-10">
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600">
              The Anti-Acne Skincare system is specially formulated to treat
              imperfections and acne. <br /> <br /> It is a dual-phase system
              that reduces and prevents pimples, blackheads, and other skin
              blemishes while providing essential nutrients to maintain a healthy
              complexion.
            </p>
          </div>
          <div className="relative w-full md:w-[40%] h-64 md:h-full">
            <Image
              src="/Group Products 1.png"
              alt="Skincare Routine"
              width={1000} 
              height={1000} 
              className="object-cover md:w-full md:h-full"
            />
          </div>
        </section>
        {/* Section 3 */}
        <section className="w-full flex flex-col md:flex-row items-center">
          <div className="relative w-full md:w-[60%] h-64 md:h-full">
            <Image
              src="/Group Products 2.png"
              alt="Skincare Routine"
              width={1000} 
              height={1000} 
              className="object-cover md:w-full md:h-full"
            />
          </div>
          <div className="flex items-center pt-40 md:pt-0 w-full md:w-[40%] p-6 md:px-10">
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600">
              This reveals your radiant skin by helping treat the problem of
              problematic skin. <br /> <br /> A combination of natural extracts
              will visibly lighten and brighten uneven skin tones, acne scars,
              age spots, and pigmentation.
            </p>
          </div>
        </section>
      </div>






      {/* Know More Section */}
      <section className="relative h-screen">
  <div className="h-1/2 bg-black"></div>
  <div className="h-1/2 bg-white"></div>
  <div className="absolute top-[50%] left-[50%] transform translate-x-[-50%] translate-y-[-50%] w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h2 className="text-3xl sm:text-4xl lg:text-5xl text-center mb-8 sm:mb-12 text-white font-gigasan">
      — KNOW MORE —
    </h2>
    <div className="grid grid-cols-3 gap-8 mt-32 md:mt-0">
      {[
        { category: "ANTI-ACNE", image: "/Model 4.png" },
        { category: "BRIGHTENING", image: "/Model 5.jpg" },
        { category: "ANTI-AGING", image: "/Model 3.jpg" },
      ].map(({ category, image }) => (
        <div key={category} className="text-center space-y-2 pb-24 sm:pb-0">
          <div className="relative h-[100px] sm:h-[200px] md:h-[300px] lg:h-[350px] mb-4">
            <Image
              src={image}
              alt={category}
              width={1000} 
              height={1000}
              className="object-cover w-full h-full rounded-3xl border-gray-400 shadow-md"
            />
          </div>
          <h3 className="text-xs sm:text-3xl lg:text-4xl font-playfair text-black">{category}</h3>
          <p className="text-xs sm:text-base text-gray-500 cursor-pointer font-gigasan">Read</p>
        </div>
      ))}
    </div>
  </div>
</section>

    </div>
  );
};

export default Product;
