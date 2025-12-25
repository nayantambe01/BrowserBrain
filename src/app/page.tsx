"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import { useWebLLM, MODELS, ChatSession } from "@/hooks/useWebLLM";
import { MessageBubble } from "@/components/MessageBubble";
import { Menu, Transition, Dialog } from "@headlessui/react";
import {
  Bars3Icon,
  PlusIcon,
  ChatBubbleLeftIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

// --- Sidebar Component ---
function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onCreateChat,
  onDeleteChat,
  onTogglePinChat,
  isOpen,
  setIsOpen,
}: {
  chats: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onCreateChat: () => void;
  onDeleteChat: (id: string) => void;
  onTogglePinChat: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const pinnedChats = chats.filter((chat) => chat.isPinned);
  const recentChats = chats.filter((chat) => !chat.isPinned);

  const ChatList = ({ title, chatList }: { title: string; chatList: ChatSession[] }) => (
    <div className="mb-4">
      <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {title}
      </h3>
      <ul className="space-y-1">
        {chatList.map((chat) => (
          <li key={chat.id} className="group relative">
            <button
              onClick={() => onSelectChat(chat.id)}
              className={clsx(
                "w-full text-left flex items-center gap-x-3 p-3 text-sm leading-6 font-semibold rounded-md hover:bg-gray-800 transition-colors",
                chat.id === activeChatId ? "bg-gray-800 text-white" : "text-gray-400"
              )}
            >
              <ChatBubbleLeftIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="truncate">{chat.title}</span>
            </button>

            {/* Chat Options Dropdown */}
            <Menu as="div" className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Menu.Button className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-gray-700/50">
                <EllipsisVerticalIcon className="h-5 w-5" />
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-36 origin-top-right rounded-md bg-gray-900 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={(e) => { e.stopPropagation(); onTogglePinChat(chat.id); }}
                          className={clsx(
                            active ? "bg-gray-800 text-white" : "text-gray-300",
                            "group flex w-full items-center px-4 py-2 text-sm"
                          )}
                        >
                          <MapPinIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-white" aria-hidden="true" />
                          {chat.isPinned ? "Unpin" : "Pin"}
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Are you sure you want to delete this chat?")) {
                              onDeleteChat(chat.id);
                            }
                          }}
                          className={clsx(
                            active ? "bg-gray-800 text-red-400" : "text-red-500",
                            "group flex w-full items-center px-4 py-2 text-sm"
                          )}
                        >
                          <TrashIcon className="mr-3 h-5 w-5 text-red-500" aria-hidden="true" />
                          Delete
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar (Using Dialog) */}
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setIsOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-950 px-6 pb-4 ring-1 ring-white/10">
                  <div className="flex h-16 shrink-0 items-center">
                    <h1 className="text-xl font-bold text-white">BrowserBrain</h1>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <button
                          onClick={() => { onCreateChat(); setIsOpen(false); }}
                          className="w-full flex items-center gap-x-3 rounded-md p-3 text-sm font-semibold leading-6 text-white bg-blue-600 hover:bg-blue-500 transition-colors"
                        >
                          <PlusIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                          New Chat
                        </button>
                      </li>
                      <li>
                        {pinnedChats.length > 0 && <ChatList title="Pinned" chatList={pinnedChats} />}
                        {recentChats.length > 0 && <ChatList title="Recent" chatList={recentChats} />}
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-950 px-6 pb-4 ring-1 ring-white/10">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-bold text-white">BrowserBrain</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <button
                  onClick={onCreateChat}
                  className="w-full flex items-center gap-x-3 rounded-md p-3 text-sm font-semibold leading-6 text-white bg-blue-600 hover:bg-blue-500 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  New Chat
                </button>
              </li>
              <li>
                {pinnedChats.length > 0 && <ChatList title="Pinned" chatList={pinnedChats} />}
                {recentChats.length > 0 && <ChatList title="Recent" chatList={recentChats} />}
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}

// --- Main Page Component ---
export default function Home() {
  const {
    isModelLoaded,
    currentModel,
    status,
    progress,
    isLoading,
    loadModel,
    chats,
    activeChatId,
    messages,
    onSend,
    createNewChat,
    setActiveChatId,
    deleteChat,
    togglePinChat,
  } = useWebLLM();

  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isModelLoaded) return;
    onSend(input);
    setInput("");
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    if (newModel !== currentModel) {
      if (confirm("Switching models requires re-loading engine weights. Continue?")) {
        loadModel(newModel);
      }
    }
  };

  // --- LOADING SCREEN ---
  if (!isModelLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 font-mono">
        <h1 className="text-4xl font-bold mb-8 text-blue-500 tracking-tighter">BrowserBrain</h1>
        
        {/* Progress Bar Container */}
        <div className="w-full max-w-md bg-gray-900 rounded-full h-4 mb-4 border border-gray-800 overflow-hidden">
          <div 
            className="bg-blue-600 h-4 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(37,99,235,0.5)]"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Status Text */}
        <p className="text-blue-400 text-sm animate-pulse">{status}</p>
        <p className="text-gray-600 text-xs mt-4">
          {currentModel === MODELS.PRO 
            ? "⚠ Downloading 4GB High-Fidelity Model..." 
            : "⚡ Downloading 1GB Optimized Model..."}
        </p>
      </div>
    );
  }

  // --- MAIN CHAT INTERFACE ---
  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onCreateChat={createNewChat}
        onDeleteChat={deleteChat}
        onTogglePinChat={togglePinChat}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div className="flex flex-1 flex-col lg:pl-72">
        {/* HEADER */}
        <header className="flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 sticky top-0 z-10">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-400 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-bold text-white lg:hidden">BrowserBrain</h1>
              <div className="relative group">
                <select 
                  value={currentModel} 
                  onChange={handleModelChange}
                  className="appearance-none bg-gray-800 border border-gray-700 hover:border-blue-500 text-sm rounded-lg pl-3 pr-8 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer transition-all text-white"
                >
                  <option value={MODELS.LITE}>⚡ Lite (1B)</option>
                  <option value={MODELS.PRO}>🧠 Pro (8B)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
            <div className="text-xs font-mono text-green-400 flex items-center gap-2 border border-green-900/50 bg-green-900/10 px-3 py-1 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
              <span className="hidden sm:inline">WebGPU ACTIVE</span>
            </div>
          </div>
        </header>

        {/* CHAT AREA */}
        <main className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth bg-gray-900">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 space-y-4 opacity-50">
              <div className="text-6xl grayscale">🔮</div>
              <p className="text-lg font-medium">Start a new conversation.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                role={msg.role} 
                content={msg.content} 
              />
            ))
          )}
          
          {isLoading && (
             <div className="flex justify-start">
               <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm text-gray-400 text-sm flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                 <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-75"></span>
                 <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-150"></span>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* INPUT AREA */}
        <div className="p-4 bg-gray-900 border-t border-gray-800">
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-gray-950 border border-gray-700 text-white px-5 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all placeholder:text-gray-600"
              disabled={isLoading}
              autoFocus
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-500 disabled:bg-transparent disabled:text-gray-600 text-white px-6 rounded-lg font-medium transition-all"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}