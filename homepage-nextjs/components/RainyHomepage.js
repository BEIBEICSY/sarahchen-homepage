import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import BackgroundCanvas from './BackgroundCanvas';
import StatusPulse from './StatusPulse';

export default function RainyHomepage({ status }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtx = useRef(null);
  const rainGainNode = useRef(null);
  const rainContainerRef = useRef(null);
  const windowOutsideRef = useRef(null);

  // Placeholder for audio initialization
  const initAudio = () => {
    if (audioCtx.current) return;
    
    audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    const bufferSize = audioCtx.current.sampleRate * 2; // 2 seconds buffer
    const buffer = audioCtx.current.createBuffer(1, bufferSize, audioCtx.current.sampleRate);
    const data = buffer.getChannelData(0);

    // 生成近似粉红噪音（比纯白噪音听起来更温和，类似雨声）
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
        let white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11; // 补偿音量
        b6 = white * 0.115926;
    }

    // 噪音源
    const noise = audioCtx.current.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // 低通滤波器让噪音更沉闷，像在玻璃外
    const filter = audioCtx.current.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800; // 调整频率控制“雨”的大小

    // 音量控制
    rainGainNode.current = audioCtx.current.createGain();
    rainGainNode.current.gain.value = 0; // 初始音量为0，稍后淡入

    noise.connect(filter);
    filter.connect(rainGainNode.current);
    rainGainNode.current.connect(audioCtx.current.destination);
    
    noise.start(0);
  };

  const fadeAudio = (targetGain, duration) => {
    if (!rainGainNode.current || !audioCtx.current) return;
    const currentTime = audioCtx.current.currentTime;
    rainGainNode.current.gain.cancelScheduledValues(currentTime);
    rainGainNode.current.gain.setValueAtTime(rainGainNode.current.gain.value, currentTime);
    rainGainNode.current.gain.linearRampToValueAtTime(targetGain, currentTime + duration);
  };

  const playRain = () => {
    if (audioCtx.current && audioCtx.current.state === 'suspended') {
      audioCtx.current.resume();
    }
    fadeAudio(0.5, 2); // 2秒淡入到0.5音量
    setIsPlaying(true);
  };

  const pauseRain = () => {
    fadeAudio(0, 1); // 1秒淡出
    setIsPlaying(false);
  };

  // Placeholder for rain drop creation
  const createRain = () => {
    if (!rainContainerRef.current) return;
    const dropCount = 100; // 雨滴数量

    for (let i = 0; i < dropCount; i++) {
        const drop = document.createElement('div');
        drop.classList.add('drop');
        
        // 随机位置、长度、动画时长和延迟
        const left = Math.random() * 100; // 0 到 100 vw
        const delay = Math.random() * 2; // 0 到 2s
        const duration = Math.random() * 0.5 + 0.5; // 0.5 到 1s
        
        drop.style.left = `${left}%`;
        drop.style.animationDelay = `${delay}s`;
        drop.style.animationDuration = `${duration}s`;
        
        // 给部分雨滴倾斜角度，模拟风
        drop.style.transform = `rotate(${Math.random() * 10 - 5}deg)`;

        rainContainerRef.current.appendChild(drop);
    }
  };

  useEffect(() => {
    createRain();
  }, []);

  const [sliderValue, setSliderValue] = useState(50);
  const rainIntensitySliderRef = useRef(null);
  const raindropThumbRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const rafIdRef = useRef(null);

  const updateRainIntensity = (value) => {
    // 1. Smoothly update raindrops
    if (rainContainerRef.current) {
      const drops = rainContainerRef.current.children;
      const targetCount = Math.floor((value / 100) * drops.length);
      for (let i = 0; i < drops.length; i++) {
        drops[i].style.display = i < targetCount ? 'block' : 'none';
      }
    }

    // 2. Audio update
    if (audioCtx.current && rainGainNode.current) {
      const targetGain = (value / 100) * 0.8;
      const currentTime = audioCtx.current.currentTime;
      rainGainNode.current.gain.setTargetAtTime(targetGain, currentTime, 0.05);
    }
  };

  const handleSliderChange = (event) => {
    const value = parseInt(event.target.value);
    
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    
    rafIdRef.current = requestAnimationFrame(() => {
      if (rainIntensitySliderRef.current && raindropThumbRef.current) {
        const sliderWidth = rainIntensitySliderRef.current.offsetWidth;
        // Thumb width is 20px (w-5)
        const thumbPos = (value / 100) * (sliderWidth - 20);
        raindropThumbRef.current.style.transform = `translate3d(${thumbPos}px, -50%, 0)`;
        
        // Update visual progress track width directly via DOM
        const track = document.getElementById('sliderProgressTrack');
        if (track) track.style.width = `${value}%`;
      }
      updateRainIntensity(value);
    });
  };

  useEffect(() => {
    // Pre-generate 200 raindrops
    if (rainContainerRef.current) {
      rainContainerRef.current.innerHTML = '';
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < 200; i++) {
        const drop = document.createElement('div');
        drop.className = 'drop';
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.animationDelay = `${Math.random() * 2}s`;
        drop.style.animationDuration = `${Math.random() * 0.5 + 0.5}s`;
        drop.style.transform = `rotate(${Math.random() * 10 - 5}deg)`;
        drop.style.display = i < 100 ? 'block' : 'none';
        fragment.appendChild(drop);
      }
      rainContainerRef.current.appendChild(fragment);
    }

    // Initial thumb and track sync
    const initialValue = 50;
    if (rainIntensitySliderRef.current && raindropThumbRef.current) {
      const sliderWidth = rainIntensitySliderRef.current.offsetWidth;
      const thumbPos = (initialValue / 100) * (sliderWidth - 20);
      raindropThumbRef.current.style.transform = `translate3d(${thumbPos}px, -50%, 0)`;
      
      const track = document.getElementById('sliderProgressTrack');
      if (track) track.style.width = `${initialValue}%`;
    }
    updateRainIntensity(initialValue);

    // Auto-init audio on first interaction since browsers block auto-play
    const handleFirstInteraction = () => {
      if (!audioCtx.current) {
        initAudio();
        playRain();
      }
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  return (
    <>
      <Head>
        <title>Sarah Chen | hi, welcome</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500&family=Inter:wght@400&display=swap" rel="stylesheet" />
      </Head>

      <div className="relative w-screen h-screen overflow-hidden bg-[#050505] font-caveat">
        {/* Background Image - Like the online version */}
        <div
          ref={windowOutsideRef}
          className="absolute top-[-5%] left-[-5%] w-[110%] h-[110%] bg-cover bg-center z-0 opacity-60"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
            filter: 'blur(8px) brightness(0.6)'
          }}
        >
        </div>
        
        {/* Deep Scene Particles - Layered on top of the image */}
        <div className="absolute inset-0 z-5">
          <BackgroundCanvas />
        </div>
        
        {/* Glass overlay with depth */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/[0.03] to-transparent shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] z-10 pointer-events-none"></div>
        
        {/* Raindrop layer */}
        <div ref={rainContainerRef} className="absolute top-0 left-0 w-full h-full z-20 pointer-events-none overflow-hidden">
          {/* CSS Raindrops generated by JS */}
        </div>

        {/* Content area */}
        <div className="relative z-30 w-full h-full flex flex-col justify-center items-center pointer-events-none">
          <h1 className="greeting">hi, welcome</h1>
          <StatusPulse status={status} />
        </div>

        {/* The Glass Widget - Bottom Controls */}
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, type: "spring", damping: 20 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-white/[0.04] px-8 py-3 rounded-full backdrop-blur-xl border border-white/[0.1] shadow-2xl z-40 hover:bg-white/[0.07] transition-all duration-300"
        >
          <button
            className="group relative bg-none border-none text-white cursor-pointer w-10 h-10 rounded-full flex justify-center items-center transition-all duration-300 hover:bg-white/[0.1] active:scale-90"
            onClick={() => (isPlaying ? pauseRain() : playRain())}
            title="Play/Pause Rain Sound"
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          
          <div className="flex items-center gap-4">
            <div className="rain-icon w-3.5 h-3.5 bg-gradient-to-br from-white/40 to-white/10 rounded-[50%_50%_50%_0] rotate-[-45deg] opacity-50"></div>
            
            <div className="relative w-44 h-10 flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="50"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                id="rainIntensitySlider"
                onInput={handleSliderChange}
                ref={rainIntensitySliderRef}
              />
              
              {/* Background Track */}
              <div className="absolute left-0 w-full h-[2px] bg-white/20 rounded-full z-0" />

              {/* Visual Progress Track - Responsive to direct DOM slider value */}
              <div 
                id="sliderProgressTrack"
                className="absolute left-0 h-[2px] bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10 pointer-events-none"
                style={{ width: '50%' }}
              />

              {/* Animated Raindrop Thumb - Hardware accelerated and correctly centered */}
              <div
                ref={raindropThumbRef}
                className="absolute pointer-events-none z-20 w-5 h-5 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] flex items-center justify-center"
                style={{ 
                  top: '50%', 
                  left: 0, 
                  willChange: 'transform' 
                }}
              >
                <div className="w-2.5 h-2.5 bg-[#050505] rounded-full"></div>
              </div>
            </div>
            
            <div className="rain-icon w-6 h-6 bg-gradient-to-br from-white/60 to-white/20 rounded-[50%_50%_50%_0] rotate-[-45deg] opacity-80"></div>
          </div>
        </motion.div>

        {/* Global styles for animations */}
        <style jsx global>{`
          @keyframes drop {
            0% { transform: translateY(0); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(120vh); opacity: 0; }
          }

          .drop {
            position: absolute;
            top: -150px;
            background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.25));
            width: 2px;
            height: 100px;
            pointer-events: none;
            animation: drop linear infinite;
          }

          @keyframes revealText {
            0% { clip-path: polygon(0 0, 0 0, 0 110%, 0% 110%); }
            100% { clip-path: polygon(0 -10%, 110% -10%, 110% 110%, 0 110%); }
          }

          .animate-revealText {
            clip-path: polygon(0 0, 0 0, 0 110%, 0% 110%);
            animation: revealText 2.5s cubic-bezier(0.77, 0, 0.175, 1) forwards;
            animation-delay: 0.5s;
          }

          .text-shadow-lg {
            text-shadow: 0 0 15px rgba(255,255,255,0.2);
          }

          .font-caveat {
            font-family: 'Caveat', cursive;
          }

          .greeting {
            color: rgba(255, 255, 255, 0.9);
            font-size: 8rem;
            text-shadow: 0 0 15px rgba(255,255,255,0.2);
            position: relative;
            padding-right: 0.2em;
            clip-path: polygon(0 0, 0 0, 0 110%, 0% 110%);
            animation: revealText 2.5s cubic-bezier(0.77, 0, 0.175, 1) forwards;
            animation-delay: 0.5s;
            font-family: 'Caveat', cursive;
          }

          @media (max-width: 768px) {
            .greeting {
              font-size: 5rem;
            }
          }

          @keyframes revealText {
            0% { clip-path: polygon(0 0, 0 0, 0 110%, 0% 110%); }
            100% { clip-path: polygon(0 -10%, 110% -10%, 110% 110%, 0 110%); }
          }
        `}</style>
      </div>
    </>
  );
}
