/* eslint-disable react/no-unescaped-entities */
import React from "react";

const HelpPage = () => {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">🛠️ Help: ISO Evaluation Chatbot</h1>

      <section className="mb-8">
        <p className="text-lg">
          Welcome to the <strong>ISO Evaluation Chatbot</strong>! This tool is designed to guide your
          organization through a self-assessment process aligned with international standards such
          as <strong>ISO 9001</strong>, <strong>ISO/IEC 27001</strong>, <strong>ISO/IEC 42001</strong>, and more.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">🤖 What Does the Chatbot Do?</h2>
        <ul className="list-disc list-inside space-y-1 text-base">
          <li>Asks chapter-specific questions based on the selected ISO standard.</li>
          <li>Analyzes your answers using AI (semantic analysis).</li>
          <li>Scores each response with labels: Conformant, Acceptable, Needs Improvement, Non-Conformant.</li>
          <li>Provides recommendations based on your answers.</li>
          <li>Displays a radar chart summarizing your performance.</li>
          <li>Generates a PDF report with scores, graphs, and analysis.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">📝 How to Use the Chatbot</h2>
        <ol className="list-decimal list-inside space-y-1 text-base">
          <li>Choose the ISO standard you want to evaluate.</li>
          <li>Answer the chatbot’s questions clearly and honestly.</li>
          <li>View real-time evaluations for each response.</li>
          <li>Review radar charts at the end of each chapter.</li>
          <li>Download your full PDF report at the end of the evaluation.</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">📊 Understanding the Evaluation Labels</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2">Label</th>
                <th className="border border-gray-300 px-4 py-2">Meaning</th>
                <th className="border border-gray-300 px-4 py-2">Score Range</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2">✅ Conformant</td>
                <td className="border border-gray-300 px-4 py-2">Fully meets ISO requirements</td>
                <td className="border border-gray-300 px-4 py-2">90–100%</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">⚠️ Acceptable</td>
                <td className="border border-gray-300 px-4 py-2">Generally compliant, but could be improved</td>
                <td className="border border-gray-300 px-4 py-2">70–89%</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">🛠️ Needs Improvement</td>
                <td className="border border-gray-300 px-4 py-2">Key elements missing or unclear</td>
                <td className="border border-gray-300 px-4 py-2">50–69%</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">❌ Non-Conformant</td>
                <td className="border border-gray-300 px-4 py-2">Does not meet ISO criteria or lacks evidence</td>
                <td className="border border-gray-300 px-4 py-2">0–49%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">📌 Tips for Accurate Evaluation</h2>
        <ul className="list-disc list-inside space-y-1 text-base">
          <li>Provide detailed responses, including examples or references to documents.</li>
          <li>Be objective and transparent—this is a self-assessment tool.</li>
          <li>If unsure, consult your quality manager or ISO coordinator.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">🧾 Exporting Your Report</h2>
        <p className="text-base">
          When your assessment is complete, click the <strong>"Download Report"</strong> button.
          The report will include:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-base">
          <li>Summary of your scores per ISO clause</li>
          <li>Radar chart visualization</li>
          <li>Answer-by-answer evaluations</li>
          <li>List of improvement suggestions</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">📩 Need Help?</h2>
        <p className="text-base">
          If you encounter any technical issues or need support interpreting your results,
          contact us at: <strong>support@yourdomain.com</strong>
        </p>
      </section>
    </div>
  );
};

export default HelpPage;
