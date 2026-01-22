import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
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
body {
  background-color: #F6F8FC;
  background-image:
    radial-gradient(900px 560px at 18% 6%, rgba(182, 255, 0, 0.14), transparent 60%),
    radial-gradient(720px 520px at 92% 84%, rgba(0, 209, 255, 0.12), transparent 55%),
    repeating-linear-gradient(
      0deg,
      rgba(11, 18, 32, 0.04) 0px,
      rgba(11, 18, 32, 0.04) 1px,
      transparent 1px,
      transparent 72px
    );
  background-attachment: fixed;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #05080D;
    background-image:
      radial-gradient(980px 620px at 16% 8%, rgba(182, 255, 0, 0.18), transparent 60%),
      radial-gradient(760px 560px at 92% 86%, rgba(0, 209, 255, 0.16), transparent 55%),
      repeating-linear-gradient(
        0deg,
        rgba(233, 240, 250, 0.05) 0px,
        rgba(233, 240, 250, 0.05) 1px,
        transparent 1px,
        transparent 72px
      );
    background-attachment: fixed;
  }
}`;
