'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { animate } from 'motion';
import { FcGoogle } from 'react-icons/fc';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const glowRef = useRef<HTMLDivElement | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (glowRef.current) {
      animate(
        glowRef.current,
        { opacity: [0.6, 0.9, 0.6], scale: [1, 1.1, 1] } as any,
        { duration: 3, repeat: Infinity, easing: 'ease-in-out' } as any
      );
    }
  }, []);

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Login failed');
      localStorage.setItem('token', data.token);
      router.push('/dashboard');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#05030A] via-[#0B0E2E] to-[#1C1F3B] px-4">
        {/* Logo Glow Animation */}
      <div
        ref={glowRef}
        className="absolute top-32 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-linear-to-r from-teal-400 via-indigo-600 to-purple-600 blur-[100px] opacity-70"
      />
      <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md p-8 border border-slate-700 relative overflow-hidden">
        


        {/* Logo and Title */}
        <div className="relative z-10 flex flex-col items-center mb-6">
          <Image
            src="/Glogo.png"
            alt="Genova AI Logo"
            width={72}
            height={72}
            className="mb-2"
          />
          <h1 className="text-2xl font-bold bg-linear-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
            Genova AI
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Welcome back! Sign in to continue.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={submit} className="relative z-10 space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 text-slate-200"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 text-slate-200"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-linear-to-r from-indigo-500 to-purple-600 hover:opacity-90 transition font-semibold text-white"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative z-10 flex items-center my-6">
          <div className="grow h-px bg-slate-700" />
          <span className="px-3 text-slate-400 text-sm">or</span>
          <div className="grow h-px bg-slate-700" />
        </div>

        {/* Google Login */}
        <button
          onClick={googleLogin}
          className="relative z-10 w-full py-3 flex items-center justify-center gap-2 rounded-lg bg-white text-gray-800 font-medium hover:bg-gray-100 transition"
        >
          <FcGoogle size={22} /> Sign in with Google
        </button>

        {/* Footer */}
        <p className="relative z-10 mt-6 text-sm text-center text-slate-400">
          Don’t have an account?{' '}
          <a href="/register" className="text-indigo-400 hover:underline">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
