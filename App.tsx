import React, { useState, useRef, useEffect, useCallback } from 'react';
import { STYLES } from './constants';
import { StyleOption, AppState } from './types';
import { generateArchaeologyImage } from './services/geminiService';
import { uploadImageToFirebase } from './services/storageService';
import { QRCodeCanvas } from 'qrcode.react';

// Helper function to merge overlay image onto the base image
const applyOverlay = (baseImageStr: string): Promise<string> => {
  return new Promise((resolve) => {
    const baseImg = new Image();
    const overlayImg = new Image();

    // If anything fails, return the original image without overlay
    const failSafe = (reason: string) => {
      console.warn("Overlay skipped:", reason);
      resolve(baseImageStr);
    };

    baseImg.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return failSafe("No Canvas Context");

      // Calculate 4:5 cropping (Target Ratio = 0.8)
      // Since Gemini returns 3:4 (0.75), which is narrower,
      // we crop the height to achieve 4:5.
      const targetRatio = 0.8;
      const originalWidth = baseImg.naturalWidth;
      const originalHeight = baseImg.naturalHeight;

      let drawWidth = originalWidth;
      let drawHeight = originalWidth / targetRatio;
      let offsetY = (originalHeight - drawHeight) / 2;
      let offsetX = 0;

      // Fallback if for some reason the image is wider than 4:5
      if (drawHeight > originalHeight) {
        drawHeight = originalHeight;
        drawWidth = originalHeight * targetRatio;
        offsetX = (originalWidth - drawWidth) / 2;
        offsetY = 0;
      }

      canvas.width = drawWidth;
      canvas.height = drawHeight;

      // 1. Draw the AI Image with cropping to 4:5
      ctx.drawImage(
        baseImg,
        offsetX, offsetY, drawWidth, drawHeight, // Source
        0, 0, drawWidth, drawHeight               // Destination
      );

      // 2. Load and Draw the Overlay
      overlayImg.onload = () => {
        // Draw overlay stretched to fit the 4:5 image perfectly
        ctx.drawImage(overlayImg, 0, 0, canvas.width, canvas.height);

        try {
          const finalData = canvas.toDataURL('image/png');
          resolve(finalData);
        } catch (e) {
          failSafe("Canvas Export Failed");
        }
      };

      overlayImg.onerror = () => {
        failSafe("Could not load ./overlay.png. Ensure the file exists in the project root.");
      };

      // Use root path which works for files in the 'public' folder
      overlayImg.src = `/overlay.png?t=${Date.now()}`;
    };

    baseImg.onerror = () => failSafe("Base image invalid");
    baseImg.src = baseImageStr;
  });
};

