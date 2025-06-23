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
//import html2canvas from "html2canvas";

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
  //const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  //const [showHistory, setShowHistory] = useState(false);
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
}, 
);


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
        content: "👋 Hello! I am your assistant for ISO compliance assessment.\n\nEnter the ISO standard to evaluate (e.g., ISO27001, ISO9001):",
        sender: "bot",
        timestamp: new Date(),
      },
    ]);
  }
 }, []);
 const loadConversation = async (conversationId: string) => {
  try {
    setIsLoading(true);
    console.log('Attempting to load conversation:', conversationId); // Debug log
    const response = await axios.get(`${API_URL}/conversations/${conversationId}`);
     if (!response.data.success || !response.data.conversation) {
      throw new Error('Invalid conversation data');
    }
    console.log('API response:', response.data); // Debug log
    const conversation = response.data;
     // Safely use norme with fallback
    const norme = conversation.norme || 'Unknown';
    
    // Set the ISO norm
    setIsoNorm(conversation.norme);
    
    // Initialize messages
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
    
    // Convert responses to chat messages
    const responseMessages = conversation.responses.map((response: any) => {
      const evaluationMessage = `${getEvaluationMessage(response.evaluation, response.score)}`;
      let content = `📂 <strong>${response.chapter}</strong>\n📝 <em>${response.subchapter}</em>\n\n🔹 Question: ${response.question}\n\n`;
      content += `Your response: ${response.response}\n\n`;
      content += evaluationMessage;
      
      if (response.recommendation) {
        content += `\n💡 <strong>Recommendation:</strong> ${response.recommendation}`;
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
    
    // If the conversation is completed, show the final summary
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
      "compliant": { emoji: "✅", color: "text-green-600" },
      "acceptable": { emoji: "🟡", color: "text-yellow-600" },
      "needs improvement": { emoji: "🟠", color: "text-orange-600" },
      "non-compliant": { emoji: "🔴", color: "text-red-600" },
      "not applicable": { emoji: "🟣 ", color: "text-purple-600" }
    };

    const { emoji, color } = evaluationMap[evaluation] || { emoji: "❓", color: "text-gray-600" };
    

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

    // Update local state
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
  
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

      // If we're editing a response, handle that case
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
    /*const saveMessage = async (sender: string, content: string) => {
      await axios.post('/api/history/save', {
        user_id: 'current_user_id', // Replace with actual user ID
        conversation_id: currentConversation,
        sender,
        content
      });
    };*/
   

    if (!isoNorm) {
      setIsoNorm(inputValue);
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/questions/${inputValue.toLowerCase()}`);
        
        setMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            content: `🔹 Starting ${inputValue} compliance assessment...`,
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

        // Show evaluation and recommendation
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

        // Handle next steps
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
              total_questions: 0 // Will be updated when we get the actual question
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
          <div className="mt-4 p-4 bg-white rounded-lg shadow">
            <img
              src={`data:image/png;base64,${message.chapterGraph}`}
              alt="Chapter compliance chart"
              className="mx-auto max-w-full"
            />
            {message.subchapterScores && (
              <div className="mt-4">
                <h4 className="font-semibold">Subchapter Scores:</h4>
                <ul className="list-disc pl-5 mt-2">
                  {Object.entries(message.subchapterScores).map(([subchapter, score]) => (
                    <li key={subchapter}>
                      {subchapter}: <span className="font-medium">{score}%</span>
                    </li>
                  ))}
                </ul>
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
  
    // Set default font
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
  
    const drawHeader = () => {
      // Configuration
      const boxHeight = 60;
      const borderWidth = 0.5;
      const titleFontSize = 14;
      const refFontSize = 10;
      
      // Calcul des largeurs
      const logoBoxWidth = 80;
      const rightBoxWidth = 140;
      const centerBoxWidth = pageWidth - 2*margin - logoBoxWidth - rightBoxWidth;
      
      // Position Y initiale
      let currentY = yPosition;
    
      // 1. CASE LOGO (GAUCHE)
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(borderWidth);
      pdf.rect(margin, currentY, logoBoxWidth, boxHeight, 'S');
      pdf.setDrawColor(255, 255, 255);
      pdf.line(margin + logoBoxWidth, currentY, margin + logoBoxWidth, currentY + boxHeight);
    
      try {
        const logoData = 'data:image/jpeg;base64,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AAAnXgYX7zAAAQA4/rAAAAAAAAAAAAAAAAAAAAAAAAAAxMAaFoAAA98DIiAAAAAAAAAAAAAAAAAAAAAAAAABA+9yLKJAaPcy8jAAAAAAAAAAAAAAAAAAAAAAAAA7wXyYaQZ0Rt5OkAAAAAAAAAAAAAAAAAAAAAAAAAA/ClJeRK1i+cQ1CAAAAAAAAAAAAAAAAAAAAAAAAAEQyX9GBZ+Y0JabAAAAAAAAAAAAAAAAAAAAAAAAAAeNazzJASiRYDBAAAAAAAAAAAAAAAAAAAAAAAAAAA8NIBe7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADDTwCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEMMMMMMAAMAAAAAAMAEMMMMMMAAMMMMMMIAAAAAAQ888884gksIAAAAA8g488888Q0Qw88888cAAAAAAA0AAAAAcc8oAAAAA8A8gAAAAgo44AAAAAc0AAAAAA8888884w8oAAAAA8AsMMMMcYoo8AAAAA8oAAAAAAoAAAAAQA0oAAAAA4I8oAAAAoIoswwwwwcoAAAAAEYAAAAAAAQ08888Y8EwIAAAAQ8ssAAAAAYgAAAAAQgAAAAAAAAgAAAAAgQAAAAAAQAQwAAAAAggAAAAAAkgEAAEEEsMEME4IEAAAAAAAAAAAAAAAAAAAAAAAQAwAQwgAggggwAQAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/8QAAv/aAAwDAQACAAMAAAAQ888888888888888888888888888888888888888888888888888888888888w9G+d9888888888888888888888888880888888w+APaWCG0888888888888888888888889ay88888IyBoTRdnv88888888888888888888888s8k1888y8UT/9+0svU88888888888888888888888L0O988DgnBBRatUl78888888888888888888888888kV42EH/wDceloqQi8PPPPPPPPPPPPPPPPPPPPPPPDMBt54dw+W3DUU4NN/PPPPPPPPPPPPPPPPPPPPPPPPpseMgs7dvLLp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';
        pdf.addImage(logoData, 'PNG', margin + 5, currentY + (boxHeight - 20)/2, 60, 30);
      } catch (e) {
        console.log('Could not load logo');
      }
    
      // 2. CASE TITRE (CENTRE)
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
    
      // 3. CASE REF/DATE (DROITE)
      pdf.setDrawColor(0, 0, 0);
      pdf.rect(margin + logoBoxWidth + centerBoxWidth, currentY, rightBoxWidth, boxHeight, 'S');
      pdf.setDrawColor(255, 255, 255);
      pdf.line(margin + logoBoxWidth + centerBoxWidth, currentY, margin + logoBoxWidth + centerBoxWidth, currentY + boxHeight);
    
      // Contenu case droite
      const refText = `Ref: QM-IAR \n VER:001\n REV: 00`;
      const dateText = `Date: ${new Date().toLocaleDateString('en-GB')}`;
      
      pdf.setFontSize(refFontSize);
      pdf.setFont('helvetica', 'normal');
      pdf.text(refText, pageWidth - margin - 5, currentY + 12, { align: 'right' });
      pdf.text(dateText, pageWidth - margin - 5, currentY + 48, { align: 'right' });
    
      // Lignes de séparation visuelles (noires)
      pdf.setDrawColor(0, 0, 0);
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      pdf.line(margin, currentY + boxHeight, pageWidth - margin, currentY + boxHeight);
    
      // Mise à jour position Y
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
      // Configuration dynamique
      const minLabelWidth = 70; // Largeur minimale colonne libellés
      const maxLabelWidth = 120; // Largeur maximale colonne libellés
      const lineHeight = 10; // Hauteur de ligne de base
      const padding = 4; // Marge interne
      const fontSize = 9; // Taille de police
    
      // Données du formulaire avec libellés courts
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
    
      // Calcul dynamique des largeurs de colonnes
      pdf.setFontSize(fontSize);
      let labelColWidth = minLabelWidth;
      
      // Trouve la largeur optimale pour la colonne de libellés
      fields.forEach(field => {
        const textWidth = pdf.getStringUnitWidth(field.label) * fontSize;
        if (textWidth + 2 * padding > labelColWidth) {
          labelColWidth = Math.min(textWidth + 2 * padding, maxLabelWidth);
        }
      });
    
      const valueColWidth = pageWidth - 2 * margin - labelColWidth;
    
      // Style du tableau
      pdf.setFont('helvetica', 'normal');
    
      // Titre de section
      pdf.setFontSize(16);
      pdf.setTextColor(40, 53, 147);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Audit Information', margin, yPosition);
      yPosition += 10;
      pdf.setFontSize(11);
      pdf.setTextColor(40, 53, 147);
      pdf.setFont('helvetica', 'normal');
      yPosition += 10;
    
      // Dessin des lignes du tableau
      fields.forEach(field => {
        const value = formValues[field.key as keyof typeof formValues];
        if (!value) return;
    
        // Découpage du texte en plusieurs lignes
        const labelLines = [field.label]; // Libellés sur une seule ligne
        const valueLines = pdf.splitTextToSize(value, valueColWidth - 2 * padding);
    
        // Calcul hauteur de la ligne
        const lineCount = Math.max(1, valueLines.length);
        const cellHeight = lineCount * lineHeight + 2 * padding;
    
        // Vérification espace page
        if (yPosition + cellHeight > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          yPosition = margin;
        }
    
        // Dessin des bordures
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(margin, yPosition, labelColWidth, cellHeight);
        pdf.rect(margin + labelColWidth, yPosition, valueColWidth, cellHeight);
    
        // Fond label
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, yPosition, labelColWidth, cellHeight, 'F');
    
        // Texte label (centré verticalement)
        pdf.setTextColor(0, 0, 0);
        const labelY = yPosition + (cellHeight / 2) - ((labelLines.length - 1) * lineHeight / 2);
        pdf.text(labelLines, margin + padding, labelY);
    
       // Texte value (aligné au centre verticalement)
        valueLines.forEach((line: string, i: number) => {
          // Calculer la position Y pour centrer le texte verticalement
          const verticalOffset = (cellHeight - (valueLines.length * lineHeight)) / 2;
          const centeredY = yPosition + padding + verticalOffset + (i * lineHeight);
          
          pdf.text(line, margin + labelColWidth + padding, centeredY);
        });
            
        yPosition += cellHeight;
      });
    
      // Espacement après le tableau
      yPosition += 20;
    };
  
    drawHeader();
    drawFormTable();
  
    // 1. Compliance Summary Section
    pdf.setFontSize(16);
    pdf.setTextColor(40, 53, 147);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Compliance Summary', margin, yPosition);
    yPosition += 20;
  
    pdf.setFontSize(14);
    const finalColor: [number, number, number] = finalSummary.score_final >= 80
      ? [0, 128, 0]
      : finalSummary.score_final >= 50
      ? [255, 165, 0]
      : [255, 0, 0];
  
    pdf.setTextColor(...finalColor);
    pdf.text(`Overall Compliance Score: ${finalSummary.score_final}%`, margin, yPosition);
    pdf.setTextColor(0, 0, 0);
    yPosition += 20;
  
    pdf.setFontSize(12);
    pdf.text(`• Chapters Assessed: ${finalSummary.chapters_completed}`, margin, yPosition);
    yPosition += 18;
    pdf.text(`• Total Questions: ${finalSummary.total_questions}`, margin, yPosition);
    yPosition += 20;
    //pdf.text(`• Applicable Questions: ${finalSummary.total_applicable_questions}`, margin, yPosition);
    //yPosition += 20;
  
    if (finalSummary.graphique_principal) {
      const imgData = `data:image/png;base64,${finalSummary.graphique_principal}`;
      const newWidth = (pageWidth - 2 * margin) * 0.7;
      const newHeight = newWidth;
    
      // Calcul de la position X pour centrer l'image
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
  
    // 2. Chapter Results Table
    pdf.setFontSize(16);
    pdf.setTextColor(40, 53, 147);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Chapter Results', margin, yPosition);
    yPosition += 20;
  
    const col1 = 120;
    const col2 = 60;
    const col3 = pageWidth - 2 * margin - col1 - col2;
    const rowHeight = 200;
  
    pdf.setFillColor(63, 81, 181);
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
  
      pdf.setFillColor(index % 2 === 0 ? 245 : 255, 245, 245);
      pdf.rect(margin, yPosition, col1, rowHeight, 'F');
      pdf.rect(margin + col1, yPosition, col2, rowHeight, 'F');
      pdf.rect(margin + col1 + col2, yPosition, col3, rowHeight, 'F');
  
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(chapter, margin + 5, yPosition + 15, { maxWidth: col1 - 10 });
  
      const scoreColor: [number, number, number] =
        score >= 80 ? [0, 128, 0] :
          score >= 50 ? [255, 165, 0] :
            [255, 0, 0];
      pdf.setTextColor(...scoreColor);
      pdf.text(`${score}%`, margin + col1 + 5, yPosition + 15);
      pdf.setTextColor(0, 0, 0);
  
      if (finalSummary.graphiques_sous_chapitres[chapter]) {
        const imgData = `data:image/png;base64,${finalSummary.graphiques_sous_chapitres[chapter]}`;
        drawRadarChart(imgData, margin + col1 + col2 + 5, yPosition + 5, col3 - 10, rowHeight - 10);
      }
  
      yPosition += rowHeight;
    });
  
    // Function to add page number
    const addPageNumber = (currentPage: number, totalPages: number) => {
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Page ${currentPage} of ${totalPages}`, pageWidth - margin - 50, pdf.internal.pageSize.getHeight() - 20);
    };
  
    // 3. Recommendations by Chapter and Subchapter
    const addRecommendations = () => {
      const pageBottomMargin = 100;
      // Filter out non-applicable questions
      const applicableResponses = finalSummary.resume_detaille.filter(
        item => item.is_applicable !== false && item.recommendation
      );
      
      if (applicableResponses.length === 0) {
        pdf.text('No specific recommendations were generated for this assessment.', margin, yPosition);
        return;
      }
      // Start recommendations on a new page
      pdf.addPage();
      pageCount++;
      yPosition = margin;
      drawHeader();

      // Add "Key Recommendations" title
      pdf.setFontSize(16);
      pdf.setTextColor(40, 53, 147);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Key Recommendations', margin, yPosition);
      yPosition += 20;

      /* Add divider line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;*/
      
      // Group by chapter and subchapter
      const grouped = applicableResponses.reduce((acc, item) => {
        const chapter = item.chapter || 'General';
        const subchapter = item.subchapter || 'General';
        
        
        if (!acc[chapter]) acc[chapter] = {};
        if (!acc[chapter][subchapter]) acc[chapter][subchapter] = [];
        
        acc[chapter][subchapter].push(item);
        return acc;
      }, {} as Record<string, Record<string, DetailedSummary[]>>);
      
      // Add recommendations to PDF
  Object.entries(grouped).forEach(([chapter, subchapters]) => {
    // Check if we need a new page for chapter heading
    if (yPosition > pdf.internal.pageSize.getHeight() - pageBottomMargin) {
      pdf.addPage();
      pageCount++;
      yPosition = margin;
      drawHeader();
    }
        
        pdf.setFontSize(14);
        pdf.setTextColor(40, 53, 147);
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
    
    // Final pass to update all page numbers
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      addPageNumber(i, pageCount);
    }
  
    pdf.save(`${isoNorm}_Compliance_Report.pdf`);
  };

  const renderFinalSummary = () => {
    if (!finalSummary) return null;

    const groupedSummary = groupByChapter(finalSummary.resume_detaille);

    return (
      <div ref={reportRef} className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-blue-800">📜 Final Assessment Summary</h2>
        
        <div className="mb-6 p-4 bg-white rounded shadow">
          <h3 className="text-lg font-semibold mb-3 text-blue-700">📈 Overall Compliance</h3>
          <p className="text-2xl font-bold mb-4">Final Score: {finalSummary.score_final}%</p>
          {finalSummary.graphique_principal && (
            <img
              src={`data:image/png;base64,${finalSummary.graphique_principal}`}
              alt="Overall compliance chart"
              className="mx-auto max-w-full"
            />
          )}
        </div>

        <div className="mb-6 p-4 bg-white rounded shadow">
          <h3 className="text-lg font-semibold mb-3 text-blue-700">📊 Chapter Scores</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(finalSummary.scores_chapitres).map(([chapter, score]) => (
              <div key={chapter} className="p-3 bg-gray-50 rounded">
                <p className="font-medium">{chapter}</p>
                <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
                  <div 
                    className="bg-blue-600 h-4 rounded-full" 
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
                <p className="text-right mt-1">{score}%</p>
              </div>
            ))}
          </div>
        </div>

        {Object.entries(groupedSummary).map(([chapter, items]) => (
          <div key={chapter} className="mb-6 p-4 bg-white rounded shadow">
            <h3 className="text-lg font-semibold mb-3 text-blue-700">📂 {chapter}</h3>
            {finalSummary.graphiques_sous_chapitres[chapter] && (
              <div className="mb-4">
                <img
                  src={`data:image/png;base64,${finalSummary.graphiques_sous_chapitres[chapter]}`}
                  alt={`${chapter} compliance chart`}
                  className="mx-auto max-w-full"
                />
              </div>
            )}
            {items.map((item, index) => (
              <div key={index} className="mb-4 p-3 bg-gray-50 rounded">
                <p className="font-semibold">Q: {item.question}</p>
                <p className="text-gray-700">A: {item.reponse}</p>
                <p className="mt-1">
                  <span className="font-bold">Evaluation:</span> {item.evaluation} ({item.score}%)
                </p>
                {item.recommandation && (
                  <p className="mt-1 text-blue-600">
                    <span className="font-bold">Recommendation:</span> {item.recommandation}
                  </p>
                )}
                <p className="text-sm text-gray-500">Subchapter: {item.subchapter}</p>
              </div>
            ))}
          </div>
        ))}

        {finalSummary.recommendations && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-bold text-yellow-800">📝 Key Recommendations</h3>
            <div className="mt-2 whitespace-pre-line text-gray-700">
              {finalSummary.recommendations}
            </div>
          </div>
        )}

        <button
          onClick={handleExportClick}
          className="mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          📄 Export Full Report (PDF)
        </button>
      </div>
    );
  };
  const renderInterimReport = () => {
    if (!interimReport) return null;
    console.log('Rendering interim report:', interimReport); // Debug

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              Interim Compliance Report
              <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                (Completed Chapters Only)
              </span>
            </h2>
            <button 
              onClick={() => setInterimReport(null)} 
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-blue-700">
              Current Compliance Status
            </h3>
            <p className="text-2xl font-bold mb-4">
              Score: {interimReport.score_final}%
              <span className="text-sm font-normal ml-2">
                ({interimReport.chapters_completed} chapters completed)
              </span>
            </p>

            {interimReport.graphique_principal && (
              <img
                src={`data:image/png;base64,${interimReport.graphique_principal}`}
                alt="Current compliance chart"
                className="mx-auto max-w-full mb-6"
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {Object.entries(interimReport.scores_chapitres).map(([chapter, score]) => (
                <div key={chapter} className="p-3 bg-white rounded shadow">
                  <p className="font-medium">{chapter}</p>
                  <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
                    <div 
                      className="bg-blue-600 h-4 rounded-full" 
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                  <p className="text-right mt-1">{score}%</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setInterimReport(null)}
              className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Close Report
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Export Modal */}
      {showExportModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
    <h2 className="text-xl font-bold mb-4">Enter Audit Information</h2>
    <form onSubmit={handleFormSubmit}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name*
          </label>
          <input
            type="text"
            name="companyName"
            value={formValues.companyName}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Auditor Name*
          </label>
          <input
            type="text"
            name="auditorName"
            value={formValues.auditorName}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Auditee Name
          </label>
          <input
            type="text"
            name="auditeeName"
            value={formValues.auditeeName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Audit Start Date
            </label>
            <input
              type="date"
              name="auditStartDate"
              value={formValues.auditStartDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Audit End Date
            </label>
            <input
              type="date"
              name="auditEndDate"
              value={formValues.auditEndDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Site
          </label>
          <input
            type="text"
            name="site"
            value={formValues.site}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Audit Objective
          </label>
          <textarea
            name="auditObjective"
            value={formValues.auditObjective}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scope of Audit
          </label>
          <textarea
            name="scopeOfAudit"
            value={formValues.scopeOfAudit}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => setShowExportModal(false)}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
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
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Your Responses</h2>
        <button 
          onClick={() => setShowResponsesModal(false)} 
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-4">
        {responses.length === 0 ? (
          <p>No responses found</p>
        ) : (
          responses.map((response, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{response.question}</p>
                  <p className="text-gray-600 mt-1">Your answer: {response.reponse}</p>
                  <p className="text-sm mt-1">
                    Evaluation: {response.evaluation} ({response.score}%)
                  </p>
                  {response.recommendation && (
                    <p className="text-sm text-blue-600 mt-1">
                      Recommendation: {response.recommendation}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleEditResponse(response)}
                  className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 text-sm"
                >
                  Edit
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {response.chapter} • {response.subchapter} • Q{response.question_index + 1}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
)}

{/* Edit Response Indicator */}
{editingResponse && (
  <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg shadow-lg z-10">
    ✏️ Editing response to: "{editingResponse.question.substring(0, 50)}..."
    <button 
      onClick={() => {
        setEditingResponse(null);
        setInputValue("");
      }}
      className="ml-2 text-yellow-600 hover:text-yellow-800"
    >
      Cancel
    </button>
  </div>
)}
{/* Add this button near your interim report button */}
{isoNorm && (
  <button
    onClick={fetchAllResponses}
    className="fixed bottom-20 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors z-10"
    disabled={isLoading}
  >
    📋 View/Edit Responses
  </button>
)}
       {/* Bouton pour le rapport intermédiaire */}
    {isoNorm && (
      <button
        onClick={async () => {
          if (!isoNorm) return;
          setIsLoading(true);
          try {
            const response = await axios.post<SummaryData>(`${API_URL}/resume`, {
              norme: isoNorm,
              only_completed: true
            });
            setInterimReport(response.data);
          } catch (error) {
            console.error("Error generating interim report:", error);
            alert("No completed chapters available yet");
          } finally {
            setIsLoading(false);
          }
        }}
        className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-green-700 transition-colors z-10"
        disabled={isLoading}
      >
        {isLoading ? "⏳ Generating..." : "📋 Interim Report"}
      </button>
    )}
    {/* Interim Report Modal */}
    {renderInterimReport()}

      {/* Main Chat Interface */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-4">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`mb-4 ${msg.sender === "user" ? "text-right" : "text-left"}`}
            >
              <div 
                className={`inline-block max-w-[90%] px-4 py-2 rounded-lg ${
                  msg.sender === "user" 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {renderMessageContent(msg)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="text-center py-3">
              <div className="inline-block px-3 py-1 bg-gray-200 rounded-full">
                <span className="text-gray-600">⏳ Processing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {finalSummary && (
          <div className="max-w-3xl mx-auto mt-4">
            {renderFinalSummary()}
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t">
        <div className="max-w-3xl mx-auto flex gap-2">
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
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg ${
              isLoading 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700"
            } text-white transition-colors`}
          >
            {isLoading ? "⏳ Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
  
  
};

export default Chatbot;