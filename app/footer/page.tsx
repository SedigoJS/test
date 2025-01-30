import Image from "next/image";
import React from "react";
import { FaFacebook, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer id="footer" className="bg-black text-white pt-12 mt-12 font-gigasan">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-between">
        {/* Left side (Logo and Social Media) */}
        <div className="relative flex flex-col items-start w-full sm:w-1/3">
            <Image 
              src="/Logo.png"
              width={1000}
              height={1000}
              alt="Tori Skin"
              className="size-60 z-0 -top-14 -left-0 absolute invert">
            </Image>
            <div className="space-y-2 flex justify-center gap-4 mt-28 mx-20">
              <FaFacebook className="z-50 rounded-full size-7 mt-2 cursor-pointer"/>
              <FaInstagram className="z-50 rounded-full text-white size-7 cursor-pointer"/>
            </div>
        </div>

        {/* Right side (Links Section) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 w-full sm:w-2/3 mt-8 sm:mt-0">
          <div>
            <h3 className="font-bold mb-4 text-lg sm:text-xl">Home</h3>
            <div className="space-y-2">
              <p className="text-sm sm:text-base">About Us</p>
              <p className="text-sm sm:text-base">Products</p>
              <p className="text-sm sm:text-base">Distributors</p>
              <p className="text-sm sm:text-base">Packages</p>
            </div>
          </div>
          <div>
            <h3 className="font-bold mb-4 text-lg sm:text-xl">About Us</h3>
            <div className="space-y-2">
              <p className="text-sm sm:text-base">About Us</p>
              <p className="text-sm sm:text-base">Get Started</p>
              <p className="text-sm sm:text-base">Media</p>
              <p className="text-sm sm:text-base">Gallery</p>
            </div>
          </div>
          <div>
            <h3 className="font-bold mb-4 text-lg sm:text-xl">Products</h3>
            <div className="space-y-2">
              <p className="text-sm sm:text-base">Product Line</p>
              <p className="text-sm sm:text-base">Anti-Acne</p>
              <p className="text-sm sm:text-base">Brightening</p>
              <p className="text-sm sm:text-base">Whitening</p>
            </div>
          </div>
          <div>
            <h3 className="font-bold mb-4 text-lg sm:text-xl">Contact Us</h3>
            <div className="space-y-2">
              <p className="text-sm sm:text-base">(000) 123-1234</p>
              <p className="text-sm sm:text-base">customercare@toriskin.com</p>
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-center py-4 mt-8">
        COPYRIGHT &copy; {new Date().getFullYear()} | Tori Skin
      </p>
    </footer>
  );
};

export default Footer;
