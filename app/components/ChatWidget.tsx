'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { Streamdown } from 'streamdown';
import dynamic from 'next/dynamic';

export default function ChatWidget() {
  const [coords, setCoords] = useState({ lat: 0, lng: 0 });
  const [dots, setDots] = useState('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

 const ParkingMap = dynamic(() => import('./parking-map'), {
    ssr: false,
    loading: () => <p className="h-80 flex items-center justify-center bg-gray-100 rounded-lg">Caricamento mappa...</p>
  });

  // Funzione per forzare lo scroll in fondo
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Inizializzazione useChat
  const { messages, sendMessage } = useChat({
    onFinish: () => {
      setIsLoading(false);
      setTimeout(scrollToBottom, 30);
    }
  });

  const botAvatar = "/avatar.svg";
  const userAvatar = "/avatar_human.svg";


  // 2. RECUPERO DELLE COORDINATE (Eseguito in sicurezza lato Client)
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error("Errore geolocalizzazione:", error),
        { enableHighAccuracy: true }
      );
    }
  }, []);
  // Animazione stabile dei puntini
  useEffect(() => {
   // console.log('passo');
    if (!isLoading) {
      setDots('');
      return;
    }
    const interval = setInterval(() => {
      setDots((prev) => (prev === '...' ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, [isLoading]);

  // 2. MODIFICATO: Lo scroll automatico si attiva SOLO se l'IA sta scrivendo (isLoading === true)
  const lastMessage = messages.at(-1);
  const lastMessageContent = lastMessage?.parts?.map(p => p.type === 'text' ? p.text : '').join('') || '';

  useEffect(() => {
    // Se la chat viene aperta, fa un singolo scroll iniziale
    if (isOpen && !isLoading && messages.length > 0 && lastMessageContent === '') {
      scrollToBottom();
      return;
    }

    // Blocca lo scroll verso il basso se l'IA ha finito di digitare!
    if (!isLoading) return; 

    scrollToBottom();
  }, [lastMessageContent, dots, isOpen, isLoading]); // Aggiunto isLoading come dipendenza di controllo

  // LOGICA DI CONTROLLO DEL PENSIERO
  const hasStartedTyping = lastMessage?.role === 'assistant' && 
    lastMessage.parts.some(part => part.type === 'text' && part.text.trim().length > 0);

  const isAiThinking = isLoading && !hasStartedTyping && typeof lastMessage !== "undefined";

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans flex flex-col items-end">
      
      {/* FINESTRA DELLA CHAT FLUTTUANTE */}
      <div className={`w-[360px] sm:w-[400px] h-[550px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col mb-4 overflow-hidden transition-all duration-300 ${
        isOpen ? 'block opacity-100 scale-100' : 'hidden opacity-0 scale-95'
      }`}>
        
        {/* Header del Widget */}
        <header className="flex items-center justify-between p-4 bg-blue-600 text-white shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={botAvatar} alt="AI Bot" className="w-8 h-8 rounded-full bg-white/20 p-1" />
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 border border-blue-600 rounded-full"></span>
            </div>
            <div>
              <h2 className="text-sm font-bold leading-none mb-1">Assistente Virtuale</h2>
              <p className="text-[10px] text-blue-100">Online</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setIsOpen(false)} 
            className="p-1 hover:bg-blue-700 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </header>
        
        {/* Area di scorrimento dei Messaggi */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-950 scroll-smooth"
        >
          {messages.length === 0 && (
            <div className="text-center text-zinc-400 dark:text-zinc-500 text-xs py-16 px-4">
              <p className="font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Benvenuto nella chat!</p>
              <p>Puoi chiedermi notizie, temperature, situazione terremoti e scaletta di canti per la messa domenicale.</p>
            </div>
          )}
          
          {messages.map(message => {
            const isUser = message.role === 'user';
            const isAiEmpty = message.role === 'assistant' && 
              !message.parts.some(part => part.type === 'text' && part.text.trim().length > 0);
              
            if (isAiEmpty) return null;

            return (
              <div 
                key={message.id} 
                className={`flex gap-2 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <img 
                  src={isUser ? userAvatar : botAvatar} 
                  alt="avatar" 
                  className="w-7 h-7 rounded-full border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 p-0.5 flex-shrink-0" 
                />
                
                <div 
                  className={`p-3 rounded-2xl text-sm shadow-sm leading-relaxed ${
                    isUser 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 border border-zinc-100 dark:border-zinc-800 rounded-tl-none'
                  }`}
                >
                  {message.parts.map((part, i) => {
                   // console.log("parttype",part.type);
                    switch (part.type) {
                      case 'text':
                        return message.role === 'assistant' ? (
                          <div key={`${message.id}-${i}`} className="prose dark:prose-invert max-w-none text-sm">
                            <Streamdown>{part.text}</Streamdown>
                          </div>
                        ) : (
                          <div className="font-semibold inline text-sm" key={`${message.id}-${i}`}>{part.text}</div>
                        );
                      case 'tool-cercaParcheggi': {
                       // console.log("part",part.type);
                      //  console.log("part.metadata",part.output);
                        const toolOutput = (part as { output?: { center?: unknown; locations?: unknown } }).output;
                        const center = toolOutput?.center;
                        const locations = toolOutput?.locations;
                     //   console.log("center",center);
                     //   console.log("locations",locations);
                        if (!center || !locations) {
                          return null;
                        }

                        return (
                          <div key={`${message.id}-${i}`} className="w-full mt-2">
                            <p className="text-xs text-gray-500 mb-1">Mappa dei parcheggi trovati:</p>
                            <ParkingMap center={center as never} locations={locations as never} />
                          </div>
                        );
                  };
                  default:
                        return null;
                    }
                  })
                  }
                </div>
              </div>
            );
          })}

          {/* COMPONENTE PUNTINI */}
          {isAiThinking && (
            <div className="flex gap-2 max-w-[85%] mr-auto items-start">
              <img src={botAvatar} alt="Bot" className="w-7 h-7 rounded-full border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 p-0.5" />
              <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-2xl rounded-tl-none text-sm shadow-sm italic">
                Sto pensando{dots}
              </div>
            </div>
          )}
        </div>

        {/* Form di Input */}
        <form
          onSubmit={e => {
            e.preventDefault();
            if (!input.trim()) return;
            sendMessage({ text: input },
                        {  body: {
                           coordinates: coords
                         }});
            setInput('');
            setIsLoading(true); // Attiva lo sblocco dello scroll per la nuova risposta
            setTimeout(scrollToBottom, 30);
          }}
          className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex-shrink-0"
        >
          <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-950 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white dark:focus-within:bg-zinc-900 transition-all">
            <input
              className="flex-1 px-2 bg-transparent outline-none text-xs text-zinc-800 dark:text-zinc-200 font-semibold"
              value={input}
              placeholder="Chiedimi qualcosa..."
              onChange={e => setInput(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={!input.trim()} 
              className="bg-blue-600 text-white rounded-lg p-1.5 hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              <svg className="w-3.5 h-3.5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* PULSANTE FLUTTUANTE */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-xl transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

    </div>
  );
}
