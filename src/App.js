import React from 'react';
import sample from './sample.mp3';

const defaultProps = {
  capColor: '#fff',
  capHeight: 2,
  gap: 4,
  meterCount: 512,
  meterColor: [
    { stop: 0, color: '#833ab4' },
    { stop: 0.5, color: '#fd411d' },
    { stop: 1, color: '#ffa321' }
  ],
  meterWidth: 2
};

function useAudioSpectrum(options) {
  let props = Object.assign(defaultProps, options);
  let audioRef = React.useRef(null);
  let canvasRef = React.useRef(null);
  let analyserRef = React.useRef(null);
  let mediaElementSrcRef = React.useRef(null);

  function drawSpectrum() {
    let animationId;
    let audioContext = new window.AudioContext();

    if (analyserRef.current === null) {
      analyserRef.current = audioContext.createAnalyser();

      analyserRef.current.smoothingTimeConstant = 0.8;
      analyserRef.current.fftSize = 2048;
    }

    if (mediaElementSrcRef.current === null) {
      mediaElementSrcRef.current = audioContext.createMediaElementSource(
        audioRef.current
      );

      mediaElementSrcRef.current.connect(analyserRef.current);
      mediaElementSrcRef.current.connect(audioContext.destination);
    }

    let capYPositionList = [];
    let canvasWidth = canvasRef.current.width;
    let canvasHeight = canvasRef.current.height - props.capHeight;
    let ctx = canvasRef.current.getContext('2d');
    let gradient = ctx.createLinearGradient(0, 0, 0, 300);

    if (Array.isArray(props.meterColor)) {
      props.meterColor.forEach(meter =>
        gradient.addColorStop(meter.stop, meter.color)
      );
    }

    if (typeof props.meterColor === 'string') {
      gradient = props.meterColor;
    }

    function drawMeter() {
      let array = new Uint8Array(analyserRef.current.frequencyBinCount);

      analyserRef.current.getByteFrequencyData(array);

      if (audioRef.current.paused) {
        array = array.map(() => 0);

        let allCapsReachBottom = capYPositionList.every(cap => cap === 0);

        if (allCapsReachBottom) {
          ctx.clearRect(0, 0, canvasWidth, canvasHeight + props.capHeight);
          return window.cancelAnimationFrame(animationId);
        }
      }

      let step = Math.round(array.length / props.meterCount);

      ctx.clearRect(0, 0, canvasWidth, canvasHeight + props.capHeight);

      for (let i = 0; i < props.meterCount; i++) {
        let capYPosition = array[i * step];

        if (capYPositionList.length < Math.round(props.meterCount)) {
          capYPositionList.push(capYPosition);
        }

        let x = i * (props.meterWidth + props.gap);
        let y = ((270 - capYPosition) * canvasHeight) / 270;

        ctx.fillStyle = props.capColor;

        if (capYPosition < capYPositionList[i]) {
          let previousCapYPosition = --capYPositionList[i];
          let y = ((270 - previousCapYPosition) * canvasHeight) / 270;

          ctx.fillRect(x, y, props.meterWidth, props.capHeight);
        } else {
          ctx.fillRect(x, y, props.meterWidth, props.capHeight);
          capYPositionList[i] = capYPosition;
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y + props.capHeight, props.meterWidth, canvasHeight);
      }

      animationId = window.requestAnimationFrame(drawMeter);
    }

    animationId = window.requestAnimationFrame(drawMeter);
  }

  React.useEffect(() => {
    if (audioRef.current === null) {
      throw new ReferenceError(
        'Audio element not found. Connect the audioRef to an audio element.'
      );
    }

    if (canvasRef.current === null) {
      throw new ReferenceError(
        'Canvas element not found. Connect the canvasRef to a canvas element.'
      );
    }
  }, []);

  return {
    audioRef,
    canvasRef,
    drawSpectrum
  };
}

export default function App() {
  let { audioRef, canvasRef, drawSpectrum } = useAudioSpectrum({
    capColor: 'crimson'
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <canvas ref={canvasRef} />
      <br />
      <audio
        ref={audioRef}
        controls
        src={sample}
        onPlay={drawSpectrum}
        crossOrigin="anonymous"
      />
    </div>
  );
}
