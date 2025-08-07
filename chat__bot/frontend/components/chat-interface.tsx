/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import jsPDF, { RGBAData } from "jspdf";

const API_URL = "http://localhost:5000/api";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  isChapterSummary?: boolean;
  chapterGraph?: string;
  chapterScore?: number;
  subchapterScores?: Record<string, number>;
}

interface Question {
  chapter: string;
  subchapter: string;
  question: string;
  question_number: number;
  total_questions: number;
}

interface ResponseData {
  question: string;
  reponse: string;
  evaluation: string;
  score: number | null;
  recommendation?: string;
  chapter: string;
  subchapter: string;
  question_index: number;
  next_question?: string;
  next_chapter?: string;
  next_subchapter?: string;
  next_question_index?: number;
  chapter_complete?: boolean;
  assessment_complete?: boolean;
  is_applicable?: boolean;
  conversation_id?: string;
}

interface Response {
  question: string;
  reponse: string;
  evaluation: string;
  score: number | null;
  recommendation?: string;
  chapter: string;
  subchapter: string;
  question_index: number;
  question_key: string;
}

interface ResponsesData {
  responses: Response[];
  total_responses: number;
}

interface DetailedSummary {
  [x: string]: any;
  question: string;
  reponse: string;
  evaluation: string;
  score: number | null;
  recommendation?: string;
  chapter: string;
  subchapter: string;
  is_applicable?: boolean;
}

interface SummaryData {
  score_final: number;
  graphique_principal: string;
  graphiques_sous_chapitres: Record<string, string>;
  scores_chapitres: Record<string, number>;
  scores_sous_chapitres: Record<string, number>;
  resume_detaille: DetailedSummary[];
  recommendations: string;
  total_questions: number;
  total_applicable_questions: number;
  chapters_completed: number;
}

interface FormValues {
  companyName: string;
  auditorName: string;
  auditeeName: string;
  auditStartDate: string;
  auditEndDate: string;
  site: string;
  auditObjective: string;
  scopeOfAudit: string;
}

