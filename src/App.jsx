import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import "./App.css";

import OpenAI from "openai";

export default function App() {

  const [listening, setListening] =
    useState(false);

  const [userText, setUserText] =
    useState("");

  const [aiText, setAiText] =
    useState("Hello! I am your AI assistant. How can I help you today?");

  const recognitionRef =
    useRef(null);

  // OPENROUTER
  const openai = new OpenAI({

    baseURL:
      "https://openrouter.ai/api/v1",

    apiKey:
      import.meta.env
        .VITE_OPENROUTER_API_KEY,

    dangerouslyAllowBrowser: true,
  });

  // SPEECH SETUP
  useEffect(() => {

    const SpeechRecognition =

      window.SpeechRecognition ||

      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

      alert(
        "Speech Recognition not supported"
      );

      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang =
      "en-US";

    recognition.continuous =
      false;

    recognition.interimResults =
      false;

    recognition.onresult =
      async (event) => {

      const text =

        event.results[0][0]
          .transcript;

      console.log(text);

      setUserText(text);

      await handleAI(text);
    };

    recognition.onend = () => {

      setListening(false);
    };

    recognitionRef.current =
      recognition;

  }, []);

  // SPEAK
const speak = (text) => {

  // STOP MIC
  if (recognitionRef.current) {

    recognitionRef.current.stop();
  }

  window.speechSynthesis.cancel();

  const speech =

    new SpeechSynthesisUtterance(
      text
    );

  speech.lang = "en-IN";

  speech.rate = 1;

  speech.pitch = 1;

  // AFTER AI SPEAKS
  speech.onend = () => {

  setListening(false);

  // restart mic automatically
  setTimeout(() => {

    try {

      recognitionRef.current.start();

    }

    catch (err) {

      console.log(err);
    }

  }, 500);
};
  window.speechSynthesis
    .speak(speech);
};

  // AI
  const handleAI =
    async (text) => {

    try {

      setAiText(
        "Thinking..."
      );

      const completion =

        await openai.chat
          .completions.create({

        model:
          "openai/gpt-4o-mini",

        messages: [

          {
            role: "user",

            content: text,
          },
        ],

      });

      const response =

  completion.choices[0]
    .message.content;

console.log(
  "AI:",
  response
);

// SHOW ORIGINAL TEXT
setAiText(response);

// CLEAN TEXT FOR VOICE
const cleanText = response

  // remove markdown symbols
  .replace(/[#*_`>-]/g, "")

  // remove extra spaces
  .replace(/\s+/g, " ")

  // trim spaces
  .trim();

// SPEAK CLEAN TEXT
speak(cleanText);

    }

    catch (error) {

      console.log(error);

      setAiText(
        "Connection failed"
      );
    }
  };

  // START MIC
  const startListening =
    async () => {

    try {

      await navigator
        .mediaDevices
        .getUserMedia({
          audio: true,
        });

      recognitionRef.current
        .start();

      setListening(true);

    }

    catch (err) {

      console.log(err);
    }
  };

  return (

    <div className="app">

      <h1>
        AI Voice Assistant
      </h1>

      <div
  className={
    listening
      ? "circle active"
      : "circle"
  }
>
  <span>AI</span>
</div>

      <button
  onClick={() => {

    // stop old AI voice
    window.speechSynthesis.cancel();

    // start mic
    startListening();
  }}
>
  {listening
    ? "Listening..."
    : "Start Talking"}
</button>

      <div className="box">

        <h2>Your Questions</h2>

        <p>{userText}</p>

      </div>

      <div className="box">

        <h2>AI Reply</h2>

        <p>{aiText}</p>

      </div>

    </div>
  );
}