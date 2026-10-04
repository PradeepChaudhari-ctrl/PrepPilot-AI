"use client";

// Types for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.speechSynthesis);
}

export class SpeechRecognitionManager {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor(
    private lang: string = "en-IN",
    private onResult: (transcript: string, isFinal: boolean) => void,
    private onError: (error: string) => void,
    private onEnd: () => void
  ) {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.lang;

        this.recognition.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          const combined = (finalTranscript + " " + interimTranscript).trim();
          this.onResult(combined, Boolean(finalTranscript));
        };

        this.recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          this.onError(event.error);
        };

        this.recognition.onend = () => {
          this.isListening = false;
          this.onEnd();
        };
      }
    }
  }

  public setLanguage(lang: string) {
    this.lang = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public start() {
    if (!this.recognition) {
      this.onError("Speech recognition is not supported in this browser. Please use keyboard input.");
      return;
    }
    if (this.isListening) return;

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e: any) {
      console.warn("Speech start exception:", e);
    }
  }

  public stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.isListening = false;
    }
  }

  public getStatus(): boolean {
    return this.isListening;
  }
}

/**
 * Text-to-Speech: AI Interviewer speaking out loud in Indian English
 */
export function speakText(text: string, lang: string = "en-IN", onEnd?: () => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  try {
    window.speechSynthesis.cancel(); // cancel any active utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick Indian voice if available
    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find((v) => v.lang === "en-IN" || v.lang === "hi-IN" || v.name.includes("India"));
    if (indianVoice) {
      utterance.voice = indianVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error("SpeechSynthesis error:", err);
  }
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
