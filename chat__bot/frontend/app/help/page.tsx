/* eslint-disable react/no-unescaped-entities */
import React from "react";
import Sidebar from "@/components/sidebar"; // Import Sidebar component

const HelpPage = () => {
  return (
    <div className="flex">
      {/* Include Sidebar component */}
      <Sidebar isMobile={false} />

      <div className="p-8 max-w-5xl mx-auto flex-1">
        <h1 className="text-4xl font-bold mb-6"> Help: ISO Evaluation Chatbot</h1>

        <section className="mb-8">
          <p className="text-lg">
            Welcome to the <strong>ISO Evaluation Chatbot</strong>! This tool is designed to guide your
            organization through a self-assessment process aligned with international standards such
            as <strong>ISO 9001</strong>, <strong>ISO/IEC 27001</strong>, <strong>ISO/IEC 42001</strong>, and more.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2"> What Does the Chatbot Do?</h2>
          <ul className="list-disc list-inside space-y-1 text-base">
            <li>Asks chapter-specific questions based on the selected ISO standard.</li>
            <li>Analyzes your answers using AI (semantic analysis).</li>
            <li>Scores each response with labels: Conformant, Acceptable, Needs Improvement, Non-Conformant.</li>
            <li>Provides recommendations based on your answers.</li>
            <li>Displays a radar chart summarizing your performance.</li>
            <li>Generates a PDF report with scores, graphs, and recommandations.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2"> How to Use the Chatbot</h2>
          <ol className="list-decimal list-inside space-y-1 text-base">
            <li>Choose the ISO standard you want to evaluate.</li>
            <li>Answer the chatbot’s questions clearly and honestly.</li>
            <li>View real-time evaluations for each response.</li>
            <li>Review radar charts at the end of each chapter.</li>
            <li>Download your full PDF report at the end of the evaluation.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2"> Tips for Accurate Evaluation</h2>
          <ul className="list-disc list-inside space-y-1 text-base">
            <li>Provide detailed responses, including examples or references to documents.</li>
            <li>Be objective and transparent—this is a self-assessment tool.</li>
            <li>If unsure, consult your quality manager or ISO coordinator.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2"> Exporting Your Report</h2>
          <p className="text-base">
            When your assessment is complete, click the <strong>"Download full Report"</strong> button.
            The report will include:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-base">
            <li>Summary of your scores per ISO clause</li>
            <li>Radar chart visualization</li>
            <li>List of improvement suggestions</li>
          </ul>
        </section>


      </div>
    </div>
  );
};

export default HelpPage;
