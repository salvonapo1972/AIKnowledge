import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminChatClient from "./AdminChatClient";

export default async function AdminChatPage() {
  const session = await auth();

  // Se l'utente non è loggato o non è l'admin, mostra la schermata di blocco
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="p-6 bg-white rounded-xl shadow border max-w-sm w-full text-center">
          <h1 className="text-xl font-bold mb-4">Area Riservata Amministratore</h1>
          
          <form
            action={async () => {
              "use server";
              redirect("/admin/login");
            }}
          >
            <button 
              type="submit" 
              className="w-full bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition"
            >
              Vai al Login OTP
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Se è autenticato, carica la chat
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Pannello AI di Amministrazione </h1>
      <p className="text-sm text-green-600 mb-6">Autenticato come: {session.user?.email}</p>
      <AdminChatClient />
    </div>
  );
}
