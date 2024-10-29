import React, { useEffect, useRef, useState } from 'react';
import { Box, Flex, Button, Text, ColorScheme } from '@mantine/core';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconTrash,
  IconRewindBackward10,
  IconReload,
} from '@tabler/icons-react';
import { GrayDots } from './GrayDots';

interface AudioPlayerProps {
  audioUrl: string;
  totalDuration: number;
  handleDelete: () => void;
  theme?: string; // 'light' | 'dark'
}

const AudioPlayer: React.FC<AudioPlayerProps> = (props) => {
  const { audioUrl, totalDuration, handleDelete } = props;

  const [app_theme, setAppTheme] = useState<string>(props.theme || 'light');
  const toggleColorScheme = (value?: ColorScheme) => {
    // console.log('Toggle color scheme', value);
    setAppTheme(value === 'dark' ? 'dark' : 'light');
  };
  useEffect(() => {
    if (props.theme) {
      toggleColorScheme(props.theme === 'dark' ? 'dark' : 'light');
    }
  }, [props.theme]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(totalDuration);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null); // To store animation frame ID

  const formatTime = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
        2,
        '0'
      )}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
      2,
      '0'
    )}`;
  };
  const loadAudio = async () => {
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    audioContextRef.current = new (window.AudioContext ||
      window.AudioContext)();
    const audioBuffer = await audioContextRef.current.decodeAudioData(
      arrayBuffer
    );
    return audioBuffer;
  };

  const setupAnalyserNode = () => {
    const audioContext = audioContextRef.current;
    if (audioContext) {
      analyserRef.current = audioContext.createAnalyser();
      dataArrayRef.current = new Uint8Array(
        analyserRef.current.frequencyBinCount
      );
    }
  };

  const playAudio = async () => {
    if (audioContextRef.current && sourceNodeRef.current) {
      sourceNodeRef.current.stop();
    }

    const audioBuffer = await loadAudio();
    const audioContext = audioContextRef.current;

    if (audioContext) {
      setupAnalyserNode();

      sourceNodeRef.current = audioContext.createBufferSource();
      sourceNodeRef.current.buffer = audioBuffer;
      sourceNodeRef.current.connect(analyserRef.current!);
      analyserRef.current?.connect(audioContext.destination);
      sourceNodeRef.current.start(0);

      startTimer();
      visualizeAudio(); // Start visualizing the audio

      sourceNodeRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        stopTimer();
        cancelAnimationFrame(animationRef.current!); // Stop the animation when audio ends
      };
    }

    setIsPlaying(true);
  };

  const visualizeAudio = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current)
      return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);

      if (canvasCtx) {
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = 4; // Bar width based on your requirement
        const barSpacing = 3; // Spacing between bars for some visual separation
        const barMaxHeight = canvas.height; // Max height for bars to fill the canvas
        const barColor = app_theme === 'dark' ? '#fff' : '#000'; // Bar color
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const barHeight = (dataArray[i] / 255) * barMaxHeight; // Normalize bar height

          // Drawing a rounded bar
          const centerY = canvas.height / 2; // Center point of the canvas
          canvasCtx.fillStyle = barColor;

          // Draw top half of the bar
          canvasCtx.beginPath();
          canvasCtx.moveTo(x + barWidth / 2, centerY - barHeight / 2); // Move to top-center of bar
          canvasCtx.arc(
            x + barWidth / 2,
            centerY - barHeight / 2,
            barWidth / 2,
            Math.PI,
            0
          ); // Top arc
          canvasCtx.rect(x, centerY - barHeight / 2, barWidth, barHeight); // Draw rectangular part
          canvasCtx.arc(
            x + barWidth / 2,
            centerY + barHeight / 2,
            barWidth / 2,
            0,
            Math.PI
          ); // Bottom arc
          canvasCtx.fill();

          x += barWidth + barSpacing; // Move x for the next bar
        }
      }
      animationRef.current = requestAnimationFrame(draw); // Request next frame
    };

    draw(); // Start drawing
  };

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setCurrentTime((prevTime) => Math.min(prevTime + 1, duration)); // Increment current time
    }, 1000); // Update every second
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null; // Reset timer reference
    }
  };

  const pauseAudio = () => {
    if (audioContextRef.current) {
      audioContextRef.current.suspend();
      setIsPlaying(false);
      stopTimer();
    }
  };

  const resetAudio = () => {
    if (audioContextRef.current) {
      pauseAudio();
      setCurrentTime(0);
      playAudio(); // Restart the audio
    }
  };

  const rewindAudio = () => {
    if (audioContextRef.current) {
      pauseAudio();
      const newTime = Math.max(currentTime - 5, 0);
      setCurrentTime(newTime);
      playAudio(); // Play from the new time
    }
  };

  useEffect(() => {
    return () => {
      stopTimer();
      if (audioContextRef.current) {
        audioContextRef.current.close(); // Close the audio context
      }
      cancelAnimationFrame(animationRef.current!); // Stop any running animation when component unmounts
    };
  }, []);

  return (
    <Box
      style={{
        border: '1px solid ' + (app_theme === 'dark' ? '#1F1F1F' : '#EDEDEE'),
        borderRadius: '12px',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px',
      }}
    >
      <Flex
        w={'100%'}
        align={'center'}
        justify={'space-between'}
        gap={{ base: 8, md: 16 }}
      >
        <Flex gap={{ base: 4, md: 8 }} align={'center'}>
          <Button
            style={{
              height: '50px',
              width: '50px',
              borderRadius: '50%',
              padding: '0px',
              backgroundColor: isPlaying
                ? app_theme === 'dark'
                  ? '#1F1F1F'
                  : '#EDEDEE'
                : app_theme === 'dark'
                ? '#fff'
                : '#000 ',
              color: '#fff',
            }}
            onClick={isPlaying ? pauseAudio : playAudio}
          >
            {isPlaying ? (
              <IconPlayerPause
                color={app_theme === 'dark' ? '#fff' : '#000'}
                stroke={1.3}
              />
            ) : (
              <IconPlayerPlay
                color={app_theme === 'dark' ? '#000' : '#fff'}
                stroke={1.3}
              />
            )}
          </Button>

          <Button
            onClick={rewindAudio}
            style={{
              height: '40px',
              width: '40px',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              padding: '4px',
            }}
          >
            <IconReload color={app_theme === 'dark' ? '#fff' : '#000'} />
          </Button>
        </Flex>
        {
          <canvas
            ref={canvasRef}
            height={100}
            // width={300}
            style={{
              backgroundColor: 'transparent',
              height: '50px',
              width: '100%',
              display: !isPlaying ? 'none' : 'block', // Adjust display based on recording state
            }}
          />
        }
        {!isPlaying && <GrayDots />}

        <Text style={{ fontSize: '16px', minWidth: '120px' }}>
          {formatTime(currentTime)}
          <span
            style={{
              fontWeight: '600',
              color: 'gray',
            }}
          >
            {' '}
            / {formatTime(duration)}
          </span>
        </Text>
        <Button
          onClick={handleDelete}
          style={{
            height: '40px',
            width: '40px',
            borderRadius: '50%',
            backgroundColor: 'transparent',
            padding: '4px',
          }}
        >
          <IconTrash color={app_theme === 'dark' ? '#fff' : '#000'} />
        </Button>
      </Flex>

      {/* Canvas for audio visualization */}
    </Box>
  );
};

export default AudioPlayer;
