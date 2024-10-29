import { Box, Button, ColorScheme, Flex, Text } from '@mantine/core';
import AudioPlayer from './AudioPlayer';
import { useEffect, useRef, useState } from 'react';
import {
  IconMicrophone,
  IconPlayerPause,
  IconReload,
  IconSquare,
} from '@tabler/icons-react';
import { GrayDots } from './GrayDots';

type Language = 'en' | 'es' | 'pt';

interface AudioRecorderProps {
  setaudioFileU: (file: File) => void;
  theme?: string; // 'light' | 'dark'
  lang?: Language; // 'en' | 'es' | 'pt'
}

export const AudioRecorder: React.FC<AudioRecorderProps> = (props) => {
  const { setaudioFileU } = props;
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
  const [app_lang, setAppLang] = useState<'en' | 'es' | 'pt'>(
    props.lang || 'en'
  );
  useEffect(() => {
    // console.log('PROPS: ', props);
    if (props.lang) {
      setAppLang(props.lang);
    }
  }, [props.lang]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [totalTime, setTotalTime] = useState(0); // State to save the total recording time
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

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

  const audioChunksRef = useRef<Blob[]>([]);
  useEffect(() => {
    if (audioUrl && typeof audioFile !== 'undefined') {
      // console.log('audioURL', audioUrl);
      setaudioFileU(audioFile as File);
    }
  }, [audioUrl]);
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const options = { mimeType: 'audio/webm' };
    const mediaRecorder = new MediaRecorder(stream, options);
    setMediaRecorder(mediaRecorder);

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;
    source.connect(analyser);

    // Set up ondataavailable event handler
    mediaRecorder.ondataavailable = (event) => {
      // console.log('Data available:', event.data.size);
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data); // Store directly in ref
        setAudioChunks((prev) => {
          // console.log('Previous Chunks:', prev);
          const newChunks = [...prev, event.data];
          // console.log('New Chunks:', newChunks);
          return newChunks; // Optional state update
        });
      }
    };

    mediaRecorder.onstop = () => {
      // console.log('onStop');
      if (audioChunksRef.current.length > 0) {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // console.log('Final Chunks:', audioChunksRef.current);
        setAudioUrl(URL.createObjectURL(blob));
        setAudioFile(blob);
      } else {
        // console.error('No audio chunks available to create a Blob');
      }
      audioChunksRef.current = []; // Clear ref after use
      setAudioChunks([]); // Optionally clear state
      // setTotalTime(timeElapsed);
      clearInterval(intervalRef.current!);
      // Save the total time recorded // Save the total time recorded
      if (audioContextRef.current) {
        audioContextRef.current.close(); // Close the audio context
      }
    };

    mediaRecorder.start();
    // console.log('MediaRecorder started');

    setIsRecording(true);
    setIsPaused(false);

    startTimer();
    visualizeAudio();
  };

  const startTimer = () => {
    intervalRef.current = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(intervalRef.current!);
  };

  const pauseRecording = () => {
    mediaRecorder?.pause();
    setIsPaused(true);
    stopTimer();
    cancelAnimationFrame(animationRef.current!);
  };

  const resumeRecording = () => {
    mediaRecorder?.resume();
    setIsPaused(false);
    startTimer();
    visualizeAudio();
  };
  useEffect(() => {
    if (timeElapsed > 60 * 3) {
      stopRecording();
      alert(translations[app_lang].recordingLimit);
    }
  }, [timeElapsed]);

  const stopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
    setTotalTime(timeElapsed);
    // console.log("Total Time: ", timeElapsed);
    // Stop the animation
    cancelAnimationFrame(animationRef.current!);
  };

  const resetRecording = () => {
    setAudioUrl(null);
    setAudioChunks([]);
    setIsRecording(false);
    setIsPaused(false);
    setTimeElapsed(0);
    setTotalTime(0); // Reset total time
    clearInterval(intervalRef.current!);
    cancelAnimationFrame(animationRef.current!);
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

        const barWidth = 4; // Bar width based on the SVG (4px width)
        const barSpacing = 3; // Spacing between bars for some visual separation
        const barMaxHeight = canvas.height; // Max height for bars to fill the canvas
        const barColor = app_theme === 'dark' ? '#fff' : '#000'; // Match the color from the SVG
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

          x += barWidth + barSpacing;
        }
      }
      animationRef.current = requestAnimationFrame(draw);
    };
    draw();
  };
  return (
    <>
      <Box mb={24}>
        <Box
          style={{
            border:
              '1px solid ' + (app_theme === 'dark' ? '#1F1F1F' : '#EDEDEE'),
            borderRadius: '12px',
            // display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px',
            display: audioUrl ? 'none' : 'flex',
          }}
        >
          <Flex
            w={'100%'}
            align={'center'}
            justify={'space-between'}
            gap={{
              base: 8,
              md: 16,
            }}
          >
            <Flex
              gap={{
                base: 4,
                md: 8,
              }}
              align={'center'}
              direction={'row'}
            >
              <Button
                style={{
                  height: '50px',
                  width: '50px',
                  borderRadius: '50%',
                  padding: '0px',
                  backgroundColor: isRecording
                    ? isPaused
                      ? '#EF4444'
                      : app_theme === 'dark'
                      ? '#1F1F1F'
                      : '#EDEDEE'
                    : '#EF4444',
                  color: '#fff',
                }}
                onClick={() => {
                  if (!isRecording) {
                    resetRecording();
                    startRecording();
                  } else if (isPaused) resumeRecording();
                  else pauseRecording();
                }}
              >
                {isRecording ? (
                  isPaused ? (
                    <IconMicrophone />
                  ) : (
                    <IconPlayerPause
                      color={app_theme === 'dark' ? '#fff' : '#000'}
                      stroke={1.3}
                    />
                  )
                ) : (
                  <IconMicrophone />
                )}
              </Button>

              {isRecording && (
                <Button
                  onClick={stopRecording}
                  styles={{
                    root: {
                      height: '40px',
                      width: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'transparent',
                      padding: '4px',
                      '&:hover': {
                        backgroundColor:
                          app_theme === 'dark' ? '#1F1F1F' : '#C5C5C9',
                      },
                    },
                  }}
                  variant="filled"
                >
                  <IconSquare color="red" stroke={1.5} size={20} />
                </Button>
              )}

              {isRecording && (
                <Button
                  onClick={() => {
                    resetRecording();
                    // startRecording()
                  }}
                  styles={{
                    root: {
                      height: '40px',
                      width: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'transparent',
                      padding: '4px',
                      '&:hover': {
                        backgroundColor:
                          app_theme === 'dark' ? '#1F1F1F' : '#C5C5C9',
                      },
                    },
                  }}
                  variant="filled"
                >
                  <IconReload
                    color={app_theme === 'dark' ? '#fff' : '#000'}
                    stroke={1.5}
                    size={20}
                  />
                </Button>
              )}
            </Flex>

            <canvas
              ref={canvasRef}
              height={100}
              width={300}
              style={{
                backgroundColor: 'transparent', // Transparent background for the canvas,
                height: '50px',
                width: '100%',
                display: !isRecording || audioUrl ? 'none' : 'block',
              }}
            ></canvas>
            {!isRecording && !audioUrl && <GrayDots />}

            <Text style={{ fontSize: '16px' }}>{formatTime(timeElapsed)}</Text>
          </Flex>
        </Box>
        {audioUrl && (
          <AudioPlayer
            audioUrl={audioUrl}
            handleDelete={resetRecording}
            totalDuration={totalTime}
            theme={app_theme}
          />
        )}
      </Box>
    </>
  );
};

const translations = {
  en: {
    recordingLimit: 'Recording limit is 3 minutes',
  },
  es: {
    recordingLimit: 'El límite de grabación es de 3 minutos',
  },
  pt: {
    recordingLimit: 'O limite de gravação é de 3 minutos',
  },
};
