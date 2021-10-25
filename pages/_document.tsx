import Document, { Head, Html, Main, NextScript } from "next/document"

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}', {
  page_path: window.location.pathname,
});`.trim(),
            }}
          />
        </Head>
        <body>
          <script
            dangerouslySetInnerHTML={{
              __html: `
var storageKey = "darkMode";
var classNameDark = "dark-mode";
var classNameLight = "light-mode";
function setClassOnDocumentBody(darkMode) {
  document.body.classList.add(darkMode ? classNameDark : classNameLight);
  document.body.classList.remove(darkMode ? classNameLight : classNameDark);
}

var preferDarkQuery = "(prefers-color-scheme: dark)";
var supportsColorSchemeQuery = window.matchMedia(preferDarkQuery).media === preferDarkQuery;

var localStorageTheme = null;
try {
  localStorageTheme = localStorage.getItem(storageKey);
} catch (err) {}

var localStorageExists = localStorageTheme !== null;
if (localStorageExists) {
  localStorageTheme = JSON.parse(localStorageTheme);
  setClassOnDocumentBody(localStorageTheme);
} else if (supportsColorSchemeQuery) {
  setClassOnDocumentBody(mql.matches);
  localStorage.setItem(storageKey, mql.matches);
} else {
  var isDarkMode = document.body.classList.contains(classNameDark);
  localStorage.setItem(storageKey, JSON.stringify(isDarkMode));
}
`.trim(),
            }}
          />
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
