import React, { FC, useEffect, useState } from 'react';

import {
  Grid,
  Box,
  Flex,
  Button,
  Text,
  FileInput,
  Divider,
  FileButton,
  Textarea,
  ScrollArea,
  CopyButton,
  SegmentedControl,
  Slider,
  Checkbox,
} from '@mantine/core';

import { useRecorder } from 'react-microphone-recorder';

const AudioToText: FC = () => {
  const [audioFileU, setaudioFileU] = useState<File | null>(null);
  const [text, setText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [inputType, setInputType] = useState<'file' | 'record'>('file');
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [summarize, setSummarize] = useState(false);
  const [summary, setSummary] = useState('');
  const [textShown, setTextShown] = useState<'transcription' | 'summary'>(
    'transcription'
  );
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
    }
  }, []);
  const generateSummary = async (transcription: string) => {
    const response = await fetch(
      'https://audio-to-text-psi.vercel.app/api/summarize',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
        }),
      }
    );

    const data = await response.json();
    console.log(data);
    const generatedSummary = data.summary;
    const words = generatedSummary.split(' ');
    var currenIndex = 0;
    var outputText = '';
    const displayWord = () => {
      if (words.length > currenIndex) {
        setTimeout(() => {
          outputText = outputText + ' ' + words[currenIndex];
          setSummary(outputText);
          currenIndex++;
          displayWord();
        }, 100);
      }
    };
    displayWord();
  };

  const blobToBase64 = (blob: Blob, callback: (arg0: any) => void) => {
    const reader = new FileReader();
    reader.onload = function () {
      const base64data = (reader.result as string)?.split(',')[1];
      callback(base64data);
    };

    reader.readAsDataURL(blob);
  };
  const getText = async (base64data: any) => {
    try {
      const response = await fetch(
        'https://audio-to-text-psi.vercel.app/api/speechToText',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            base64data: base64data,
          }),
        }
      ).then((res) => res.json());
      const { text } = response;
      if (summarize) {
        generateSummary(text);
      }
      setLoading(false);
      const words = text.split(' ');
      var currenIndex = 0;
      var outputText = '';
      const displayWord = () => {
        if (words.length > currenIndex) {
          setTimeout(() => {
            outputText = outputText + ' ' + words[currenIndex];
            setText(outputText);
            currenIndex++;
            displayWord();
          }, 100);
        }
      };
      displayWord();
    } catch (error) {
      console.log(error);
    }
  };

  const handleConvert = async () => {
    if (!audioFileU) {
      alert('Please upload audio file');
      return;
    }
    setLoading(true);
    ////////////////////////////////////////////////////////////
    ////////// LOGIC FOR REQUESTING AUDIO TO TEXT API //////////
    blobToBase64(audioFileU, getText);
    ////////////////////////////////////////////////////////////
  };
  const {
    startRecording,
    pauseRecording,
    stopRecording,
    resetRecording,
    resumeRecording,
    audioFile,
    audioURL,
    timeElapsed,
    isRecording,
    audioLevel,
    recordingState,
  } = useRecorder();
  const onStart = () => {
    console.log('Recording started');
  };

  const onStop = (recordedBlob: any) => {
    console.log('Recording stopped');
  };
  useEffect(() => {
    if (audioURL && typeof audioFile !== 'undefined') {
      console.log('audioURL', audioURL);
      setaudioFileU(audioFile as File);
    }
  }, [audioURL]);

  useEffect(() => {
    if (timeElapsed == 60 * 3) {
      stopRecording();
    }
  }, [timeElapsed]);

  useEffect(() => {
    if (audioFileU && audioFileU.size > 11 * 1024 * 1024) {
      alert('File size should be less than 10MB');
      setaudioFileU(null);
    }
  }, [audioFileU]);

  const [recordedFile, setRecordedFile] = useState(false);
  useEffect(() => {
    if (audioURL) {
      setTimeout(() => {
        setRecordedFile(true);
      }, 300);
    } else {
      setRecordedFile(false);
    }
  }, [audioURL]);

  const formatTime = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0'
    )}:${String(seconds).padStart(2, '0')}`;
  };
  return (
    <>
      <Grid h={'100%'} m={0}>
        <Grid.Col
          sx={(theme) => ({
            backgroundColor: '#FDFDFD',
          })}
          sm={12} // On small screens, take the full width
          md={8} // On medium screens, take half of the width
        >
          <Box
            w={{
              base: '100%',
              md: '90%',
            }}
            sx={(theme) => ({
              boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.165)',
              backgroundColor: '#FFFFFF',
              borderRadius: '15px',
            })}
            my={{
              base: '5%',
              md: '3%',
            }}
            mx={{
              base: 0,
              md: '5%',
            }}
            p={{
              base: 8,
              md: 16,
            }}
          >
            {inputType === 'file' && (
              <>
                <Text
                  size={15}
                  weight={700}
                  mx={{
                    base: 8,
                    md: 16,
                  }}
                >
                  Upload Audio or Video File
                </Text>
                <Text
                  size={14}
                  weight={100}
                  color="gray"
                  mx={{
                    base: 8,
                    md: 16,
                  }}
                >
                  Select an audio or video file to convert to text. Supported
                  formats are .flac, .mp3, .mp4, .mpeg, .mpga, .m4a, .ogg, .wav,
                  .webm.
                </Text>
                <Text
                  size={14}
                  weight={100}
                  color="gray"
                  mb={8}
                  mx={{
                    base: 8,
                    md: 16,
                  }}
                >
                  Max Limit: 10MB
                </Text>
                <Flex
                  my={8}
                  mx={{
                    base: 8,
                    md: 16,
                  }}
                >
                  <FileButton
                    accept=".flac,.mp3,.mp4,.mpeg,.mpga,.m4a,.ogg,.wav,.webm"
                    onChange={(file) => setaudioFileU(file)}
                  >
                    {(props) => (
                      <Button
                        {...props}
                        variant="light"
                        color="violet"
                        size="sm"
                        style={{
                          border: '1px solid',
                          borderTopRightRadius: '0px',
                          borderBottomRightRadius: '0px',
                          zIndex: 1,
                        }}
                        mr={'-4px'}
                        w={'120px'}
                      >
                        Browse
                      </Button>
                    )}
                  </FileButton>
                  <FileInput
                    iconWidth={'0px'}
                    accept=".flac,.mp3,.mp4,.mpeg,.mpga,.m4a,.ogg,.wav,.webm"
                    value={audioFileU}
                    onChange={(file) => setaudioFileU(file)}
                    placeholder={'Select Audio File'}
                    w={'100%'}
                    maw={'calc(100% - 125px)'}
                    size="sm"
                    style={{
                      borderTopLeftRadius: '0px',
                      borderBottomLeftRadius: '0px',
                    }}
                  />
                </Flex>
              </>
            )}
            {inputType === 'record' && (
              <>
                <Box>
                  <Text
                    size={15}
                    weight={700}
                    mx={{
                      base: 8,
                      md: 16,
                    }}
                  >
                    Record Audio
                  </Text>
                  <Text
                    size={14}
                    weight={100}
                    color="gray"
                    mx={{
                      base: 8,
                      md: 16,
                    }}
                  >
                    Record audio using your microphone and convert it to text.
                  </Text>
                  <Text
                    size={14}
                    weight={100}
                    color="gray"
                    mb={8}
                    mx={{
                      base: 8,
                      md: 16,
                    }}
                  >
                    Max Limit: 3 minutes
                  </Text>
                  <Box
                    style={{
                      height: '5px',
                      width: `${
                        recordingState === 'recording' ? audioLevel : 2
                      }%`,
                      backgroundColor: '#3fff10',
                      maxWidth: '90%',
                      borderRadius: '5px',
                    }}
                    mx={'auto'}
                  ></Box>
                  <Text
                    size={14}
                    weight={100}
                    mb={8}
                    mx={{
                      base: 8,
                      md: 16,
                    }}
                  >
                    Time Elapsed: {formatTime(timeElapsed)}
                  </Text>
                  {audioURL && recordedFile && (
                    <Box
                      mx={{
                        base: 8,
                        md: 16,
                      }}
                    >
                      <audio
                        style={{
                          width: '100%',
                        }}
                        controls
                        src={audioURL}
                      />
                    </Box>
                  )}
                  <Flex
                    direction={{
                      base: 'column',
                      lg: 'row',
                    }}
                    justify={'space-between'}
                    align={'center'}
                    mx={{
                      base: 8,
                      md: 16,
                    }}
                    gap={8}
                  >
                    <Button
                      color="green"
                      variant="filled"
                      style={{
                        border: '1px solid',
                      }}
                      my={8}
                      onClick={() => {
                        if (recordingState !== 'recording') {
                          startRecording();
                        }
                      }}
                      w={'100%'}
                    >
                      Start
                    </Button>
                    <Button
                      color="yellow"
                      variant="filled"
                      style={{
                        border: '1px solid',
                      }}
                      my={8}
                      onClick={
                        recordingState === 'paused'
                          ? resumeRecording
                          : recordingState === 'recording'
                          ? pauseRecording
                          : () => {}
                      }
                      w={'100%'}
                    >
                      {recordingState === 'paused' ? 'Resume' : 'Pause'}
                    </Button>
                    <Button
                      color="red"
                      variant="light"
                      style={{
                        border: '1px solid',
                      }}
                      my={8}
                      onClick={stopRecording}
                      w={'100%'}
                    >
                      Stop
                    </Button>
                    <Button
                      color="gray"
                      variant="filled"
                      style={{
                        border: '1px solid',
                      }}
                      my={8}
                      onClick={() => {
                        if (recordingState === 'recording') {
                          stopRecording();
                        }
                        setTimeout(() => {
                          if (typeof resetRecording === 'function') {
                            resetRecording();
                          }
                        }, 200);
                      }}
                      w={'100%'}
                    >
                      Reset
                    </Button>
                  </Flex>
                </Box>
              </>
            )}
          </Box>
          {text && (
            <Box
              w={{
                base: '100%',
                md: '90%',
              }}
              sx={(theme) => ({
                boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.165)',
                backgroundColor: '#FFFFFF',
                borderRadius: '15px',
              })}
              my={{
                base: '5%',
                md: '3%',
              }}
              mx={{
                base: 0,
                md: '5%',
              }}
              p={{
                base: 8,
                md: 16,
              }}
            >
              <Flex
                direction={'row'}
                justify={'space-between'}
                align={'center'}
              >
                <SegmentedControl
                  data={
                    summarize
                      ? [
                          { label: 'Transcription', value: 'transcription' },
                          { label: 'Summary', value: 'summary' },
                        ]
                      : [{ label: 'Transcription', value: 'transcription' }]
                  }
                  value={textShown}
                  onChange={(value) => setTextShown(value as any)}
                  fullWidth
                  color="violet"
                  variant="light"
                  my={8}
                />
                <CopyButton
                  value={textShown === 'transcription' ? text : summary}
                >
                  {({ copied, copy }) => (
                    <Button
                      w={90}
                      m={{
                        base: 8,
                        md: 16,
                      }}
                      size="xs"
                      color="violet"
                      variant="light"
                      style={{
                        border: '1px solid',
                      }}
                      onClick={copy}
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  )}
                </CopyButton>
              </Flex>
              <ScrollArea h={'60vh'}>
                <Textarea
                  value={textShown === 'transcription' ? text : summary}
                  w={'100%'}
                  style={{
                    borderTopLeftRadius: '0px',
                    borderBottomLeftRadius: '0px',
                  }}
                  styles={{
                    input: {
                      backgroundColor: '#FDFDFD',
                      border: 'none',
                    },
                  }}
                  autosize
                />
              </ScrollArea>
            </Box>
          )}
        </Grid.Col>
        <Grid.Col
          sx={(theme) => ({
            backgroundColor: '#FDFDFD',
          })}
          sm={12} // On small screens, take the full width
          md={4} // On medium screens, take half of the width
        >
          <Box
            m={{
              base: 0,
              md: '3%',
            }}
            mt={{
              base: '110px',
              md: '5%',
            }}
            bg={'#f5f7f9'}
            p={16}
            style={{
              boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.165)',
              backgroundColor: '#FFFFFF',
              borderRadius: '15px',
            }}
          >
            <Flex direction={'column'}>
              <SegmentedControl
                color="violet"
                variant="light"
                data={[
                  { label: 'Upload Audio File', value: 'file' },
                  { label: 'Record Audio', value: 'record' },
                ]}
                fullWidth
                orientation={windowWidth > 768 ? 'horizontal' : 'vertical'}
                value={inputType}
                onChange={(value) => setInputType(value as any)}
                my={8}
              />
              <Checkbox
                checked={summarize}
                color="violet"
                onChange={(event) => setSummarize(event.currentTarget.checked)}
                label="Transcription Summary"
                my={8}
                w={'100%'}
              />

              <Button
                color="violet"
                variant="light"
                style={{
                  border: '1px solid',
                }}
                w={'100%'}
                my={8}
                onClick={handleConvert}
                loading={loading}
              >
                Convert
              </Button>
              <Text size={14} weight={100} color="gray" ml={8}>
                {loading && 'Please Do not refresh the page while converting'}
              </Text>
            </Flex>
          </Box>
        </Grid.Col>
      </Grid>
    </>
  );
};

export default AudioToText;
