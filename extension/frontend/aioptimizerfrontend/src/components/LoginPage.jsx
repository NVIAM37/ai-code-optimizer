import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Step 1

const LoginPage = () => {
  const [username, handleUsername] = useState("");
  const [email, handleEmail] = useState("");
  const [password, handlePassword] = useState("");
    const navigate = useNavigate(); // ✅ Step 2

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { username, email, password };
    const userData = JSON.parse(localStorage.getItem("userData"));
   if(username !== userData.username || email !== userData.email || password !== userData.password){
    alert("Invalid credentials!");
    return;
   }
    handleUsername("");
    handleEmail("");
    handlePassword("");
     alert("Login successful!");
    navigate('/Ide'); // Navigate to MainPage after login
  };

  return (
    <div className="flex items-center flex-col  justify-center h-screen ">
      <h1 className="text-gray-200 text-6xl mt-5 font-bold">AI Code Optimizer</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-[#ffffff15] m-auto w-[40%]  flex flex-col items-center gap-7 p-6 rounded-lg"
      >
        <h1 className="text-center text-4xl font-extrabold text-gray-200">
          Login
        </h1>

        <div className="flex w-[70%] justify-between">
          <label
            htmlFor="username"
            className="cursor-pointer text-gray-300 font-bold"
          >
            Username
          </label>
          <input
            type="text"
            name="username"
            required
            value={username}
            onChange={(e) => handleUsername(e.target.value)}
            id="username"
            placeholder="Enter username"
            className="bg-white text-black pl-2"
          />
        </div>

        <div className="flex w-[70%] justify-between">
          <label
            htmlFor="email"
            className="cursor-pointer text-gray-300 font-bold"
          >
            E-Mail
          </label>
          <input
            type="email"
            name="email"
            required
            value={email}
            onChange={(e) => handleEmail(e.target.value)}
            id="email"
            placeholder="Enter email"
            className="bg-white text-black pl-2"
          />
        </div>

        <div className="flex w-[70%] justify-between">
          <label
            htmlFor="password"
            className="cursor-pointer text-gray-300 font-bold"
          >
            Password
          </label>
          <input
            type="password"
            name="password"
            required
            value={password}
            onChange={(e) => handlePassword(e.target.value)}
            id="password"
            placeholder="Enter password"
            className="bg-white text-black pl-2"
          />
        </div>

        <button
          type="submit"
          className="bg-white text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-950 focus:ring-opacity-50 font-bold px-4 py-2 rounded"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
