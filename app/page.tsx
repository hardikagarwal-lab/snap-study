"use client";
import { useState } from "react";

export default function Home() {
  const [notes, setNotes] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [quiz, setQuiz] = useState("");
  const [answers, setAnswers] = useState("");
  const [showAnswers, setShowAnswers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // NEW: State for the exact number of questions (with your defaults)
  const [numMCQ, setNumMCQ] = useState(15);
  const [numQnA, setNumQnA] = useState(10);

  // Your requested options
  const mcqOptions = [10, 15, 20, 30, 40, 45, 50];
  const qnaOptions = [5, 10, 15, 20, 30, 40, 45, 50];

  const fileToGenerativePart = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result.split(',')[1];
        resolve({ base64: base64Data, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    });
  };

  const generateQuiz = async () => {
    if (!notes && imageFiles.length === 0) {
      setErrorMsg("Please type some notes or upload at least one image of your textbook!");
      return;
    }

    setLoading(true);
    setQuiz("");
    setAnswers("");
    setShowAnswers(false);
    setErrorMsg("");

    try {
      // NEW: We pack the selected numbers into the payload sent to the brain
      let payload = { notes, numMCQ, numQnA };

      if (imageFiles.length > 0) {
        const imagePromises = imageFiles.map(file => fileToGenerativePart(file));
        const imageParts = await Promise.all(imagePromises);
        payload.images = imageParts;
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.result) {
        if (data.result.includes("IMAGE_UNCLEAR")) {
          setErrorMsg("Oops! One or more images are not clear enough. Please re-upload.");
        } else {
          const parts = data.result.split("---ANSWER_KEY---");
          setQuiz(parts[0].trim());
          if (parts[1]) {
            setAnswers(parts[1].trim());
          }
        }
      } else {
        setErrorMsg("Something went wrong on the server.");
      }
    } catch (error) {
      setErrorMsg("Error connecting to the AI.");
    }
    
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center py-12 px-6">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-xl p-8">
        <h1 className="text-4xl font-extrabold text-blue-600 mb-2">Snap-Study AI 📸</h1>
        <p className="text-gray-600 mb-6 font-medium">
          Upload your textbook pages and customize your practice test.
        </p>

        <div className="flex flex-col gap-4 mb-6">
          <input 
            type="file" 
            multiple
            accept="image/*"
            onChange={(e) => setImageFiles(Array.from(e.target.files))}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-300 rounded-lg"
          />
          
          {imageFiles.length > 0 && (
            <div className="text-sm text-green-600 font-bold">
              ✅ {imageFiles.length} image(s) selected and ready!
            </div>
          )}

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-gray-800"
            placeholder="Type or paste extra notes here..."
          ></textarea>
        </div>

        {/* --- NEW QUIZ SETTINGS PANEL --- */}
        <div className="mb-6 p-5 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
          <h3 className="font-extrabold text-gray-800 mb-4 border-b pb-2">⚙️ Quiz Settings</h3>

          <div className="mb-5">
            <label className="block text-sm font-bold text-gray-700 mb-2">Number Of MCQ:</label>
            <div className="flex flex-wrap gap-4">
              {mcqOptions.map(num => (
                <label key={`mcq-${num}`} className="flex items-center gap-2 cursor-pointer hover:bg-gray-200 p-1 rounded transition">
                  <input type="radio" name="mcq" value={num} checked={numMCQ === num} onChange={() => setNumMCQ(num)} className="w-5 h-5 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  <span className="text-gray-800 font-medium">{num}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Number Of Q&A:</label>
            <div className="flex flex-wrap gap-4">
              {qnaOptions.map(num => (
                <label key={`qna-${num}`} className="flex items-center gap-2 cursor-pointer hover:bg-gray-200 p-1 rounded transition">
                  <input type="radio" name="qna" value={num} checked={numQnA === num} onChange={() => setNumQnA(num)} className="w-5 h-5 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  <span className="text-gray-800 font-medium">{num}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        {/* --- END QUIZ SETTINGS --- */}

        {errorMsg && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg font-semibold">
            {errorMsg}
          </div>
        )}

        <button 
          onClick={generateQuiz}
          disabled={loading}
          className="w-full bg-blue-600 text-white font-extrabold py-4 rounded-lg hover:bg-blue-700 transition duration-200 shadow-md disabled:bg-blue-300 text-lg"
        >
          {loading ? "Analyzing and Generating..." : `Generate ${numMCQ + numQnA} Questions`}
        </button>

        {quiz && (
          <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-inner">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">Your Practice Quiz</h2>
            <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">{quiz}</div>
            
            {answers && (
              <div className="mt-8 border-t pt-6 text-center">
                <button 
                  onClick={() => setShowAnswers(!showAnswers)}
                  className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition"
                >
                  {showAnswers ? "Hide Answer Key" : "View Answer Key"}
                </button>

                {showAnswers && (
                  <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg text-left shadow-inner">
                    <h3 className="text-2xl font-bold text-green-800 mb-4">Answer Key</h3>
                    <div className="text-gray-800 whitespace-pre-wrap">{answers}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}