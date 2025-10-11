import React, { useState } from "react";
import bubble from "../assets/bubble3.png";
import SignUpPage from "./SignUpPage.jsx";
import { useNavigate } from "react-router-dom"; // ✅ Step 1

const MainPage = () => {
  const navigate = useNavigate(); // ✅ Step 2

  return (
    <div className="h-screen  overflow-y-hidden">
      {/* header */}
      {/* this is a opening header tag  */}
      <div className="bg-[#a7a2a29f] w-[50%] h-[50px] m-auto mt-10 flex items-center justify-between px-4 rounded-lg text-gray-300">
        <h1 className="font-bold text-xl">NVIAM</h1>

        <div className="flex gap-4 items-center justify-center">
          <button
            className="bg-[#050428] text-white hover:bg-blue-950 px-4 py-2 cursor-pointer rounded-lg"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
          <button
            className="bg-[#050428] cursor-pointer text-white hover:bg-blue-950 px-4 py-2 rounded-lg"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </button>
        </div>
      </div>
      {/* this is a opening header tag  */}

      {/* headLine */}
      {/* this is a opening heading tag  */}
      <h1 className=" text-gray-400 mt-4 text-6xl font-bold text-center ">
        Optimize Your Code With -{" "}
      </h1>
      <h2 className="uppercase text-4xl font-extrabold mt-3 text-center text-gray-300">
        AI CODE OPTIMIZER IDE
      </h2>
      {/* this is a closing heading tag  */}

      {/* Bubble Image  */}
      <img src={bubble} alt="bubbleImg " className="m-auto" />
    </div>
  );
};

export default MainPage;
