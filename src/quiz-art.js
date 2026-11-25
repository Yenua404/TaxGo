/* Original airport, conveyor, luggage and aircraft pixel art for the wallet quiz. */
(function () {
  'use strict';

  var scene = `<svg class="quiz-scene" viewBox="0 0 360 620" preserveAspectRatio="none" shape-rendering="crispEdges" aria-hidden="true">
    <defs>
      <linearGradient id="quiz-glass" x2="0" y2="1">
        <stop stop-color="#7ed8ef"/><stop offset="1" stop-color="#c9f4e0"/>
      </linearGradient>
      <pattern id="quiz-floor-tile" width="45" height="28" patternUnits="userSpaceOnUse">
        <path d="M0 0h45v28H0z" fill="#c5ebdd"/><path d="M0 0h45v2H0zm0 0h2v28H0z" fill="#9accc4"/>
        <path d="M5 5h6v2H5zm4 15h3v2H9z" fill="#b1ddd3"/>
      </pattern>
    </defs>
    <path d="M0 0h360v620H0z" fill="#e7f6e6"/>
    <path d="M0 0h360v27H0zm0 198h360v62H0z" fill="#a1d8cd"/>
    <path d="M0 10h360v3H0zm0 195h360v4H0z" fill="#679a9d"/>
    <path d="M12 27h336v172H12z" fill="#29687a"/>
    <path d="M18 34h324v154H18z" fill="url(#quiz-glass)"/>
    <g fill="#eefcf1"><path d="M17 80h17v-6h13v-7h14v5h11v8h16v7H17zm191-16h13v-6h13v-6h16v7h18v5h15v6h-75zm71 40h16v-6h13v-7h18v7h17v13h-64z"/><path d="M19 42h74v3H19zm84 0h53v3h-53zm103 0h65v3h-65zm74 0h59v3h-59z" opacity=".7"/></g>
    <path d="M18 151h324v37H18z" fill="#93bbac"/>
    <path d="M18 159h324v5H18zm0 18h324v4H18z" fill="#718c88"/>
    <g fill="#fff1c2"><path d="M23 170h31v3H23zm48 0h24v3H71zm42 0h24v3h-24zm44 0h24v3h-24zm44 0h24v3h-24zm44 0h24v3h-24zm48 0h32v3h-32z"/></g>
    <path d="M123 121h9v4h14v5h20l14-9h14l-10 9h46v-5h8v5h9v5h-11v5h-54l-8 7h-9l5-7h-27l-10-6h-11z" fill="#4c92a1" opacity=".85"/>
    <path d="M145 133h82v3h-82z" fill="#c7f6eb"/>
    <path d="M96 30h6v167h-6zm81 0h6v167h-6zm81 0h6v167h-6z" fill="#2b7581"/>
    <path d="M102 34h3v154h-3zm81 0h3v154h-3zm81 0h3v154h-3z" fill="#7ac1c3"/>
    <path d="M12 191h336v8H12z" fill="#3b8790"/>
    <path d="M99 225h162v31H99z" fill="#457b86"/>
    <path d="M103 229h154v22H103z" fill="#387280"/>
    <path d="M113 238h8v-5h10v5h8v9h-26zm12-3v3h2v-3z" fill="#fff3c9" fill-rule="evenodd"/>
    <path d="M146 236h32v2h-32zm0 7h47v2h-47zm63-5h25v3h-25zm23-4h4v4h4v3h-4v4h-4z" fill="#b7eadb"/>
    <path d="M0 264h360v139H0z" fill="#f1f7df"/>
    <path d="M0 270h360v4H0zm0 124h360v12H0z" fill="#81b8b6"/>
    <path d="M0 404h360v216H0z" fill="url(#quiz-floor-tile)"/>
    <path d="M0 404h360v4H0z" fill="#5e939a"/>
    <g>
      <path d="M16 299h50v49H16z" fill="#5b8d96"/><path d="M19 302h44v41H19z" fill="#4c7784"/>
      <path d="M23 308h34v7H23zm0 12h28v3H23zm0 8h34v3H23zm0 8h18v3H23z" fill="#aacfc8"/>
      <path d="M25 310h13v2H25zm18 0h12v2H43z" fill="#fff1c2"/>
      <path d="M38 349h6v45h-6z" fill="#689ba2"/>
    </g>
    <g>
      <path d="M304 331h34v12h-34zm4 12h26v51h-26z" fill="#679591"/><path d="M312 349h18v41h-18z" fill="#afd0ae"/>
      <path d="M302 319h7v-8h11v-9h7v10h8v8h9v12h-42z" fill="#477d70"/>
      <path d="M307 316h7v-6h8v-5h5v10h5v8h8v4h-33z" fill="#78b28a"/>
    </g>
    <path d="M119 369v-44h8v-13h13v-7h80v7h13v13h8v44z" fill="#4d8390"/>
    <path d="M125 369v-44h8v-9h13v-5h68v5h13v9h8v44z" fill="#78b6bb"/>
    <path d="M134 369v-39h8v-9h76v9h8v39z" fill="#3b5666"/>
    <path d="M143 368v-36h74v36z" fill="#304654"/>
    <path d="M124 348h4v9h-4zm108 0h4v9h-4z" fill="#f8c96f"/>
    <path d="M139 367h82l117 253H22z" fill="#305669"/>
    <path d="M146 368h68l107 252H39z" fill="#627d87"/>
    <path d="M152 371h56l99 249H53z" fill="#516d78"/>
    <g fill="#3a5360"><path d="M151 376h58l2 5h-62zm-5 14h68l2 5h-72zm-6 16h80l2 5h-84zm-8 20h96l3 6H129zm-10 24h116l4 7H118zm-12 28h140l4 8H106zm-13 32h166l4 9H93zm-17 39h200l5 10H75zm-17 47h234l5 11H58z"/></g>
    <g fill="#90a7a7"><path d="M149 381h62l1 2h-64zm-5 14h72l1 2h-74zm-6 16h84l1 2h-86zm-9 21h102l1 2H128zm-11 25h124l1 2H117zm-12 29h148l1 2H105zm-13 33h174l1 2H92zm-18 40h210l1 3H74zm-17 48h244l1 3H57z"/></g>
    <path d="M138 368h5L41 620H29zm79 0h5l109 252h-12z" fill="#e69e67"/>
    <path d="M137 368h2L31 620h-5zm84 0h2l111 252h-5z" fill="#fff2bd"/>
  </svg>`;

  var palettes = [
    ['#ff957d', '#b95762', '#ffd3a0'],
    ['#65c9b1', '#328875', '#bdf2d3'],
    ['#f4c75a', '#ae803d', '#ffed9b'],
    ['#83bfea', '#557bb8', '#bee7fb'],
    ['#be97de', '#9262ab', '#e5c7f3']
  ];

  function bag(index) {
    var colors = palettes[index % palettes.length];
    return '<svg class="quiz-bag-art" viewBox="0 0 72 72" shape-rendering="crispEdges" aria-hidden="true">' +
      '<path d="M24 5h24v4h4v15h-7V12H27v12h-7V9h4z" fill="#355864"/>' +
      '<path d="M25 8h22v4H25z" fill="#aac6bc"/>' +
      '<path d="M17 19h38v4h5v34h-4v6h-6v5h-7v-5H30v5h-7v-5h-7v-5h-4V24h5z" fill="#294650"/>' +
      '<path d="M18 23h37v4h2v28h-4v4H19v-4h-4V27h3z" fill="' + colors[0] + '"/>' +
      '<path d="M51 24h4v3h2v28h-4v4H20v-4h31zM23 31h3v19h-3zm11 0h3v19h-3zm11 0h3v19h-3z" fill="' + colors[1] + '"/>' +
      '<path d="M19 29h3v20h-3zm9-4h20v3H28z" fill="' + colors[2] + '"/>' +
      '<path d="M44 33h13v10H44z" fill="#ffefcb"/><path d="M47 36h7v2h-7zm0 3h4v1h-4z" fill="#567386"/>' +
      '<path d="M23 62h6v3h-6zm21 0h6v3h-6z" fill="#68828a"/>' +
      '</svg>';
  }

  var plane = `<svg class="quiz-plane-art" viewBox="0 0 176 80" shape-rendering="crispEdges" aria-hidden="true">
    <path d="M12 26h9V14h11v5h8v10h5v7h28L58 20h-7v-6h17l29 22h54v3h12v4h7v4h4v6h-4v4h-9v4h-49l-27 15H68v-6l11-9H43v-4H24v-5H14v-5H8V30h4z" fill="#335261"/>
    <path d="M14 30h11V18h7v5h6v10h5v7h37L62 18h5l29 22h54v3h12v4h6v5h-7v5h-49L85 72H75l12-15H45v-4H25v-5H14z" fill="#fff3d2"/>
    <path d="M25 18h7v5h6v10h5v7H23z" fill="#ec9687"/>
    <path d="M14 47h144v3h10v3h-7v4h-49L85 72H75l12-15H45v-4H25v-5H14z" fill="#91c9c1"/>
    <path d="M29 46h128v3H29z" fill="#e78977"/>
    <path d="M147 43h7v4h-7zm9 2h5v2h-5zM47 42h4v3h-4zm8 0h4v3h-4zm8 0h4v3h-4zm8 0h4v3h-4zm8 0h4v3h-4zm8 0h4v3h-4zm8 0h4v3h-4zm8 0h4v3h-4zm8 0h4v3h-4zm8 0h4v3h-4zm8 0h4v3h-4zm8 0h4v3h-4z" fill="#3d6774"/>
    <path d="M48 48h15v9H48z" fill="#54919a"/><path d="M50 49h11v7H50z" fill="#22586a"/><path d="M51 50h8v2h-8z" fill="#86ada7"/>
    <path d="M80 60h25v7H80z" fill="#608c8c"/><path d="M82 60h22v3H82z" fill="#d1ece0"/>
  </svg>`;

  window.TAXGO_QUIZ_ART = { scene: scene, bag: bag, plane: plane };
})();
