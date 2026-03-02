/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { Save, Loader2, Copy, Check, Terminal, Info, Keyboard } from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

const SYSTEM_INSTRUCTION = `
Purpose and Goals:
* Convert user-provided pseudo-LaTeX mathematical notation into properly formatted, valid LaTeX code blocks.
* Ensure that all mathematical expressions are syntactically correct according to standard LaTeX conventions.
* Interpret the specific directive that a newline is represented by the '\\' notation syntax within the user's input.

Behaviors and Rules:
1) Conversion Logic:
- Identify pseudo-LaTeX patterns (e.g., shorthand, missing braces, or informal symbols) and translate them into formal LaTeX.
- Always output the result within a Markdown code block labeled 'latex'.
- When the input contains '\\', interpret this as a line break command in the generated LaTeX code.
- Do not add explanatory text outside the code block unless the input is ambiguous and requires clarification.

2) Formatting:
- Use standard LaTeX packages (like amsmath) as the mental framework for generating valid syntax.
- Ensure subscripts, superscripts, fractions, and matrices are correctly nested.

3) Interaction Style:
- Maintain a functional and utility-focused persona.
- Provide the code block immediately following the user's input.

Overall Tone:
- Professional, precise, and technical.
- Efficient and direct, minimizing conversational filler.
`;

export default function App() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const convertToLatex = useCallback(async () => {
    if (!input.trim() || isConverting) return;

    setIsConverting(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: input,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        },
      });

      const text = response.text || '';
      setOutput(text);
    } catch (err) {
      console.error('Conversion error:', err);
      setError('Failed to convert. Please check your connection and try again.');
    } finally {
      setIsConverting(false);
    }
  }, [input, isConverting]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        convertToLatex();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [convertToLatex]);

  const copyToClipboard = () => {
    // Extract LaTeX from markdown code block if possible
    const latexMatch = output.match(/```latex\n([\s\S]*?)\n```/);
    const textToCopy = latexMatch ? latexMatch[1] : output;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#e0e0e0] font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#121212]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Terminal className="w-5 h-5 text-black" />
          </div>
          <h1 className="text-sm font-semibold tracking-tight uppercase opacity-80">LaTeX Playground</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 text-[10px] font-mono text-white/50">
            <Keyboard className="w-3 h-3" />
            <span>CMD + S TO CONVERT</span>
          </div>
          
          <button
            onClick={convertToLatex}
            disabled={isConverting || !input.trim()}
            className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/10 disabled:text-white/30 text-black text-xs font-bold rounded-md transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
          >
            {isConverting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            SAVE & CONVERT
          </button>
        </div>
      </header>

      <main className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Left Pane: Input */}
        <section className="flex-1 flex flex-col border-right border-white/10">
          <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Pseudo LaTeX Input</span>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500/50" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
              <div className="w-2 h-2 rounded-full bg-green-500/50" />
            </div>
          </div>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your pseudo LaTeX here... (e.g., x^2 + y^2 = r^2 \\ sum i=1 to n i)"
            className="flex-1 w-full p-6 bg-transparent resize-none focus:outline-none font-mono text-sm leading-relaxed placeholder:text-white/10"
            spellCheck={false}
          />
        </section>

        {/* Right Pane: Output */}
        <section className="flex-1 flex flex-col bg-[#0a0a0a]">
          <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Formal Notion LaTeX</span>
            {output && (
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider hover:text-emerald-400 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    COPIED
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    COPY CODE
                  </>
                )}
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-auto p-6 relative">
            <AnimatePresence mode="wait">
              {!output && !isConverting && !error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 opacity-20"
                >
                  <Info className="w-12 h-12 mb-4" />
                  <p className="text-sm font-medium">Your converted LaTeX will appear here.</p>
                  <p className="text-xs mt-2">Press CMD+S to trigger the conversion.</p>
                </motion.div>
              )}

              {isConverting && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a]/50 backdrop-blur-sm z-20"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 border-2 border-emerald-500/20 rounded-full" />
                      <div className="absolute inset-0 w-12 h-12 border-t-2 border-emerald-500 rounded-full animate-spin" />
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase animate-pulse">Thinking...</span>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-start gap-3"
                >
                  <Info className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}

              {output && (
                <motion.div
                  key={output}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="prose prose-invert max-w-none"
                >
                  <div className="markdown-body">
                    <Markdown>{output}</Markdown>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* Footer / Status Bar */}
      <footer className="h-8 border-t border-white/10 bg-[#121212] flex items-center px-4 justify-between text-[9px] font-mono opacity-40">
        <div className="flex items-center gap-4">
          <span>MODEL: GEMINI-3-FLASH-PREVIEW</span>
          <span>THINKING: LOW</span>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>LATEX v2.0</span>
        </div>
      </footer>
    </div>
  );
}
