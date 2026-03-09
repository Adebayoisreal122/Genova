'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { animate } from 'motion';
import Image from 'next/image';
import { FcGoogle } from 'react-icons/fc';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (glowRef.current) {
      animate(
        glowRef.current,
        { opacity: [0.6, 0.9, 0.6], transform: ['scale(1)', 'scale(1.1)', 'scale(1)'] } as any,
        { duration: 3, repeat: Infinity, easing: 'ease-in-out' }as any
      );
    }
  }, []);

   const googleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Registration failed');
      localStorage.setItem('token', data.token);
      router.push('/dashboard');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
      {/* Animated background glow */}
      <div
        ref={glowRef}
        className="absolute top-32 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-linear-to-r from-teal-400 via-indigo-600 to-purple-600 blur-[100px] opacity-70"
      />

      <div className="relative z-10 w-full max-w-md p-8 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/Glogo.png"
            alt="Genova AI Logo"
            width={70}
            height={70}
            className="mb-3"
          />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-teal-400 to-indigo-500">
            Create Your Account
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Join the future of AI creation with Genova AI.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <input
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            disabled={loading}
            className="w-full py-3 bg-linear-to-r from-teal-500 to-indigo-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            {loading ? 'Creating...' : 'Create Account'}
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

        <p className="mt-6 text-sm text-center text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-teal-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
