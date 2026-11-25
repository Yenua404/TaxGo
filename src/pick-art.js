/* Original pixel illustrations of the products, their packaging and scent or flavour notes. */
(function () {
  'use strict';

  var ink = '#272338';
  var cream = '#fff2ca';

  function rect(x, y, w, h, fill) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"/>';
  }

  function path(d, fill, stroke) {
    return '<path d="' + d + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="2"' : '') + '/>';
  }

  function label(x, y, value, fill, size) {
    return '<text x="' + x + '" y="' + y + '" fill="' + fill + '" text-anchor="middle" font-family="monospace" font-size="' + size + '" font-weight="700">' + value + '</text>';
  }

  function art(content) {
    return '<svg class="pick-sprite" viewBox="0 0 64 64" aria-hidden="true" shape-rendering="crispEdges">' +
      '<g opacity=".16">' + path('M10 57h44v2h4v2H6v-2h4z', '#30253c') + '</g>' + content + '</svg>';
  }

  function cologne(tone, accent, name, notes) {
    return art(
      path('M34 14h16l5 5v36H34z', '#ede4c6', ink) +
      path('M50 14l5 5v36h-5z', '#b9a788') +
      rect(36, 24, 12, 2, accent) + rect(37, 28, 10, 1, '#948573') + rect(37, 31, 8, 1, '#948573') +
      path('M16 8h13v3h3v12H13V11h3z', '#909daa', ink) +
      rect(17, 10, 3, 10, '#f7f5e8') + rect(25, 11, 3, 9, '#525c71') +
      path('M12 23h21v4h4v27h-4v4H12v-4H8V27h4z', '#fff7de', ink) +
      path('M11 32h23v21h-4v3H15v-3h-4z', tone) +
      rect(11, 28, 2, 18, '#fffdf1') + rect(32, 30, 2, 20, accent) +
      rect(14, 34, 17, 15, ink) + rect(15, 35, 15, 13, '#fff7df') +
      label(22.5, 39.5, 'JM', ink, 4) + label(22.5, 44, name, ink, 3.1) +
      notes
    );
  }

  window.TAXGO_PICK_ART = {
    '23': art(
      path('M29 10h18l7 5v43H29z', '#eee0b5', ink) +
      path('M47 10l7 5v43h-7z', '#a89364') +
      rect(37, 18, 7, 32, '#fdf5d5') + label(40.5, 26, '23', '#66423c', 6) +
      rect(40, 31, 1, 12, '#6e5a44') +
      path('M13 8h12v5h2v17l6 7v18l-3 4H9l-3-4V37l7-7z', '#203f35', ink) +
      path('M13 8h12v5h2v13H12V12z', '#594063') +
      path('M13 25l-7-3 2 8 10-3 9 6 1-8-9-1z', '#72517b') +
      rect(9, 38, 2, 15, '#487664') + rect(12, 38, 16, 16, '#fcf5d8') +
      label(20, 44, 'DASSAI', ink, 3.3) + label(20, 51, '23', '#66423c', 6) +
      rect(12, 11, 12, 2, '#87678d')
    ),
    '梅': art(
      path('M20 8h23v5h-2v5l7 7v28l-4 5H19l-4-5V25l7-7v-5h-2z', '#ba8435', ink) +
      rect(20, 8, 23, 7, '#33334b') + rect(21, 10, 21, 2, '#565872') +
      path('M18 28h27v24l-3 3H21l-3-3z', '#daa84c') +
      rect(18, 27, 2, 23, '#fce0a3') +
      path('M26 43h8v2h3v7h-3v3h-8v-3h-3v-7h3zm11-6h5v2h3v5h-3v3h-5v-3h-2v-5h2z', '#73763a') +
      path('M12 24h39v16H12z', '#fff0bc', ink) + rect(14, 26, 35, 2, '#86622a') +
      label(31.5, 34, 'CHOYA', '#524019', 6) + label(31.5, 38, 'KISHU', '#7c5e30', 3.4)
    ),
    '柚': art(
      path('M18 7h13v6h-2v7l7 8v24l-4 5H14l-4-5V30l8-10v-7z', '#d5972d', ink) +
      rect(18, 7, 13, 6, '#ead27b') + rect(19, 9, 11, 2, '#8e6e38') +
      path('M13 31h20v20l-3 2H16l-3-2z', '#f3c456') +
      rect(13, 30, 2, 17, '#ffe7a0') + rect(15, 32, 17, 15, '#fff1c6') +
      label(23.5, 38, 'YUZU', '#56703c', 4.7) + rect(18, 41, 11, 1, '#d1a950') +
      path('M43 39h9v3h4v4h2v7h-4v4h-4v2h-7v-3h-4v-3h-2v-8h3v-4h3z', '#ebb341', ink) +
      path('M46 40v-5h4v-4h8v3h-3v2h-5v4z', '#607b45') +
      rect(41, 46, 3, 3, '#ffe082') + rect(52, 49, 2, 3, '#ba8027')
    ),
    PEAR: cologne('#e5c06b', '#ab8a47', 'PEAR',
      path('M47 42h3v4h4v4h3v6h-3v3h-9v-3h-3v-6h3v-4h2z', '#b0ad50', ink) +
      path('M48 45v-5h4v-4h6v3h-2v2h-5v4z', '#597342') + rect(46, 51, 2, 4, '#e1d582')
    ),
    SEA: cologne('#baece1', '#67948d', 'SEA SALT',
      path('M42 49h4v-4h4v4h5v-2h5v3h-4v3h-6v-1h-4v3h-7v-3h3zm0 8h6v-2h5v2h7v2H42z', '#467e92') +
      path('M49 42h3v2h3v3h-3v2h-3v-2h-2v-3h2z', '#fffbec', '#77a4ab')
    ),
    PEONY: cologne('#e7a8af', '#bd7e8a', 'PEONY',
      path('M48 44h5v-3h4v4h3v4h-3v4h-6v4h-5v-3h-4v-6h3v-4z', '#cc7f9a', ink) +
      path('M49 45h4v2h4v3h-5v3h-5v-2h-2v-3h4z', '#faafbe') +
      path('M49 53h3v5h6v3h-7v-3h-2z', '#6d8048') + rect(50, 48, 3, 2, '#faca80')
    ),
    'SK-II': art(
      path('M29 16h23l5 5v37H29z', '#ba4962', ink) +
      path('M52 16l5 5v37h-5z', '#853343') + rect(36, 28, 13, 12, '#de8796') +
      label(42.5, 35, 'SK-II', '#fff2da', 4.2) +
      path('M27 12h11v10h3v31l-3 4H27l-3-4V22h3z', '#dfc479', ink) +
      rect(28, 12, 9, 10, '#cbd0d0') + rect(29, 14, 2, 7, '#f6f7eb') +
      path('M11 6h12v12h3v35l-3 5H11l-3-5V18h3z', '#efdb9f', ink) +
      rect(11, 6, 12, 12, '#b8c0c4') + rect(12, 8, 3, 8, '#f6f7ed') +
      rect(10, 20, 2, 30, '#fff5d3') + rect(11, 30, 12, 13, '#fff4d3') +
      label(17, 37, 'SK-II', '#a5364e', 3.5) + rect(14, 39, 6, 1, '#ae8664')
    ),
    BASE: art(
      path('M33 8h15l6 5v45H33z', '#222c4a', ink) +
      path('M48 8l6 5v45h-6z', '#141e34') + rect(36, 16, 1, 35, '#536a88') +
      path('M12 8h21v5l-3 31H15l-3-31z', '#485781', ink) +
      rect(13, 10, 19, 3, '#8095b0') + path('M29 15h3l-3 27h-4z', '#313b65') +
      rect(17, 22, 10, 1, '#d9b887') + rect(19, 24, 6, 1, '#d9b887') +
      label(22.5, 32, 'BASE', '#f8e4c0', 4) +
      path('M15 43h15v5H15z', '#bd9b6c', ink) + path('M14 48h17v9l-2 2H16l-2-2z', '#2b3454', ink) +
      rect(17, 50, 2, 6, '#6c7a9b') + rect(39, 30, 6, 2, '#ad946b')
    ),
    ULT: art(
      path('M34 11h14l7 5v42H34z', '#b5374f', ink) +
      path('M48 11l7 5v42h-7z', '#762941') + rect(37, 22, 9, 20, '#d45168') +
      path('M16 5h12v4h3v14H13V9h3z', '#c5c9cf', ink) +
      rect(16, 8, 3, 12, '#fff4e2') + rect(26, 8, 3, 12, '#818397') +
      path('M13 22h18v5h4v25l-3 5H12l-3-5V27h4z', '#d14e62', ink) +
      path('M12 30h4v19h-3v3h-2V30zm4-4h4v3h-4z', '#f47e82') +
      path('M29 27h4v24l-4 4h-7v-4h7z', '#a02e46') +
      rect(13, 21, 18, 3, '#674556') + label(22, 39, 'ULT', '#fff4e5', 5.2) +
      rect(17, 41, 10, 1, '#f0b6b0')
    ),
    square: art(
      path('M5 37h54v11l-5 7H11l-6-7z', '#3b4458', ink) +
      rect(12, 48, 40, 2, '#636e7a') +
      path('M5 22h21l3 4h6l3-4h21v5h-2v10l-4 6H41l-6-5v-8h-6v8l-6 5H11l-4-6V27H5z', '#273338', ink) +
      path('M10 27h14l2 3v7l-4 3h-9l-3-3zm30 0h14v10l-3 3h-9l-4-3v-7z', '#5c8377') +
      path('M13 28h7l-7 7zm31 0h7l-7 7z', '#aac2aa') +
      rect(8, 24, 3, 2, '#d6c5a3') + rect(53, 24, 3, 2, '#d6c5a3')
    ),
    aviator: art(
      path('M6 42h52v11l-5 5H11l-5-5z', '#a07754', ink) +
      rect(12, 46, 40, 2, '#d3a574') +
      path('M5 20h20v3h14v-3h20v6h-2v8h-3v6h-4v4h-7v-2h-4v-5h-3v-8h-8v8h-3v5h-4v2h-7v-4h-4v-6H7v-8H5z', '#a08248', ink) +
      path('M9 24h15l2 5v7h-3v4h-3v2h-5v-4h-3v-6H9zm31 0h15v8h-3v6h-3v4h-5v-2h-3v-4h-3v-7z', '#637f70') +
      path('M11 25h8l-8 9zm30 0h8l-8 9z', '#b9c4a5') + rect(27, 24, 10, 2, '#e1c487')
    ),
    brow: art(
      path('M8 42h48v10l-6 5H13l-5-5z', '#7e4f4c', ink) +
      rect(16, 48, 33, 2, '#af7770') +
      path('M5 20h20l5 4h4l5-4h20v6h-3v10l-3 5H41l-5-4v-8h-8v8l-5 4H11l-3-5V26H5z', '#ad8959', ink) +
      path('M10 26h14l2 3v7l-4 3h-9l-3-4zm30 0h14v9l-3 4h-9l-4-3v-7z', '#8c805e') +
      path('M5 20h20l5 4v4h-5l-3-2H5zm34 0h20v6H42l-3 2h-5v-4z', '#62392f') +
      rect(8, 22, 4, 2, '#bf9168') + rect(52, 22, 4, 2, '#bf9168') +
      path('M13 28h7l-7 7zm31 0h7l-7 7z', '#cbb78c')
    ),
    BANANA: art(
      path('M5 24l10-7h35l9 7v27H5z', '#f6cc56', ink) +
      path('M5 24l10-7h35l9 7z', '#fff0a3') + rect(8, 28, 48, 2, '#fbf2bf') +
      rect(8, 44, 48, 2, '#dd9e3c') + rect(15, 31, 34, 12, '#fff3cc') +
      label(32, 36, 'TOKYO', '#79542e', 3.8) + label(32, 41, 'BANANA', '#79542e', 4) +
      path('M31 49h8v2h11v-3h7v4h-2v4h-4v3H35v-2h-7v-4h3z', '#edb754', ink) +
      path('M34 51h5v2h12v2H37v-2h-3z', '#fff1a6')
    ),
    MAPLE: art(
      path('M8 17h40l7 8v29H8z', '#d7924e', ink) +
      path('M8 17h40l7 8H8z', '#efbe72') + path('M48 17l7 8v29h-7z', '#9d5940') +
      rect(12, 27, 33, 22, '#fbe6aa') + rect(13, 29, 31, 2, '#943d3b') +
      label(29, 38, 'MAPLE', '#963f35', 5) + label(29, 44, 'MANIA', '#963f35', 4.8) +
      path('M38 48h18v3h3v6h-3v3H37v-2h-3v-7h4z', '#bb763c', ink) +
      path('M37 52h19v2h-3v1H36v-2z', '#f2cca0') +
      rect(41, 50, 3, 1, '#764228') + rect(49, 52, 2, 1, '#764228')
    ),
    KUBOTA: art(
      path('M31 11h17l8 6v42H31z', '#d1b6a1', ink) +
      path('M48 11l8 6v42h-8z', '#97817f') +
      rect(35, 17, 10, 2, '#ab5359') + rect(37, 23, 8, 24, '#eee1c9') +
      label(41, 33, 'K', '#68526a', 7) + rect(39, 37, 4, 6, '#77606e') +
      path('M14 6h13v12h2v10l5 7v22l-2 3H9l-2-3V35l5-7V18h2z', '#413a45', ink) +
      rect(14, 6, 13, 9, '#5f485a') + rect(16, 8, 3, 5, '#bd8e92') +
      path('M11 35h4v19h-4zm14-12h2v9h-2z', '#786273') +
      rect(12, 34, 17, 19, '#eee0ba') + label(20.5, 42, 'KUBOTA', ink, 3.3) +
      rect(16, 45, 9, 1, '#907362') + rect(23, 48, 3, 3, '#a44749')
    ),
    KAKUBIN: art(
      path('M23 5h17v11h-2v6h8v4h6v28l-5 6H16l-5-6V26h6v-4h8v-6h-2z', '#744329', ink) +
      rect(24, 6, 15, 8, '#44302d') + rect(25, 8, 13, 2, '#a26b48') +
      path('M16 30h31v22l-4 5H20l-4-5z', '#cd904c') +
      path('M18 25h5v3h-3v20h-3V28h1zm27 4h3v22h-3z', '#ffdaa0') +
      path('M21 28h7v2h-7zm15 0h7v2h-7zm-9 25h9v3h-9zm-8-4h7v2h-7zm20 0h7v2h-7z', '#9c6137') +
      path('M15 32h33v16H15z', '#f6dc5e', '#684337') +
      rect(17, 34, 29, 1, '#ba813a') + label(31.5, 41, 'KAKUBIN', '#603b29', 5.4) +
      label(31.5, 45.5, 'WHISKY', '#785436', 3.3)
    ),
    LIME: cologne('#d6dc79', '#778543', 'LIME',
      path('M45 42h9v3h4v10h-4v4H43v-3h-4v-9h3v-3h3z', '#7caa53', ink) +
      path('M46 45h7v2h3v7h-3v3h-8v-3h-3v-6h4z', '#cdd867') +
      path('M48 46h2v10h-2zm-4 4h10v2H44z', '#eff4bc') +
      path('M45 44h-5v-8h4v3h4v4z', '#578049') + rect(55, 55, 3, 2, '#6b964b')
    ),
    NECTARINE: cologne('#f5bc77', '#cb805a', 'NECTAR',
      path('M45 42h10v4h4v9h-4v4H44v-3h-4V46h3v-3h2z', '#dc8b59', ink) +
      path('M43 49h4v-3h5v3h4v5h-4v3h-7v-3h-2z', '#ffd08b') +
      path('M49 46v-4h3v-4h7v3h-3v2h-4v3z', '#668056') +
      path('M54 51h3v5h-3v2h-2v-3h2z', '#c46e5d')
    ),
    GLOW: art(
      path('M35 13h14l7 6v40H35z', '#b38978', ink) +
      path('M49 13l7 6v40h-7z', '#825f64') + rect(38, 21, 8, 31, '#d1ad98') +
      label(42, 37, 'S', '#54434e', 6) +
      path('M12 24h22v5h3v24l-4 5H13l-4-5V29h3z', '#d1947d', ink) +
      path('M13 7h20v5h2v14H11V12h2z', '#514350', ink) +
      rect(14, 10, 3, 12, '#94717e') + rect(29, 9, 2, 14, '#302d3c') +
      path('M12 32h4v20h-3v-3h-1zm5-3h3v4h-3z', '#f6c6a7') +
      rect(13, 39, 20, 12, '#ead1b3') + label(23, 44, 'GLOW', '#674658', 4.5) + rect(18, 47, 10, 1, '#aa7f6d')
    ),
    OIL: art(
      path('M14 8h24v5H27v9H16v-9h-2z', '#b0aba5', ink) +
      rect(16, 9, 20, 2, '#faf1dc') + rect(19, 13, 3, 6, '#e9c9ae') +
      path('M10 22h24v4h6v28l-4 5H11l-4-5V26h3z', '#e9bf8f', ink) +
      path('M10 30h5v21l-2 3h-3zm5-4h4v3h-4z', '#fff1c5') +
      path('M35 29h3v24l-3 4h-4v-4h4z', '#ac835d') +
      rect(15, 35, 19, 16, '#f4dcc0') + label(24.5, 41, 'PERFECT', '#795b56', 3.3) +
      label(24.5, 47, 'OIL', '#795b56', 5) +
      path('M50 32h3v5h3v5h3v7h-3v3h-9v-3h-3v-7h3v-5h3z', '#e0ae66', '#886747') +
      rect(48, 43, 2, 5, '#fff0b5')
    ),
    round: art(
      path('M6 42h52v11l-5 5H11l-5-5z', '#808279', ink) + rect(12, 48, 40, 2, '#b7b39a') +
      path('M5 24h4v-5h5v-3h11v3h4v6h6v-6h4v-3h11v3h5v5h4v3h-3v8h-3v5h-5v3H39v-3h-5v-5h-3v-5h-2v5h-3v5h-5v3h-9v-3H7v-5H5z', '#b7985c', ink) +
      path('M10 25h3v-5h10v4h4v11h-4v4H13v-4h-3zm27 0h4v-5h10v5h3v10h-3v4H41v-4h-4z', '#657c65') +
      path('M14 23h8l-8 8zm28 0h8l-8 8z', '#b7c4a5') + rect(29, 26, 6, 2, '#ebd08a')
    ),
    erika: art(
      path('M6 43h52v11l-4 5H11l-5-5z', '#59545e', ink) + rect(13, 50, 38, 2, '#88808c') +
      path('M4 22h7v-3h16l3 4h4l3-4h16v3h7v5h-4v11h-4v5H40l-5-4v-9h-3v-3h-3v3h-2v9l-5 4H10l-3-5V27H4z', '#865a49', ink) +
      path('M11 25h13v6h-2v6l-3 3h-7l-3-5v-8zm29 0h13v3h2v7h-3v5h-8l-4-4z', '#a78068') +
      path('M11 25h13v4H11zm29 0h13v4H40z', '#724e45') +
      path('M12 31h8l-8 6zm30 0h7l-7 6z', '#d0ab86') + rect(5, 24, 4, 2, '#e0bc8b') + rect(54, 24, 4, 2, '#e0bc8b')
    ),
    JAGA: art(
      path('M6 15h40l8 8v33H6z', '#f3d8aa', ink) +
      path('M6 15h40l8 8H6z', '#fff0c9') + path('M46 15l8 8v33h-8z', '#c8a47d') +
      rect(9, 25, 35, 5, '#ac483b') + rect(9, 45, 35, 7, '#ca624a') +
      label(26.5, 36, 'JAGA', '#66503a', 5.3) + label(26.5, 42, 'POKKURU', '#66503a', 4.2) +
      path('M32 51l3-4 19 6-2 5-19-5zm8-2l3-5 15 10-2 5z', '#e1ac5b', '#885e42') +
      path('M35 49l14 5-1 2-13-5zm9-3 12 9-1 2-12-9z', '#ffe2a0')
    ),
    CHEESE: art(
      path('M7 15h39l9 8v31H7z', '#e9d7b0', ink) +
      path('M7 15h39l9 8H7z', '#fff2d1') + path('M46 15l9 8v31h-9z', '#c0a38a') +
      rect(11, 28, 32, 17, '#fdf0cc') + rect(11, 29, 32, 1, '#8f6857') +
      label(27, 36, 'MILK CHEESE', '#664d4b', 4) + label(27, 41, 'CAMEMBERT', '#866153', 3.7) +
      path('M12 52l13-9 12 6v9H12z', '#e7b85e', '#946e47') +
      path('M12 52l13-9 12 6-13 4z', '#fff1af') + rect(17, 55, 4, 2, '#c28f43') + rect(27, 54, 3, 3, '#c28f43') +
      path('M41 47h11l5 4v8H40l-3-4v-5z', '#b7865c', '#775442') +
      path('M40 48h12l4 4H38z', '#efcc95') + path('M38 54h18v2H39z', '#fff6d8')
    ),
    MATCHA: art(
      path('M8 16h39l7 8v30H8z', '#5d714f', ink) +
      path('M8 16h39l7 8H8z', '#84936a') + path('M47 16l7 8v30h-7z', '#35443b') +
      rect(13, 27, 28, 20, '#e8deb1') + rect(15, 29, 24, 1, '#a29262') +
      label(27, 38, 'CHA NO KA', '#415543', 4.1) + rect(16, 42, 22, 1, '#a29262') +
      path('M33 51l6-5h16l5 4v8H35l-2-3z', '#879d5f', ink) +
      path('M34 53h25v2H35z', '#fff2ce') + rect(39, 48, 15, 2, '#abc477')
    )
  };
})();
