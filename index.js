// pages/_app.js
// Root wrapper — imports global styles and passes pageProps to every page.

import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}
