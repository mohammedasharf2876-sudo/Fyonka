
import React, { useState, useRef, useEffect } from 'react';
import { Message, Category, Sender } from './types';
import { chatWithFyonka } from './services/geminiService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "أهلاً بيكي يا قمر في فيونكة! 🎀 أنا خبيرة الجمال والإكسسوارات بتاعتك.. قوليلي حابة تسألي عن إيه النهاردة؟",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>(Category.General);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedImage) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
      image: selectedImage || undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    const currentImg = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    const botReply = await chatWithFyonka(inputValue, selectedCategory, currentImg || undefined);
    
    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      text: botReply,
      sender: 'bot',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex justify-center min-h-screen items-center p-0 md:p-4 bg-pink-50">
      <div className="w-full max-w-[450px] bg-white h-screen md:h-[90vh] shadow-2xl md:rounded-3xl flex flex-col overflow-hidden border-4 border-white">
        
        {/* Header */}
        <header className="bg-gradient-to-r from-[#ff5c8d] to-[#ff85a2] p-5 text-white shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-inner border-2 border-pink-200">
              🎀
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">فيونكة - Fyonka</h1>
              <p className="text-xs opacity-90 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                خبيرتك الخاصة متصلة الآن
              </p>
            </div>
          </div>
          <button className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-all">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
          </button>
        </header>

        {/* Category Selector */}
        <div className="bg-pink-50 px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar shadow-inner">
          {[
            { id: Category.General, label: 'الكل', icon: '✨' },
            { id: Category.Accessories, label: 'إكسسوارات', icon: '💍' },
            { id: Category.Makeup, label: 'مكياج', icon: '💄' },
            { id: Category.Skincare, label: 'بشرة', icon: '🧴' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1 border ${
                selectedCategory === cat.id 
                  ? 'bg-[#ff5c8d] text-white border-[#ff5c8d] shadow-md' 
                  : 'bg-white text-gray-600 border-pink-100 hover:bg-pink-100'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scroll bg-[url('https://www.transparenttextures.com/patterns/pink-dust.png')] bg-repeat">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              {msg.image && (
                <div className="mb-1 rounded-xl overflow-hidden shadow-md max-w-[200px] border-2 border-white">
                  <img src={msg.image} alt="Uploaded" className="w-full h-auto object-cover" />
                </div>
              )}
              <div 
                className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                  msg.sender === 'user' 
                    ? 'bg-[#ff5c8d] text-white rounded-br-none' 
                    : 'bg-white text-gray-700 rounded-bl-none border border-pink-100'
                }`}
              >
                {msg.text}
                <div className={`text-[10px] mt-1 opacity-60 ${msg.sender === 'user' ? 'text-left' : 'text-right'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex flex-col items-start">
              <div className="bg-white border border-pink-100 p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1">
                <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Selected Image Preview */}
        {selectedImage && (
          <div className="px-4 py-2 bg-pink-100 flex items-center gap-2 animate-in slide-in-from-bottom-4">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-white shadow-sm">
              <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-full"
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <p className="text-xs text-pink-600 font-bold">فيونكة هتحللك الصورة دي ✨</p>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-pink-100 flex items-center gap-3">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-full text-pink-400 hover:bg-pink-50 transition-colors border border-pink-100"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </button>
          
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="اسألي فيونكة عن جمالك..."
            className="flex-1 bg-pink-50/50 border border-pink-100 rounded-full px-5 py-2.5 outline-none text-sm focus:border-[#ff5c8d] transition-all text-gray-700"
          />

          <button
            onClick={handleSendMessage}
            disabled={(!inputValue.trim() && !selectedImage) || isLoading}
            className="w-11 h-11 rounded-full bg-[#ff5c8d] text-white flex items-center justify-center shadow-lg hover:bg-[#ff4070] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            <svg style={{transform: 'rotate(180deg)'}} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
