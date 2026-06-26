import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
html,
body {
  background-color: #F8FAFC;
  margin: 0;
  min-height: 100%;
  overflow-x: hidden;
  width: 100%;
}
body {
  align-items: stretch;
  display: flex;
  justify-content: center;
}
body * {
  box-sizing: border-box;
}
#root,
#expo-root {
  background-color: #FFFFFF;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.05);
  min-height: 100%;
  overflow-x: hidden;
  position: relative;
  width: min(100vw, 430px);
}
body > div {
  margin: 0 auto;
  max-width: none;
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
  width: min(100vw, 430px);
}
`;
