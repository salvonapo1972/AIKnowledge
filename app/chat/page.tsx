'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { Streamdown } from 'streamdown';
import dynamic from 'next/dynamic';
import { DefaultChatTransport } from 'ai';

export default function ChatPage() {
  const [coords, setCoords] = useState({ lat: 0, lng: 0 });
  const [dots, setDots] = useState('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
   const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const ParkingMap = dynamic(() => import('../components/parking-map'), {
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
    
    transport: new DefaultChatTransport({
    body: () => ({
      coordinates: coords 
    })
  }),
    onFinish: () => {
      setIsLoading(false);
      setTimeout(scrollToBottom, 30);
    }
  });

  const botAvatar = "/avatar.svg";
  const userAvatar = "/avatar_human.svg";

 // INIZIALIZZAZIONE DEL RICONOSCIMENTO VOCALE (Eseguito lato client in sicurezza)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'it-IT';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        
        recognition.onerror = (event: any) => {
          console.error("Errore microfono:", event.error);
          setIsListening(false);
        };

        recognition.onresult = async (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript.trim()) {
            // Sintassi v7: invio diretto tramite sendMessage con l'oggetto text
            setIsLoading(true);
            await sendMessage({ text: transcript });
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, [sendMessage]);

  // Gestione click sul pulsante del microfono
  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Il tuo browser o dispositivo non supporta il riconoscimento vocale.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  // Recupero delle coordinate
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
    if (!isLoading) {
      setDots('');
      return;
    }
    const interval = setInterval(() => {
      setDots((prev) => (prev === '...' ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, [isLoading]);

  const lastMessage = messages.at(-1);
  const lastMessageContent = lastMessage?.parts?.map(p => p.type === 'text' ? p.text : '').join('') || '';

  // Gestione dello scroll automatico della pagina
  useEffect(() => {
    if (!isLoading && messages.length > 0 && lastMessageContent === '') {
      scrollToBottom();
      return;
    }

    if (!isLoading) return; 

    scrollToBottom();
  }, [lastMessageContent, dots, isLoading]);

  // Logica di controllo del pensiero dell'IA
  const hasStartedTyping = lastMessage?.role === 'assistant' && 
    lastMessage.parts.some(part => part.type === 'text' && part.text.trim().length > 0);

  const isAiThinking = isLoading && !hasStartedTyping && typeof lastMessage !== "undefined";

  return (
     
    <div className="flex flex-col h-screen w-full bg-zinc-50 dark:bg-zinc-950 font-sans">
      
      {/* Header principale della pagina */}
      <header className="w-full flex items-center justify-between p-4 bg-blue-600 text-white shadow-md flex-shrink-0 z-10">
        <div className="max-w-4xl w-full mx-auto flex items-center gap-3">
          <div className="relative">
            <img src={botAvatar} alt="AI Bot" className="w-10 h-10 rounded-full bg-white/20 p-1" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border border-blue-600 rounded-full"></span>
          </div>
          <div>
            <h1 className="text-base font-bold leading-none mb-1">Assistente Virtuale</h1>
            <p className="text-xs text-blue-100">Online • Pronto ad aiutarti</p>
          </div>
        </div>
      </header>
      
      {/* Area principale dei messaggi centralizzata */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 w-full scroll-smooth"
      >
        <div className="max-w-4xl mx-auto space-y-6 py-4">
          {messages.length === 0 && (
            <div className="text-center text-zinc-400 dark:text-zinc-500 text-sm py-24 px-4 max-w-md mx-auto">
              <p className="font-semibold text-zinc-600 dark:text-zinc-400 text-lg mb-2">Benvenuto nella chat!</p>
              <p>Puoi chiedermi notizie, temperature, situazione terremoti e la scaletta dei canti per la messa domenicale.</p>
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
                className={`flex gap-3 max-w-[85%] md:max-w-[75%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <img 
                  src={isUser ? userAvatar : botAvatar} 
                  alt="avatar" 
                  className="w-8 h-8 rounded-full border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 p-0.5 flex-shrink-0" 
                />
                
                <div 
                  className={`p-4 rounded-2xl text-base shadow-sm leading-relaxed ${
                    isUser 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 border border-zinc-100 dark:border-zinc-800 rounded-tl-none'
                  }`}
                >
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return message.role === 'assistant' ? (
                          <div key={`${message.id}-${i}`} className="prose dark:prose-invert max-w-none text-base">
                            <Streamdown>{part.text}</Streamdown>
                          </div>
                        ) : (
                          <div className="font-medium inline text-base" key={`${message.id}-${i}`}>{part.text}</div>
                        );
                      case 'tool-cercaParcheggi': {
                        const toolOutput = (part as { output?: { center?: unknown; locations?: unknown } }).output;
                        const center = toolOutput?.center;
                        const locations = toolOutput?.locations;
                        
                        if (!center || !locations) return null;

                        return (
                          <div key={`${message.id}-${i}`} className="w-full mt-3">
                            <p className="text-xs text-gray-500 mb-2">Mappa dei parcheggi trovati:</p>
                            <ParkingMap center={center as never} locations={locations as never} />
                          </div>
                        );
                      }
                      default:
                        return null;
                    }
                  })}
                </div>
              </div>
            );
          })}

          {/* Indicatore di caricamento/pensiero */}
          {isAiThinking && (
            <div className="flex gap-3 max-w-[85%] mr-auto items-center">
              <img src={botAvatar} alt="avatar" className="w-8 h-8 rounded-full border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 p-0.5" />
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl rounded-tl-none border border-zinc-100 dark:border-zinc-800 text-sm text-zinc-500">
                L'assistente sta pensando{dots}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input bar fissa in basso alla pagina */}
      <footer className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-4 flex-shrink-0">
        <div className="max-w-4xl w-full mx-auto">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (!input.trim()) return;  
              setIsLoading(true);
              sendMessage({ text: input });
              setInput('');
            }}
            className="flex gap-2"
          >
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Scrivi un messaggio o usa il microfono" 
              className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-base text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
             {/* Pulsante Microfono Vocale */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            disabled={isLoading}
            className={`p-2 rounded-xl transition-all duration-200 ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse scale-105' 
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50'
            }`}
            title={isListening ? "Ascoltando... Clicca per fermare" : "Attiva microfono"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isListening ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19a1 1 0 01-1-1v-1a5 5 0 01-5-5a1 1 0 012 0a3 3 0 006 0a1 1 0 012 0a5 5 0 01-5 5v1a1 1 0 01-1 1zm3-8a3 3 0 10-6 0v1a3 3 0 006 0v-1z" />
              )}
            </svg>
          </button>
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Invia
            </button>
          </form>
        </div>
      </footer>

    </div>
  );
}
