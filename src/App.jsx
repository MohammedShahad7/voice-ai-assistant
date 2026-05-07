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
    useState("Hello boss");

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

    const speech =

      new SpeechSynthesisUtterance(
        text
      );

    speech.lang = "en-US";

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

      setAiText(response);

      speak(response);

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
        AI
      </div>

      <button
        onClick={
          startListening
        }
      >
        {listening
          ? "Listening..."
          : "Start Talking"}
      </button>

      <div className="box">

        <h2>You Said</h2>

        <p>{userText}</p>

      </div>

      <div className="box">

        <h2>AI Reply</h2>

        <p>{aiText}</p>

      </div>

    </div>
  );
}