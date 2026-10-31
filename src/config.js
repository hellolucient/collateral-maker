/* =====================================================================================================
   CONFIG - the one place to rebrand the Collateral Maker.
   -----------------------------------------------------------------------------------------------------
   Two ways to use it:
     1. Edit the values below directly in index.html (this block is at the top of the file), save, reload.
     2. Or edit src/config.js and run `node build.js` to rebuild index.html.
   Everything is optional: delete a line and the built-in default is used.
   ===================================================================================================== */
window.CONFIG = {

  /* --- Who you are ------------------------------------------------------------------------------- */
  brandName: "Your Brand",                 // appears on every piece, in the page title and in file names
  tagline: "Your tagline goes here",       // short line on the welcome postcard and the phone business card
  location: "Your City",                   // small capitals line on the card fronts. Use "" to leave it out
  website: "yourbrand.com",                // shown as text on the pieces. QR codes default to https://<website>
  appTitle: "Collateral Maker",            // the name shown at the top of the page
  storagePrefix: "collateral-maker",       // browser storage name. Change it if two copies are hosted on the same site

  /* --- Request tab --------------------------------------------------------------------------------- */
  requestEmail: "requests@example.com",    // "Email this request" opens the user's own email app, addressed here

  /* --- Gift card and voucher numbers --------------------------------------------------------------- */
  numberPrefixes: { voucher: "GV-", giftcard: "GC-" },   // numbers are suggested as GV-0001, GV-0002 ...

  /* --- Colours (any CSS hex colour) ---------------------------------------------------------------- */
  colors: {
    ink: "#2E3440",        // main text and dark backgrounds
    accent: "#6C7A89",     // secondary text, thin rules, small caps labels
    paper: "#F7F7F5",      // light background of the pieces and the page
    band: "#ECEDEA",       // soft bands and the footer strip
    highlight: "#B4A58B",  // small accent lines
    line: "#D5D8D6"        // hairlines and ruled writing lines
  },

  /* --- Fonts ----------------------------------------------------------------------------------------
     CSS font-family stacks. 'Abhaya Libre' (headings) and 'Noto Sans' (body) are bundled in index.html.
     Any other name only works if that font is installed on the viewer's device, so keep a fallback. */
  fonts: {
    heading: "'Abhaya Libre', Georgia, serif",
    body: "'Noto Sans', Arial, sans-serif"
  },

  /* --- Logo -----------------------------------------------------------------------------------------
     By default a simple text logo is drawn from brandName. To use your own, paste an inline SVG string
     ("<svg ...>...</svg>") or a data: URI. Do not use a file path: exports need the logo inside the file.
       onLight / symbolOnLight : the version that sits on light backgrounds (usually your dark logo)
       onDark  / symbolOnDark  : the version that sits on dark photos or colours (usually white)
     The symbol is the small mark used on card backs and the certificate seal.
     wordmarkRatio and symbolRatio are height divided by width of your artwork. */
  logo: {
    onLight: null, onDark: null, symbolOnLight: null, symbolOnDark: null,
    wordmarkRatio: 56 / 142, symbolRatio: 31 / 60
  },

  /* --- Picture backgrounds -------------------------------------------------------------------------
     The choices in the "Picture" dropdown. Each has an id, a label and EITHER a CSS `background`
     (a colour or gradient) OR a `src` (a data: URI or image URL). People can also upload their own photo
     in the app. Add as many as you like. */
  images: [
    { id: "sage",  label: "Sage",  background: "linear-gradient(135deg,#8E9A86,#5F6B58)" },
    { id: "dusk",  label: "Dusk",  background: "linear-gradient(135deg,#8A8FA3,#565B73)" },
    { id: "clay",  label: "Clay",  background: "linear-gradient(135deg,#B58E7A,#7F5A4A)" },
    { id: "stone", label: "Stone", background: "linear-gradient(135deg,#9C9A94,#66645F)" },
    { id: "sand",  label: "Sand",  background: "linear-gradient(135deg,#C2AE8C,#8E7A5A)" },
    { id: "ink",   label: "Charcoal", background: "linear-gradient(135deg,#4A4F58,#2B2E34)" }
  ],

  /* --- Background pattern on the footer strips: "dots", "lines" or "none" ------------------------- */
  pattern: "dots"
};
