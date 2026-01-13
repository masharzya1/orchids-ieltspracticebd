"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Eye, 
  EyeOff, 
  Flag, 
  Volume2, 
  ArrowRight,
  HelpCircle,
  LogOut,
  Save,
  Plus,
  Trash2,
  Image as ImageIcon,
  Table as TableIcon,
  Type,
  List,
  Layout as LayoutIcon,
  Settings,
  AudioLines,
  FileText,
  Play,
  Pause,
  Wifi,
  Bell,
  Menu,
  MousePointer2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CDIAdminEditorProps {
  testTitle: string;
  section: any;
  parts: any[];
  questions: any[];
  onSave: (data: { parts: any[], questions: any[] }) => void;
  onExit: () => void;
}

export default function CDIAdminEditor({
  testTitle,
  section,
  parts: initialParts,
  questions: initialQuestions,
  onSave,
  onExit
}: CDIAdminEditorProps) {
    const [parts, setParts] = useState(initialParts);
    const [questions, setQuestions] = useState(initialQuestions);
    const [currentPartIndex, setCurrentPartIndex] = useState(0);

    // Sync state with props when switching modules or after save
    useEffect(() => {
      setParts(initialParts.length > 0 ? initialParts : []);
      setQuestions(initialQuestions);
      setCurrentPartIndex(0);
    }, [initialParts, initialQuestions]);

    // Ensure we have at least one part if none exist
    useEffect(() => {
      if (parts.length === 0 && section?.id) {
        const newPartId = `temp-part-${Date.now()}`;
        setParts([{
          id: newPartId,
          temp_id: newPartId,
          section_id: section.id,
          part_number: 1,
          title: "New Part",
          instructions: "",
          passage_text: "",
          order_index: 1
        }]);
      }
    }, [parts.length, section?.id]);

    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
    const [bulkMode, setBulkMode] = useState(false);
    const [bulkText, setBulkText] = useState("");
    const [leftPanelWidth, setLeftPanelWidth] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
  
    const containerRef = useRef<HTMLDivElement>(null);
    const sectionType = section?.section_type || "reading";
    
    // Dynamic Theme Color - IDP Standard
    const getTheme = () => {
      switch(sectionType) {
        case 'listening':
          return {
            primary: "#0072bc",
            bg: "bg-[#0072bc]",
            text: "text-[#0072bc]",
            border: "border-[#0072bc]",
            hoverBg: "hover:bg-[#005a96]",
            lightBg: "bg-blue-50",
            lightBorder: "border-blue-100"
          };
        case 'reading':
          return {
            primary: "#0072bc", // Reading is also blue in IDP
            bg: "bg-[#0072bc]",
            text: "text-[#0072bc]",
            border: "border-[#0072bc]",
            hoverBg: "hover:bg-[#005a96]",
            lightBg: "bg-blue-50",
            lightBorder: "border-blue-100"
          };
        case 'writing':
          return {
            primary: "#DC2626", // Writing can be red or blue, user seems to prefer distinct themes
            bg: "bg-[#DC2626]",
            text: "text-[#DC2626]",
            border: "border-[#DC2626]",
            hoverBg: "hover:bg-[#B91C1C]",
            lightBg: "bg-red-50",
            lightBorder: "border-red-100"
          };
        default:
          return {
            primary: "#7c3aed",
            bg: "bg-purple-600",
            text: "text-purple-600",
            border: "border-purple-600",
            hoverBg: "hover:bg-purple-700",
            lightBg: "bg-purple-50",
            lightBorder: "border-purple-100"
          };
      }
    };

    const theme = getTheme();
    const themeBg = theme.bg;
    const themeText = theme.text;
    const themeBorder = theme.border;

    const currentPart = parts[currentPartIndex];
    const partQuestions = questions.filter(q => q.part_id === currentPart?.id || (q.temp_part_id && q.temp_part_id === currentPart?.id));

    const addPart = () => {
      const newPartId = `temp-part-${Date.now()}`;
      const newPart = {
        id: newPartId,
        temp_id: newPartId,
        section_id: section.id,
        part_number: parts.length + 1,
        title: `Part ${parts.length + 1}`,
        instructions: "",
        passage_text: "",
        order_index: parts.length + 1
      };
      setParts([...parts, newPart]);
      setCurrentPartIndex(parts.length);
      toast.success("New part added");
    };

    const deletePart = (index: number) => {
      if (parts.length <= 1) {
        toast.error("At least one part is required");
        return;
      }
      const partToDelete = parts[index];
      const newParts = parts.filter((_, i) => i !== index);
      const indexedParts = newParts.map((p, i) => ({ ...p, part_number: i + 1, order_index: i + 1 }));
      setParts(indexedParts);
      setQuestions(prev => prev.filter(q => q.part_id !== partToDelete.id && q.temp_part_id !== partToDelete.id));
      if (currentPartIndex >= indexedParts.length) {
        setCurrentPartIndex(indexedParts.length - 1);
      }
      toast.info("Part removed");
    };
  
    const updatePart = (id: string, field: string, value: any) => {
      setParts(prev => prev.map(p => (p.id === id || p.temp_id === id) ? { ...p, [field]: value } : p));
    };
  
    const updateQuestion = (id: string, field: string, value: any) => {
      setQuestions(prev => prev.map(q => (q.id === id || q.temp_id === id) ? { ...q, [field]: value } : q));
    };
  
    const addQuestion = () => {
      if (!currentPart) {
        toast.error("Please add a part first");
        return;
      }
      const newId = `temp-q-${Date.now()}`;
      const newQ = {
        id: newId,
        temp_id: newId,
        part_id: currentPart.id,
        temp_part_id: currentPart.id,
        section_id: section.id,
        question_type: "short_answer",
        question_text: "New Question",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correct_answer: "",
        points: 1,
        order_index: questions.length + 1
      };
      setQuestions([...questions, newQ]);
      toast.success("Question added");
    };


  const deleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id && q.temp_id !== id));
    toast.info("Question removed");
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSave({ parts, questions });
      toast.success("Changes saved successfully");
    } catch (err) {
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
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
      setLeftPanelWidth(Math.max(20, Math.min(80, newWidth)));
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

  const applyPreset = (qId: string, type: string) => {
    let updates: any = { question_type: type };
    if (type === "true_false_ng") updates.options = ["True", "False", "Not Given"];
    else if (type === "multiple_choice") updates.options = ["Option A", "Option B", "Option C", "Option D"];
    else if (type === "gap_fill") updates.options = null;

    setQuestions(prev => prev.map(q => (q.id === qId || q.temp_id === qId) ? { ...q, ...updates } : q));
    toast.info(`Applied ${type} preset`);
  };

  const isSplitLayout = sectionType === "reading" || sectionType === "writing";

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col font-sans select-none text-[#333] text-sm" ref={containerRef}>
      {/* IDP STYLE HEADER */}
      <header className="bg-white border-b border-gray-200 px-4 py-1.5 sticky top-0 z-50 shadow-sm shrink-0">
        <div className="w-full flex items-center justify-between h-10">
          <div className="flex items-center space-x-6 flex-1 justify-start min-w-0">
            <h1 className={cn("font-bold text-2xl tracking-wide whitespace-nowrap", themeText)}>IELTS</h1>
            <div className="h-5 w-px bg-gray-200" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none">Visual Editor</span>
              <span className="text-xs font-bold truncate max-w-[200px]">{testTitle}</span>
            </div>
          </div>

          <div className="flex-1 flex justify-center px-2">
            <div className="bg-gray-100 p-0.5 rounded-lg flex items-center shadow-inner">
              <button 
                onClick={() => setActiveTab("edit")}
                className={cn(
                  "px-6 py-1.5 rounded-md text-[10px] font-black transition-all flex items-center gap-2",
                  activeTab === "edit" ? cn(themeBg, "text-white shadow-md") : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Settings size={14} /> EDIT
              </button>
              <button 
                onClick={() => setActiveTab("preview")}
                className={cn(
                  "px-6 py-1.5 rounded-md text-[10px] font-black transition-all flex items-center gap-2",
                  activeTab === "preview" ? cn(themeBg, "text-white shadow-md") : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Eye size={14} /> PREVIEW
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3 flex-1 justify-end min-w-0">
            <Button 
              onClick={handleSaveAll} 
              disabled={isSaving}
              size="sm"
              className={cn("text-white gap-2 font-black px-6 rounded-lg h-9 shadow-md transition-all active:scale-95", themeBg, sectionType === 'reading' || sectionType === 'listening' ? "hover:bg-[#005a96]" : "hover:bg-[#B91C1C]")}
            >
              {isSaving ? "SAVING..." : <><Save size={16} /> SAVE CHANGES</>}
            </Button>
            <button 
              onClick={onExit}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
              title="Exit Editor"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ADMIN TOOLBAR - Improved for Visual Editing */}
      {activeTab === "edit" && (
        <div className="h-12 bg-[#f8f9fa] border-b border-gray-200 flex items-center px-4 shrink-0 gap-6 overflow-x-auto no-scrollbar shadow-inner">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">Module Sections:</span>
            <div className="flex items-center gap-1.5">
              {parts.map((p, idx) => (
                <div key={p.id || p.temp_id} className="flex items-center group/p relative">
                  <button
                    onClick={() => setCurrentPartIndex(idx)}
                    className={cn(
                      "h-8 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border flex items-center gap-2",
                      currentPartIndex === idx 
                        ? cn("bg-white text-[#222] shadow-sm", themeBorder) 
                        : "bg-gray-100 border-transparent text-gray-500 hover:bg-white hover:border-gray-300"
                    )}
                  >
                    PART {p.part_number}
                  </button>
                  <button 
                    onClick={() => deletePart(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white opacity-0 group-hover/p:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 shadow-lg z-10"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
              <button 
                onClick={addPart}
                className={cn("w-8 h-8 rounded-xl text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg", themeBg)}
                title="Add New Part"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-200 shrink-0" />

          <div className="flex items-center gap-3 shrink-0">
            <Button variant="outline" size="sm" onClick={addQuestion} className={cn("h-8 text-[10px] bg-white border-gray-200 gap-2 font-black transition-colors py-0 px-4 rounded-xl", "hover:" + themeBorder, "hover:" + themeText)}>
              <Plus size={14} /> ADD QUESTION
            </Button>
            <Button variant="outline" size="sm" onClick={() => setBulkMode(true)} className={cn("h-8 text-[10px] bg-white border-gray-200 gap-2 font-black transition-colors py-0 px-4 rounded-xl", "hover:" + themeBorder, "hover:" + themeText)}>
              <List size={14} /> BULK IMPORT
            </Button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex relative overflow-hidden bg-[#f0f2f5]">
        {isSplitLayout ? (
          <>
            {/* Left Panel - Passage Editor (Reading Style) */}
            <div 
              className="overflow-auto border-r border-gray-200 bg-white h-full shadow-lg z-10" 
              style={{ width: `${leftPanelWidth}%` }}
            >
              <div className="p-6 max-w-4xl mx-auto space-y-6">
                <div className={cn("p-4 rounded-2xl border flex flex-col gap-2", sectionType === 'reading' ? "bg-[#0072bc]/5 border-[#0072bc]/10" : "bg-[#DC2626]/5 border-[#DC2626]/10")}>
                  <div className="flex items-center justify-between">
                    <Label className={cn("text-[10px] font-black uppercase tracking-widest", themeText)}>Part {currentPart?.part_number} Heading</Label>
                    <div className="text-[10px] font-black text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">Reading Passage</div>
                  </div>
                  <input 
                    type="text" 
                    value={currentPart?.title || ""} 
                    onChange={(e) => updatePart(currentPart.id || currentPart.temp_id, "title", e.target.value)}
                    className="text-2xl font-black w-full border-b-2 border-transparent focus:border-current outline-none bg-transparent transition-all placeholder:text-gray-300 py-1"
                    placeholder="Enter Passage Title..."
                  />
                  <p className="text-[10px] font-bold text-gray-400 mt-1 italic">You should spend about 20 minutes on Questions 1-13, which are based on Reading Passage {currentPart?.part_number} below.</p>
                </div>
  
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                      <FileText size={12} /> Passage Content
                    </Label>
                    <div className="flex gap-1">
                      <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 transition-colors"><Type size={14}/></button>
                      <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 transition-colors"><TableIcon size={14}/></button>
                      <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 transition-colors"><ImageIcon size={14}/></button>
                    </div>
                  </div>
                  <Textarea 
                    value={currentPart?.passage_text || ""} 
                    onChange={(e) => updatePart(currentPart.id || currentPart.temp_id, "passage_text", e.target.value)}
                    className="w-full min-h-[600px] border-2 border-gray-50 rounded-2xl focus:border-[#0072bc] p-6 font-serif text-lg leading-[1.8] shadow-inner transition-all resize-none bg-gray-50/30"
                    placeholder="Type or paste your passage content here..."
                  />
                </div>
              </div>
            </div>
  
            {/* Resize Handle */}
            <div 
              onMouseDown={handleMouseDown}
              className="w-1.5 bg-gray-200 hover:bg-[#0072bc] cursor-col-resize transition-all flex-shrink-0 relative group z-20"
            >
              <div className="absolute inset-y-0 -left-2 -right-2 bg-transparent" />
            </div>
  
            {/* Right Panel - Questions Editor */}
            <div className="overflow-auto flex-1 bg-[#f8f9fa] h-full">
              <div className="p-6 max-w-3xl mx-auto space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                  <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Question Instructions</Label>
                  <Textarea 
                    value={currentPart?.instructions || ""} 
                    onChange={(e) => updatePart(currentPart.id || currentPart.temp_id, "instructions", e.target.value)}
                    className="w-full h-16 border-none focus:ring-0 p-0 resize-none italic text-sm text-gray-600 font-bold bg-transparent"
                    placeholder="Enter instructions for this part (e.g. Write NO MORE THAN TWO WORDS...)"
                  />
                </div>
  
                <div className="space-y-4">
                  {partQuestions.sort((a, b) => a.order_index - b.order_index).map((q, idx) => (
                    <div key={q.id || q.temp_id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all space-y-4 relative group/q">
                      <div className="absolute -right-2 -top-2 opacity-0 group-hover/q:opacity-100 transition-opacity">
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="h-7 w-7 rounded-full shadow-xl"
                          onClick={() => deleteQuestion(q.id || q.temp_id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
  
                      <div className="flex items-start gap-4">
                        <div className={cn("w-7 h-7 rounded-xl text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-md", themeBg)}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap gap-1.5">
                            {["multiple_choice", "gap_fill", "true_false_ng", "short_answer"].map((type) => (
                              <button
                                key={type}
                                onClick={() => applyPreset(q.id || q.temp_id, type)}
                                className={cn(
                                  "text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border transition-all shadow-sm",
                                  q.question_type === type 
                                    ? cn(themeBg, themeBorder, "text-white") 
                                    : "bg-white text-gray-400 border-gray-100 hover:border-[#0072bc]/30"
                                )}
                              >
                                {type.replace("_", " ")}
                              </button>
                            ))}
                          </div>
  
                          <Textarea 
                            value={q.question_text}
                            onChange={(e) => updateQuestion(q.id || q.temp_id, "question_text", e.target.value)}
                            className="w-full border-none focus:ring-0 p-0 resize-none font-bold text-gray-800 text-sm min-h-[40px] bg-transparent leading-relaxed"
                            placeholder="Type question content..."
                          />
  
                          {q.question_type === "multiple_choice" && (
                            <div className="space-y-2 pl-4 border-l-2 border-gray-100">
                              {q.options?.map((opt: string, oIdx: number) => (
                                <div key={oIdx} className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border shadow-sm",
                                    q.correct_answer === opt ? "bg-green-500 text-white border-green-500" : "bg-white text-gray-300 border-gray-100"
                                  )}>
                                    {String.fromCharCode(65 + oIdx)}
                                  </div>
                                  <Input 
                                    value={opt}
                                    onChange={(e) => {
                                      const newOpts = [...q.options];
                                      newOpts[oIdx] = e.target.value;
                                      updateQuestion(q.id || q.temp_id, "options", newOpts);
                                    }}
                                    className="h-8 text-xs border-gray-100 rounded-xl focus:border-[#0072bc] bg-gray-50/50 font-medium"
                                  />
                                  <button 
                                    onClick={() => updateQuestion(q.id || q.temp_id, "correct_answer", opt)}
                                    className={cn(
                                      "text-[9px] font-black transition-all px-3 py-1 rounded-lg",
                                      q.correct_answer === opt ? "bg-green-50 text-green-600" : "text-gray-300 hover:text-green-500"
                                    )}
                                  >
                                    SET AS CORRECT
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
  
                          {(q.question_type === "short_answer" || q.question_type === "gap_fill" || q.question_type === "true_false_ng") && (
                            <div className="space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
                              <Label className={cn("text-[9px] font-black uppercase tracking-widest flex items-center gap-2", themeText)}>
                                <CheckCircle2 size={12}/> Answer Key
                              </Label>
                              <Input 
                                value={q.correct_answer}
                                onChange={(e) => updateQuestion(q.id || q.temp_id, "correct_answer", e.target.value)}
                                placeholder="Enter correct answer..."
                                className="h-9 text-sm border-gray-200 rounded-xl focus:border-[#0072bc] bg-white font-black"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
  
                <Button 
                  onClick={addQuestion} 
                  className={cn("w-full h-14 border-2 border-dashed bg-white transition-all rounded-2xl font-black flex items-center justify-center gap-3 shadow-sm text-sm group", themeText, themeBorder, sectionType === 'reading' ? "hover:bg-blue-50" : "hover:bg-red-50")}
                >
                  <Plus size={20} /> 
                  ADD NEW QUESTION TO PART {currentPart?.part_number}
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Listening Layout - Improved to match IDP Screenshot */
          <div className="flex-1 overflow-auto bg-[#f8f9fa]">
            <div className="max-w-4xl mx-auto p-8 space-y-6">
              <div className={cn("p-6 rounded-[2rem] text-white shadow-xl flex items-center justify-between relative overflow-hidden h-32", themeBg)}>
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Volume2 size={120} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black tracking-widest uppercase">IELTS Listening</span>
                    <span className="px-3 py-1 bg-black/20 rounded-full text-[10px] font-black tracking-widest uppercase">Section {currentPartIndex + 1}</span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tighter uppercase">Listening Editor</h2>
                </div>
                <div className="h-16 w-16 bg-white/20 rounded-[1.5rem] flex items-center justify-center relative z-10 backdrop-blur-md border border-white/20 shadow-lg">
                  <AudioLines className="h-8 w-8 text-white" />
                </div>
              </div>
  
              <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-lg space-y-6">
                <div className="space-y-3">
                  <Label className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-2", themeText)}>
                    <Wifi size={14} /> AUDIO SOURCE (URL)
                  </Label>
                  <div className="flex gap-4">
                    <Input 
                      value={currentPart?.audio_url || ""} 
                      onChange={(e) => updatePart(currentPart.id || currentPart.temp_id, "audio_url", e.target.value)}
                      placeholder="https://example.com/audio.mp3"
                      className="h-12 text-sm border-gray-100 rounded-2xl focus:border-[#0072bc] bg-gray-50/50 font-bold flex-1 px-4"
                    />
                    <Button className={cn("h-12 px-6 rounded-2xl shadow-lg", themeBg)} size="default">
                      <Play className="h-5 w-5 mr-2" /> TEST AUDIO
                    </Button>
                  </div>
                </div>
  
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">SECTION INSTRUCTIONS</Label>
                  <Textarea 
                    value={currentPart?.instructions || ""} 
                    onChange={(e) => updatePart(currentPart.id || currentPart.temp_id, "instructions", e.target.value)}
                    className="w-full h-24 border-gray-100 rounded-2xl focus:border-[#0072bc] p-4 italic text-sm font-bold bg-gray-50/30 shadow-inner"
                    placeholder="Enter instructions..."
                  />
                </div>
              </div>
  
              <div className="space-y-6">
                 {partQuestions.sort((a, b) => a.order_index - b.order_index).map((q, idx) => (
                   <div key={q.id || q.temp_id} className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-lg hover:shadow-xl transition-all space-y-6 relative group/q overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover/q:opacity-100 transition-opacity">
                        <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full shadow-xl" onClick={() => deleteQuestion(q.id || q.temp_id)}><Trash2 size={16} /></Button>
                      </div>
  
                      <div className="flex items-center gap-6">
                        <div className={cn("w-10 h-10 rounded-2xl text-white flex items-center justify-center font-black text-lg shadow-lg shrink-0", themeBg)}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 space-y-3">
                           <div className="flex flex-wrap gap-1.5">
                            {["multiple_choice", "gap_fill", "true_false_ng", "short_answer"].map((type) => (
                              <button
                                key={type}
                                onClick={() => applyPreset(q.id || q.temp_id, type)}
                                className={cn(
                                  "text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider border transition-all shadow-sm",
                                  q.question_type === type 
                                    ? cn(themeBg, "text-white") 
                                    : "bg-white text-gray-400 border-gray-100 hover:border-[#0072bc]/30"
                                )}
                              >
                                {type.replace("_", " ")}
                              </button>
                            ))}
                          </div>
                          <Textarea 
                            value={q.question_text}
                            onChange={(e) => updateQuestion(q.id || q.temp_id, "question_text", e.target.value)}
                            className="w-full border-none focus:ring-0 p-0 resize-none font-black text-gray-800 text-lg min-h-[40px] bg-transparent leading-tight"
                            placeholder="Type question text..."
                          />
                        </div>
                      </div>
  
                      <div className="pl-16 space-y-6">
                        {q.question_type === "multiple_choice" && (
                          <div className="grid sm:grid-cols-2 gap-4">
                            {q.options?.map((opt: string, oIdx: number) => (
                              <div key={oIdx} className="flex items-center gap-4 bg-gray-50/50 p-3 rounded-2xl border-2 border-gray-50 hover:border-[#0072bc]/30 transition-all shadow-sm group/opt">
                                <div className={cn(
                                  "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black border-2",
                                  q.correct_answer === opt ? "bg-green-500 text-white border-green-500 shadow-md" : "bg-white text-gray-300 border-gray-100"
                                )}>
                                  {String.fromCharCode(65 + oIdx)}
                                </div>
                                <Input 
                                  value={opt}
                                  onChange={(e) => {
                                    const newOpts = [...q.options];
                                    newOpts[oIdx] = e.target.value;
                                    updateQuestion(q.id || q.temp_id, "options", newOpts);
                                  }}
                                  className="h-10 text-sm border-none bg-transparent font-bold focus-visible:ring-0 px-0"
                                />
                                <button onClick={() => updateQuestion(q.id || q.temp_id, "correct_answer", opt)} className={cn("p-2 rounded-xl transition-all shadow-md active:scale-90", q.correct_answer === opt ? "bg-green-500 text-white" : "bg-white text-gray-300 hover:text-green-500")}>
                                  <MousePointer2 size={16}/>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
  
                        {(q.question_type === "short_answer" || q.question_type === "gap_fill" || q.question_type === "true_false_ng") && (
                          <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-inner">
                            <Label className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-2", themeText)}>
                              <CheckCircle2 size={14} /> CORRECT ANSWER
                            </Label>
                            <Input 
                              value={q.correct_answer}
                              onChange={(e) => updateQuestion(q.id || q.temp_id, "correct_answer", e.target.value)}
                              className="h-12 border-gray-200 rounded-xl bg-white font-black text-base px-4 shadow-sm focus:border-[#0072bc]"
                              placeholder="Type answer..."
                            />
                          </div>
                        )}
                      </div>
                   </div>
                 ))}
              </div>
  
              <Button 
                onClick={addQuestion} 
                className={cn("w-full h-20 border-4 border-dashed bg-white transition-all rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 shadow-xl group", themeText, themeBorder, sectionType === 'listening' ? "hover:bg-blue-50" : "hover:bg-red-50")}
              >
                <Plus size={32} /> 
                ADD NEW QUESTION
              </Button>
            </div>
          </div>
        )}
      </main>
  
      {/* IDP STYLE FOOTER */}
      <footer className="bg-[#f8f9fa] border-t border-gray-200 sticky bottom-0 shrink-0 h-16 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-[100]">
        <div className="flex justify-between items-center px-6 h-full gap-8">
          {/* Part Switcher Tabs */}
          <div className="flex items-center h-full">
            {parts.map((p, idx) => (
              <button 
                key={p.id || p.temp_id}
                onClick={() => setCurrentPartIndex(idx)}
                className={cn(
                  "h-full px-8 text-xs font-black uppercase tracking-widest border-t-4 transition-all flex items-center gap-2",
                  currentPartIndex === idx 
                    ? cn(themeBorder, themeText, "bg-white") 
                    : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                )}
              >
                Part {p.part_number}
              </button>
            ))}
          </div>

          {/* Question Grid */}
          <div className="flex-1 flex justify-center items-center gap-1.5 overflow-x-auto px-4 no-scrollbar">
            {questions.map((q, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "min-w-[28px] h-7 rounded-md text-[10px] font-black flex items-center justify-center border-b-2 transition-all cursor-pointer hover:-translate-y-0.5 shadow-sm", 
                  q.correct_answer 
                    ? "bg-[#222] border-black text-white" 
                    : "bg-white border-gray-200 text-gray-400"
                )}
                title={`Question ${idx + 1}: ${q.correct_answer ? 'Configured' : 'Empty'}`}
              >
                {idx + 1}
              </div>
            ))}
          </div>

            {/* Submit/Finish Button */}
            <div className="flex items-center gap-3">
              {currentPartIndex < parts.length - 1 ? (
                <button 
                  onClick={() => setCurrentPartIndex(prev => prev + 1)}
                  className={cn("text-white px-8 py-2 font-black h-11 text-[11px] rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg uppercase tracking-widest flex items-center gap-2", themeBg)}
                >
                  Next Part
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button 
                  onClick={handleSaveAll}
                  className="bg-[#222] text-white px-8 py-2 font-black h-11 text-[11px] rounded-xl transition-all hover:bg-black hover:scale-105 active:scale-95 shadow-lg uppercase tracking-widest flex items-center gap-2"
                >
                  Finish & Save Section
                  <CheckCircle2 size={16} />
                </button>
              )}
            </div>
        </div>
      </footer>

  
      {/* BULK ADD MODAL */}
      {bulkMode && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col scale-in-center">
            <div className={cn("p-8 text-white flex justify-between items-center", themeBg)}>
              <div>
                <h3 className="text-2xl font-black tracking-tight">Bulk Import Questions</h3>
                <p className="text-xs opacity-80 mt-1 font-bold">Paste multiple questions (one per line). We'll handle the rest.</p>
              </div>
              <Button variant="ghost" onClick={() => setBulkMode(false)} className="text-white hover:bg-white/10 h-12 w-12 rounded-full"><LogOut size={24} /></Button>
            </div>
            <div className="p-8 space-y-6">
              <div className="relative">
                <Textarea 
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="min-h-[300px] font-bold text-lg leading-relaxed border-gray-100 rounded-2xl bg-gray-50 p-6 focus:ring-[#0072bc] shadow-inner resize-none"
                  placeholder="Where was Clarence Birdseye born?&#10;What year did he move to Montana?&#10;Why did he leave college?"
                />
                <div className="absolute bottom-4 right-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">Questions detected: {bulkText.split('\n').filter(l => l.trim()).length}</div>
              </div>
              <div className="flex gap-4">
                <Button 
                  onClick={() => {
                    const lines = bulkText.split('\n').filter(l => l.trim());
                    const newQs = lines.map((line, idx) => ({
                      temp_id: `bulk-${Date.now()}-${idx}`,
                      part_id: currentPart?.id,
                      temp_part_id: currentPart?.temp_id,
                      section_id: section.id,
                      question_type: "short_answer",
                      question_text: line.trim(),
                      options: ["Option A", "Option B", "Option C", "Option D"],
                      correct_answer: "",
                      points: 1,
                      order_index: questions.length + idx + 1
                    }));
                    setQuestions([...questions, ...newQs]);
                    setBulkText("");
                    setBulkMode(false);
                    toast.success(`${newQs.length} questions imported successfully`);
                  }} 
                  className={cn("flex-1 h-14 font-black text-lg rounded-2xl shadow-xl transition-all active:scale-95", themeBg)}
                >
                  IMPORT {bulkText.split('\n').filter(l => l.trim()).length} QUESTIONS
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { CheckCircle2 } from "lucide-react";
