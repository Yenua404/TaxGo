/* Original pixel streetscape inspired by the reference images' dusk palette. */
window.TAXGO_PICK_SCENE = `<svg class="pick-scene" viewBox="0 0 360 620" preserveAspectRatio="none" aria-hidden="true" shape-rendering="crispEdges">
  <defs>
    <linearGradient id="pick-sky" x2="0" y2="1">
      <stop stop-color="#471b6a"/><stop offset=".59" stop-color="#77439e"/><stop offset="1" stop-color="#b873bb"/>
    </linearGradient>
    <linearGradient id="pick-sun" x2="0" y2="1">
      <stop stop-color="#fff087"/><stop offset="1" stop-color="#ff6c9f"/>
    </linearGradient>
    <pattern id="pick-stars" width="43" height="37" patternUnits="userSpaceOnUse">
      <path d="M5 4h2v2H5zm25 19h1v2h-1zM15 33h1v1h-1z" fill="#ecc1f1" opacity=".47"/>
    </pattern>
    <pattern id="pick-tiles" width="12" height="8" patternUnits="userSpaceOnUse">
      <path fill="#87558c" d="M0 0h12v8H0z"/><path fill="#ac719e" d="M0 0h10v2H0zM4 4h8v2H4z"/>
      <path fill="#64396e" d="M0 7h12v1H0z"/>
    </pattern>
    <pattern id="pick-awning" width="16" height="22" patternUnits="userSpaceOnUse">
      <path fill="#ff8ab2" d="M0 0h8v22H0z"/><path fill="#7ce0d1" d="M8 0h8v22H8z"/>
    </pattern>
    <clipPath id="pick-sun-clip"><path d="M154 117h12v-8h28v8h12v8h8v12h7v29h-7v12h-8v8h-12v7h-28v-7h-12v-8h-8v-12h-7v-29h7v-12h8z"/></clipPath>
  </defs>
  <path fill="url(#pick-sky)" d="M0 0h360v620H0z"/>
  <path fill="url(#pick-stars)" d="M0 0h360v459H0z"/>
  <g clip-path="url(#pick-sun-clip)">
    <path fill="url(#pick-sun)" d="M137 108h86v88h-86z"/>
    <path fill="#7c397e" d="M137 157h86v3h-86zM137 167h86v4h-86zM137 179h86v5h-86zM137 189h86v5h-86z"/>
  </g>
  <g fill="#6962ad"><path d="M0 158h14v-7h20v-9h17v-6h15v12h16v8h23v8H0z"/><path d="M257 119h22v-9h16V98h12v-8h17v13h13v8h23v16H257z"/><path d="M16 309h17v-5h12v-8h14v10h13v8H16z"/></g>
  <g fill="#d395d4"><path d="M0 154h16v-7h20v-8h16v-6h11v12h16v8h17v4H0z"/><path d="M264 116h18v-9h16V95h11v-8h15v13h14v10h22v8h-96z"/><path d="M24 307h12v-7h11v-7h10v10h12v6H24z"/></g>
  <g class="pick-sky-plane">
    <g transform="translate(102 156)">
      <path fill="#dec6f4" opacity=".58" d="M-31 8h13v2h-13zm17 0H0v2h-14zm-24 5h11v1h-11zm14 0h19v1h-19z"/>
      <path fill="#3f285c" d="M-1 0h9v3h4v4h5V6h-3V0h9v2h4v3h5v2h13v2h4v7h-4v3H31v3h-4v3H16v-6H7v-2H3v-3H1v-4h-2z"/>
      <path fill="#fff1d8" d="M1 2h5v3h4v4h10V7h-3V4h-3V2h7v2h4v3h5v2h13v2h4v3h-4v3H29v3h-4v3h-7v-3h3v-3H9v-2H5v-3H3V8H1z"/>
      <path fill="#bbb4e2" d="M7 13h36v2H29v2H9v-2H7zm15 4h7v3h-4v2h-5v-2h2z"/>
      <path fill="#e17cae" d="M2 3h4v3H3zm2 4h4v2H5z"/>
      <path fill="#53476c" d="M13 10h2v2h-2zm6 0h2v2h-2zm6 0h2v2h-2zm6 0h2v2h-2zm7 0h5v2h-5z"/>
    </g>
  </g>
  <path fill="#664183" d="M0 454h18v-23h22v-11h16v35h18v-22h32v-18h16v-19h13v19h14v31h16v-18h20v-15h18v40h19v-45h19v-11h17v47h14v-17h22v-21h19v-13h15v45h32v87H0z"/>
  <path fill="#875998" d="M25 444h4v7h-4zm74 9h5v7h-5zm26-29h5v7h-5zm44 11h5v8h-5zm62-16h5v8h-5zm13 0h5v8h-5zm52 21h4v7h-4zm20-23h4v7h-4z"/>
  <path fill="#47254f" d="M0 541h360v79H0z"/>
  <path fill="#c26f8b" d="M0 558h360v5H0z"/>
  <path fill="url(#pick-tiles)" d="M0 563h360v24H0z"/>
  <path fill="#3b284a" d="M0 587h360v33H0z"/>
  <path fill="#e39eaa" d="M8 604h28v3H8zm56 0h28v3H64zm56 0h28v3h-28zm56 0h28v3h-28zm56 0h28v3h-28zm56 0h28v3h-28zm56 0h16v3h-16z"/>
  <g>
    <path fill="#6b315f" d="M0 465h87v93H0z"/><path fill="#af5489" d="M3 475h80v79H3z"/>
    <path fill="#ec7eab" d="M0 460h83v6h7v8H0z"/><path fill="#ffb5b3" d="M0 467h88v3H0z"/>
    <path fill="#693657" d="M10 446h48v15H10z"/><path fill="#f181a9" d="M13 449h42v9H13z"/><path fill="#ffe0a5" d="M17 452h7v3h-7zm10 0h12v3H27zm15 0h8v3h-8z"/>
    <path fill="#4a315b" d="M7 492h40v57H7zM53 487h23v67H53z"/><path fill="#b265a0" d="M10 496h33v45H10zm47-5h15v58H57z"/>
    <path fill="#e58ab0" d="M10 523h9v-6h9v-8h14v6H32v8H22v7H10zm49 10 11-9v7l-11 9z"/>
    <path fill="#784274" d="M25 496h3v45h-3z"/><path fill="#ffab92" d="M67 517h3v6h-3zM0 550h83v4H0z"/>
  </g>
  <g>
    <path fill="#4a375f" d="M99 504h22v52H99z"/><path fill="#9275b9" d="M101 508h18v35h-18z"/><path fill="#58bac1" d="M103 512h5v6h-5zm7 0h7v6h-7zm-7 10h5v6h-5zm7 0h7v6h-7zm-7 10h5v6h-5zm7 0h7v6h-7z"/><path fill="#dad4ee" d="M103 546h12v3h-12z"/>
    <path fill="#5c365e" d="M134 501h52v53h-52z"/><path fill="#a65e9d" d="M138 504h44v45h-44z"/><path fill="#d583b9" d="M139 531h7v-6h8v-6h8v-5h8v4h-8v6h-8v6h-8v6h-7z"/><path fill="#6a3969" d="M157 504h3v45h-3z"/><path fill="#f093ba" d="M129 498h62v5h-62z"/><path fill="#69d3c8" d="M151 490h25v5h-25z"/><path fill="#4c385c" d="M138 550h4v9h-4zm39 0h4v9h-4z"/>
    <path fill="#4d3f73" d="M195 521h4v37h-4z"/><path fill="#75c5d4" d="M191 511h13v14h-13z"/><path fill="#4d3f73" d="M194 514h7v5h-7z"/>
    <path fill="#70426c" d="M216 480h4v78h-4zM216 480h15v3h-15z"/><path fill="#fbb496" d="M225 478h10v5h-10z"/>
  </g>
  <g>
    <path fill="#623569" d="M246 463h114v94H246z"/><path fill="#9e59a0" d="M249 470h111v84H249z"/>
    <path fill="#f67bb1" d="M242 451h118v18H242z"/><path fill="#5a3773" d="M247 454h113v10H247z"/><path fill="#86e8d9" d="M253 457h13v3h-13zm20 0h25v3h-25zm30 0h14v3h-14zm20 0h32v3h-32z"/>
    <path fill="url(#pick-awning)" d="M243 474h117v20H243z"/><path fill="#733b75" d="M243 494h117v4H243z"/>
    <path fill="#e692bd" d="M254 503h50v42h-50z"/><path fill="#6e4485" d="M258 507h42v32h-42z"/><path fill="#8bd3cd" d="M261 510h16v25h-16zm20 0h16v25h-16z"/><path fill="#6d72a0" d="M261 521h36v3h-36z"/>
    <path fill="#583e6b" d="M311 501h32v55h-32z"/><path fill="#ed94bc" d="M315 506h23v47h-23z"/><path fill="#a663a3" d="M318 510h17v20h-17z"/><path fill="#fce196" d="M330 534h3v5h-3z"/>
    <path fill="#66406d" d="M348 514h12v36h-12z"/><path fill="#81cecc" d="M351 519h9v14h-9z"/>
  </g>
  <g fill="#689580"><path d="M0 550h32v6H0zm78 1h21v5H78zm150 0h22v6h-22z"/><path fill="#9ed0a5" d="M4 547h4v3H4zm13 0h5v3h-5zm64 1h5v3h-5zm153 0h4v4h-4z"/></g>
</svg>`;
