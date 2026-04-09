import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim"; // loads tsparticles-slim

const BackgroundCanvas = () => {
  const particlesInit = useCallback(async (engine) => {
    console.log(engine);
    await loadSlim(engine);
  }, []);

  const particlesLoaded = useCallback(async (container) => {
    console.log(container);
  }, []);

  const options = {
    fullScreen: {
      enable: false, // We will control the size with CSS
    },
    background: {
      color: {
        value: "transparent", // Background is handled by the main div
      },
    },
    fpsLimit: 60,
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: "parallax", // Enable parallax mode
        },
        resize: true,
      },
      modes: {
        parallax: {
          enable: true,
          force: 60, // How strong the parallax effect is
          smoothness: 10, // How smooth the movement is
        },
        repulse: {
          distance: 100,
          duration: 0.4,
        },
      },
    },
    particles: {
      color: {
        value: ["#ffffff", "#7dd3fc", "#0ea5e9"], // Multi-tone blue/white for depth
      },
      links: {
        enable: false,
      },
      move: {
        direction: "bottom",
        enable: true,
        outModes: {
          default: "out",
        },
        random: false,
        speed: { min: 0.1, max: 0.8 }, // Varied speed for depth
        straight: true,
      },
      number: {
        density: {
          enable: true,
          area: 800,
        },
        value: 120, // More particles
      },
      opacity: {
        value: { min: 0.05, max: 0.4 }, // Softer opacity
        animation: {
          enable: true,
          speed: 0.3,
          minimumValue: 0.05,
          sync: false,
        },
      },
      shape: {
        type: "line",
      },
      size: {
        value: { min: 1, max: 40 }, // Varied line length for bokeh effect
        random: true,
      },
    },
    detectRetina: true,
  };

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      loaded={particlesLoaded}
      options={options}
    />
  );
};

export default BackgroundCanvas;