"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      code,
      redirect: false, // Gestiamo il reindirizzamento manualmente per evitare refresh brutti
    });

    if (result?.error) {
      setError("Codice errato o scaduto. Riprova.");
    } else {
      router.push("/admin/chat"); // Se è corretto, ti manda alla chat protetta
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-6 rounded-xl shadow-md border">
        <h1 className="text-xl font-bold mb-2 text-gray-900 text-center">Area Riservata Admin</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">Inserisci il codice a 6 cifre della tua app Authenticator.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="tracking-[0.5em] text-center font-mono text-2xl border p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          
          <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700 transition">
            Sblocca Accesso
          </button>
        </form>
      </div>
    </div>
  );
}
