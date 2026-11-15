import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white px-6">

      <h1 className="text-5xl font-bold text-emerald-400">
        MoveMate
      </h1>

      <p className="mt-4 text-slate-300 text-center">
        Travel Together. Share Smartly. Help Each Other.
      </p>

      <div className="flex gap-4 mt-8">
        <Link
          to="/login"
          className="bg-emerald-500 px-6 py-3 rounded-lg font-semibold"
        >
          Login
        </Link>

        <Link
          to="/register"
          className="border border-white px-6 py-3 rounded-lg"
        >
          Get Started
        </Link>
      </div>

    </div>
  );
}

export default Home;