import { MantineThemeOverride } from '@mantine/core';

export const mantineTheme: MantineThemeOverride = {
  colorScheme: 'light',
  colors: {
    dark: ['#202123', '#96979B'],
    light: ['#fff', '#FDFDFD', '#D9D9D9'],
    red: ['#FF5C5C', '#FFDADA'],
  },

  shadows: {
    md: '0px 0px 6px 0px rgba(0, 0, 0, 0.12)',
    xl: '5px 5px 3px rgba(0, 0, 0, .25)',
  },
  headings: {
    fontFamily: 'Open Sans, sans-serif',
  },
};
