import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import OpenAI from "openai";

export default function App() {
  const [listening, setListening] = useState(false);
  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("Hello! I am your AI assistant. How can I help you today?");
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);

  const recognitionRef = useRef(null);
  const isRecognizing = useRef(false);

  // OPENROUTER
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  // SPEECH RECOGNITION SETUP
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event) => {
      const current = event.resultIndex;

      if (!event.results[current].isFinal) return;

      const finalText =
        event.results[current][0].transcript;

      console.log("YOU:", finalText);

      setUserText(finalText);

      recognition.stop();
      isRecognizing.current = false;
      setListening(false);

      if (finalText.trim().length < 2) return;

      await handleAI(finalText);
    };

    recognition.onend = () => {
      isRecognizing.current = false;
      setListening(false);
    };

    recognition.onerror = (event) => {
      console.log("Speech error:", event.error);
      isRecognizing.current = false;
      setListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  // SPEAK FUNCTION (ANDROID SAFE)
  const speak = (text) => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      isRecognizing.current = false;
    }

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = "en-IN";
    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(v => v.lang === "en-IN");

    if (indianVoice) {
      speech.voice = indianVoice;
    }

    setSpeaking(true);

    speech.onend = () => {
      setSpeaking(false);

      // IMPORTANT DELAY FOR ANDROID
      setTimeout(() => {
        try {
          if (!isRecognizing.current) {
            recognitionRef.current.start();
            isRecognizing.current = true;
            setListening(true);
          }
        } catch (err) {
          console.log("Mic restart error:", err);
        }
      }, 1200);
    };

    window.speechSynthesis.speak(speech);
  };

  // AI CALL
  const handleAI = async (text) => {
    if (!text.trim() || loading) return;

    try {
      setLoading(true);
      setAiText("Thinking...");

      const completion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: text }],
      });

      const response = completion.choices[0].message.content;

      console.log("AI:", response);

      setAiText(response);

      const cleanText = response
        .replace(/[#*_`>-]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      speak(cleanText);
    } catch (error) {
      console.log(error);
      setAiText("Connection failed");
    } finally {
      setLoading(false);
    }
  };

  // START LISTENING BUTTON
  const startListening = async () => {
    if (speaking || loading) return;

    try {
      window.speechSynthesis.cancel();

      if (isRecognizing.current) return;

      await navigator.mediaDevices.getUserMedia({ audio: true });

      setTimeout(() => {
        try {
          recognitionRef.current.start();
          isRecognizing.current = true;
          setListening(true);
        } catch (err) {
          console.log(err);
        }
      }, 800);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="app">
      <h1>AI Voice Assistant</h1>

      <div className={listening ? "circle active" : "circle"}>
        <span>AI</span>
      </div>

      <button onClick={startListening}>
        {listening ? "Listening..." : "Start Talking"}
      </button>

      <div className="box">
        <h2>Your Question</h2>
        <p>{userText}</p>
      </div>

      <div className="box">
        <h2>AI Reply</h2>
        <p>{aiText}</p>
      </div>
    </div>
  );
}