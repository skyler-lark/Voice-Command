"use client";

import React, { useState, useEffect, useRef, useCallback, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";

const NUM_BARS = 60;
const INNER_RADIUS = 110;
const MAX_BAR_LENGTH = 50;

const customStyles = {
  body: {
    background: "linear-gradient(130deg, #050607 0%, #0b0c0d 65%, #0a0a0a 100%)",
  },
};

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function uploadFile(file: File, folder: string) {
  const filePath = `${folder}/${Date.now()}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from("uploads").upload(filePath, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("uploads").getPublicUrl(filePath);
  if (!data?.publicUrl) throw new Error("Could not get public URL.");
  return data.publicUrl;
}

const CircularWaveform = ({ isRecording }: { isRecording: boolean }) => {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const animationIdRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const updateIdleWaveform = useCallback(() => {
    const bars = barsRef.current;
    if (!bars.length) return;

    const time = Date.now() * 0.002;

    bars.forEach((bar, i) => {
      if (!bar) return;
      const wave1 = Math.sin((i / NUM_BARS) * Math.PI * 4 + time) * 0.5;
      const wave2 = Math.cos((i / NUM_BARS) * Math.PI * 4 + time * 0.7) * 0.4;
      const wave3 = Math.sin((i / NUM_BARS) * Math.PI * 8 + time * 1.3) * 0.3;
      const wave4 = Math.cos((i / NUM_BARS) * Math.PI * 2 + time * 0.5) * 0.35;
      const combined = (wave1 + wave2 + wave3 + wave4) / 2 + 0.5;

      let height = 8 + combined * 35;
      const edgeBlendWidth = 4;
      if (i < edgeBlendWidth) {
        const blendFactor = i / edgeBlendWidth;
        const oppositeBar = bars[NUM_BARS - 1 - i];
        const oppositeHeight = oppositeBar ? parseFloat(oppositeBar.style.height) : height;
        height = height * blendFactor + oppositeHeight * (1 - blendFactor);
      } else if (i >= NUM_BARS - edgeBlendWidth) {
        const blendFactor = (NUM_BARS - 1 - i) / edgeBlendWidth;
        const oppositeIndex = edgeBlendWidth - 1 - (NUM_BARS - 1 - i);
        const oppositeBar = bars[oppositeIndex];
        const oppositeHeight = oppositeBar ? parseFloat(oppositeBar.style.height) : height;
        height = height * blendFactor + oppositeHeight * (1 - blendFactor);
      }

      const angle = (i / NUM_BARS) * 2 * Math.PI - Math.PI / 2;
      const colorWave1 = Math.sin((i / NUM_BARS) * Math.PI * 8 + time * 0.5);
      const colorWave2 = Math.cos((i / NUM_BARS) * Math.PI * 8 + time * 0.3);
      const colorWave3 = Math.sin((i / NUM_BARS) * Math.PI * 4 + time * 0.7);
      const colorCombined = (colorWave1 + colorWave2 * 0.5 + colorWave3 * 0.3) / 1.8;
      const colorMix = (colorCombined + 1) / 2;

      const r = Math.floor(67 + (140 - 67) * colorMix);
      const g = Math.floor(156 + (107 - 156) * colorMix);
      const b = Math.floor(132 + (237 - 132) * colorMix);

      bar.style.height = `${height}px`;
      bar.style.transform = `translate(-50%, -100%) rotate(${angle}rad) translateY(-${INNER_RADIUS}px)`;
      bar.style.background = `rgb(${r}, ${g}, ${b})`;
      bar.style.opacity = String(0.4 + combined * 0.5);
    });

    animationIdRef.current = requestAnimationFrame(updateIdleWaveform);
  }, []);

  const updateRecordingWaveform = useCallback(() => {
    const bars = barsRef.current;
    if (!bars.length) return;

    const time = Date.now() * 0.004;

    bars.forEach((bar, i) => {
      if (!bar) return;
      const angle = (i / NUM_BARS) * Math.PI * 2;
      const wave1 = Math.sin(angle * 2 + time * 4) * 0.6;
      const wave2 = Math.cos(angle * 3 + time * 7) * 0.5;
      const wave3 = Math.sin(angle * 5 + time * 3) * 0.4;
      const wave4 = Math.cos(angle + time * 5) * 0.45;
      const combined = Math.abs(wave1 + wave2 + wave3 + wave4) / 2;
      const amplitude = Math.max(0.1, combined);

      let height = 8 + amplitude * MAX_BAR_LENGTH * 1.5;
      const edgeBlendWidth = 4;
      if (i < edgeBlendWidth) {
        const blendFactor = i / edgeBlendWidth;
        const oppositeBar = bars[NUM_BARS - 1 - i];
        const oppositeHeight = oppositeBar ? parseFloat(oppositeBar.style.height) : height;
        height = height * blendFactor + oppositeHeight * (1 - blendFactor);
      } else if (i >= NUM_BARS - edgeBlendWidth) {
        const blendFactor = (NUM_BARS - 1 - i) / edgeBlendWidth;
        const oppositeIndex = edgeBlendWidth - 1 - (NUM_BARS - 1 - i);
        const oppositeBar = bars[oppositeIndex];
        const oppositeHeight = oppositeBar ? parseFloat(oppositeBar.style.height) : height;
        height = height * blendFactor + oppositeHeight * (1 - blendFactor);
      }

      const barAngle = (i / NUM_BARS) * 2 * Math.PI - Math.PI / 2;
      const colorWave1 = Math.sin(time * 3 + i * 0.8);
      const colorWave2 = Math.cos(time * 5 + i * 0.6);
      const colorWave3 = Math.sin(time * 2 + i * 1.2);
      const colorCombined = (colorWave1 + colorWave2 * 0.7 + colorWave3 * 0.5) / 2.2;
      const colorMix = (colorCombined + 1) / 2;

      const brightness = 1 + amplitude * 0.6;
      const saturationBoost = 1 + amplitude * 0.3;

      const r = Math.min(255, Math.floor((67 + (140 - 67) * colorMix) * brightness * saturationBoost));
      const g = Math.min(255, Math.floor((156 + (107 - 156) * colorMix) * brightness));
      const b = Math.min(255, Math.floor((132 + (237 - 132) * colorMix) * brightness * saturationBoost));

      bar.style.height = `${height}px`;
      bar.style.transform = `translate(-50%, -100%) rotate(${barAngle}rad) translateY(-${INNER_RADIUS}px)`;
      bar.style.background = `rgb(${r}, ${g}, ${b})`;
      bar.style.opacity = String(0.5 + amplitude * 0.5);

      const glowR = Math.floor(67 + (140 - 67) * colorMix);
      const glowG = Math.floor(156 + (107 - 156) * colorMix);
      const glowB = Math.floor(132 + (237 - 132) * colorMix);
      bar.style.boxShadow = amplitude > 0.6 ? `0 0 ${8 + amplitude * 12}px rgba(${glowR}, ${glowG}, ${glowB}, ${amplitude * 0.7})` : "none";
    });

    animationIdRef.current = requestAnimationFrame(updateRecordingWaveform);
  }, []);

  useEffect(() => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    if (isRecording) {
      updateRecordingWaveform();
    } else {
      updateIdleWaveform();
    }
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isRecording, updateIdleWaveform, updateRecordingWaveform]);

  const bars = [];
  for (let i = 0; i < NUM_BARS; i++) {
    const angle = (i / NUM_BARS) * 2 * Math.PI - Math.PI / 2;
    bars.push(
      <div
        key={i}
        data-waveform-bar
        ref={(el) => {
          barsRef.current[i] = el;
        }}
        style={{
          position: "absolute",
          width: "3px",
          height: "12px",
          background: "linear-gradient(to top, #439c84 0%, #8c6bed 100%)",
          borderRadius: "1.5px",
          opacity: "0.7",
          left: "50%",
          top: "50%",
          transformOrigin: "center bottom",
          transform: `translate(-50%, -100%) rotate(${angle}rad) translateY(-${INNER_RADIUS}px)`,
          transition: "all 0.15s ease-out",
        }}
      />
    );
  }

  return (
    <div ref={containerRef} className="absolute w-full h-full pointer-events-none">
      {bars}
    </div>
  );
};

export default function RecorderUpload() {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [statusText, setStatusText] = useState("Ready.");
  const [fileName, setFileName] = useState("Choose File...");
  const [resultText, setResultText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isHoveringRecord, setIsHoveringRecord] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState("");
  const [interimTranscription, setInterimTranscription] = useState("");
  const [recordings, setRecordings] = useState<{ blob: Blob; file: File; url: string }[]>([]);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect((): (() => void) => {
    const styleEl = document.createElement("style");
    styleEl.textContent = `
      body { margin: 0; }
      @import url('https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&display=swap');

      textarea::-webkit-scrollbar { width: 8px; }
      textarea::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.5); border-radius: 4px; }
      textarea::-webkit-scrollbar-thumb { background: rgba(67, 156, 132, 0.5); border-radius: 4px; }
      textarea::-webkit-scrollbar-thumb:hover { background: rgba(67, 156, 132, 0.8); }
      input[type="file"]::file-selector-button { display: none; }
      @keyframes ping-anim { 75%, 100% { transform: scale(2); opacity: 0; } }
      @keyframes pulse-anim { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      @keyframes spin-anim { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .animate-ping-custom { animation: ping-anim 1s cubic-bezier(0, 0, 0.2, 1) infinite; }
      .animate-pulse-custom { animation: pulse-anim 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      .animate-spin-custom { animation: spin-anim 1s linear infinite; }

      /* Audio player styling */
      audio::-webkit-media-controls-panel {
        background: transparent;
      }
      audio::-webkit-media-controls-play-button {
        background-color: #439c84;
        border-radius: 50%;
      }
      audio::-webkit-media-controls-timeline {
        background-color: rgba(140, 107, 237, 0.3);
        border-radius: 4px;
      }
      audio::-webkit-media-controls-current-time-display,
      audio::-webkit-media-controls-time-remaining-display {
        color: #8c6bed;
      }
    `;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  const [sectionHeight, setSectionHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => setSectionHeight(window.innerHeight * 0.9);
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Web Speech API not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setInterimTranscription("");
      setLiveTranscription("");
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + " ";
        } else {
          interim += transcript;
        }
      }

      setInterimTranscription(interim);
      if (final) {
        setLiveTranscription((prev) => prev + final);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      // Recognition ends when user stops speaking
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  useEffect(() => {
    if (isRecording) {
      const mins = Math.floor(seconds / 60)
        .toString()
        .padStart(2, "0");
      const secs = (seconds % 60).toString().padStart(2, "0");
      setStatusText(`Recording... ${mins}:${secs}`);
    }
  }, [seconds, isRecording]);

  const handleRecordClick = async () => {
    if (!isRecording) {
      try {
        setStatusText("Requesting microphone permission...");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        chunksRef.current = [];

        // Use a MIME type the browser actually supports
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/mp4")
            ? "audio/mp4"
            : "";
        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunksRef.current.push(event.data);
        };

        recorder.onstop = () => {
          const actualType = recorder.mimeType || "audio/webm";
          const ext = actualType.includes("mp4") ? "mp4" : actualType.includes("aac") ? "aac" : "webm";
          const blob = new Blob(chunksRef.current, { type: actualType });
          const file = new File([blob], `recording-${Date.now()}.${ext}`, { type: actualType });
          const url = URL.createObjectURL(blob);
          setAudioFile(file);
          setRecordings((prev) => [...prev, { blob, file, url }]);

          // Stop speech recognition
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }

          setStatusText("Processing complete. Ready for playback or upload.");
        };

        recorder.start();

        // Start speech recognition
        if (recognitionRef.current) {
          setLiveTranscription("");
          setInterimTranscription("");
          recognitionRef.current.start();
        }

        setIsRecording(true);
        setResultText("");
      } catch (error) {
        setStatusText(`Recording failed: ${(error as Error).message}`);
      }
    } else {
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const handleFileChange = (e: FormEvent<HTMLInputElement>) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files.length > 0) {
      const file = files[0];
      const name = file.name;
      const displayName = name.length > 20 ? name.substring(0, 17) + "..." : name;
      setFileName(displayName);
      setAttachedFile(file);
      setStatusText(`File selected: ${name}`);
    }
  };

  const handleDone = async () => {
    if (isUploading || !audioFile) {
      if (!audioFile) setStatusText("Please record audio first.");
      return;
    }

    setIsUploading(true);
    setStatusText("Uploading audio...");
    setResultText("");

    try {
      const audioUrl = await uploadFile(audioFile, "audio");
      let attachmentUrl = "None";

      if (attachedFile) {
        setStatusText("Uploading attachment...");
        attachmentUrl = await uploadFile(attachedFile, "attachments");
      }

      const transcriptionText = liveTranscription.trim() || "(No transcription captured)";
      setResultText(`Success.\n\nLive Transcription:\n${transcriptionText}\n\nAudio URL:\n${audioUrl}\n\nAttachment URL:\n${attachmentUrl}`);
      setStatusText("Upload complete. Audio sent to n8n workflow.");
    } catch (error) {
      setStatusText(`Upload failed: ${(error as Error).message}`);
      setResultText(`Upload failed:\n${(error as Error).message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Web Audio API for waveform voice responsiveness
  useEffect(() => {
    if (!isRecording || !mediaRecorderRef.current) return;

    const stream = mediaRecorderRef.current.stream;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContext.resume();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animationId: number;

    // Calculate frequency cutoff (8000Hz max)
    const nyquist = audioContext.sampleRate / 2;
    const maxFreqIndex = Math.floor((8000 / nyquist) * dataArray.length);

    const updateWaveform = () => {
      analyser.getByteFrequencyData(dataArray);
      const bars = document.querySelectorAll<HTMLDivElement>('[data-waveform-bar]');
      const barCount = bars.length;

      bars.forEach((bar, i) => {
        // Use only frequencies up to 8000Hz
        const index = Math.floor((i / barCount) * maxFreqIndex);
        const frequency = dataArray[index];
        // Increase responsiveness by 20% (60 * 1.2 = 72)
        const normalizedHeight = 8 + (frequency / 255) * 72;
        bar.style.height = `${normalizedHeight}px`;
      });

      animationId = requestAnimationFrame(updateWaveform);
    };

    updateWaveform();

    return () => {
      cancelAnimationFrame(animationId);
      source.disconnect();
      analyser.disconnect();
      audioContext.close();
    };
  }, [isRecording]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    let isAnimating = false;

    const handleWheel = (e: WheelEvent) => {
      if (isAnimating) return;

      // Find the first section (header) to calculate scroll target
      const firstSection = scrollContainer.querySelector('section');
      if (!firstSection) return;

      const firstSectionHeight = firstSection.clientHeight;
      const currentScroll = scrollContainer.scrollTop;

      // Only trigger animation when scrolling down and not already at target
      if (e.deltaY > 0 && currentScroll < firstSectionHeight - 10) {
        e.preventDefault();
        isAnimating = true;

        // Disable scrolling during animation
        scrollContainer.style.overflow = 'hidden';

        const startScroll = currentScroll;
        const targetScroll = firstSectionHeight;
        const distance = targetScroll - startScroll;
        const duration = 500;
        const startTime = Date.now();

        const easeInOutQuad = (t: number) => {
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        };

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeProgress = easeInOutQuad(progress);

          scrollContainer.scrollTop = startScroll + distance * easeProgress;

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            // Re-enable scrolling after animation
            scrollContainer.style.overflow = 'auto';
            isAnimating = false;
          }
        };

        animate();
      }
    };

    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
    return () => scrollContainer.removeEventListener('wheel', handleWheel);
  }, []);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      recordings.forEach((rec) => URL.revokeObjectURL(rec.url));
    };
  }, [recordings]);

  return (
    <div className="min-h-screen w-full flex items-start justify-center p-0 text-white antialiased" style={{ ...customStyles.body, paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <main className="w-full bg-[#050607] border-2 border-[#439c84] rounded-[50px] flex flex-col relative z-10 overflow-hidden" style={{ width: "min(420px, 92vw)", maxHeight: "min(90dvh, 800px)", height: "90dvh", boxShadow: "0 14px 45px rgba(0,0,0,0.45)", marginTop: "auto", marginBottom: "auto" }}>
        <div className="relative h-full overflow-hidden">
          <div className="h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth record-scroll-container" ref={scrollContainerRef} style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
            <section className="h-auto snap-start px-[24px] flex flex-col items-center justify-start gap-5" style={{ paddingTop: "8vh", paddingBottom: "2vh" }}>
              <h1 style={{ fontFamily: "Silkscreen, sans-serif" }} className="text-[44px] font-[600] text-center tracking-[0.03em] mb-[6px] leading-tight drop-shadow-lg"><span className="text-white">Voice </span><span style={{ color: "#439c84" }}>COMMAND</span></h1>
              <h2 className="text-[18px] text-[#d1d5db] text-center mb-[8px] font-[300]">Record or upload files</h2>
              <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#0b0c0d] border border-[#439c84]">
                <span className="text-[12px] uppercase text-[#9ca3af] text-center font-bold tracking-widest flex items-center gap-2">
                  <span style={{ color: "#439c84", fontSize: "14px" }}>✓</span>
                  BUILD 0.2.0
                </span>
              </div>
            </section>

            <section className="h-[50vh] snap-start px-[24px] flex flex-col items-center justify-center">
              <div className="relative w-[260px] h-[260px] flex items-center justify-center">
                <CircularWaveform isRecording={isRecording} />
                <button
                  onClick={handleRecordClick}
                  disabled={isUploading}
                  onMouseEnter={() => setIsHoveringRecord(true)}
                  onMouseLeave={() => setIsHoveringRecord(false)}
                  className="w-[180px] h-[180px] rounded-full border-2 text-white flex items-center justify-center transition-all duration-500 active:scale-95 group relative z-10"
                  style={{
                    borderColor: isRecording ? "#8c6bed" : "#439c84",
                    background: isRecording
                      ? "linear-gradient(to bottom right, #2ecc71, rgba(46,204,113,0.8))"
                      : "linear-gradient(to bottom right, #8c6bed, rgba(140,107,237,0.8))",
                    boxShadow: isHoveringRecord
                      ? isRecording
                        ? "0 8px 30px rgba(46,204,113,0.4), 0 0 50px rgba(46,204,113,0.2)"
                        : "0 8px 30px rgba(140,107,237,0.4), 0 0 50px rgba(140,107,237,0.2)"
                      : isRecording
                        ? "0 4px 20px rgba(46,204,113,0.3), 0 0 30px rgba(46,204,113,0.15)"
                        : "0 4px 20px rgba(140,107,237,0.3), 0 0 30px rgba(140,107,237,0.15)",
                    transform: isHoveringRecord && !isUploading ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  <div className="absolute inset-0 rounded-full border-2 animate-ping-custom" style={{ borderColor: isRecording ? "rgba(67,156,132,0.3)" : "rgba(140,107,237,0.3)", opacity: isHoveringRecord && !isUploading ? 1 : 0 }} />
                  <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(to top right, rgba(255,255,255,0.08), transparent, rgba(140,107,237,0.15))" }} />
                  <div
                    className="w-[16px] h-[16px] transition-all duration-300"
                    style={{
                      borderRadius: isRecording ? "2px" : "50%",
                      background: isRecording ? "#8c6bed" : "#439c84",
                      boxShadow: isRecording
                        ? "0 0 12px rgba(140,107,237,0.5), 0 0 6px rgba(140,107,237,0.3)"
                        : "0 0 10px rgba(67,156,132,0.5), 0 0 5px rgba(67,156,132,0.2)",
                    }}
                  />
                </button>
              </div>
            </section>

            <section className="h-[90vh] snap-start px-[24px] py-[16px] overflow-y-auto flex flex-col items-center">
              <div className="flex flex-col items-center w-full max-w-[380px] gap-8" style={{paddingTop: '3vh'}}>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <button onClick={() => fileInputRef.current?.click()} className="w-full rounded-[20px] border-2 border-[#439c84] bg-[#0f172a] text-[#439c84] text-[18px] font-[500] px-[16px] py-[16px] flex items-center justify-center gap-2 transition-all duration-300 hover:bg-[#439c84] hover:text-[#050607] hover:border-[#439c84] active:scale-[0.98]" style={{ marginBottom: '10px' }}>
                  {fileName}
                </button>
                <button onClick={handleDone} disabled={isUploading || !audioFile} className="w-full rounded-[20px] border-2 border-[#439c84] bg-[#0f172a] text-[#439c84] text-[18px] font-[500] px-[16px] py-[16px] flex items-center justify-center gap-2 transition-all duration-300 hover:bg-[#439c84] hover:text-[#050607] hover:border-[#439c84] active:scale-[0.98]" style={{ opacity: isUploading || !audioFile ? 0.5 : 1, marginBottom: '10px' }}>
                  Send to workflow
                </button>

                <div className="w-full pt-4" style={{ marginBottom: '10px' }}>
                  <p className="text-[#439c84] text-[14px] font-mono overflow-wrap-anywhere">{statusText}</p>
                </div>

                {isRecording && (liveTranscription || interimTranscription) && (
                  <div className="w-full bg-[#0f172a] border-2 border-[#8c6bed] rounded-[20px] p-[20px] max-h-[120px] overflow-y-auto" style={{ marginBottom: '10px' }}>
                    <p className="text-[#a5b4fc] text-[14px] leading-relaxed font-medium">
                      {liveTranscription}
                      {interimTranscription && <span className="opacity-60 italic">{interimTranscription}</span>}
                    </p>
                  </div>
                )}

                {recordings.length > 0 && recordings.map((rec, index) => (
                  <div key={rec.url} className="w-full rounded-[20px] border-2 border-[#439c84] p-[16px]" style={{ marginBottom: '6px', background: 'transparent' }}>
                    <p className="text-[#8c6bed] text-[12px] font-mono font-medium" style={{ marginBottom: '8px' }}>Recording {index + 1}</p>
                    <audio
                      src={rec.url}
                      controls
                      playsInline
                      onError={(e) => {
                        const audio = e.currentTarget;
                        setStatusText(`Playback error (Recording ${index + 1}): ${audio.error?.message || "Unknown error"} [code ${audio.error?.code}]`);
                      }}
                      className="w-full"
                      style={{ height: "48px", borderRadius: "12px" }}
                    />
                  </div>
                ))}

                <div className="relative w-full group">
                  <div className="absolute -inset-0.5 rounded-[16px] blur transition duration-500" style={{ background: "linear-gradient(to right, rgba(67,156,132,0.3), rgba(140,107,237,0.3))", opacity: 0.2 }} />
                  <textarea readOnly placeholder="Upload results will appear here..." value={resultText} className="relative w-full min-h-[110px] rounded-[20px] bg-[#0f172a] border-2 border-[#439c84] text-[#a5b4fc] text-[14px] font-mono leading-relaxed p-[20px] whitespace-pre-wrap outline-none resize-y focus:border-[#8c6bed] transition-colors duration-300" style={{ boxShadow: "inset 0 2px 10px rgba(0,0,0,0.2)" }} />
                </div>
              </div>
            </section>
        </div>
      </div>
    </main>

      <div className="fixed pointer-events-none z-0" style={{ top: "-10%", left: "-10%", width: "40%", height: "40%", background: "rgba(67,156,132,0.05)", borderRadius: "50%", filter: "blur(120px)" }} />
      <div className="fixed pointer-events-none z-0" style={{ bottom: "-10%", right: "-10%", width: "40%", height: "40%", background: "rgba(140,107,237,0.05)", borderRadius: "50%", filter: "blur(120px)" }} />
    </div>
  );
}