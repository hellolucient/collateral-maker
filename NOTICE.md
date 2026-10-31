# Third-party notices

The Collateral Maker itself is MIT licensed (see `LICENSE`). It bundles the following third-party
components. Full licence texts are in the `LICENSES/` folder. The built `index.html` contains this
code and font data inline, so keep this notice and the `LICENSES/` folder when you redistribute it.

| Component | Where | Licence | Copyright |
|---|---|---|---|
| [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) 2.0.4 | `src/vendor/qrcode.js` | MIT (`LICENSES/MIT-qrcode-generator.txt`) | (c) 2009 Kazuhiko Arase |
| [Abhaya Libre](https://github.com/mooniak/abhaya-libre-font) (Medium, SemiBold) | `src/fonts/AbhayaLibre-*.woff` | SIL Open Font License 1.1 (`LICENSES/OFL-AbhayaLibre.txt`) | (c) 2013-2016 Abhaya Libre Project Authors |
| [Noto Sans](https://github.com/notofonts/latin-greek-cyrillic) (variable) | `src/fonts/NotoSans-Variable.woff` | SIL Open Font License 1.1 (`LICENSES/OFL-NotoSans.txt`) | Copyright 2022 The Noto Project Authors |

"QR Code" is a registered trademark of DENSO WAVE INCORPORATED.

The OFL allows the fonts to be bundled and embedded in documents (including the PDFs and images this
tool makes) provided they are not sold on their own. If you swap in other fonts, check their licences.

The PDF writer (`src/pdf.js`) is a small original module that is part of this project and covered by the MIT licence.
