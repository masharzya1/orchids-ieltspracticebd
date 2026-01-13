"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Volume2,
  Wifi,
  Bell,
  Menu,
  HighlighterIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IDPExamInterfaceProps {
  testTitle: string;
  sectionType: string;
  parts: any[];
  questions: any[];
  timeLeft: number;
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, answer: any) => void;
  onFinish: () => void;
  onExit: () => void;
}

export default function IDPExamInterface({
  testTitle,
  sectionType,
  parts,
  questions,
  timeLeft,
  answers,
  onAnswerChange,
  onFinish,
  onExit
}: IDPExamInterfaceProps) {
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const currentPart = parts[currentPartIndex];
  const partQuestions = questions.filter(q => q.part_id === currentPart?.id);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPanelWidth(Math.max(25, Math.min(75, newWidth)));
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const isAnswered = (questionId: string) => {
    const ans = answers[questionId];
    return ans !== undefined && ans !== "" && ans !== null;
  };

  const scrollToQuestion = (id: string) => {
    const el = document.getElementById(`q-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const isSplitLayout = sectionType === "reading" || sectionType === "writing";

  const getQuestionRange = (partIndex: number) => {
    let start = 1;
    for (let i = 0; i < partIndex; i++) {
      const pQuestions = questions.filter(q => q.part_id === parts[i]?.id);
      start += pQuestions.length;
    }
    const end = start + partQuestions.length - 1;
    return { start, end };
  };

  const { start: qStart, end: qEnd } = getQuestionRange(currentPartIndex);

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col font-['Arial',sans-serif] select-none" ref={containerRef}>
      {/* TOP HEADER BAR - Official IDP Style */}
      <header className="bg-[#1a1a1a] text-white h-10 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-lg font-black tracking-tight">IELTS</span>
          <span className="text-xs text-gray-400">Test taker ID</span>
          <span className="text-xs text-white/80">@ieltspracticebd</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="font-bold tabular-nums">{formatTime(timeLeft)}</span>
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </div>
          
          <div className="flex items-center gap-3 text-gray-400">
            <Wifi className="w-4 h-4" />
            <Bell className="w-4 h-4" />
            <Menu className="w-4 h-4" />
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex overflow-hidden">
        {isSplitLayout ? (
          <>
            {/* LEFT PANEL - Reading Passage */}
            <div 
              className="h-full overflow-y-auto bg-white border-r border-gray-200"
              style={{ width: `${leftPanelWidth}%` }}
            >
              {/* Part Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-3 z-10">
                <div className="text-xs text-gray-500 mb-1">Part {currentPart?.part_number || currentPartIndex + 1}</div>
                <p className="text-xs text-gray-600">
                  You should spend about 20 minutes on Questions {qStart}-{qEnd} which are based on Reading Passage {currentPartIndex + 1}.
                </p>
              </div>

              {/* Passage Title & Content */}
              <div className="px-6 py-4">
                <h2 className="text-base font-bold text-black mb-6 uppercase tracking-tight leading-tight">
                  {currentPart?.title || "READING PASSAGE"}
                </h2>

                {/* Highlight instruction */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-6 float-right">
                  <HighlighterIcon className="w-3 h-3" />
                  <span>Select text to highlight</span>
                </div>

                <div className="clear-both" />

                {/* Passage Text */}
                <div className="text-[14px] leading-[1.8] text-gray-800 text-justify space-y-4">
                  {currentPart?.passage_text?.split('\n').map((para: string, i: number) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>

                {/* Writing Area */}
                {sectionType === "writing" && (
                  <div className="mt-8 border-t pt-6">
                    <textarea 
                      className="w-full h-[400px] p-4 border border-gray-300 rounded text-[14px] leading-relaxed resize-none focus:outline-none focus:border-blue-500"
                      placeholder="Write your answer here..."
                      value={answers[`writing-${currentPart?.id}`] || ""}
                      onChange={(e) => onAnswerChange(`writing-${currentPart?.id}`, e.target.value)}
                    />
                    <div className="mt-2 text-xs text-gray-500">
                      Word count: {(answers[`writing-${currentPart?.id}`] || "").trim().split(/\s+/).filter(Boolean).length}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RESIZE HANDLE */}
            <div 
              onMouseDown={handleMouseDown}
              className="w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors shrink-0"
            />

            {/* RIGHT PANEL - Questions */}
            <div className="flex-1 h-full overflow-y-auto bg-[#f5f5f5]">
              {/* Questions Header */}
              <div className="sticky top-0 bg-[#f5f5f5] border-b border-gray-200 px-6 py-3 z-10">
                <h3 className="text-sm font-bold text-black">Questions {qStart}–{qEnd}</h3>
                <p className="text-xs text-gray-600 mt-1">
                  {currentPart?.instructions || "Complete the flow-chart below. Choose NO MORE THAN TWO WORDS from the passage for each answer."}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Write your answers in boxes {qStart}-{qEnd} on your answer sheet.
                </p>
              </div>

              {/* Questions List */}
              <div className="px-6 py-4">
                {/* If there's a special diagram/flowchart title */}
                {currentPart?.diagram_title && (
                  <div className="bg-white border border-gray-300 rounded p-4 mb-6">
                    <h4 className="text-center font-bold text-sm mb-4">{currentPart.diagram_title}</h4>
                  </div>
                )}

                {/* Questions */}
                <div className="space-y-4">
                  {partQuestions.map((q, idx) => (
                    <div key={q.id} id={`q-${q.id}`} className="flex items-start gap-3">
                      <div className="flex items-center gap-2 shrink-0 pt-0.5">
                        <span className="text-orange-500 text-lg">●</span>
                        <span className="text-sm text-gray-700">{q.question_text?.replace(/\[\[\d+\]\]/g, '').trim() || `Question ${q.order_index}`}</span>
                      </div>
                      
                      {q.question_type === "multiple_choice" ? (
                        <div className="flex-1 space-y-1">
                          {q.options?.map((opt: string, i: number) => (
                            <label 
                              key={i} 
                              className={cn(
                                "flex items-center gap-2 p-2 rounded cursor-pointer text-sm",
                                answers[q.id] === opt ? "bg-blue-50" : "hover:bg-gray-50"
                              )}
                            >
                              <input 
                                type="radio" 
                                name={`q-${q.id}`} 
                                value={opt}
                                checked={answers[q.id] === opt}
                                onChange={() => onAnswerChange(q.id, opt)}
                                className="accent-blue-600"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <input 
                          type="text"
                          className="flex-1 max-w-[200px] h-8 px-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
                          placeholder=""
                          value={answers[q.id] || ""}
                          onChange={(e) => onAnswerChange(q.id, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* LISTENING LAYOUT - Single Column */
          <div className="flex-1 h-full overflow-y-auto bg-[#f5f5f5]">
            {/* Section Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-4">
              <h2 className="text-lg font-bold text-black">Section {currentPartIndex + 1}</h2>
              <p className="text-sm text-gray-600 mt-1">Listen and answer questions {qStart}-{qEnd}.</p>
              
              {/* Audio Player */}
              {currentPart?.audio_url && (
                <div className="mt-4">
                  <audio controls className="w-full max-w-md h-10">
                    <source src={currentPart.audio_url} type="audio/mpeg" />
                  </audio>
                </div>
              )}
            </div>

            {/* Questions */}
            <div className="px-8 py-6 max-w-3xl">
              <div className="bg-white border border-gray-300 rounded p-6">
                <h3 className="font-bold text-sm mb-4">{currentPart?.title || `Questions ${qStart}-${qEnd}`}</h3>
                <p className="text-xs text-gray-600 mb-6">
                  {currentPart?.instructions || "Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer."}
                </p>

                <div className="space-y-4">
                  {partQuestions.map((q) => (
                    <div key={q.id} id={`q-${q.id}`} className="flex items-start gap-4">
                      <span className="text-sm font-bold text-gray-700 shrink-0 w-6">{q.order_index}</span>
                      
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 mb-2">{q.question_text}</p>
                        
                        {q.question_type === "multiple_choice" ? (
                          <div className="space-y-1 pl-2">
                            {q.options?.map((opt: string, i: number) => (
                              <label 
                                key={i} 
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded cursor-pointer text-sm",
                                  answers[q.id] === opt ? "bg-blue-50" : "hover:bg-gray-50"
                                )}
                              >
                                <input 
                                  type="radio" 
                                  name={`q-${q.id}`} 
                                  value={opt}
                                  checked={answers[q.id] === opt}
                                  onChange={() => onAnswerChange(q.id, opt)}
                                  className="accent-blue-600"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <input 
                            type="text"
                            className="w-full max-w-[250px] h-8 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
                            value={answers[q.id] || ""}
                            onChange={(e) => onAnswerChange(q.id, e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM NAVIGATION BAR - Official IDP Style */}
      <footer className="bg-white border-t border-gray-200 h-12 flex items-center justify-between px-4 shrink-0">
        {/* Left: Review indicators */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-orange-400" />
        </div>

        {/* Center: Part tabs and question numbers */}
        <div className="flex items-center gap-1">
          {parts.map((p, i) => {
            const pQuestions = questions.filter(q => q.part_id === p.id);
            const partStart = questions.filter(q => {
              const pIdx = parts.findIndex(pt => pt.id === q.part_id);
              return pIdx < i;
            }).length + 1;
            const partEnd = partStart + pQuestions.length - 1;
            
            return (
              <button
                key={p.id}
                onClick={() => setCurrentPartIndex(i)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded transition-colors",
                  currentPartIndex === i 
                    ? "bg-[#1a1a1a] text-white" 
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                Part {p.part_number || i + 1}
              </button>
            );
          })}

          <div className="flex items-center gap-0.5 ml-4 border-l border-gray-200 pl-4">
            {questions.map((q) => {
              const isCurrentPart = q.part_id === currentPart?.id;
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    const pIdx = parts.findIndex(p => p.id === q.part_id);
                    if (pIdx !== -1) setCurrentPartIndex(pIdx);
                    setTimeout(() => scrollToQuestion(q.id), 100);
                  }}
                  className={cn(
                    "w-6 h-6 flex items-center justify-center text-[10px] font-medium border transition-all",
                    isAnswered(q.id) 
                      ? "bg-gray-800 text-white border-gray-800" 
                      : isCurrentPart
                        ? "bg-white text-gray-800 border-gray-300"
                        : "bg-gray-50 text-gray-400 border-gray-200"
                  )}
                >
                  {q.order_index}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Submit button */}
        <button 
          onClick={onFinish}
          className="bg-[#dc2626] hover:bg-[#b91c1c] text-white px-4 py-1.5 rounded text-xs font-bold transition-colors uppercase tracking-tight"
        >
          Finish Section
        </button>
      </footer>
    </div>
  );
}
