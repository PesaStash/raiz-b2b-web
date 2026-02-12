"use client";
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "@/styles/authslider.css";

import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Autoplay, EffectFade, Navigation, Pagination } from "swiper/modules";
import { RegisterSlidesData } from "@/constants/RegisterSlidesData";
import Slide from "./Slide";

const Slider = ({className}:{className?: string}) => {
  return (
    <div className={`relative hidden md:block w-[50%] xl:w-[54%] h-full ${className}`}>
      <Swiper
        spaceBetween={30}
        effect={"fade"}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        loop
        pagination={{
          clickable: true,
          renderBullet: (index, className) =>
            `<span class="${className} custom-dot"></span>`,
        }}
        modules={[EffectFade, Pagination, Autoplay, Navigation]}
        className="w-full h-full"
      >
        {RegisterSlidesData.map((slide, index) => (
          <SwiperSlide key={index}>
            <Slide
              title={slide.title}
              description={slide.description}
              bgImage={slide.bgImage}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default Slider;