export default function App() {
  const [appState, setAppState] = useState<AppState>('selection');
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [apiKeyReady, setApiKeyReady] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingIconIndex, setLoadingIconIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // --- Fullscreen Logic ---
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const LOADING_ICONS = [
    // Compass
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>,
    // Magnifying Glass
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
    // Puzzle Piece
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M19.439 7.85c0-1.571-1.291-2.85-2.85-2.85H15.08c-.036-1.666-1.4-3-3.08-3s-3.044 1.334-3.08 3H7.411c-1.559 0-2.85 1.279-2.85 2.85v1.509c-1.667.036-3 1.4-3 3.08s1.333 3.044 3 3.08v2.503c0 1.571 1.291 2.85 2.85 2.85h1.509c.036 1.667 1.4 3 3.08 3s3.044-1.333 3.08-3h2.503c1.558 0 2.85-1.279 2.85-2.85v-1.509c1.667-.036 3-1.4 3-3.08s-1.333-3.044-3-3.08V7.85z" /></svg>,
    // Pyramid (Mountain icon with flat top feel)
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M21 20H3L12 4z" /><path d="M12 4v16" /></svg>,
    // Wind
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M9.59 4.59A2 2 0 1 1 11 8H2" /><path d="M12.59 19.41A2 2 0 1 0 14 16H2" /><path d="M15.59 12.41A2 2 0 1 1 17 9H2" /></svg>,
    // Sand (Dunes/Waves)
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M2 18c2-3.5 4-3.5 6 0 2 3.5 4 3.5 6 0 2-3.5 4-3.5 6 0" /><path d="M2 12c2-3.5 4-3.5 6 0 2 3.5 4 3.5 6 0 2-3.5 4-3.5 6 0" /></svg>,
    // Camel (Dinosaur-like placeholder or stylized)
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M18 10h.01" /><path d="M15 10h.01" /><path d="M12 10h.01" /><path d="M2 20h20" /><path d="M4 20v-7a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v7h-2v-4h-2v4h-2v-4H8v4H6v-4H4z" /></svg>
  ];

  // --- Loading Simulation Logic ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (appState === 'generating') {
      setLoadingProgress(0);
      setLoadingIconIndex(0);

      const startTime = Date.now();
      const duration = 30000; // 30 seconds

      interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 99);
        setLoadingProgress(progress);

        // Change icon every 5 seconds
        const currentIconIdx = Math.floor(elapsed / 5000) % LOADING_ICONS.length;
        setLoadingIconIndex(currentIconIdx);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [appState]);

  // --- Carousel Navigation ---
  const [currentStyleIndex, setCurrentStyleIndex] = useState(0);

  useEffect(() => {
    if (selectedStyle) {
      setCurrentStyleIndex(STYLES.findIndex(s => s.id === selectedStyle.id));
    }
  }, [selectedStyle]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // --- Style Navigation & PRELOADING ---
  useEffect(() => {
    STYLES.forEach(style => {
      const img = new Image();
      img.src = style.thumbnail;
    });
  }, []);

  const nextStyle = () => {
    setCurrentStyleIndex((prev) => (prev + 1) % STYLES.length);
  };

  const prevStyle = () => {
    setCurrentStyleIndex((prev) => (prev - 1 + STYLES.length) % STYLES.length);
  };

  // --- API Key Check ---
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        // @ts-ignore
        if (window.aistudio) {
          // @ts-ignore
          const hasKey = await window.aistudio.hasSelectedApiKey();
          if (hasKey) {
            setApiKeyReady(true);
          }
        } else {
          setApiKeyReady(true);
        }
      } catch (e) {
        console.error("Error checking API key", e);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    try {
      // @ts-ignore
      if (window.aistudio) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        setApiKeyReady(true);
      }
    } catch (e) {
      console.error("Error selecting key", e);
    }
  };


  // --- Camera Logic ---
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1080 },
          height: { ideal: 1920 },
          aspectRatio: { ideal: 9 / 16 }
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please allow permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (appState === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [appState]);

  const triggerCapture = () => {
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // Capture now
      captureImage();
      setCountdown(null);
    }
  }, [countdown]);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
        setAppState('preview');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
        setAppState('preview');
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Generation Logic ---
  const handleGenerate = async () => {
    if (!selectedStyle || !capturedImage) return;

    setAppState('generating');
    setProcessingStep("Designing Artifact...");
    setError(null);

    try {
      const rawResult = await generateArchaeologyImage(capturedImage, selectedStyle.prompt);
      setProcessingStep("Applying FTCVN Overlay...");
      const finalResult = await applyOverlay(rawResult);
      setGeneratedImage(finalResult);

      setProcessingStep("Generating Share Link...");
      const url = await uploadImageToFirebase(finalResult);
      setDownloadUrl(url);

      setAppState('result');
    } catch (err) {
      console.error(err);
      setError("Failed to generate image. Please try again.");
      setAppState('preview');
    }
  };

  const resetApp = () => {
    setCapturedImage(null);
    setGeneratedImage(null);
    setSelectedStyle(null);
    setAppState('selection');
    setError(null);
  };

  // --- Render Views (KIOSK MODE - TOP CONTROLS) ---

  if (!apiKeyReady) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-950 text-amber-50 p-6 text-center">
        <h1 className="text-4xl brand-font text-amber-500 mb-6">FTCVN: Decode AI</h1>
        <button
          onClick={handleSelectKey}
          className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 px-10 rounded-full text-xl shadow-lg"
        >
          Start System
        </button>
      </div>
    );
  }

  // 1. Style Selection (Buttons at TOP)
  if (appState === 'selection') {
    const activeStyle = STYLES[currentStyleIndex];
    return (
      <div className="h-screen w-full bg-zinc-950 flex flex-col relative overflow-hidden">
        {/* Background Blur */}
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center blur-3xl transition-all duration-700"
          style={{ backgroundImage: `url(${activeStyle.thumbnail})` }}
        ></div>

        {/* TOP CONTROLS */}
        <div className="flex-none pt-12 pb-6 px-6 z-20 flex flex-col gap-6 bg-gradient-to-b from-black/90 to-transparent">
          <header className="text-center relative">
            <h1 className="text-3xl brand-font text-amber-500 tracking-wider">FTCVN: Decode AI</h1>
            <p className="text-zinc-400 text-sm mt-1 uppercase tracking-widest">Select Your Archetype</p>

            <button
              onClick={toggleFullscreen}
              className="absolute top-0 right-0 p-3 bg-zinc-800/50 rounded-full border border-white/5 text-amber-500 active:scale-95 transition-all"
            >
              {isFullscreen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" /></svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 15v6h-6M3 9V3h6" /></svg>
              )}
            </button>
          </header>

          <button
            onClick={() => {
              setSelectedStyle(activeStyle);
              setAppState('camera');
            }}
            className="w-full max-w-lg mx-auto py-5 bg-gradient-to-r from-amber-600 to-orange-700 text-white font-bold text-xl rounded-2xl shadow-lg hover:scale-105 transition-transform uppercase tracking-wider brand-font animate-pulse"
          >
            Select & Capture
          </button>
        </div>

        {/* Carousel Area (Bottom) */}
        <div className="flex-1 flex items-center justify-center relative z-10 px-4 min-h-0 pb-12">
          {/* Nav Buttons */}
          <button onClick={prevStyle} className="absolute left-2 md:left-4 z-30 p-6 rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 active:scale-95">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
          </button>

          <div className="h-full max-h-[70vh] w-full max-w-lg relative group">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 z-10 rounded-3xl"></div>
            <img
              src={activeStyle.thumbnail}
              alt={activeStyle.title}
              className="w-full h-full object-cover rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border-2 border-zinc-800"
            />

            <div className="absolute bottom-0 left-0 right-0 p-8 z-20 text-center">
              <h2 className="text-4xl brand-font text-white mb-2 drop-shadow-lg">{activeStyle.title}</h2>
              <p className="text-zinc-300 text-base line-clamp-3 drop-shadow-md">{activeStyle.description}</p>
              {/* Pagination Dots */}
              <div className="flex justify-center gap-2 mt-6">
                {STYLES.map((_, idx) => (
                  <div key={idx} className={`w-3 h-3 rounded-full transition-all ${idx === currentStyleIndex ? 'bg-amber-500 w-8' : 'bg-zinc-600'}`} />
                ))}
              </div>
            </div>
          </div>

          <button onClick={nextStyle} className="absolute right-2 md:right-4 z-30 p-6 rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 active:scale-95">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>
      </div>
    );
  }

  // 2. Camera View (Controls at TOP)
  if (appState === 'camera') {
    return (
      <div className="h-screen w-full bg-black relative flex flex-col overflow-hidden">
        {/* TOP CONTROL BAR */}
        <div className="flex-none h-48 bg-gradient-to-b from-black via-black/80 to-transparent absolute top-0 w-full flex items-center justify-between px-6 z-30 pt-6">

          {/* Back Button */}
          <button onClick={() => setAppState('selection')} className="p-4 bg-zinc-800/80 rounded-full backdrop-blur-md text-white border border-white/10 active:scale-90 transition-transform">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
          </button>

          {/* Shutter Button (Center) */}
          <button
            onClick={triggerCapture}
            disabled={countdown !== null}
            className="w-28 h-28 rounded-full border-4 border-white flex items-center justify-center bg-white/10 backdrop-blur-sm active:scale-90 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            <div className="w-24 h-24 bg-amber-500 rounded-full shadow-inner"></div>
          </button>

          {/* Upload Button */}
          <label className="flex flex-col items-center gap-1 text-white/80 active:scale-95 transition-transform cursor-pointer">
            <div className="p-4 bg-zinc-800/80 rounded-full backdrop-blur-md border border-white/10">
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
            </div>
          </label>
        </div>

        {/* Video Feed */}
        <div className="flex-1 relative overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain scale-x-[-1]"
          />
          <canvas ref={canvasRef} className="hidden" />
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm">
              <span className="text-[12rem] font-bold text-amber-500 brand-font animate-ping">{countdown > 0 ? countdown : 'SHOOT'}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Preview View (Buttons at TOP)
  if (appState === 'preview') {
    return (
      <div className="h-screen w-full bg-zinc-950 flex flex-col relative p-6 overflow-hidden">
        {/* TOP CONTROLS */}
        <div className="flex-none pt-8 pb-6 z-20 flex flex-col gap-4 bg-zinc-950">
          <h2 className="text-xl brand-font text-amber-500 uppercase tracking-widest text-center">Subject Acquired</h2>
          <div className="flex gap-4 w-full max-w-lg mx-auto">
            <button
              onClick={() => setAppState('camera')}
              className="flex-1 py-5 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 font-bold uppercase tracking-wide hover:bg-zinc-800 text-lg active:scale-95 transition-transform"
            >
              Retake
            </button>
            <button
              onClick={handleGenerate}
              className="flex-[2] py-5 rounded-xl bg-amber-600 text-white font-bold uppercase tracking-wide shadow-lg animate-pulse hover:animate-none text-lg active:scale-95 transition-transform"
            >
              Decode Identity
            </button>
          </div>
          {error && <p className="text-red-500 text-center">{error}</p>}
        </div>

        {/* Image Area */}
        <div className="flex-1 flex items-center justify-center min-h-0 pb-8">
          <div className="relative h-full w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 bg-black">
            {capturedImage && (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
            )}
          </div>
        </div>
      </div>
    );
  }

  // 4. Generating View
  if (appState === 'generating') {
    return (
      <div className="h-screen w-full bg-zinc-950 flex flex-col items-center justify-center p-8 text-center">
        <div className="relative w-48 h-48 mb-10">
          <div className="absolute inset-0 border-[6px] border-zinc-900 rounded-full"></div>
          {/* Circular Progress Bar */}
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="90"
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-amber-600"
              strokeDasharray={565.48}
              strokeDashoffset={565.48 - (565.48 * loadingProgress) / 100}
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center animate-pulse">
            {LOADING_ICONS[loadingIconIndex]}
          </div>
        </div>

        <h2 className="text-4xl brand-font text-white mb-2 tracking-widest">DECODING...</h2>
        <p className="text-amber-500 font-bold text-xl mb-8 h-8">{processingStep}</p>

        <div className="w-full max-w-sm">
          <div className="flex justify-between items-end mb-2">
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-tighter">Identity Reconstruction</span>
            <span className="text-amber-500 text-2xl font-black italic">{Math.floor(loadingProgress)}%</span>
          </div>
          <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden border border-white/5 p-[2px]">
            <div
              className="h-full bg-gradient-to-r from-amber-700 via-amber-500 to-amber-400 rounded-full transition-all duration-300 ease-linear shadow-[0_0_15px_rgba(245,158,11,0.4)]"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  // 5. Result View (Buttons at TOP)
  if (appState === 'result' && generatedImage) {
    return (
      <div className="h-screen w-full bg-zinc-950 flex flex-col relative p-6 overflow-hidden">
        {/* Result Image - PRIORITIZED */}
        <div className="flex-1 flex items-center justify-center min-h-0 py-2">
          <div className="relative h-full w-full max-w-lg rounded-xl overflow-hidden shadow-[0_0_60px_rgba(217,119,6,0.15)] border border-amber-900/30 bg-black">
            <img src={generatedImage} alt="AI Result" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* COMPACT ACTIONS FOOTER */}
        <div className="flex-none pb-6 pt-2 z-20">
          <div className="flex items-center justify-center gap-4 max-w-lg mx-auto w-full bg-zinc-900/80 backdrop-blur-md p-3 rounded-2xl border border-zinc-800 shadow-2xl">
            {downloadUrl && (
              <div className="bg-white p-1 rounded-lg shrink-0">
                <QRCodeCanvas value={downloadUrl} size={80} />
              </div>
            )}

            <div className="flex flex-col gap-2 flex-1">
              <div className="flex gap-2">
                <button
                  onClick={resetApp}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-xl font-bold uppercase tracking-wider border border-zinc-700 active:scale-95 transition-transform"
                >
                  New
                </button>
                <a
                  href={generatedImage}
                  download={`FTCVN-${Date.now()}.png`}
                  className="p-3 bg-amber-600 text-white rounded-xl hover:bg-amber-500 active:scale-95 transition-transform flex items-center justify-center"
                  title="Download"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                </a>
              </div>
              <button
                onClick={resetApp}
                className="w-full py-3 bg-amber-600 text-white text-sm rounded-xl font-bold uppercase tracking-wider shadow-lg active:scale-95 transition-transform"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
