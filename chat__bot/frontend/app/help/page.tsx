/* eslint-disable react/no-unescaped-entities */
import React from "react";
import Sidebar from "@/components/sidebar";

const HelpPage = () => {
  return (
    <div className="flex bg-gray-900 text-white min-h-screen">
      <Sidebar isMobile={false} />

      <div className="p-8 md:p-12 flex-1 flex flex-col items-center">
        <div className="max-w-3xl w-full mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-5xl font-extrabold text-white leading-tight">
              Help: ISO Evaluation Chatbot
            </h1>
            <p className="mt-4 text-lg text-gray-400">
              Welcome to your user guide.
            </p>
          </header>

          <main className="space-y-8">
            <section className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
              <h2 className="flex items-center text-3xl font-bold text-white mb-4">
                <svg
                  className="w-8 h-8 text-blue-400 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2.936 3h-1.07a1 1 0 110-2h1.07A1 1 0 0010 8zM12 15a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
                What is the Chatbot For?
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                The <strong>ISO Evaluation Chatbot</strong> is a self-assessment tool for international standards like <strong>ISO 9001</strong>, <strong>ISO/IEC 27001</strong>, <strong>ISO/IEC 42001</strong>, and more. It guides your organization through a simple process to check for compliance.
              </p>
            </section>

            <section className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
              <h2 className="flex items-center text-3xl font-bold text-white mb-4">
                <svg
                  className="w-8 h-8 text-blue-400 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M3 3a2 2 0 012-2h10a2 2 0 012 2v16a2 2 0 01-2 2H5a2 2 0 01-2-2V3zm2 0v16h10V3H5zm4 4h2v2H9V7zm0 4h2v2H9v-2zm-4 4h10v2H5v-2z"
                  />
                </svg>
                Key Features
              </h2>
              <ul className="list-disc list-inside space-y-3 text-lg text-gray-300">
                <li>Asks chapter-specific questions based on the selected ISO standard.</li>
                <li>Analyzes your answers using AI to assign a label: Conformant, Acceptable, Needs Improvement, or Non-Conformant.</li>
                <li>Provides recommendations based on your answers to improve compliance.</li>
                <li>Displays a radar chart for a clear visualization of your performance.</li>
                <li>Generates a complete PDF report including scores, charts, and recommendations.</li>
              </ul>
            </section>

            <section className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
              <h2 className="flex items-center text-3xl font-bold text-white mb-4">
                <svg
                  className="w-8 h-8 text-blue-400 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                How to Use the Chatbot
              </h2>
              <ol className="list-decimal list-inside space-y-3 text-lg text-gray-300">
                <li>Choose the ISO standard you want to evaluate.</li>
                <li>Answer the chatbot’s questions clearly and in detail.</li>
                <li>View real-time evaluations for each response.</li>
                <li>Review the radar chart at the end of each chapter.</li>
                <li>Download your full PDF report after completing the evaluation.</li>
              </ol>
            </section>

            <section className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
              <h2 className="flex items-center text-3xl font-bold text-white mb-4">
                <svg
                  className="w-8 h-8 text-blue-400 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M10 2a8 8 0 100 16 8 8 0 000-16zM8.5 7.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM10 12a1 1 0 00-1 1v2a1 1 0 102 0v-2a1 1 0 00-1-1z"
                  />
                </svg>
                Tips for an Accurate Evaluation
              </h2>
              <ul className="list-disc list-inside space-y-3 text-lg text-gray-300">
                <li>Provide detailed responses, including examples or document references.</li>
                <li>Be objective and transparent—this is a self-assessment tool.</li>
                <li>If unsure, consult your quality manager or ISO coordinator.</li>
              </ul>
            </section>

            <section className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
              <h2 className="flex items-center text-3xl font-bold text-white mb-4">
                <svg
                  className="w-8 h-8 text-blue-400 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M10 2a8 8 0 100 16 8 8 0 000-16zm-1 8a1 1 0 112 0v5a1 1 0 11-2 0v-5zm1-5a1 1 0 100 2 1 1 0 000-2z"
                  />
                </svg>
                Exporting Your Report
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                When your assessment is complete, click the <strong>"Download full Report"</strong> button. The report will include:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-3 text-lg text-gray-300">
                <li>A summary of your scores per ISO clause.</li>
                <li>A radar chart visualization of your performance.</li>
                <li>A list of improvement suggestions.</li>
              </ul>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;