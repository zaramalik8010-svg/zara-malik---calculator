/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Calculator, 
  Sparkles, 
  History as HistoryIcon, 
  Trash2, 
  ChevronRight, 
  Loader2,
  BrainCircuit,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface HistoryItem {
  id: string;
  query: string;
  result: string;
  type: 'manual' | 'ai';
  timestamp: number;
}

export default function App() {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll history
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleNumber = (num: string) => {
    setDisplay(prev => (prev === '0' ? num : prev + num));
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = () => {
    try {
      const fullEquation = equation + display;
      // Basic safe evaluation for simple arithmetic
      // In a real app, use a math library, but for this demo we'll use a simple parser
      const result = eval(fullEquation.replace(/×/g, '*').replace(/÷/g, '/'));
      const resultStr = String(result);
      
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        query: fullEquation,
        result: resultStr,
        type: 'manual',
        timestamp: Date.now()
      };
      
      setHistory(prev => [...prev, newItem]);
      setDisplay(resultStr);
      setEquation('');
    } catch (error) {
      setDisplay('Error');
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
    setAiResponse(null);
  };

  const handleAiSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiQuery.trim()) return;

    setIsAiLoading(true);
    setAiResponse(null);

    try {
      const prompt = `You are a helpful AI calculator. Solve the following math problem or query: "${aiQuery}". 
      Provide a clear, concise answer. If it's a multi-step problem, briefly explain the steps. 
      Format the final result clearly.`;

      const result = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const responseText = result.text || "Sorry, I couldn't solve that.";
      setAiResponse(responseText);

      const newItem: HistoryItem = {
        id: Date.now().toString(),
        query: aiQuery,
        result: responseText,
        type: 'ai',
        timestamp: Date.now()
      };
      setHistory(prev => [...prev, newItem]);
      setAiQuery('');
    } catch (error) {
      console.error("AI Error:", error);
      setAiResponse("Error connecting to AI. Please check your API key.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Traditional Calculator */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="glass rounded-3xl p-6 shadow-2xl flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <h1 className="font-semibold tracking-tight">Standard</h1>
              </div>
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <HistoryIcon className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {/* Display */}
            <div className="bg-black/20 rounded-2xl p-6 mb-6 text-right min-h-[120px] flex flex-col justify-end">
              <div className="text-zinc-500 text-sm font-mono h-6 overflow-hidden">
                {equation}
              </div>
              <div className="text-4xl font-mono font-medium tracking-tighter truncate">
                {display}
              </div>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-4 gap-3 flex-grow">
              <button onClick={clear} className="calc-btn calc-btn-action col-span-2">AC</button>
              <button onClick={() => handleOperator('%')} className="calc-btn calc-btn-action">%</button>
              <button onClick={() => handleOperator('/')} className="calc-btn calc-btn-op">÷</button>
              
              {[7, 8, 9].map(n => (
                <button key={n} onClick={() => handleNumber(String(n))} className="calc-btn calc-btn-num">{n}</button>
              ))}
              <button onClick={() => handleOperator('*')} className="calc-btn calc-btn-op">×</button>
              
              {[4, 5, 6].map(n => (
                <button key={n} onClick={() => handleNumber(String(n))} className="calc-btn calc-btn-num">{n}</button>
              ))}
              <button onClick={() => handleOperator('-')} className="calc-btn calc-btn-op">−</button>
              
              {[1, 2, 3].map(n => (
                <button key={n} onClick={() => handleNumber(String(n))} className="calc-btn calc-btn-num">{n}</button>
              ))}
              <button onClick={() => handleOperator('+')} className="calc-btn calc-btn-op">+</button>
              
              <button onClick={() => handleNumber('0')} className="calc-btn calc-btn-num col-span-2">0</button>
              <button onClick={() => handleNumber('.')} className="calc-btn calc-btn-num">.</button>
              <button onClick={calculate} className="calc-btn bg-emerald-500 hover:bg-emerald-400 text-white">=</button>
            </div>
          </div>
        </div>

        {/* Right Column: AI & History */}
        <div className="lg:col-span-7 flex flex-col gap-6 h-full">
          
          {/* AI Input Section */}
          <div className="glass rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h2 className="font-semibold">AI Problem Solver</h2>
            </div>
            <form onSubmit={handleAiSubmit} className="relative">
              <input 
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Ask anything... e.g. 'What is 15% of 250?'"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-14 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600"
              />
              <button 
                type="submit"
                disabled={isAiLoading}
                className="absolute right-2 top-2 bottom-2 w-10 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 rounded-xl flex items-center justify-center transition-colors"
              >
                {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </form>
            
            <AnimatePresence mode="wait">
              {aiResponse && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-sm leading-relaxed text-emerald-100"
                >
                  <div className="flex items-start gap-3">
                    <BrainCircuit className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <p>{aiResponse}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* History Section */}
          <div className="glass rounded-3xl p-6 shadow-xl flex-grow flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HistoryIcon className="w-5 h-5 text-zinc-400" />
                <h2 className="font-semibold">Recent Calculations</h2>
              </div>
              {history.length > 0 && (
                <button 
                  onClick={() => setHistory([])}
                  className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            <div 
              ref={scrollRef}
              className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar"
            >
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2 opacity-50">
                  <MessageSquare className="w-8 h-8" />
                  <p className="text-sm">No history yet</p>
                </div>
              ) : (
                history.map((item) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={item.id}
                    className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
                        {item.type === 'ai' ? 'AI Solver' : 'Manual'}
                      </span>
                      <span className="text-[10px] text-zinc-600">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-sm text-zinc-400 mb-1">{item.query}</div>
                    <div className="text-lg font-mono text-emerald-400 flex items-center gap-2">
                      <span className="text-zinc-600 text-xs">=</span>
                      {item.result}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
