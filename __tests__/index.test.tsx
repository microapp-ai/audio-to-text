import { test, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import Home from '../pages';
import { mantineTheme } from '@/styles/mantine-theme';
import { MantineProvider } from '@mantine/core';

beforeAll(() => {
  window.matchMedia =
    window.matchMedia ||
    function () {
      return {
        matches: false,
        addListener: function () {},
        removeListener: function () {},
      };
    };
});

test('renders the page', async () => {
  render(
    <MantineProvider withGlobalStyles withNormalizeCSS theme={mantineTheme}>
      <Home />
    </MantineProvider>
  );
});
