import React, { FC, useEffect, useState } from 'react';
import { GeistSans } from 'geist/font/sans';
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
  Select,
  ColorSchemeProvider,
  MantineProvider,
  ColorScheme,
  rem,
} from '@mantine/core';

import { useRecorder } from 'react-microphone-recorder';
import { AudioRecorder } from './AudioRecorder';
import { IconPencil } from '@tabler/icons-react';
const QuillEditor = dynamic(() => import('react-quill'), {
  ssr: false, // This ensures it's not loaded during server-side rendering
});
import 'react-quill/dist/quill.snow.css';
import dynamic from 'next/dynamic';

type Language = 'en' | 'es' | 'pt';

type HomeProps = {
  theme?: string; // 'light' | 'dark'
  lang?: Language; // 'en' | 'es' | 'pt'
};

const Home: React.FC<HomeProps> = (props) => {
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
  const LANGUAGES = {
    automatic: 'Detect automatically',
    en: 'english',
    zh: 'chinese',
    de: 'german',
    es: 'spanish',
    ru: 'russian',
    ko: 'korean',
    fr: 'french',
    ja: 'japanese',
    pt: 'portuguese',
    tr: 'turkish',
    pl: 'polish',
    ca: 'catalan',
    nl: 'dutch',
    ar: 'arabic',
    sv: 'swedish',
    it: 'italian',
    id: 'indonesian',
    hi: 'hindi',
    fi: 'finnish',
    vi: 'vietnamese',
    he: 'hebrew',
    uk: 'ukrainian',
    el: 'greek',
    ms: 'malay',
    cs: 'czech',
    ro: 'romanian',
    da: 'danish',
    hu: 'hungarian',
    ta: 'tamil',
    no: 'norwegian',
    th: 'thai',
    ur: 'urdu',
    hr: 'croatian',
    bg: 'bulgarian',
    lt: 'lithuanian',
    la: 'latin',
    mi: 'maori',
    ml: 'malayalam',
    cy: 'welsh',
    sk: 'slovak',
    te: 'telugu',
    fa: 'persian',
    lv: 'latvian',
    bn: 'bengali',
    sr: 'serbian',
    az: 'azerbaijani',
    sl: 'slovenian',
    kn: 'kannada',
    et: 'estonian',
    mk: 'macedonian',
    br: 'breton',
    eu: 'basque',
    is: 'icelandic',
    hy: 'armenian',
    ne: 'nepali',
    mn: 'mongolian',
    bs: 'bosnian',
    kk: 'kazakh',
    sq: 'albanian',
    sw: 'swahili',
    gl: 'galician',
    mr: 'marathi',
    pa: 'punjabi',
    si: 'sinhala',
    km: 'khmer',
    sn: 'shona',
    yo: 'yoruba',
    so: 'somali',
    af: 'afrikaans',
    oc: 'occitan',
    ka: 'georgian',
    be: 'belarusian',
    tg: 'tajik',
    sd: 'sindhi',
    gu: 'gujarati',
    am: 'amharic',
    yi: 'yiddish',
    lo: 'lao',
    uz: 'uzbek',
    fo: 'faroese',
    ht: 'haitian creole',
    ps: 'pashto',
    tk: 'turkmen',
    nn: 'nynorsk',
    mt: 'maltese',
    sa: 'sanskrit',
    lb: 'luxembourgish',
    my: 'myanmar',
    bo: 'tibetan',
    tl: 'tagalog',
    mg: 'malagasy',
    as: 'assamese',
    tt: 'tatar',
    haw: 'hawaiian',
    ln: 'lingala',
    ha: 'hausa',
    ba: 'bashkir',
    jw: 'javanese',
    su: 'sundanese',
    yue: 'cantonese',
  };
  const [language, setLanguage] = useState('automatic');
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
          language: language,
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
            language: language,
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

  useEffect(() => {
    if (audioFileU && audioFileU.size > 10 * 1024 * 1024) {
      alert('File size should be less than 10MB');
      setaudioFileU(null);
    }
  }, [audioFileU]);

  return (
    <>
      <ColorSchemeProvider
        colorScheme={app_theme === 'dark' ? 'dark' : 'light'}
        toggleColorScheme={() => {}}
      >
        <MantineProvider
          theme={{
            colorScheme: app_theme === 'dark' ? 'dark' : 'light',
            fontFamily: GeistSans.style.fontFamily,
          }}
          withGlobalStyles
          withNormalizeCSS
        >
          <style jsx global>{`
            .ql-toolbar {
              border: 1px solid ${app_theme === 'dark' ? '#2C2C30' : '#ccc'} !important;
              border-radius: 25px 25px 0 0;
            }
            .ql-container {
              border: 1px solid ${app_theme === 'dark' ? '#2C2C30' : '#ccc'} !important;
              border-radius: 0 0 25px 25px;
            }
            .ql-editor {
              min-height: 280px;
            }
            ${app_theme === 'dark'
              ? `.ql-toolbar svg,
.ql-toolbar rect,
.ql-toolbar line,
.ql-toolbar path,
.ql-toolbar span {
          /* fill: #ccc !important; */
          stroke: #ccc !important;
          color: #ccc !important; 
        }`
              : ''}

            ::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }

            ::-webkit-scrollbar-track {
              background: transparent; /* Background of the scrollbar track */
            }

            ::-webkit-scrollbar-thumb {
              background-color: #888; /* Color of the scrollbar handle */
              border-radius: 10px;
              border: 3px solid transparent; /* Padding around the handle */
              background-clip: padding-box;
            }

            ::-webkit-scrollbar-thumb:hover {
              background-color: #555; /* Darker color when hovered */
            }
          `}</style>
          <Grid
            py={48}
            px={8}
            w={'100%'}
            mih={'100vh'}
            style={{
              backgroundColor: app_theme === 'dark' ? '#000' : '#fff',
            }}
          >
            <Grid.Col
              sx={() => ({
                borderRight: '1px solid',
                borderColor: app_theme === 'dark' ? '#2C2C30' : '#C5C5C9',
              })}
              sm={6}
              md={6}
              lg={6}
              w={'100%'}
              pl={{
                base: 8,
                md: 60,
                lg: 60,
              }}
              pr={{
                base: 8,
                md: 24,
                lg: 24,
              }}
            >
              <Box w={{ base: '100%' }}>
                <SegmentedControl
                  fullWidth
                  radius={6}
                  value={inputType}
                  onChange={(value) => {
                    setInputType(value as any);
                  }}
                  data={[
                    {
                      value: 'file',
                      label: 'Upload File',
                    },
                    {
                      value: 'record',
                      label: 'Record Audio',
                    },
                  ]}
                  styles={{
                    controlActive: {
                      backgroundColor:
                        app_theme === 'dark' ? '#2C2C30' : '#DFDFE2',
                    },
                    root: {
                      backgroundColor: 'transparent',
                      border: '1px solid',
                      borderColor: app_theme === 'dark' ? '#2C2C30' : '#DFDFE2',
                    },
                  }}
                  mb={24}
                />
                {inputType === 'file' && (
                  <>
                    <Text size={'lg'} weight={700} mb={4}>
                      Upload audio or video file
                    </Text>
                    <Text size={'sm'} weight={400} color="gray" mb={12}>
                      Select an audio or video file to convert to text.
                      Supported formats are .flac, .mp3, .mp4, .mpeg, .mpga,
                      .m4a, .ogg, .wav, .webm. Max Limit: 10MB
                    </Text>
                    <Box
                      style={{
                        border:
                          '1px solid ' +
                          (app_theme === 'dark' ? '#2f2e2e' : '#CDCDCDFF'),
                        borderRadius: '24px',
                        padding: '3px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      mx={{
                        base: 'auto',
                        md: 0,
                        lg: 0,
                      }}
                      // miw={350}
                      // maw={300}
                      mb={24}
                    >
                      <FileButton
                        accept=".flac,.mp3,.mp4,.mpeg,.mpga,.m4a,.ogg,.wav,.webm"
                        onChange={(file) => {
                          setaudioFileU(file);
                        }}
                      >
                        {(props) => (
                          <Button
                            {...props}
                            size="sm"
                            style={{
                              borderRadius: '24px',
                              zIndex: 1,
                              // padding: '0px',
                              color:
                                app_theme === 'dark' ? '#CDCDCDFF' : '#141415',
                              backgroundColor:
                                app_theme === 'dark' ? '#141415' : '#EDEDEE',
                            }}
                            w={'120px'}
                          >
                            Browse
                          </Button>
                        )}
                      </FileButton>
                      <FileInput
                        accept=".flac,.mp3,.mp4,.mpeg,.mpga,.m4a,.ogg,.wav,.webm"
                        value={audioFileU}
                        onChange={(file) => {
                          setaudioFileU(file);
                        }}
                        w={'100%'}
                        style={{
                          border: 'none',
                        }}
                        styles={(theme) => ({
                          input: {
                            border: 'none',
                            backgroundColor: 'transparent',
                          },
                          placeholder: {
                            paddingLeft: '5%',
                          },
                        })}
                        placeholder={'No file selected'}
                        clearable
                      />
                    </Box>
                  </>
                )}
                {inputType === 'record' && (
                  <AudioRecorder setaudioFileU={setaudioFileU} />
                )}
                <Select
                  label="Language (OPTIONAL)"
                  data={Object.keys(LANGUAGES).map((key) => {
                    return {
                      label: LANGUAGES[key as keyof typeof LANGUAGES],
                      value: key,
                    };
                  })}
                  size="md"
                  radius={'xl'}
                  searchable
                  value={language}
                  mt={24}
                  color="dark"
                  onChange={(val) => setLanguage(val as string)}
                />
                <Checkbox
                  checked={summarize}
                  color="dark"
                  onChange={(event) =>
                    setSummarize(event.currentTarget.checked)
                  }
                  label="Transcription Summary"
                  mt={24}
                  w={'100%'}
                />
                <Button
                  leftIcon={<IconPencil />}
                  onClick={handleConvert}
                  loading={loading}
                  radius={'xl'}
                  variant={app_theme !== 'dark' ? 'filled' : 'outline'}
                  color="dark"
                  size="md"
                  styles={(theme) => ({
                    root: {
                      color: app_theme !== 'dark' ? '#ffffff' : '#000000',
                      backgroundColor:
                        app_theme !== 'dark' ? '#000000' : '#ffff',
                      border: 0,
                      height: rem(42),
                      paddingLeft: rem(20),
                      paddingRight: rem(20),
                      '&:hover': {
                        backgroundColor:
                          app_theme === 'dark' ? '#808080' : '#333333',
                      },
                      '&:disabled': {
                        color: app_theme === 'dark' ? '#76767F' : '#909098',
                        backgroundColor:
                          app_theme === 'dark' ? '#2C2C30' : '#DFDFE2',
                      },
                    },
                  })}
                  mt={24}
                  disabled={!audioFileU}
                >
                  Transcribe
                </Button>
              </Box>
              {/* {text && (
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
                        summarize && summary
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
                      size="sm"
                      // weight={400}
                      minRows={10}
                      autosize
                      readOnly
                    />
                  </ScrollArea>
                </Box>
              )} */}
            </Grid.Col>
            <Grid.Col
              sx={() => ({
                // borderRight: '1px solid #D9D9D9',
                '@media (min-width: 768px)': {
                  display: 'flex',
                  justifyContent: 'flex-end',
                },
              })}
              sm={6}
              md={6}
              lg={6}
              w={'100%'}
              // mt={48}
              pr={{
                base: 8,
                sm: 8,
                md: 60,
                lg: 60,
              }}
              pl={{
                base: 8,
                sm: 8,
                md: 24,
                lg: 24,
              }}
              mx={'auto'}
            >
              <Box w={'100%'}>
                <SegmentedControl
                  fullWidth
                  radius={6}
                  value={textShown}
                  onChange={(value) => {
                    setTextShown(value as 'transcription' | 'summary');
                  }}
                  defaultValue="transcription"
                  data={[
                    {
                      value: 'transcription',
                      label: 'Transcription',
                    },
                    {
                      value: 'summary',
                      label: 'Summary',
                    },
                  ]}
                  styles={{
                    controlActive: {
                      backgroundColor:
                        app_theme === 'dark' ? '#2C2C30' : '#DFDFE2',
                    },
                    root: {
                      backgroundColor: 'transparent',
                      border: '1px solid',
                      borderColor: app_theme === 'dark' ? '#2C2C30' : '#DFDFE2',
                    },
                  }}
                  mb={24}
                />
                {!loading && text === '' && (
                  <Text size={'md'} weight={100} color="gray" mb={8}>
                    Your audio {textShown} will appear here.
                  </Text>
                )}
                <Text size={14} weight={100} color="gray" ml={8}>
                  {loading &&
                    'Please do not refresh the page while transcribing'}
                </Text>
                {!loading && text && (
                  <>
                    <QuillEditor
                      value={textShown === 'transcription' ? text : summary}
                      theme="snow"
                      onChange={(value) => {
                        if (textShown === 'transcription') {
                          setText(value);
                        } else {
                          setSummary(value);
                        }
                      }}
                      id={'output_box'}
                      style={{
                        borderRadius: '25px',
                      }}
                      modules={{
                        toolbar: [
                          [{ font: [] }],
                          [{ header: [1, 2, 3, 4, 5, 6, false] }],
                          [{ size: ['small', false, 'large', 'huge'] }], // text size options
                          ['bold', 'italic', 'underline', 'strike'], // toggled buttons
                          // [{ color: [] }, { background: [] }], // dropdown with defaults from theme
                          // [{ script: 'sub' }, { script: 'super' }], // superscript/subscript
                          // ['blockquote', 'code-block'],
                          [{ list: 'ordered' }, { list: 'bullet' }],
                          // [{ indent: '-1' }, { indent: '+1' }], // outdent/indent
                          // [{ direction: 'rtl' }], // text direction
                          [
                            {
                              align: [],
                            },
                          ],
                          // ['link', 'image', 'video'],
                          // ['clean'], // remove formatting button
                        ],
                      }}
                    />
                  </>
                )}
              </Box>
            </Grid.Col>
          </Grid>
        </MantineProvider>
      </ColorSchemeProvider>
    </>
  );
};

export default Home;