interface ConversationData {
  _id: string;
  norme: string;
  description: string;
  responses: Response[];
  status: string;
  created_at: string;
  last_updated: string;
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isoNorm, setIsoNorm] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [finalSummary, setFinalSummary] = useState<SummaryData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [formValues, setFormValues] = useState<FormValues>({
    companyName: '',
    auditorName: '',
    auditeeName: '',
    auditStartDate: '',
    auditEndDate: '',
    site: '',
    auditObjective: '',
    scopeOfAudit: ''
  });
  const [interimReport, setInterimReport] = useState<SummaryData | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [editingResponse, setEditingResponse] = useState<Response | null>(null);
  const [showResponsesModal, setShowResponsesModal] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const conversationId = searchParams.get('conversationId');
    
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, []);

  useEffect(() => {
    // Check for conversation ID in localStorage
    const conversationId = localStorage.getItem('currentConversationId');
    
    if (conversationId) {
      loadConversation(conversationId);
      // Clear the stored ID after loading
      localStorage.removeItem('currentConversationId');
    } else {
      setMessages([
        {
          id: uuidv4(),
          content: "👋 Hello! I am your assistant for ISO compliance assessment.\n\nEnter the ISO standard to evaluate (e.g., ISO27001:2022(Information security, cybersecurity and privacy protection), ISO9001:2015(Quality management systems),ISO13485:2016(Medical devices),ISO42001:2022(Management systems for sustainability),ISO14791:2022):",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  const loadConversation = async (conversationId: string) => {
    try {
      setIsLoading(true);
      console.log('Attempting to load conversation:', conversationId);
      const response = await axios.get(`${API_URL}/conversations/${conversationId}`);
      
      if (!response.data.success || !response.data.conversation) {
        throw new Error('Invalid conversation data');
      }
      
      console.log('API response:', response.data);
      const conversation = response.data;
      
      const norme = conversation.norme || 'Unknown';
      setIsoNorm(conversation.norme);
      
      const initialMessages: Message[] = [
        {
          id: uuidv4(),
          content: `🔹 Resuming ${(conversation.norme || 'Unknown').toUpperCase()} compliance assessment...`,
          sender: "bot",
          timestamp: new Date(),
        },
        {
          id: uuidv4(),
          content: conversation.description,
          sender: "bot",
          timestamp: new Date(),
        }
      ];
      
      const responseMessages = conversation.responses.map((response: any) => {
        const evaluationMessage = `${getEvaluationMessage(response.evaluation, response.score)}`;
        let content = `📂 <strong>${response.chapter}</strong>\n📝 <em>${response.subchapter}</em>\n\n🔹 Question: ${response.question}\n\n`;
        content += `Your response: ${response.reponse}\n\n`;
        content += evaluationMessage;
        
        const rec = response.recommendation || response.recommandation;
        if (rec) {
          content += `\n💡 <strong>Recommendation:</strong> ${rec}`;
        }
        
        return [
          {
            id: uuidv4(),
            content: response.question,
            sender: "user" as const,
            timestamp: new Date(response.timestamp),
          },
          {
            id: uuidv4(),
            content: content,
            sender: "bot" as const,
            timestamp: new Date(response.timestamp),
          }
        ];
      }).flat();
      
      setMessages([...initialMessages, ...responseMessages]);
      
      if (conversation.status === 'completed') {
        const summaryResponse = await axios.post(`${API_URL}/resume`, {
          norme: conversation.norme,
        });
        setFinalSummary(summaryResponse.data);
      }
      
    } catch (error) {
      console.error('Error loading conversation:', error);
      setMessages(prev => [
        ...prev,
        {
          id: uuidv4(),
          content: "❌ Error loading conversation. Please try again.",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getEvaluationMessage = (evaluation: string, score: number | null) => {
    const evaluationMap: Record<string, { emoji: string; color: string }> = {
      "compliant": { emoji: "✅", color: "text-emerald-600" },
      "acceptable": { emoji: "🟡", color: "text-amber-600" },
      "needs improvement": { emoji: "🟠", color: "text-orange-600" },
      "non-compliant": { emoji: "🔴", color: "text-red-600" },
      "not applicable": { emoji: "🟣 ", color: "text-violet-600" }
    };

    const { emoji, color } = evaluationMap[evaluation] || { emoji: "❓", color: "text-slate-600" };

    if (evaluation === "not applicable" || score === null) {
      return `${emoji} <span class="${color} font-semibold">NOT APPLICABLE</span>`;
    }

    return `${emoji} <span class="${color} font-semibold">${evaluation.toUpperCase()}</span> (Score: ${score}%)`;
  };

  const fetchAllResponses = async () => {
    try {
      const response = await axios.get<ResponsesData>(`${API_URL}/get_responses/${isoNorm}`);
      setResponses(response.data.responses);
      setShowResponsesModal(true);
    } catch (error) {
      console.error("Error fetching responses:", error);
      setMessages(prev => [
        ...prev,
        {
          id: uuidv4(),
          content: "❌ Error fetching previous responses",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleEditResponse = (response: Response) => {
    setEditingResponse(response);
    setInputValue(response.reponse);
    setShowResponsesModal(false);
  };

  const handleUpdateResponse = async () => {
    if (!editingResponse || !inputValue.trim()) return;

    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/modifier_reponse`, {
        norme: isoNorm,
        question_key: editingResponse.question_key,
        new_response: inputValue,
      });

      setMessages(prev => [
        ...prev,
        {
          id: uuidv4(),
          content: `✅ Response updated successfully\n${getEvaluationMessage(response.data.updated_response.evaluation, response.data.updated_response.score)}`,
          sender: "bot",
          timestamp: new Date(),
        },
      ]);

      setResponses(prev =>
        prev.map(r =>
          r.question_key === editingResponse.question_key
            ? response.data.updated_response
            : r
        )
      );

      setEditingResponse(null);
      setInputValue("");
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: uuidv4(),
          content: "❌ Error updating response",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // NEW FUNCTION: Generate current report at any time, regardless of completion status
  const generateCurrentReport = async () => {
    if (!isoNorm) {
      alert("Please start an assessment first by entering an ISO standard");
      return;
    }

    try {
      setIsLoading(true);
      // Fetch current summary data regardless of completion status
      const response = await axios.post<SummaryData>(`${API_URL}/resume`, {
        norme: isoNorm
      });
      
      // Set the data and show export modal
      setFinalSummary(response.data);
      setShowExportModal(true);
      
      setMessages(prev => [
        ...prev,
        {
          id: uuidv4(),
          content: `📊 Current report generated! You can now download the PDF with current progress.`,
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error generating current report:", error);
      setMessages(prev => [
        ...prev,
        {
          id: uuidv4(),
          content: "❌ Error generating report. Please try again.",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // NEW FUNCTION: Start a new conversation
  const startNewConversation = () => {
    setMessages([
      {
        id: uuidv4(),
        content: "👋 Hello! I am your assistant for ISO compliance assessment.\n\nEnter the ISO standard to evaluate (e.g., ISO27001:2022(Information security, cybersecurity and privacy protection), ISO9001:2015(Quality management systems),ISO13485:2016(Medical devices),ISO42001:2022(Management systems for sustainability),ISO14791:2022):",
        sender: "bot",
        timestamp: new Date(),
      },
    ]);
    setIsoNorm(null);
    setCurrentQuestion(null);
    setFinalSummary(null);
    setInterimReport(null);
    setResponses([]);
    setEditingResponse(null);
    setShowResponsesModal(false);
    setCurrentConversationId(null);
    setInputValue("");
    localStorage.removeItem('currentConversationId');
  };

  // Helper function to clean up user input for the ISO standard
  const normalizeIsoStandard = (input: string): string => {
    let cleanedInput = input
      .toLowerCase()
      .replace(/[:(]\d{4}\)?/g, '') // Removes versioning like :2022 or (2022)
      .replace(/\s+/g, '');         // Removes all spaces

    // Prepend "iso" if it's missing (e.g., user types "27001" instead of "iso27001")
    if (!cleanedInput.startsWith('iso')) {
      cleanedInput = 'iso' + cleanedInput;
    }
    
    return cleanedInput;
  };
  
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    if (editingResponse) {
      await handleUpdateResponse();
      return;
    }

    const userMessage: Message = {
      id: uuidv4(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    if (!isoNorm) {
      const normalizedStandard = normalizeIsoStandard(inputValue);
      setIsoNorm(normalizedStandard);
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/questions/${normalizedStandard}`);
        
        setMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            content: `🔹 Starting ${inputValue.trim().toUpperCase()} compliance assessment...`,
            sender: "bot",
            timestamp: new Date(),
          },
        ]);

        const firstQuestion = {
          chapter: response.data.chapters[0].name,
          subchapter: response.data.chapters[0].subchapters[0].name,
          question: response.data.questions[0].question,
          question_number: 1,
          total_questions: response.data.questions[0].total_questions
        };
        
        setCurrentQuestion(firstQuestion);
        sendNextQuestion(firstQuestion);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            content: "❌ Error: Could not initialize assessment. Please check the standard name and try again.",
            sender: "bot",
            timestamp: new Date(),
          },
        ]);
        setIsoNorm(null);
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        setIsLoading(true);
        const response = await axios.post<ResponseData>(`${API_URL}/repondre`, {
          norme: isoNorm,
          reponse: inputValue,
        });

        let responseContent = `${getEvaluationMessage(response.data.evaluation, response.data.score)}`;
        if (response.data.recommendation) {
          responseContent += `\n💡 <strong>Recommendation:</strong> ${response.data.recommendation}`;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            content: responseContent,
            sender: "bot",
            timestamp: new Date(),
          },
        ]);

        if (response.data.assessment_complete) {
          await showFinalSummary();
        } else if (response.data.chapter_complete) {
          await showChapterSummary(response.data.chapter);
          
          if (response.data.next_chapter && response.data.next_subchapter && response.data.next_question) {
            const nextQuestion = {
              chapter: response.data.next_chapter,
              subchapter: response.data.next_subchapter,
              question: response.data.next_question,
              question_number: (response.data.next_question_index || 0) + 1,
              total_questions: 0
            };
            setCurrentQuestion(nextQuestion);
            setTimeout(() => sendNextQuestion(nextQuestion), 1500);
          }
        } else if (response.data.next_question) {
          const nextQuestion = {
            chapter: response.data.next_chapter || currentQuestion!.chapter,
            subchapter: response.data.next_subchapter || currentQuestion!.subchapter,
            question: response.data.next_question,
            question_number: (response.data.next_question_index || 0) + 1,
            total_questions: currentQuestion!.total_questions
          };
          setCurrentQuestion(nextQuestion);
          setTimeout(() => sendNextQuestion(nextQuestion), 500);
        }
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            content: "❌ Error processing your response. Please try again.",
            sender: "bot",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const sendNextQuestion = (question: Question) => {
    setMessages((prev) => [
      ...prev,
      {
        id: uuidv4(),
        content: `📂 <strong>${question.chapter}</strong>\n📝 <em>${question.subchapter}</em>\n\n🔹 Question ${question.question_number}: ${question.question}`,
        sender: "bot",
        timestamp: new Date(),
      },
    ]);
  };

  const showChapterSummary = async (chapter: string) => {
    try {
      const response = await axios.post(`${API_URL}/chapter_resume`, {
        norme: isoNorm,
        chapter: chapter,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          content: `📊 <strong>Chapter "${chapter}" Summary</strong>\n🏆 Score: ${response.data.score_chapitre}%`,
          sender: "bot",
          timestamp: new Date(),
          isChapterSummary: true,
          chapterGraph: response.data.graphique,
          chapterScore: response.data.score_chapitre,
          subchapterScores: response.data.scores_sous_chapitres,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          content: "⚠️ Could not generate chapter summary",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const showFinalSummary = async () => {
    try {
      const response = await axios.post<SummaryData>(`${API_URL}/resume`, {
        norme: isoNorm,
      });
      setFinalSummary(response.data);

      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          content: `🎉 <strong>Assessment Complete!</strong>\n✨ Final Compliance Score: ${response.data.score_final}%`,
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          content: "❌ Error generating final report",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    }
  };

 const renderMessageContent = (message: Message) => {
  if (message.isChapterSummary && message.chapterGraph) {
    return (
      <div>
        <div dangerouslySetInnerHTML={{ __html: message.content }} />
        <div className="mt-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
          <img
            src={`data:image/png;base64,${message.chapterGraph}`}
            alt="Chapter compliance chart"
            className="mx-auto max-w-full rounded-lg"
          />
          {message.subchapterScores && (
            <div className="mt-4">
              <h4 className="font-semibold text-slate-800 mb-3">Subchapter Scores:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(message.subchapterScores).map(([subchapter, score]) => (
                  <div key={subchapter} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-700">{subchapter}</span>
                    <span className="font-medium text-slate-900">{score}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return <div dangerouslySetInnerHTML={{ __html: message.content }} />;
};

  const groupByChapter = (data: DetailedSummary[]) => {
    return data.reduce((acc, item) => {
      const chapter = item.chapter || 'Unknown Chapter';
      if (!acc[chapter]) acc[chapter] = [];
      acc[chapter].push(item);
      return acc;
    }, {} as Record<string, DetailedSummary[]>);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleExportClick = () => {
    setShowExportModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowExportModal(false);
    generatePDF();
  };

  const generatePDF = () => {
    if (!finalSummary) return;
  
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 40;
    const usableWidth = pageWidth - margin * 2;
    let yPosition = margin;
    let pageCount = 1;

    // NEW: Teal color palette for PDF
    const primaryColor: [number, number, number] = [13, 148, 136]; // Dark Teal
    const secondaryColor: [number, number, number] = [15, 118, 110]; // Darker Teal for headers
    const lightBgColor: [number, number, number] = [240, 249, 249]; // Very light teal
  
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
  
    const drawHeader = () => {
      const boxHeight = 60;
      const borderWidth = 0.5;
      const titleFontSize = 14;
      const refFontSize = 10;
      
      const logoBoxWidth = 80;
      const rightBoxWidth = 140;
      const centerBoxWidth = pageWidth - 2*margin - logoBoxWidth - rightBoxWidth;
      
      let currentY = yPosition;
    
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(borderWidth);
      pdf.rect(margin, currentY, logoBoxWidth, boxHeight, 'S');
      pdf.setDrawColor(255, 255, 255);
      pdf.line(margin + logoBoxWidth, currentY, margin + logoBoxWidth, currentY + boxHeight);
    
      try {
        const logoData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...';
        pdf.addImage(logoData, 'PNG', margin + 5, currentY + (boxHeight - 20)/2, 60, 30);
      } catch (e) {
        console.log('Could not load logo');
      }
    
      pdf.setDrawColor(0, 0, 0);
      pdf.rect(margin + logoBoxWidth, currentY, centerBoxWidth, boxHeight, 'S');
      pdf.setDrawColor(255, 255, 255);
      pdf.line(margin + logoBoxWidth, currentY, margin + logoBoxWidth, currentY + boxHeight);
      pdf.line(margin + logoBoxWidth + centerBoxWidth, currentY, margin + logoBoxWidth + centerBoxWidth, currentY + boxHeight);
    
      const isoTitle = `Internal Audit Report ${isoNorm || 'ISO/IEC '}`;
      pdf.setFontSize(titleFontSize);
      pdf.setFont('helvetica', 'bold');
      pdf.text(isoTitle, 
        margin + logoBoxWidth + centerBoxWidth/2, 
        currentY + boxHeight/2 + 3, 
        { align: 'center', baseline: 'middle' });
    
      pdf.setDrawColor(0, 0, 0);
      pdf.rect(margin + logoBoxWidth + centerBoxWidth, currentY, rightBoxWidth, boxHeight, 'S');
      pdf.setDrawColor(255, 255, 255);
      pdf.line(margin + logoBoxWidth + centerBoxWidth, currentY, margin + logoBoxWidth + centerBoxWidth, currentY + boxHeight);
    
      const refText = `Ref: QM-IAR \n VER:001\n REV: 00`;
      const dateText = `Date: ${new Date().toLocaleDateString('en-GB')}`;
      
      pdf.setFontSize(refFontSize);
      pdf.setFont('helvetica', 'normal');
      pdf.text(refText, pageWidth - margin - 5, currentY + 12, { align: 'right' });
      pdf.text(dateText, pageWidth - margin - 5, currentY + 48, { align: 'right' });
    
      pdf.setDrawColor(0, 0, 0);
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      pdf.line(margin, currentY + boxHeight, pageWidth - margin, currentY + boxHeight);
    
      yPosition = currentY + boxHeight + 20;
    };
  
    const drawRadarChart = (imgData: string | HTMLImageElement | HTMLCanvasElement | Uint8Array<ArrayBufferLike> | RGBAData, x: number, y: number, width: number, height: number) => {
      try {
        pdf.setDrawColor(200);
        pdf.rect(x - 5, y - 5, width + 10, height + 10);
        pdf.addImage(imgData, 'PNG', x, y, width, height);
      } catch {
        pdf.text('Radar chart unavailable', x, y);
      }
    };

    const drawFormTable = () => {
      const minLabelWidth = 70;
      const maxLabelWidth = 120;
      const lineHeight = 10;
      const padding = 4;
      const fontSize = 9;
    
      const fields = [
        { key: 'companyName', label: 'Company' },
        { key: 'auditorName', label: 'Auditor' },
        { key: 'auditeeName', label: 'Auditee' },
        { key: 'auditStartDate', label: 'Start Date' },
        { key: 'auditEndDate', label: 'End Date' },
        { key: 'site', label: 'Site' },
        { key: 'auditObjective', label: 'Objectives' },
        { key: 'scopeOfAudit', label: 'Scope' }
      ];
    
      pdf.setFontSize(fontSize);
      let labelColWidth = minLabelWidth;
      
      fields.forEach(field => {
        const textWidth = pdf.getStringUnitWidth(field.label) * fontSize;
        if (textWidth + 2 * padding > labelColWidth) {
          labelColWidth = Math.min(textWidth + 2 * padding, maxLabelWidth);
        }
      });
    
      const valueColWidth = pageWidth - 2 * margin - labelColWidth;
    
      pdf.setFont('helvetica', 'normal');
    
      pdf.setFontSize(16);
      pdf.setTextColor(...primaryColor);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Audit Information', margin, yPosition);
      yPosition += 10;
      pdf.setFontSize(11);
      pdf.setTextColor(...primaryColor);
      pdf.setFont('helvetica', 'normal');
      yPosition += 10;
    
      fields.forEach(field => {
        const value = formValues[field.key as keyof typeof formValues];
        if (!value) return;
    
        const labelLines = [field.label];
        const valueLines = pdf.splitTextToSize(value, valueColWidth - 2 * padding);
    
        const lineCount = Math.max(1, valueLines.length);
        const cellHeight = lineCount * lineHeight + 2 * padding;
    
        if (yPosition + cellHeight > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          yPosition = margin;
        }
    
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(margin, yPosition, labelColWidth, cellHeight);
        pdf.rect(margin + labelColWidth, yPosition, valueColWidth, cellHeight);
    
        pdf.setFillColor(...lightBgColor);
        pdf.rect(margin, yPosition, labelColWidth, cellHeight, 'F');
    
        pdf.setTextColor(0, 0, 0);
        const labelY = yPosition + (cellHeight / 2) - ((labelLines.length - 1) * lineHeight / 2);
        pdf.text(labelLines, margin + padding, labelY);
    
        valueLines.forEach((line: string, i: number) => {
          const verticalOffset = (cellHeight - (valueLines.length * lineHeight)) / 2;
          const centeredY = yPosition + padding + verticalOffset + (i * lineHeight);
          
          pdf.text(line, margin + labelColWidth + padding, centeredY);
        });
            
        yPosition += cellHeight;
      });
    
      yPosition += 20;
    };
  
    drawHeader();
    drawFormTable();
  
    // UPDATED: Assessment status section with better handling of incomplete assessments
    pdf.setFontSize(16);
    pdf.setTextColor(...primaryColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Compliance Summary', margin, yPosition);
    yPosition += 20;

    // Add assessment status indicator - NEW FEATURE
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    const totalChapters = Object.keys(finalSummary.scores_chapitres).length;
    const completedChapters = finalSummary.chapters_completed || 0;
    const isComplete = completedChapters >= totalChapters;
    
    const statusText = isComplete ? 
      'Status: ✅ Assessment Complete' : 
      `Status: 🔄 In Progress (${completedChapters} of ${totalChapters} chapters completed)`;
    
    pdf.text(statusText, margin, yPosition);
    yPosition += 20;
  
    pdf.setFontSize(14);
    const finalColor: [number, number, number] = finalSummary.score_final >= 80
      ? [0, 128, 0]
      : finalSummary.score_final >= 50
      ? [255, 165, 0]
      : [255, 0, 0];
  
    pdf.setTextColor(...finalColor);
    const scoreLabel = isComplete ? 'Final Compliance Score' : 'Current Compliance Score';
    pdf.text(`${scoreLabel}: ${finalSummary.score_final}%`, margin, yPosition);
    pdf.setTextColor(0, 0, 0);
    yPosition += 20;
  
    pdf.setFontSize(12);
    pdf.text(`• Chapters Assessed: ${completedChapters}`, margin, yPosition);
    yPosition += 18;
    pdf.text(`• Questions Answered: ${finalSummary.total_questions || 0}`, margin, yPosition);
    yPosition += 20;
  
    if (finalSummary.graphique_principal) {
      const imgData = `data:image/png;base64,${finalSummary.graphique_principal}`;
      const newWidth = (pageWidth - 2 * margin) * 0.7;
      const newHeight = newWidth;
    
      const centeredX = (pageWidth - newWidth) / 2;
    
      drawRadarChart(imgData, centeredX, yPosition, newWidth, newHeight);
      yPosition += newHeight + 20;
    }
  
    if (yPosition > pdf.internal.pageSize.getHeight() - 200) {
      pdf.addPage();
      pageCount++;
      yPosition = margin;
      drawHeader();
    }
  
    // Chapter Results Table
    pdf.setFontSize(16);
    pdf.setTextColor(...primaryColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Chapter Results', margin, yPosition);
    yPosition += 20;
  
    const col1 = 120;
    const col2 = 60;
    const col3 = pageWidth - 2 * margin - col1 - col2;
    const rowHeight = 200;
  
    pdf.setFillColor(...secondaryColor);
    pdf.setTextColor(255, 255, 255);
    pdf.rect(margin, yPosition, col1, 25, 'F');
    pdf.rect(margin + col1, yPosition, col2, 25, 'F');
    pdf.rect(margin + col1 + col2, yPosition, col3, 25, 'F');
  
    pdf.setFont('helvetica', 'bold');
    pdf.text('Chapter', margin + 5, yPosition + 17);
    pdf.text('Score', margin + col1 + 5, yPosition + 17);
    pdf.text('Radar Chart', margin + col1 + col2 + 5, yPosition + 17);
    yPosition += 25;
  
    pdf.setFont('helvetica', 'normal');
    Object.entries(finalSummary.scores_chapitres).forEach(([chapter, score], index) => {
      if (yPosition > pdf.internal.pageSize.getHeight() - rowHeight - 30) {
        pdf.addPage();
        pageCount++;
        yPosition = margin;
        drawHeader(); 
      }
  
      pdf.setFillColor(index % 2 === 0 ? lightBgColor[0] : 255, index % 2 === 0 ? lightBgColor[1] : 255, index % 2 === 0 ? lightBgColor[2] : 255);
      pdf.rect(margin, yPosition, col1, rowHeight, 'F');
      pdf.rect(margin + col1, yPosition, col2, rowHeight, 'F');
      pdf.rect(margin + col1 + col2, yPosition, col3, rowHeight, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(chapter, margin + 5, yPosition + 15, { maxWidth: col1 - 10 });

      pdf.setTextColor(0, 0, 0);
      pdf.text(`${score}%`, margin + col1 + 5, yPosition + 15);

      if (finalSummary.graphiques_sous_chapitres[chapter]) {
        const imgData = `data:image/png;base64,${finalSummary.graphiques_sous_chapitres[chapter]}`;
        drawRadarChart(imgData, margin + col1 + col2 + 5, yPosition + 5, col3 - 10, rowHeight - 10);
      }

      yPosition += rowHeight;
    });
  
    const addPageNumber = (currentPage: number, totalPages: number) => {
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Page ${currentPage} of ${totalPages}`, pageWidth - margin - 50, pdf.internal.pageSize.getHeight() - 20);
    };
  
    // Recommendations by Chapter and Subchapter
    const addRecommendations = () => {
      const pageBottomMargin = 100;
      const applicableResponses = finalSummary.resume_detaille.filter(
        item => item.is_applicable !== false && item.recommendation
      );
      
      if (applicableResponses.length === 0) {
        pdf.text('No specific recommendations were generated for this assessment.', margin, yPosition);
        return;
      }

      pdf.addPage();
      pageCount++;
      yPosition = margin;
      drawHeader();

      pdf.setFontSize(16);
      pdf.setTextColor(...primaryColor);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Key Recommendations', margin, yPosition);
      yPosition += 20;
      
      const grouped = applicableResponses.reduce((acc, item) => {
        const chapter = item.chapter || 'General';
        const subchapter = item.subchapter || 'General';
        
        if (!acc[chapter]) acc[chapter] = {};
        if (!acc[chapter][subchapter]) acc[chapter][subchapter] = [];
        
        acc[chapter][subchapter].push(item);
        return acc;
      }, {} as Record<string, Record<string, DetailedSummary[]>>);
      
      Object.entries(grouped).forEach(([chapter, subchapters]) => {
        if (yPosition > pdf.internal.pageSize.getHeight() - pageBottomMargin) {
          pdf.addPage();
          pageCount++;
          yPosition = margin;
          drawHeader();
        }
        
        pdf.setFontSize(14);
        pdf.setTextColor(...primaryColor);
        pdf.setFont('helvetica', 'normal');
        pdf.text(chapter, margin, yPosition);
        yPosition += 20;
        
        Object.entries(subchapters).forEach(([subchapter, items]) => {
          if (yPosition > pdf.internal.pageSize.getHeight() - 50) {
            pdf.addPage();
            pageCount++;
            yPosition = margin;
            drawHeader();
          }
          
          pdf.setFontSize(12);
          pdf.setTextColor(70, 70, 70);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`• ${subchapter}`, margin + 10, yPosition);
          yPosition += 15;
          
          items.forEach(item => {
            if (yPosition > pdf.internal.pageSize.getHeight() - 50) {
              pdf.addPage();
              pageCount++;
              yPosition = margin;
              drawHeader();
            }
            
            pdf.setFontSize(10);
            pdf.setTextColor(50, 50, 50);
            pdf.setFont('helvetica', 'normal');
            
            const questionText = `Q: ${item.question}`;
            const recommendationText = `**Recommendation: ${item.recommendation}`;
            
            const questionLines = pdf.splitTextToSize(questionText, usableWidth - 20);
            const recLines = pdf.splitTextToSize(recommendationText, usableWidth - 30);
            
            pdf.text(questionLines, margin + 20, yPosition);
            yPosition += questionLines.length * 10 + 5;
            
            pdf.text(recLines, margin + 30, yPosition);
            yPosition += recLines.length * 10 + 10;
          });
        });
      });
    };
    
    addRecommendations();
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      addPageNumber(i, pageCount);
    }
  
    const filename = isComplete ? 
      `${isoNorm}_Final_Compliance_Report.pdf` : 
      `${isoNorm}_Progress_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    
    pdf.save(filename);
  };

  const renderFinalSummary = () => {
    if (!finalSummary) return null;

    const groupedSummary = groupByChapter(finalSummary.resume_detaille);
    const totalChapters = Object.keys(finalSummary.scores_chapitres).length;
    const completedChapters = finalSummary.chapters_completed || 0;
    const isComplete = completedChapters >= totalChapters;

    return (
      <div ref={reportRef} className="mt-6">
        <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-2xl p-6 shadow-sm border border-teal-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {isComplete ? 'Final Assessment Report' : 'Current Progress Report'}
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                {isComplete ? 
                  '✅ Assessment Complete' : 
                  `🔄 In Progress (${completedChapters} of ${totalChapters} chapters completed)`
                }
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold mb-4 text-slate-800 flex items-center gap-2">
                <span className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">📈</span>
                Overall Compliance
              </h3>
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${
                  finalSummary.score_final >= 80 ? 'text-emerald-600' :
                  finalSummary.score_final >= 50 ? 'text-amber-600' : 'text-red-500'
                }`}>
                  {finalSummary.score_final}%
                </div>
                <p className="text-slate-600 text-sm">
                  {isComplete ? 'Final' : 'Current'} Score
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold mb-4 text-slate-800 flex items-center gap-2">
                <span className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center text-cyan-600">📋</span>
                Assessment Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Chapters Assessed:</span>
                  <span className="font-semibold text-slate-800">{completedChapters}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Questions Answered:</span>
                  <span className="font-semibold text-slate-800">{finalSummary.total_questions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Chapters:</span>
                  <span className="font-semibold text-slate-800">{totalChapters}</span>
                </div>
              </div>
            </div>
          </div>

          {finalSummary.graphique_principal && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-slate-800 text-center">Compliance Overview</h3>
              <div className="flex justify-center">
                <img
                  src={`data:image/png;base64,${finalSummary.graphique_principal}`}
                  alt="Overall compliance chart"
                  className="max-w-full h-auto rounded-lg shadow-sm"
                />
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">🎯</span>
              Chapter Scores
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(finalSummary.scores_chapitres).map(([chapter, score]) => (
                <div key={chapter} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium text-slate-800 text-sm">{chapter}</p>
                    <span className="text-lg font-bold text-slate-900">{score}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        score >= 80 ? 'bg-emerald-500' :
                        score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {Object.entries(groupedSummary).map(([chapter, items]) => (
            <div key={chapter} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-slate-800 flex items-center gap-2">
                <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">📂</span>
                {chapter}
              </h3>
              
              {finalSummary.graphiques_sous_chapitres[chapter] && (
                <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                  <img
                    src={`data:image/png;base64,${finalSummary.graphiques_sous_chapitres[chapter]}`}
                    alt={`${chapter} compliance chart`}
                    className="mx-auto max-w-full h-auto rounded-lg"
                  />
                </div>
              )}
              
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="mb-3">
                      <p className="font-semibold text-slate-800 mb-2">Q: {item.question}</p>
                      <p className="text-slate-700 mb-2">A: {item.reponse}</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                        Evaluation: {item.evaluation}
                      </span>
                      {item.score !== null && (
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                          item.score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                          item.score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          Score: {item.score}%
                        </span>
                      )}
                    </div>
                    
                    {item.recommendation && (
                      <div className="mt-3 p-3 bg-sky-50 rounded-lg border border-sky-100">
                        <p className="text-sky-800">
                          <span className="font-semibold">💡 Recommendation:</span> {item.recommendation}
                        </p>
                      </div>
                    )}
                    
                    <p className="text-xs text-slate-500 mt-2">
                      Subchapter: {item.subchapter}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {finalSummary.recommendations && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200 mb-6">
              <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">📝</span>
                Key Recommendations
              </h3>
              <div className="text-slate-700 whitespace-pre-line leading-relaxed">
                {finalSummary.recommendations}
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={handleExportClick}
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-semibold shadow-sm hover:shadow-md"
            >
              <span>📄</span>
              Export Report (PDF)
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderInterimReport = () => {
    if (!interimReport) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">📊</span>
                Current Compliance Report
              </h2>
              <button 
                onClick={() => setInterimReport(null)} 
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <span className="text-lg">✕</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-xl p-6 border border-teal-100">
              <h3 className="text-lg font-semibold mb-4 text-slate-800 flex items-center gap-2">
                <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">📈</span>
                Current Compliance Status
              </h3>
              
              <div className="text-center mb-6">
                <div className={`text-4xl font-bold mb-2 ${
                  interimReport.score_final >= 80 ? 'text-emerald-600' :
                  interimReport.score_final >= 50 ? 'text-amber-600' : 'text-red-500'
                }`}>
                  {interimReport.score_final}%
                </div>
                <p className="text-slate-600">
                  ({interimReport.chapters_completed} chapters completed)
                </p>
              </div>

              {interimReport.graphique_principal && (
                <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
                  <img
                    src={`data:image/png;base64,${interimReport.graphique_principal}`}
                    alt="Current compliance chart"
                    className="mx-auto max-w-full h-auto rounded-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {Object.entries(interimReport.scores_chapitres).map(([chapter, score]) => (
                  <div key={chapter} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium text-slate-800 text-sm">{chapter}</p>
                      <span className="font-bold text-slate-900">{score}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          score >= 80 ? 'bg-emerald-500' :
                          score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => setInterimReport(null)}
                  className="px-6 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-slate-700 font-medium transition-colors"
                >
                  Close Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-800">Enter Audit Information</h2>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Company Name*
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formValues.companyName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Auditor Name*
                  </label>
                  <input
                    type="text"
                    name="auditorName"
                    value={formValues.auditorName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Auditee Name
                  </label>
                  <input
                    type="text"
                    name="auditeeName"
                    value={formValues.auditeeName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Audit Start Date
                    </label>
                    <input
                      type="date"
                      name="auditStartDate"
                      value={formValues.auditStartDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Audit End Date
                    </label>
                    <input
                      type="date"
                      name="auditEndDate"
                      value={formValues.auditEndDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Site
                  </label>
                  <input
                    type="text"
                    name="site"
                    value={formValues.site}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Audit Objective
                  </label>
                  <textarea
                    name="auditObjective"
                    value={formValues.auditObjective}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Scope of Audit
                  </label>
                  <textarea
                    name="scopeOfAudit"
                    value={formValues.scopeOfAudit}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium transition-colors shadow-sm"
                >
                  Generate PDF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View/Edit Responses Modal */}
      {showResponsesModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"></span>

                  <span className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center text-cyan-600">📋</span>
                  Your Responses
                </h2>
                <button 
                  onClick={() => setShowResponsesModal(false)} 
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <span className="text-lg">✕</span>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {responses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📭</span>
                  </div>
                  <p className="text-slate-600">No responses found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {responses.map((response, index) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800 mb-2">{response.question}</p>
                          <div className="mb-3">
                            <p className="text-sm text-slate-700 mb-1">Your answer:</p>
                            <p className="text-slate-800 bg-white p-3 rounded-lg border border-slate-200">
                              {response.reponse}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                              response.evaluation === "compliant" ? 'bg-emerald-100 text-emerald-700' :
                              response.evaluation === "acceptable" ? 'bg-amber-100 text-amber-700' :
                              response.evaluation === "needs improvement" ? 'bg-orange-100 text-orange-700' :
                              response.evaluation === "non-compliant" ? 'bg-red-100 text-red-700' :
                              'bg-violet-100 text-violet-700'
                            }`}>
                              {response.evaluation}
                              {response.score !== null && ` (${response.score}%)`}
                            </span>
                            {response.recommendation && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                Has recommendation
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleEditResponse(response)}
                          className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="text-xs text-slate-500 mt-3 flex items-center gap-2">
                        <span>{response.chapter}</span>
                        <span>•</span>
                        <span>{response.subchapter}</span>
                        <span>•</span>
                        <span>Q{response.question_index + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Response Indicator */}
      {editingResponse && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-amber-100 text-amber-800 px-4 py-2 rounded-xl shadow-lg z-10 flex items-center gap-3">
          <span className="text-lg">✏️</span>
          <span>Editing response to: "{editingResponse.question.substring(0, 50)}..."</span>
          <button 
            onClick={() => {
              setEditingResponse(null);
              setInputValue("");
            }}
            className="ml-2 text-amber-600 hover:text-amber-800 font-medium"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Floating Action Buttons */}
      {isoNorm && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-10">
          <button
            onClick={startNewConversation}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl shadow-lg transition-colors text-sm font-medium"
            disabled={isLoading}
            title="Start a new conversation"
          >
            <span>🆕</span>
            New Conversation
          </button>
          <button
            onClick={fetchAllResponses}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-3 rounded-xl shadow-lg transition-colors text-sm font-medium"
            disabled={isLoading}
          >
            <span>📋</span>
            View/Edit Responses
          </button>
          
          <button
            onClick={generateCurrentReport}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 rounded-xl shadow-lg transition-colors text-sm font-medium"
            disabled={isLoading}
            title="Generate and download a report with current progress"
          >
            <span>{isLoading ? "⏳" : "📊"}</span>
            {isLoading ? "Generating..." : "Generate Report"}
          </button>

          <button
            onClick={async () => {
              if (!isoNorm) return;
              setIsLoading(true);
              try {
                const response = await axios.post<SummaryData>(`${API_URL}/resume`, {
                  norme: isoNorm
                });
                setInterimReport(response.data);
              } catch (error) {
                console.error("Error generating interim report:", error);
              } finally {
                setIsLoading(false);
              }
            }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl shadow-lg transition-colors text-sm font-medium"
            disabled={isLoading}
          >
            <span>{isLoading ? "⏳" : "📈"}</span>
            {isLoading ? "Loading..." : "Quick View"}
          </button>
        </div>
      )}

      {/* Interim Report Modal */}
      {renderInterimReport()}

      {/* Main Chat Interface */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Chat messages container */}
          <div className="h-[70vh] overflow-y-auto p-6">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`mb-6 ${msg.sender === "user" ? "text-right" : "text-left"}`}
              >
                <div 
                  className={`inline-block max-w-[90%] px-4 py-3 rounded-xl ${
                    msg.sender === "user" 
                      ? "bg-teal-600 text-white" 
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {renderMessageContent(msg)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-center py-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full">
                  <span className="animate-pulse">⏳</span>
                  <span className="text-slate-600">Processing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Final summary section */}
          {finalSummary && (
            <div className="border-t border-slate-200">
              {renderFinalSummary()}
            </div>
          )}

          {/* Input area */}
          <div className="border-t border-slate-200 p-4 bg-slate-50">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={
                  editingResponse 
                    ? "Edit your response..." 
                    : isoNorm 
                      ? "Type your response..." 
                      : "Enter ISO standard (e.g., ISO27001)"
                }
                className="flex-1 p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800 placeholder:text-slate-400"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading}
                className={`flex items-center justify-center w-12 h-12 rounded-xl ${
                  isLoading 
                    ? "bg-slate-400 cursor-not-allowed" 
                    : "bg-teal-600 hover:bg-teal-700"
                } text-white transition-colors`}
              >
                {isLoading ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <span>➤</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;