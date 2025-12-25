"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CreateMLCEngine, MLCEngine, InitProgressCallback } from "@mlc-ai/web-llm";
import { v4 as uuidv4 } from "uuid";

// --- Constants ---
export const MODELS = {
  LITE: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
  PRO: "Llama-3-8B-Instruct-q4f16_1-MLC",
};

// --- Types ---
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  isPinned?: boolean;
}

// --- Hook ---
export function useWebLLM() {
  // Engine State
  const engine = useRef<MLCEngine | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [currentModel, setCurrentModel] = useState<string>(MODELS.LITE);
  const [status, setStatus] = useState<string>("Idle");
  const [progress, setProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Chat Data State
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const activeChat = chats.find((chat) => chat.id === activeChatId);
  const messages = activeChat?.messages || [];

  // --- 1. Model Management ---
  const loadModel = useCallback(async (modelId: string) => {
    setIsModelLoaded(false);
    setStatus(`Initializing ${modelId === MODELS.PRO ? "Pro" : "Lite"} Model...`);
    setProgress(0);
    setCurrentModel(modelId);

    const onProgress: InitProgressCallback = (report) => {
      const match = report.text.match(/(\d+)%/);
      if (match) setProgress(parseInt(match[1]));
      setStatus(report.text);
    };

    try {
      if (engine.current) {
        await engine.current.reload(modelId);
      } else {
        engine.current = await CreateMLCEngine(modelId, { initProgressCallback: onProgress });
      }
      setIsModelLoaded(true);
      setStatus("Ready");
      setProgress(100);
    } catch (err) {
      console.error(err);
      setStatus("Error: Failed to load model.");
      setIsModelLoaded(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!engine.current) {
      loadModel(MODELS.LITE);
    }
  }, [loadModel]);

  // --- 2. Chat Session Management ---

  const createNewChat = useCallback(() => {
    // FIX 1: Prevent duplicate empty chats
    // If the currently active chat is already empty, just stay there.
    if (activeChatId) {
      const currentChat = chats.find(c => c.id === activeChatId);
      if (currentChat && currentChat.messages.length === 0) {
        return currentChat.id;
      }
    }

    const newChat: ChatSession = {
      id: uuidv4(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
    };
    setChats((prevChats) => [newChat, ...prevChats]);
    setActiveChatId(newChat.id);
    return newChat.id;
  }, [chats, activeChatId]);

  const deleteChat = useCallback((chatId: string) => {
    setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
    if (activeChatId === chatId) {
      const remainingChats = chats.filter((chat) => chat.id !== chatId);
      setActiveChatId(remainingChats.length > 0 ? remainingChats[0].id : null);
    }
  }, [chats, activeChatId]);

  const togglePinChat = useCallback((chatId: string) => {
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId ? { ...chat, isPinned: !chat.isPinned } : chat
      )
    );
  }, []);

  // --- 3. Messaging Logic ---

  const generateChatTitle = useCallback(async (firstMessage: string) => {
    if (!engine.current) return firstMessage.slice(0, 30);
    try {
      // Ask AI to summarize the title
      const reply = await engine.current.chat.completions.create({
        messages: [
          { role: "system", content: "Summarize this into a 3-5 word title. No quotes." },
          { role: "user", content: firstMessage },
        ],
        max_tokens: 15,
      });
      return reply.choices[0].message.content || firstMessage.slice(0, 30);
    } catch (error) {
      return firstMessage.slice(0, 30);
    }
  }, []);

  const onSend = useCallback(async (text: string) => {
    if (!engine.current || !isModelLoaded || !text.trim()) return;

    let currentChatId = activeChatId;
    let isFirstMessage = false;

    if (!currentChatId) {
      currentChatId = createNewChat();
      isFirstMessage = true;
    }

    // Check if this is the first message in the chat
    const currentChat = chats.find(c => c.id === currentChatId);
    if (currentChat && currentChat.messages.length === 0) {
      isFirstMessage = true;
      
      // FIX 3: INSTANT RENAME based on user input (Truncated)
      // This gives immediate feedback before the AI generates a smarter title
      const instantTitle = text.slice(0, 40) + (text.length > 40 ? "..." : "");
      setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, title: instantTitle } : c));
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };

    // Update UI with User Message
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === currentChatId
          ? { ...chat, messages: [...chat.messages, userMessage] }
          : chat
      )
    );
    setIsLoading(true);

    try {
      const chatContext = chats.find((c) => c.id === currentChatId)?.messages || [];
      const messagesForAPI = [...chatContext, userMessage].map(({ role, content }) => ({
        role,
        content,
      }));

      const reply = await engine.current.chat.completions.create({
        messages: messagesForAPI,
      });

      const botMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: reply.choices[0].message.content || "",
        createdAt: Date.now(),
      };

      // Update UI with Bot Message
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: [...chat.messages, botMessage] }
            : chat
        )
      );

      // Post-Processing: Generate a smarter AI title if it was the first message
      if (isFirstMessage) {
        const smartTitle = await generateChatTitle(text);
        setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, title: smartTitle } : c));
      }

    } catch (error) {
      console.error("Inference Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [engine, isModelLoaded, activeChatId, chats, createNewChat, generateChatTitle]);

  // Load chats from localStorage
  useEffect(() => {
    const savedChats = localStorage.getItem("browser-brain-chats");
    if (savedChats) {
      try {
        const parsedChats: ChatSession[] = JSON.parse(savedChats);
        setChats(parsedChats);
        if (parsedChats.length > 0) {
          // If we have chats, select the most recent one
          setActiveChatId(parsedChats[0].id);
        } else {
          // If array is empty, create new
          createNewChat();
        }
      } catch (e) {
        console.error("Failed to parse chats", e);
        createNewChat();
      }
    } else {
      createNewChat();
    }
  }, []); // Run only once on mount

  // FIX 2: SAVE FILTER
  // Save chats to localStorage, BUT IGNORE EMPTY CHATS
  useEffect(() => {
    // Only save chats that actually have messages
    const validChats = chats.filter(chat => chat.messages.length > 0);
    
    // We only write to local storage if we have valid chats or if we intentionally cleared everything
    if (chats.length > 0 || validChats.length === 0) {
      localStorage.setItem("browser-brain-chats", JSON.stringify(validChats));
    }
  }, [chats]);

  return {
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
  };
}