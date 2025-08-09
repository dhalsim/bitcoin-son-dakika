var ga = Object.defineProperty;
var pa = (qe, H, je) =>
  H in qe ? ga(qe, H, { enumerable: !0, configurable: !0, writable: !0, value: je }) : (qe[H] = je);
var x = (qe, H, je) => pa(qe, typeof H != "symbol" ? H + "" : H, je);
(function () {
  "use strict";
  var fo, ho, bo, go, po, wo, yo;
  const qe =
    '*,:before,:after{--tw-border-spacing-x: 0;--tw-border-spacing-y: 0;--tw-translate-x: 0;--tw-translate-y: 0;--tw-rotate: 0;--tw-skew-x: 0;--tw-skew-y: 0;--tw-scale-x: 1;--tw-scale-y: 1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness: proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width: 0px;--tw-ring-offset-color: #fff;--tw-ring-color: rgb(59 130 246 / .5);--tw-ring-offset-shadow: 0 0 #0000;--tw-ring-shadow: 0 0 #0000;--tw-shadow: 0 0 #0000;--tw-shadow-colored: 0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }::backdrop{--tw-border-spacing-x: 0;--tw-border-spacing-y: 0;--tw-translate-x: 0;--tw-translate-y: 0;--tw-rotate: 0;--tw-skew-x: 0;--tw-skew-y: 0;--tw-scale-x: 1;--tw-scale-y: 1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness: proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width: 0px;--tw-ring-offset-color: #fff;--tw-ring-color: rgb(59 130 246 / .5);--tw-ring-offset-shadow: 0 0 #0000;--tw-ring-shadow: 0 0 #0000;--tw-shadow: 0 0 #0000;--tw-shadow-colored: 0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }*,:before,:after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}:before,:after{--tw-content: ""}html,:host{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol,"Noto Color Emoji";font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,samp,pre{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;font-feature-settings:normal;font-variation-settings:normal;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}button,input:where([type=button]),input:where([type=reset]),input:where([type=submit]){-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dl,dd,h1,h2,h3,h4,h5,h6,hr,figure,p,pre{margin:0}fieldset{margin:0;padding:0}legend{padding:0}ol,ul,menu{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::-moz-placeholder,textarea::-moz-placeholder{opacity:1;color:#9ca3af}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}button,[role=button]{cursor:pointer}:disabled{cursor:default}img,svg,video,canvas,audio,iframe,embed,object{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]:where(:not([hidden=until-found])){display:none}.fixed{position:fixed}.absolute{position:absolute}.bottom-1{bottom:.25rem}.right-2{right:.5rem}.right-3{right:.75rem}.top-0{top:0}.z-\\[9000\\]{z-index:9000}.m-auto{margin:auto}.my-2{margin-top:.5rem;margin-bottom:.5rem}.mb-1{margin-bottom:.25rem}.mb-2{margin-bottom:.5rem}.mb-4{margin-bottom:1rem}.ml-2{margin-left:.5rem}.mr-2{margin-right:.5rem}.mt-4{margin-top:1rem}.mt-6{margin-top:1.5rem}.box-border{box-sizing:border-box}.block{display:block}.inline-block{display:inline-block}.inline{display:inline}.flex{display:flex}.h-10{height:2.5rem}.h-5{height:1.25rem}.h-6{height:1.5rem}.w-10{width:2.5rem}.w-5{width:1.25rem}.w-6{width:1.5rem}.w-full{width:100%}.max-w-56{max-width:14rem}@keyframes moveIn{0%{transform:translateY(-10px)}to{transform:translateY(0)}}.animate-fadein{animation:fadeIn 1s ease-in-out,moveIn 1s ease-in-out}@keyframes fadeIn{0%{opacity:0}to{opacity:1}}.animate-show{animation:fadeIn .2s ease-in-out}@keyframes spin{to{transform:rotate(360deg)}}.animate-spin{animation:spin 1s linear infinite}.cursor-grabbing{cursor:grabbing}.cursor-pointer{cursor:pointer}.flex-col{flex-direction:column}.items-center{align-items:center}.justify-center{justify-content:center}.gap-2{gap:.5rem}.overflow-hidden{overflow:hidden}.overflow-ellipsis{text-overflow:ellipsis}.whitespace-nowrap{white-space:nowrap}.break-all{word-break:break-all}.rounded{border-radius:.25rem}.rounded-full{border-radius:9999px}.rounded-md{border-radius:.375rem}.border-0{border-width:0px}.border-2{border-width:2px}.border-solid{border-style:solid}.border-transparent{border-color:transparent}.bg-cyan-700{--tw-bg-opacity: 1;background-color:rgb(14 116 144 / var(--tw-bg-opacity, 1))}.bg-cyan-800{--tw-bg-opacity: 1;background-color:rgb(21 94 117 / var(--tw-bg-opacity, 1))}.bg-cyan-900{--tw-bg-opacity: 1;background-color:rgb(22 78 99 / var(--tw-bg-opacity, 1))}.bg-cyan-950{--tw-bg-opacity: 1;background-color:rgb(8 51 68 / var(--tw-bg-opacity, 1))}.bg-green-700{--tw-bg-opacity: 1;background-color:rgb(21 128 61 / var(--tw-bg-opacity, 1))}.bg-green-800{--tw-bg-opacity: 1;background-color:rgb(22 101 52 / var(--tw-bg-opacity, 1))}.bg-green-900{--tw-bg-opacity: 1;background-color:rgb(20 83 45 / var(--tw-bg-opacity, 1))}.bg-green-950{--tw-bg-opacity: 1;background-color:rgb(5 46 22 / var(--tw-bg-opacity, 1))}.bg-neutral-700{--tw-bg-opacity: 1;background-color:rgb(64 64 64 / var(--tw-bg-opacity, 1))}.bg-neutral-800{--tw-bg-opacity: 1;background-color:rgb(38 38 38 / var(--tw-bg-opacity, 1))}.bg-neutral-900{--tw-bg-opacity: 1;background-color:rgb(23 23 23 / var(--tw-bg-opacity, 1))}.bg-neutral-950{--tw-bg-opacity: 1;background-color:rgb(10 10 10 / var(--tw-bg-opacity, 1))}.bg-orange-700{--tw-bg-opacity: 1;background-color:rgb(194 65 12 / var(--tw-bg-opacity, 1))}.bg-orange-800{--tw-bg-opacity: 1;background-color:rgb(154 52 18 / var(--tw-bg-opacity, 1))}.bg-orange-900{--tw-bg-opacity: 1;background-color:rgb(124 45 18 / var(--tw-bg-opacity, 1))}.bg-orange-950{--tw-bg-opacity: 1;background-color:rgb(67 20 7 / var(--tw-bg-opacity, 1))}.bg-purple-700{--tw-bg-opacity: 1;background-color:rgb(126 34 206 / var(--tw-bg-opacity, 1))}.bg-purple-800{--tw-bg-opacity: 1;background-color:rgb(107 33 168 / var(--tw-bg-opacity, 1))}.bg-purple-900{--tw-bg-opacity: 1;background-color:rgb(88 28 135 / var(--tw-bg-opacity, 1))}.bg-purple-950{--tw-bg-opacity: 1;background-color:rgb(59 7 100 / var(--tw-bg-opacity, 1))}.bg-red-700{--tw-bg-opacity: 1;background-color:rgb(185 28 28 / var(--tw-bg-opacity, 1))}.bg-red-800{--tw-bg-opacity: 1;background-color:rgb(153 27 27 / var(--tw-bg-opacity, 1))}.bg-red-900{--tw-bg-opacity: 1;background-color:rgb(127 29 29 / var(--tw-bg-opacity, 1))}.bg-red-950{--tw-bg-opacity: 1;background-color:rgb(69 10 10 / var(--tw-bg-opacity, 1))}.bg-stone-700{--tw-bg-opacity: 1;background-color:rgb(68 64 60 / var(--tw-bg-opacity, 1))}.bg-stone-800{--tw-bg-opacity: 1;background-color:rgb(41 37 36 / var(--tw-bg-opacity, 1))}.bg-stone-900{--tw-bg-opacity: 1;background-color:rgb(28 25 23 / var(--tw-bg-opacity, 1))}.bg-stone-950{--tw-bg-opacity: 1;background-color:rgb(12 10 9 / var(--tw-bg-opacity, 1))}.bg-transparent{background-color:transparent}.bg-yellow-100{--tw-bg-opacity: 1;background-color:rgb(254 249 195 / var(--tw-bg-opacity, 1))}.bg-gradient-to-b{background-image:linear-gradient(to bottom,var(--tw-gradient-stops))}.from-cyan-900{--tw-gradient-from: #164e63 var(--tw-gradient-from-position);--tw-gradient-to: rgb(22 78 99 / 0) var(--tw-gradient-to-position);--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to)}.from-green-900{--tw-gradient-from: #14532d var(--tw-gradient-from-position);--tw-gradient-to: rgb(20 83 45 / 0) var(--tw-gradient-to-position);--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to)}.from-neutral-900{--tw-gradient-from: #171717 var(--tw-gradient-from-position);--tw-gradient-to: rgb(23 23 23 / 0) var(--tw-gradient-to-position);--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to)}.from-orange-900{--tw-gradient-from: #7c2d12 var(--tw-gradient-from-position);--tw-gradient-to: rgb(124 45 18 / 0) var(--tw-gradient-to-position);--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to)}.from-purple-900{--tw-gradient-from: #581c87 var(--tw-gradient-from-position);--tw-gradient-to: rgb(88 28 135 / 0) var(--tw-gradient-to-position);--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to)}.from-red-900{--tw-gradient-from: #7f1d1d var(--tw-gradient-from-position);--tw-gradient-to: rgb(127 29 29 / 0) var(--tw-gradient-to-position);--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to)}.from-stone-900{--tw-gradient-from: #1c1917 var(--tw-gradient-from-position);--tw-gradient-to: rgb(28 25 23 / 0) var(--tw-gradient-to-position);--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to)}.to-cyan-700{--tw-gradient-to: #0e7490 var(--tw-gradient-to-position)}.to-green-700{--tw-gradient-to: #15803d var(--tw-gradient-to-position)}.to-neutral-700{--tw-gradient-to: #404040 var(--tw-gradient-to-position)}.to-orange-700{--tw-gradient-to: #c2410c var(--tw-gradient-to-position)}.to-purple-700{--tw-gradient-to: #7e22ce var(--tw-gradient-to-position)}.to-red-700{--tw-gradient-to: #b91c1c var(--tw-gradient-to-position)}.to-stone-700{--tw-gradient-to: #44403c var(--tw-gradient-to-position)}.p-2{padding:.5rem}.px-2{padding-left:.5rem;padding-right:.5rem}.px-8{padding-left:2rem;padding-right:2rem}.py-1{padding-top:.25rem;padding-bottom:.25rem}.py-2{padding-top:.5rem;padding-bottom:.5rem}.py-8{padding-top:2rem;padding-bottom:2rem}.text-center{text-align:center}.font-sans{font-family:ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol,"Noto Color Emoji"}.text-3xl{font-size:1.875rem;line-height:2.25rem}.text-base{font-size:1rem;line-height:1.5rem}.text-lg{font-size:1.125rem;line-height:1.75rem}.text-sm{font-size:.875rem;line-height:1.25rem}.text-xl{font-size:1.25rem;line-height:1.75rem}.leading-3{line-height:.75rem}.leading-4{line-height:1rem}.leading-5{line-height:1.25rem}.text-cyan-600{--tw-text-opacity: 1;color:rgb(8 145 178 / var(--tw-text-opacity, 1))}.text-green-600{--tw-text-opacity: 1;color:rgb(22 163 74 / var(--tw-text-opacity, 1))}.text-neutral-600{--tw-text-opacity: 1;color:rgb(82 82 82 / var(--tw-text-opacity, 1))}.text-neutral-800{--tw-text-opacity: 1;color:rgb(38 38 38 / var(--tw-text-opacity, 1))}.text-orange-600{--tw-text-opacity: 1;color:rgb(234 88 12 / var(--tw-text-opacity, 1))}.text-purple-600{--tw-text-opacity: 1;color:rgb(147 51 234 / var(--tw-text-opacity, 1))}.text-red-400{--tw-text-opacity: 1;color:rgb(248 113 113 / var(--tw-text-opacity, 1))}.text-red-600{--tw-text-opacity: 1;color:rgb(220 38 38 / var(--tw-text-opacity, 1))}.text-stone-600{--tw-text-opacity: 1;color:rgb(87 83 78 / var(--tw-text-opacity, 1))}.text-white{--tw-text-opacity: 1;color:rgb(255 255 255 / var(--tw-text-opacity, 1))}.underline{text-decoration-line:underline}.no-underline{text-decoration-line:none}.decoration-2{text-decoration-thickness:2px}.underline-offset-4{text-underline-offset:4px}.opacity-25{opacity:.25}.opacity-75{opacity:.75}.shadow-\\[0_0px_10px_0px_rgba\\(0\\,0\\,0\\,0\\.3\\)\\]{--tw-shadow: 0 0px 10px 0px rgba(0,0,0,.3);--tw-shadow-colored: 0 0px 10px 0px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.shadow-\\[0_0px_30px_0px_rgba\\(0\\,0\\,0\\,0\\.6\\)\\]{--tw-shadow: 0 0px 30px 0px rgba(0,0,0,.6);--tw-shadow-colored: 0 0px 30px 0px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.outline-none{outline:2px solid transparent;outline-offset:2px}.outline-dashed{outline-style:dashed}.outline-1{outline-width:1px}.outline-offset-4{outline-offset:4px}.outline-cyan-500{outline-color:#06b6d4}.outline-green-500{outline-color:#22c55e}.outline-neutral-500{outline-color:#737373}.outline-orange-500{outline-color:#f97316}.outline-purple-500{outline-color:#a855f7}.outline-red-500{outline-color:#ef4444}.outline-stone-500{outline-color:#78716c}.transition-all{transition-property:all;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.duration-200{transition-duration:.2s}.hover\\:bg-cyan-700:hover{--tw-bg-opacity: 1;background-color:rgb(14 116 144 / var(--tw-bg-opacity, 1))}.hover\\:bg-cyan-800:hover{--tw-bg-opacity: 1;background-color:rgb(21 94 117 / var(--tw-bg-opacity, 1))}.hover\\:bg-cyan-900:hover{--tw-bg-opacity: 1;background-color:rgb(22 78 99 / var(--tw-bg-opacity, 1))}.hover\\:bg-cyan-950:hover{--tw-bg-opacity: 1;background-color:rgb(8 51 68 / var(--tw-bg-opacity, 1))}.hover\\:bg-green-700:hover{--tw-bg-opacity: 1;background-color:rgb(21 128 61 / var(--tw-bg-opacity, 1))}.hover\\:bg-green-800:hover{--tw-bg-opacity: 1;background-color:rgb(22 101 52 / var(--tw-bg-opacity, 1))}.hover\\:bg-green-900:hover{--tw-bg-opacity: 1;background-color:rgb(20 83 45 / var(--tw-bg-opacity, 1))}.hover\\:bg-green-950:hover{--tw-bg-opacity: 1;background-color:rgb(5 46 22 / var(--tw-bg-opacity, 1))}.hover\\:bg-neutral-700:hover{--tw-bg-opacity: 1;background-color:rgb(64 64 64 / var(--tw-bg-opacity, 1))}.hover\\:bg-neutral-800:hover{--tw-bg-opacity: 1;background-color:rgb(38 38 38 / var(--tw-bg-opacity, 1))}.hover\\:bg-neutral-900:hover{--tw-bg-opacity: 1;background-color:rgb(23 23 23 / var(--tw-bg-opacity, 1))}.hover\\:bg-neutral-950:hover{--tw-bg-opacity: 1;background-color:rgb(10 10 10 / var(--tw-bg-opacity, 1))}.hover\\:bg-orange-700:hover{--tw-bg-opacity: 1;background-color:rgb(194 65 12 / var(--tw-bg-opacity, 1))}.hover\\:bg-orange-800:hover{--tw-bg-opacity: 1;background-color:rgb(154 52 18 / var(--tw-bg-opacity, 1))}.hover\\:bg-orange-900:hover{--tw-bg-opacity: 1;background-color:rgb(124 45 18 / var(--tw-bg-opacity, 1))}.hover\\:bg-orange-950:hover{--tw-bg-opacity: 1;background-color:rgb(67 20 7 / var(--tw-bg-opacity, 1))}.hover\\:bg-purple-700:hover{--tw-bg-opacity: 1;background-color:rgb(126 34 206 / var(--tw-bg-opacity, 1))}.hover\\:bg-purple-800:hover{--tw-bg-opacity: 1;background-color:rgb(107 33 168 / var(--tw-bg-opacity, 1))}.hover\\:bg-purple-900:hover{--tw-bg-opacity: 1;background-color:rgb(88 28 135 / var(--tw-bg-opacity, 1))}.hover\\:bg-purple-950:hover{--tw-bg-opacity: 1;background-color:rgb(59 7 100 / var(--tw-bg-opacity, 1))}.hover\\:bg-red-700:hover{--tw-bg-opacity: 1;background-color:rgb(185 28 28 / var(--tw-bg-opacity, 1))}.hover\\:bg-red-800:hover{--tw-bg-opacity: 1;background-color:rgb(153 27 27 / var(--tw-bg-opacity, 1))}.hover\\:bg-red-900:hover{--tw-bg-opacity: 1;background-color:rgb(127 29 29 / var(--tw-bg-opacity, 1))}.hover\\:bg-red-950:hover{--tw-bg-opacity: 1;background-color:rgb(69 10 10 / var(--tw-bg-opacity, 1))}.hover\\:bg-stone-700:hover{--tw-bg-opacity: 1;background-color:rgb(68 64 60 / var(--tw-bg-opacity, 1))}.hover\\:bg-stone-800:hover{--tw-bg-opacity: 1;background-color:rgb(41 37 36 / var(--tw-bg-opacity, 1))}.hover\\:bg-stone-900:hover{--tw-bg-opacity: 1;background-color:rgb(28 25 23 / var(--tw-bg-opacity, 1))}.hover\\:bg-stone-950:hover{--tw-bg-opacity: 1;background-color:rgb(12 10 9 / var(--tw-bg-opacity, 1))}.disabled\\:cursor-default:disabled{cursor:default}.disabled\\:bg-neutral-400:disabled{--tw-bg-opacity: 1;background-color:rgb(163 163 163 / var(--tw-bg-opacity, 1))}.disabled\\:text-neutral-200:disabled{--tw-text-opacity: 1;color:rgb(229 229 229 / var(--tw-text-opacity, 1))}.group:hover .group-hover\\:underline{text-decoration-line:underline}@media (min-width: 640px){.sm\\:w-96{width:24rem}}';
  function H() {}
  function je(t) {
    return t();
  }
  function Un() {
    return Object.create(null);
  }
  function Ie(t) {
    t.forEach(je);
  }
  function $t(t) {
    return typeof t == "function";
  }
  function zt(t, e) {
    return t != t ? e == e : t !== e || (t && typeof t == "object") || typeof t == "function";
  }
  let yt;
  function Ye(t, e) {
    return t === e ? !0 : (yt || (yt = document.createElement("a")), (yt.href = e), t === yt.href);
  }
  function ko(t) {
    return Object.keys(t).length === 0;
  }
  function So(t, ...e) {
    if (t == null) {
      for (const r of e) r(void 0);
      return H;
    }
    const n = t.subscribe(...e);
    return n.unsubscribe ? () => n.unsubscribe() : n;
  }
  function Ao(t, e, n) {
    t.$$.on_destroy.push(So(e, n));
  }
  const Io = typeof window < "u" ? window : typeof globalThis < "u" ? globalThis : global;
  function v(t, e) {
    t.appendChild(e);
  }
  function q(t, e, n) {
    t.insertBefore(e, n || null);
  }
  function U(t) {
    t.parentNode && t.parentNode.removeChild(t);
  }
  function C(t) {
    return document.createElement(t);
  }
  function Wt(t) {
    return document.createElementNS("http://www.w3.org/2000/svg", t);
  }
  function K(t) {
    return document.createTextNode(t);
  }
  function j() {
    return K(" ");
  }
  function Mn() {
    return K("");
  }
  function ne(t, e, n, r) {
    return (t.addEventListener(e, n, r), () => t.removeEventListener(e, n, r));
  }
  function _(t, e, n) {
    n == null ? t.removeAttribute(e) : t.getAttribute(e) !== n && t.setAttribute(e, n);
  }
  function No(t) {
    return Array.from(t.childNodes);
  }
  function Ne(t, e) {
    ((e = "" + e), t.data !== e && (t.data = e));
  }
  function qn(t, e) {
    t.value = e ?? "";
  }
  function jn(t, e, n) {
    t.classList.toggle(e, !!n);
  }
  let at;
  function lt(t) {
    at = t;
  }
  function To() {
    if (!at) throw new Error("Function called outside component initialization");
    return at;
  }
  function Bo(t) {
    To().$$.on_mount.push(t);
  }
  const Ge = [],
    mt = [];
  let Ze = [];
  const $n = [],
    Oo = Promise.resolve();
  let Kt = !1;
  function Po() {
    Kt || ((Kt = !0), Oo.then(zn));
  }
  function Dt(t) {
    Ze.push(t);
  }
  const Vt = new Set();
  let Je = 0;
  function zn() {
    if (Je !== 0) return;
    const t = at;
    do {
      try {
        for (; Je < Ge.length; ) {
          const e = Ge[Je];
          (Je++, lt(e), Co(e.$$));
        }
      } catch (e) {
        throw ((Ge.length = 0), (Je = 0), e);
      }
      for (lt(null), Ge.length = 0, Je = 0; mt.length; ) mt.pop()();
      for (let e = 0; e < Ze.length; e += 1) {
        const n = Ze[e];
        Vt.has(n) || (Vt.add(n), n());
      }
      Ze.length = 0;
    } while (Ge.length);
    for (; $n.length; ) $n.pop()();
    ((Kt = !1), Vt.clear(), lt(t));
  }
  function Co(t) {
    if (t.fragment !== null) {
      (t.update(), Ie(t.before_update));
      const e = t.dirty;
      ((t.dirty = [-1]), t.fragment && t.fragment.p(t.ctx, e), t.after_update.forEach(Dt));
    }
  }
  function Lo(t) {
    const e = [],
      n = [];
    (Ze.forEach((r) => (t.indexOf(r) === -1 ? e.push(r) : n.push(r))),
      n.forEach((r) => r()),
      (Ze = e));
  }
  const vt = new Set();
  let $e;
  function Et() {
    $e = { r: 0, c: [], p: $e };
  }
  function xt() {
    ($e.r || Ie($e.c), ($e = $e.p));
  }
  function be(t, e) {
    t && t.i && (vt.delete(t), t.i(e));
  }
  function we(t, e, n, r) {
    if (t && t.o) {
      if (vt.has(t)) return;
      (vt.add(t),
        $e.c.push(() => {
          (vt.delete(t), r && (n && t.d(1), r()));
        }),
        t.o(e));
    } else r && r();
  }
  function Wn(t) {
    t && t.c();
  }
  function Ft(t, e, n) {
    const { fragment: r, after_update: o } = t.$$;
    (r && r.m(e, n),
      Dt(() => {
        const i = t.$$.on_mount.map(je).filter($t);
        (t.$$.on_destroy ? t.$$.on_destroy.push(...i) : Ie(i), (t.$$.on_mount = []));
      }),
      o.forEach(Dt));
  }
  function Yt(t, e) {
    const n = t.$$;
    n.fragment !== null &&
      (Lo(n.after_update),
      Ie(n.on_destroy),
      n.fragment && n.fragment.d(e),
      (n.on_destroy = n.fragment = null),
      (n.ctx = []));
  }
  function Ro(t, e) {
    (t.$$.dirty[0] === -1 && (Ge.push(t), Po(), t.$$.dirty.fill(0)),
      (t.$$.dirty[(e / 31) | 0] |= 1 << e % 31));
  }
  function Kn(t, e, n, r, o, i, s = null, c = [-1]) {
    const a = at;
    lt(t);
    const l = (t.$$ = {
      fragment: null,
      ctx: [],
      props: i,
      update: H,
      not_equal: o,
      bound: Un(),
      on_mount: [],
      on_destroy: [],
      on_disconnect: [],
      before_update: [],
      after_update: [],
      context: new Map(e.context || (a ? a.$$.context : [])),
      callbacks: Un(),
      dirty: c,
      skip_bound: !1,
      root: e.target || a.$$.root,
    });
    s && s(l.root);
    let f = !1;
    if (
      ((l.ctx = n
        ? n(t, e.props || {}, (u, b, ...d) => {
            const g = d.length ? d[0] : b;
            return (
              l.ctx &&
                o(l.ctx[u], (l.ctx[u] = g)) &&
                (!l.skip_bound && l.bound[u] && l.bound[u](g), f && Ro(t, u)),
              b
            );
          })
        : []),
      l.update(),
      (f = !0),
      Ie(l.before_update),
      (l.fragment = r ? r(l.ctx) : !1),
      e.target)
    ) {
      if (e.hydrate) {
        const u = No(e.target);
        (l.fragment && l.fragment.l(u), u.forEach(U));
      } else l.fragment && l.fragment.c();
      (e.intro && be(t.$$.fragment), Ft(t, e.target, e.anchor), zn());
    }
    lt(a);
  }
  class Dn {
    constructor() {
      x(this, "$$");
      x(this, "$$set");
    }
    $destroy() {
      (Yt(this, 1), (this.$destroy = H));
    }
    $on(e, n) {
      if (!$t(n)) return H;
      const r = this.$$.callbacks[e] || (this.$$.callbacks[e] = []);
      return (
        r.push(n),
        () => {
          const o = r.indexOf(n);
          o !== -1 && r.splice(o, 1);
        }
      );
    }
    $set(e) {
      this.$$set && !ko(e) && ((this.$$.skip_bound = !0), this.$$set(e), (this.$$.skip_bound = !1));
    }
  }
  const Ho = "4";
  typeof window < "u" && (window.__svelte || (window.__svelte = { v: new Set() })).v.add(Ho);
  function Uo(t) {
    return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
  }
  var Gt = { exports: {} };
  function Vn(t, e = 100, n = {}) {
    if (typeof t != "function")
      throw new TypeError(`Expected the first parameter to be a function, got \`${typeof t}\`.`);
    if (e < 0) throw new RangeError("`wait` must not be negative.");
    const { immediate: r } = typeof n == "boolean" ? { immediate: n } : n;
    let o, i, s, c, a;
    function l() {
      const u = Date.now() - c;
      if (u < e && u >= 0) s = setTimeout(l, e - u);
      else if (((s = void 0), !r)) {
        const b = o,
          d = i;
        ((o = void 0), (i = void 0), (a = t.apply(b, d)));
      }
    }
    const f = function (...u) {
      if (o && this !== o) throw new Error("Debounced method called with different contexts.");
      ((o = this), (i = u), (c = Date.now()));
      const b = r && !s;
      if ((s || (s = setTimeout(l, e)), b)) {
        const d = o,
          g = i;
        ((o = void 0), (i = void 0), (a = t.apply(d, g)));
      }
      return a;
    };
    return (
      (f.clear = () => {
        s && (clearTimeout(s), (s = void 0));
      }),
      (f.flush = () => {
        if (!s) return;
        const u = o,
          b = i;
        ((o = void 0), (i = void 0), (a = t.apply(u, b)), clearTimeout(s), (s = void 0));
      }),
      f
    );
  }
  ((Gt.exports.debounce = Vn), (Gt.exports = Vn));
  var Mo = Gt.exports;
  const qo = Uo(Mo),
    Zt = typeof globalThis == "object" && "crypto" in globalThis ? globalThis.crypto : void 0;
  /*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */ const Jt = (t) =>
      t instanceof Uint8Array,
    Qt = (t) => new DataView(t.buffer, t.byteOffset, t.byteLength),
    ye = (t, e) => (t << (32 - e)) | (t >>> e);
  if (!(new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68))
    throw new Error("Non little-endian hardware is not supported");
  const jo = Array.from({ length: 256 }, (t, e) => e.toString(16).padStart(2, "0"));
  function ue(t) {
    if (!Jt(t)) throw new Error("Uint8Array expected");
    let e = "";
    for (let n = 0; n < t.length; n++) e += jo[t[n]];
    return e;
  }
  function Fn(t) {
    if (typeof t != "string") throw new Error("hex string expected, got " + typeof t);
    const e = t.length;
    if (e % 2) throw new Error("padded hex string expected, got unpadded hex of length " + e);
    const n = new Uint8Array(e / 2);
    for (let r = 0; r < n.length; r++) {
      const o = r * 2,
        i = t.slice(o, o + 2),
        s = Number.parseInt(i, 16);
      if (Number.isNaN(s) || s < 0) throw new Error("Invalid byte sequence");
      n[r] = s;
    }
    return n;
  }
  function $o(t) {
    if (typeof t != "string") throw new Error(`utf8ToBytes expected string, got ${typeof t}`);
    return new Uint8Array(new TextEncoder().encode(t));
  }
  function ut(t) {
    if ((typeof t == "string" && (t = $o(t)), !Jt(t)))
      throw new Error(`expected Uint8Array, got ${typeof t}`);
    return t;
  }
  function Xt(...t) {
    const e = new Uint8Array(t.reduce((r, o) => r + o.length, 0));
    let n = 0;
    return (
      t.forEach((r) => {
        if (!Jt(r)) throw new Error("Uint8Array expected");
        (e.set(r, n), (n += r.length));
      }),
      e
    );
  }
  let Yn = class {
    clone() {
      return this._cloneInto();
    }
  };
  function Gn(t) {
    const e = (r) => t().update(ut(r)).digest(),
      n = t();
    return ((e.outputLen = n.outputLen), (e.blockLen = n.blockLen), (e.create = () => t()), e);
  }
  function zo(t = 32) {
    if (Zt && typeof Zt.getRandomValues == "function") return Zt.getRandomValues(new Uint8Array(t));
    throw new Error("crypto.getRandomValues must be defined");
  }
  function Zn(t) {
    if (!Number.isSafeInteger(t) || t < 0) throw new Error(`Wrong positive integer: ${t}`);
  }
  function Jn(t, ...e) {
    if (!(t instanceof Uint8Array)) throw new Error("Expected Uint8Array");
    if (e.length > 0 && !e.includes(t.length))
      throw new Error(`Expected Uint8Array of length ${e}, not of length=${t.length}`);
  }
  function Wo(t) {
    if (typeof t != "function" || typeof t.create != "function")
      throw new Error("Hash should be wrapped by utils.wrapConstructor");
    (Zn(t.outputLen), Zn(t.blockLen));
  }
  function _t(t, e = !0) {
    if (t.destroyed) throw new Error("Hash instance has been destroyed");
    if (e && t.finished) throw new Error("Hash#digest() has already been called");
  }
  function Ko(t, e) {
    Jn(t);
    const n = e.outputLen;
    if (t.length < n) throw new Error(`digestInto() expects output buffer of length at least ${n}`);
  }
  const en = typeof globalThis == "object" && "crypto" in globalThis ? globalThis.crypto : void 0;
  /*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */ const Qn = (t) =>
      t instanceof Uint8Array,
    tn = (t) => new DataView(t.buffer, t.byteOffset, t.byteLength),
    me = (t, e) => (t << (32 - e)) | (t >>> e);
  if (!(new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68))
    throw new Error("Non little-endian hardware is not supported");
  function Do(t) {
    if (typeof t != "string") throw new Error(`utf8ToBytes expected string, got ${typeof t}`);
    return new Uint8Array(new TextEncoder().encode(t));
  }
  function nn(t) {
    if ((typeof t == "string" && (t = Do(t)), !Qn(t)))
      throw new Error(`expected Uint8Array, got ${typeof t}`);
    return t;
  }
  function Vo(...t) {
    const e = new Uint8Array(t.reduce((r, o) => r + o.length, 0));
    let n = 0;
    return (
      t.forEach((r) => {
        if (!Qn(r)) throw new Error("Uint8Array expected");
        (e.set(r, n), (n += r.length));
      }),
      e
    );
  }
  class Xn {
    clone() {
      return this._cloneInto();
    }
  }
  function Fo(t) {
    const e = (r) => t().update(nn(r)).digest(),
      n = t();
    return ((e.outputLen = n.outputLen), (e.blockLen = n.blockLen), (e.create = () => t()), e);
  }
  function er(t = 32) {
    if (en && typeof en.getRandomValues == "function") return en.getRandomValues(new Uint8Array(t));
    throw new Error("crypto.getRandomValues must be defined");
  }
  function Yo(t, e, n, r) {
    if (typeof t.setBigUint64 == "function") return t.setBigUint64(e, n, r);
    const o = BigInt(32),
      i = BigInt(4294967295),
      s = Number((n >> o) & i),
      c = Number(n & i),
      a = r ? 4 : 0,
      l = r ? 0 : 4;
    (t.setUint32(e + a, s, r), t.setUint32(e + l, c, r));
  }
  let Go = class extends Xn {
    constructor(e, n, r, o) {
      (super(),
        (this.blockLen = e),
        (this.outputLen = n),
        (this.padOffset = r),
        (this.isLE = o),
        (this.finished = !1),
        (this.length = 0),
        (this.pos = 0),
        (this.destroyed = !1),
        (this.buffer = new Uint8Array(e)),
        (this.view = tn(this.buffer)));
    }
    update(e) {
      _t(this);
      const { view: n, buffer: r, blockLen: o } = this;
      e = nn(e);
      const i = e.length;
      for (let s = 0; s < i; ) {
        const c = Math.min(o - this.pos, i - s);
        if (c === o) {
          const a = tn(e);
          for (; o <= i - s; s += o) this.process(a, s);
          continue;
        }
        (r.set(e.subarray(s, s + c), this.pos),
          (this.pos += c),
          (s += c),
          this.pos === o && (this.process(n, 0), (this.pos = 0)));
      }
      return ((this.length += e.length), this.roundClean(), this);
    }
    digestInto(e) {
      (_t(this), Ko(e, this), (this.finished = !0));
      const { buffer: n, view: r, blockLen: o, isLE: i } = this;
      let { pos: s } = this;
      ((n[s++] = 128),
        this.buffer.subarray(s).fill(0),
        this.padOffset > o - s && (this.process(r, 0), (s = 0)));
      for (let u = s; u < o; u++) n[u] = 0;
      (Yo(r, o - 8, BigInt(this.length * 8), i), this.process(r, 0));
      const c = tn(e),
        a = this.outputLen;
      if (a % 4) throw new Error("_sha2: outputLen should be aligned to 32bit");
      const l = a / 4,
        f = this.get();
      if (l > f.length) throw new Error("_sha2: outputLen bigger than state");
      for (let u = 0; u < l; u++) c.setUint32(4 * u, f[u], i);
    }
    digest() {
      const { buffer: e, outputLen: n } = this;
      this.digestInto(e);
      const r = e.slice(0, n);
      return (this.destroy(), r);
    }
    _cloneInto(e) {
      (e || (e = new this.constructor()), e.set(...this.get()));
      const { blockLen: n, buffer: r, length: o, finished: i, destroyed: s, pos: c } = this;
      return (
        (e.length = o),
        (e.pos = c),
        (e.finished = i),
        (e.destroyed = s),
        o % n && e.buffer.set(r),
        e
      );
    }
  };
  const Zo = (t, e, n) => (t & e) ^ (~t & n),
    Jo = (t, e, n) => (t & e) ^ (t & n) ^ (e & n),
    Qo = new Uint32Array([
      1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221,
      3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580,
      3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986,
      2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895,
      666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037,
      2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344,
      430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779,
      1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479,
      3329325298,
    ]),
    Te = new Uint32Array([
      1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225,
    ]),
    Be = new Uint32Array(64);
  let Xo = class extends Go {
    constructor() {
      (super(64, 32, 8, !1),
        (this.A = Te[0] | 0),
        (this.B = Te[1] | 0),
        (this.C = Te[2] | 0),
        (this.D = Te[3] | 0),
        (this.E = Te[4] | 0),
        (this.F = Te[5] | 0),
        (this.G = Te[6] | 0),
        (this.H = Te[7] | 0));
    }
    get() {
      const { A: e, B: n, C: r, D: o, E: i, F: s, G: c, H: a } = this;
      return [e, n, r, o, i, s, c, a];
    }
    set(e, n, r, o, i, s, c, a) {
      ((this.A = e | 0),
        (this.B = n | 0),
        (this.C = r | 0),
        (this.D = o | 0),
        (this.E = i | 0),
        (this.F = s | 0),
        (this.G = c | 0),
        (this.H = a | 0));
    }
    process(e, n) {
      for (let u = 0; u < 16; u++, n += 4) Be[u] = e.getUint32(n, !1);
      for (let u = 16; u < 64; u++) {
        const b = Be[u - 15],
          d = Be[u - 2],
          g = me(b, 7) ^ me(b, 18) ^ (b >>> 3),
          h = me(d, 17) ^ me(d, 19) ^ (d >>> 10);
        Be[u] = (h + Be[u - 7] + g + Be[u - 16]) | 0;
      }
      let { A: r, B: o, C: i, D: s, E: c, F: a, G: l, H: f } = this;
      for (let u = 0; u < 64; u++) {
        const b = me(c, 6) ^ me(c, 11) ^ me(c, 25),
          d = (f + b + Zo(c, a, l) + Qo[u] + Be[u]) | 0,
          h = ((me(r, 2) ^ me(r, 13) ^ me(r, 22)) + Jo(r, o, i)) | 0;
        ((f = l),
          (l = a),
          (a = c),
          (c = (s + d) | 0),
          (s = i),
          (i = o),
          (o = r),
          (r = (d + h) | 0));
      }
      ((r = (r + this.A) | 0),
        (o = (o + this.B) | 0),
        (i = (i + this.C) | 0),
        (s = (s + this.D) | 0),
        (c = (c + this.E) | 0),
        (a = (a + this.F) | 0),
        (l = (l + this.G) | 0),
        (f = (f + this.H) | 0),
        this.set(r, o, i, s, c, a, l, f));
    }
    roundClean() {
      Be.fill(0);
    }
    destroy() {
      (this.set(0, 0, 0, 0, 0, 0, 0, 0), this.buffer.fill(0));
    }
  };
  const rn = Fo(() => new Xo());
  /*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */ const tr = BigInt(0),
    kt = BigInt(1),
    ei = BigInt(2),
    St = (t) => t instanceof Uint8Array,
    ti = Array.from({ length: 256 }, (t, e) => e.toString(16).padStart(2, "0"));
  function Qe(t) {
    if (!St(t)) throw new Error("Uint8Array expected");
    let e = "";
    for (let n = 0; n < t.length; n++) e += ti[t[n]];
    return e;
  }
  function nr(t) {
    const e = t.toString(16);
    return e.length & 1 ? `0${e}` : e;
  }
  function on(t) {
    if (typeof t != "string") throw new Error("hex string expected, got " + typeof t);
    return BigInt(t === "" ? "0" : `0x${t}`);
  }
  function Xe(t) {
    if (typeof t != "string") throw new Error("hex string expected, got " + typeof t);
    const e = t.length;
    if (e % 2) throw new Error("padded hex string expected, got unpadded hex of length " + e);
    const n = new Uint8Array(e / 2);
    for (let r = 0; r < n.length; r++) {
      const o = r * 2,
        i = t.slice(o, o + 2),
        s = Number.parseInt(i, 16);
      if (Number.isNaN(s) || s < 0) throw new Error("Invalid byte sequence");
      n[r] = s;
    }
    return n;
  }
  function ae(t) {
    return on(Qe(t));
  }
  function sn(t) {
    if (!St(t)) throw new Error("Uint8Array expected");
    return on(Qe(Uint8Array.from(t).reverse()));
  }
  function Oe(t, e) {
    return Xe(t.toString(16).padStart(e * 2, "0"));
  }
  function cn(t, e) {
    return Oe(t, e).reverse();
  }
  function ni(t) {
    return Xe(nr(t));
  }
  function oe(t, e, n) {
    let r;
    if (typeof e == "string")
      try {
        r = Xe(e);
      } catch (i) {
        throw new Error(`${t} must be valid hex string, got "${e}". Cause: ${i}`);
      }
    else if (St(e)) r = Uint8Array.from(e);
    else throw new Error(`${t} must be hex string or Uint8Array`);
    const o = r.length;
    if (typeof n == "number" && o !== n) throw new Error(`${t} expected ${n} bytes, got ${o}`);
    return r;
  }
  function ze(...t) {
    const e = new Uint8Array(t.reduce((r, o) => r + o.length, 0));
    let n = 0;
    return (
      t.forEach((r) => {
        if (!St(r)) throw new Error("Uint8Array expected");
        (e.set(r, n), (n += r.length));
      }),
      e
    );
  }
  function ri(t, e) {
    if (t.length !== e.length) return !1;
    for (let n = 0; n < t.length; n++) if (t[n] !== e[n]) return !1;
    return !0;
  }
  function oi(t) {
    if (typeof t != "string") throw new Error(`utf8ToBytes expected string, got ${typeof t}`);
    return new Uint8Array(new TextEncoder().encode(t));
  }
  function ii(t) {
    let e;
    for (e = 0; t > tr; t >>= kt, e += 1);
    return e;
  }
  function si(t, e) {
    return (t >> BigInt(e)) & kt;
  }
  const ci = (t, e, n) => t | ((n ? kt : tr) << BigInt(e)),
    an = (t) => (ei << BigInt(t - 1)) - kt,
    ln = (t) => new Uint8Array(t),
    rr = (t) => Uint8Array.from(t);
  function or(t, e, n) {
    if (typeof t != "number" || t < 2) throw new Error("hashLen must be a number");
    if (typeof e != "number" || e < 2) throw new Error("qByteLen must be a number");
    if (typeof n != "function") throw new Error("hmacFn must be a function");
    let r = ln(t),
      o = ln(t),
      i = 0;
    const s = () => {
        (r.fill(1), o.fill(0), (i = 0));
      },
      c = (...u) => n(o, r, ...u),
      a = (u = ln()) => {
        ((o = c(rr([0]), u)), (r = c()), u.length !== 0 && ((o = c(rr([1]), u)), (r = c())));
      },
      l = () => {
        if (i++ >= 1e3) throw new Error("drbg: tried 1000 values");
        let u = 0;
        const b = [];
        for (; u < e; ) {
          r = c();
          const d = r.slice();
          (b.push(d), (u += r.length));
        }
        return ze(...b);
      };
    return (u, b) => {
      (s(), a(u));
      let d;
      for (; !(d = b(l())); ) a();
      return (s(), d);
    };
  }
  const ai = {
    bigint: (t) => typeof t == "bigint",
    function: (t) => typeof t == "function",
    boolean: (t) => typeof t == "boolean",
    string: (t) => typeof t == "string",
    stringOrUint8Array: (t) => typeof t == "string" || t instanceof Uint8Array,
    isSafeInteger: (t) => Number.isSafeInteger(t),
    array: (t) => Array.isArray(t),
    field: (t, e) => e.Fp.isValid(t),
    hash: (t) => typeof t == "function" && Number.isSafeInteger(t.outputLen),
  };
  function ft(t, e, n = {}) {
    const r = (o, i, s) => {
      const c = ai[i];
      if (typeof c != "function") throw new Error(`Invalid validator "${i}", expected function`);
      const a = t[o];
      if (!(s && a === void 0) && !c(a, t))
        throw new Error(`Invalid param ${String(o)}=${a} (${typeof a}), expected ${i}`);
    };
    for (const [o, i] of Object.entries(e)) r(o, i, !1);
    for (const [o, i] of Object.entries(n)) r(o, i, !0);
    return t;
  }
  const li = Object.freeze(
    Object.defineProperty(
      {
        __proto__: null,
        bitGet: si,
        bitLen: ii,
        bitMask: an,
        bitSet: ci,
        bytesToHex: Qe,
        bytesToNumberBE: ae,
        bytesToNumberLE: sn,
        concatBytes: ze,
        createHmacDrbg: or,
        ensureBytes: oe,
        equalBytes: ri,
        hexToBytes: Xe,
        hexToNumber: on,
        numberToBytesBE: Oe,
        numberToBytesLE: cn,
        numberToHexUnpadded: nr,
        numberToVarBytesBE: ni,
        utf8ToBytes: oi,
        validateObject: ft,
      },
      Symbol.toStringTag,
      { value: "Module" },
    ),
  );
  /*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */ const ee = BigInt(0),
    Q = BigInt(1),
    We = BigInt(2),
    ui = BigInt(3),
    un = BigInt(4),
    ir = BigInt(5),
    sr = BigInt(8);
  (BigInt(9), BigInt(16));
  function re(t, e) {
    const n = t % e;
    return n >= ee ? n : e + n;
  }
  function fi(t, e, n) {
    if (n <= ee || e < ee) throw new Error("Expected power/modulo > 0");
    if (n === Q) return ee;
    let r = Q;
    for (; e > ee; ) (e & Q && (r = (r * t) % n), (t = (t * t) % n), (e >>= Q));
    return r;
  }
  function fe(t, e, n) {
    let r = t;
    for (; e-- > ee; ) ((r *= r), (r %= n));
    return r;
  }
  function fn(t, e) {
    if (t === ee || e <= ee)
      throw new Error(`invert: expected positive integers, got n=${t} mod=${e}`);
    let n = re(t, e),
      r = e,
      o = ee,
      i = Q;
    for (; n !== ee; ) {
      const c = r / n,
        a = r % n,
        l = o - i * c;
      ((r = n), (n = a), (o = i), (i = l));
    }
    if (r !== Q) throw new Error("invert: does not exist");
    return re(o, e);
  }
  function di(t) {
    const e = (t - Q) / We;
    let n, r, o;
    for (n = t - Q, r = 0; n % We === ee; n /= We, r++);
    for (o = We; o < t && fi(o, e, t) !== t - Q; o++);
    if (r === 1) {
      const s = (t + Q) / un;
      return function (a, l) {
        const f = a.pow(l, s);
        if (!a.eql(a.sqr(f), l)) throw new Error("Cannot find square root");
        return f;
      };
    }
    const i = (n + Q) / We;
    return function (c, a) {
      if (c.pow(a, e) === c.neg(c.ONE)) throw new Error("Cannot find square root");
      let l = r,
        f = c.pow(c.mul(c.ONE, o), n),
        u = c.pow(a, i),
        b = c.pow(a, n);
      for (; !c.eql(b, c.ONE); ) {
        if (c.eql(b, c.ZERO)) return c.ZERO;
        let d = 1;
        for (let h = c.sqr(b); d < l && !c.eql(h, c.ONE); d++) h = c.sqr(h);
        const g = c.pow(f, Q << BigInt(l - d - 1));
        ((f = c.sqr(g)), (u = c.mul(u, g)), (b = c.mul(b, f)), (l = d));
      }
      return u;
    };
  }
  function hi(t) {
    if (t % un === ui) {
      const e = (t + Q) / un;
      return function (r, o) {
        const i = r.pow(o, e);
        if (!r.eql(r.sqr(i), o)) throw new Error("Cannot find square root");
        return i;
      };
    }
    if (t % sr === ir) {
      const e = (t - ir) / sr;
      return function (r, o) {
        const i = r.mul(o, We),
          s = r.pow(i, e),
          c = r.mul(o, s),
          a = r.mul(r.mul(c, We), s),
          l = r.mul(c, r.sub(a, r.ONE));
        if (!r.eql(r.sqr(l), o)) throw new Error("Cannot find square root");
        return l;
      };
    }
    return di(t);
  }
  const bi = [
    "create",
    "isValid",
    "is0",
    "neg",
    "inv",
    "sqrt",
    "sqr",
    "eql",
    "add",
    "sub",
    "mul",
    "pow",
    "div",
    "addN",
    "subN",
    "mulN",
    "sqrN",
  ];
  function gi(t) {
    const e = {
        ORDER: "bigint",
        MASK: "bigint",
        BYTES: "isSafeInteger",
        BITS: "isSafeInteger",
      },
      n = bi.reduce((r, o) => ((r[o] = "function"), r), e);
    return ft(t, n);
  }
  function pi(t, e, n) {
    if (n < ee) throw new Error("Expected power > 0");
    if (n === ee) return t.ONE;
    if (n === Q) return e;
    let r = t.ONE,
      o = e;
    for (; n > ee; ) (n & Q && (r = t.mul(r, o)), (o = t.sqr(o)), (n >>= Q));
    return r;
  }
  function wi(t, e) {
    const n = new Array(e.length),
      r = e.reduce((i, s, c) => (t.is0(s) ? i : ((n[c] = i), t.mul(i, s))), t.ONE),
      o = t.inv(r);
    return (
      e.reduceRight((i, s, c) => (t.is0(s) ? i : ((n[c] = t.mul(i, n[c])), t.mul(i, s))), o),
      n
    );
  }
  function cr(t, e) {
    const n = e !== void 0 ? e : t.toString(2).length,
      r = Math.ceil(n / 8);
    return { nBitLength: n, nByteLength: r };
  }
  function yi(t, e, n = !1, r = {}) {
    if (t <= ee) throw new Error(`Expected Field ORDER > 0, got ${t}`);
    const { nBitLength: o, nByteLength: i } = cr(t, e);
    if (i > 2048) throw new Error("Field lengths over 2048 bytes are not supported");
    const s = hi(t),
      c = Object.freeze({
        ORDER: t,
        BITS: o,
        BYTES: i,
        MASK: an(o),
        ZERO: ee,
        ONE: Q,
        create: (a) => re(a, t),
        isValid: (a) => {
          if (typeof a != "bigint")
            throw new Error(`Invalid field element: expected bigint, got ${typeof a}`);
          return ee <= a && a < t;
        },
        is0: (a) => a === ee,
        isOdd: (a) => (a & Q) === Q,
        neg: (a) => re(-a, t),
        eql: (a, l) => a === l,
        sqr: (a) => re(a * a, t),
        add: (a, l) => re(a + l, t),
        sub: (a, l) => re(a - l, t),
        mul: (a, l) => re(a * l, t),
        pow: (a, l) => pi(c, a, l),
        div: (a, l) => re(a * fn(l, t), t),
        sqrN: (a) => a * a,
        addN: (a, l) => a + l,
        subN: (a, l) => a - l,
        mulN: (a, l) => a * l,
        inv: (a) => fn(a, t),
        sqrt: r.sqrt || ((a) => s(c, a)),
        invertBatch: (a) => wi(c, a),
        cmov: (a, l, f) => (f ? l : a),
        toBytes: (a) => (n ? cn(a, i) : Oe(a, i)),
        fromBytes: (a) => {
          if (a.length !== i) throw new Error(`Fp.fromBytes: expected ${i}, got ${a.length}`);
          return n ? sn(a) : ae(a);
        },
      });
    return Object.freeze(c);
  }
  function ar(t) {
    if (typeof t != "bigint") throw new Error("field order must be bigint");
    const e = t.toString(2).length;
    return Math.ceil(e / 8);
  }
  function lr(t) {
    const e = ar(t);
    return e + Math.ceil(e / 2);
  }
  function mi(t, e, n = !1) {
    const r = t.length,
      o = ar(e),
      i = lr(e);
    if (r < 16 || r < i || r > 1024) throw new Error(`expected ${i}-1024 bytes of input, got ${r}`);
    const s = n ? ae(t) : sn(t),
      c = re(s, e - Q) + Q;
    return n ? cn(c, o) : Oe(c, o);
  }
  /*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */ const vi = BigInt(0),
    dn = BigInt(1);
  function Ei(t, e) {
    const n = (o, i) => {
        const s = i.negate();
        return o ? s : i;
      },
      r = (o) => {
        const i = Math.ceil(e / o) + 1,
          s = 2 ** (o - 1);
        return { windows: i, windowSize: s };
      };
    return {
      constTimeNegate: n,
      unsafeLadder(o, i) {
        let s = t.ZERO,
          c = o;
        for (; i > vi; ) (i & dn && (s = s.add(c)), (c = c.double()), (i >>= dn));
        return s;
      },
      precomputeWindow(o, i) {
        const { windows: s, windowSize: c } = r(i),
          a = [];
        let l = o,
          f = l;
        for (let u = 0; u < s; u++) {
          ((f = l), a.push(f));
          for (let b = 1; b < c; b++) ((f = f.add(l)), a.push(f));
          l = f.double();
        }
        return a;
      },
      wNAF(o, i, s) {
        const { windows: c, windowSize: a } = r(o);
        let l = t.ZERO,
          f = t.BASE;
        const u = BigInt(2 ** o - 1),
          b = 2 ** o,
          d = BigInt(o);
        for (let g = 0; g < c; g++) {
          const h = g * a;
          let p = Number(s & u);
          ((s >>= d), p > a && ((p -= b), (s += dn)));
          const w = h,
            y = h + Math.abs(p) - 1,
            A = g % 2 !== 0,
            O = p < 0;
          p === 0 ? (f = f.add(n(A, i[w]))) : (l = l.add(n(O, i[y])));
        }
        return { p: l, f };
      },
      wNAFCached(o, i, s, c) {
        const a = o._WINDOW_SIZE || 1;
        let l = i.get(o);
        return (
          l || ((l = this.precomputeWindow(o, a)), a !== 1 && i.set(o, c(l))),
          this.wNAF(a, l, s)
        );
      },
    };
  }
  function ur(t) {
    return (
      gi(t.Fp),
      ft(
        t,
        { n: "bigint", h: "bigint", Gx: "field", Gy: "field" },
        { nBitLength: "isSafeInteger", nByteLength: "isSafeInteger" },
      ),
      Object.freeze({ ...cr(t.n, t.nBitLength), ...t, p: t.Fp.ORDER })
    );
  }
  /*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */ function xi(t) {
    const e = ur(t);
    ft(
      e,
      { a: "field", b: "field" },
      {
        allowedPrivateKeyLengths: "array",
        wrapPrivateKey: "boolean",
        isTorsionFree: "function",
        clearCofactor: "function",
        allowInfinityPoint: "boolean",
        fromBytes: "function",
        toBytes: "function",
      },
    );
    const { endo: n, Fp: r, a: o } = e;
    if (n) {
      if (!r.eql(o, r.ZERO))
        throw new Error("Endomorphism can only be defined for Koblitz curves that have a=0");
      if (typeof n != "object" || typeof n.beta != "bigint" || typeof n.splitScalar != "function")
        throw new Error("Expected endomorphism with beta: bigint and splitScalar: function");
    }
    return Object.freeze({ ...e });
  }
  const { bytesToNumberBE: _i, hexToBytes: ki } = li,
    Ke = {
      Err: class extends Error {
        constructor(e = "") {
          super(e);
        }
      },
      _parseInt(t) {
        const { Err: e } = Ke;
        if (t.length < 2 || t[0] !== 2) throw new e("Invalid signature integer tag");
        const n = t[1],
          r = t.subarray(2, n + 2);
        if (!n || r.length !== n) throw new e("Invalid signature integer: wrong length");
        if (r[0] & 128) throw new e("Invalid signature integer: negative");
        if (r[0] === 0 && !(r[1] & 128))
          throw new e("Invalid signature integer: unnecessary leading zero");
        return { d: _i(r), l: t.subarray(n + 2) };
      },
      toSig(t) {
        const { Err: e } = Ke,
          n = typeof t == "string" ? ki(t) : t;
        if (!(n instanceof Uint8Array)) throw new Error("ui8a expected");
        let r = n.length;
        if (r < 2 || n[0] != 48) throw new e("Invalid signature tag");
        if (n[1] !== r - 2) throw new e("Invalid signature: incorrect length");
        const { d: o, l: i } = Ke._parseInt(n.subarray(2)),
          { d: s, l: c } = Ke._parseInt(i);
        if (c.length) throw new e("Invalid signature: left bytes after parsing");
        return { r: o, s };
      },
      hexFromSig(t) {
        const e = (l) => (Number.parseInt(l[0], 16) & 8 ? "00" + l : l),
          n = (l) => {
            const f = l.toString(16);
            return f.length & 1 ? `0${f}` : f;
          },
          r = e(n(t.s)),
          o = e(n(t.r)),
          i = r.length / 2,
          s = o.length / 2,
          c = n(i),
          a = n(s);
        return `30${n(s + i + 4)}02${a}${o}02${c}${r}`;
      },
    },
    xe = BigInt(0),
    de = BigInt(1);
  BigInt(2);
  const fr = BigInt(3);
  BigInt(4);
  function Si(t) {
    const e = xi(t),
      { Fp: n } = e,
      r =
        e.toBytes ||
        ((g, h, p) => {
          const w = h.toAffine();
          return ze(Uint8Array.from([4]), n.toBytes(w.x), n.toBytes(w.y));
        }),
      o =
        e.fromBytes ||
        ((g) => {
          const h = g.subarray(1),
            p = n.fromBytes(h.subarray(0, n.BYTES)),
            w = n.fromBytes(h.subarray(n.BYTES, 2 * n.BYTES));
          return { x: p, y: w };
        });
    function i(g) {
      const { a: h, b: p } = e,
        w = n.sqr(g),
        y = n.mul(w, g);
      return n.add(n.add(y, n.mul(g, h)), p);
    }
    if (!n.eql(n.sqr(e.Gy), i(e.Gx)))
      throw new Error("bad generator point: equation left != right");
    function s(g) {
      return typeof g == "bigint" && xe < g && g < e.n;
    }
    function c(g) {
      if (!s(g)) throw new Error("Expected valid bigint: 0 < bigint < curve.n");
    }
    function a(g) {
      const { allowedPrivateKeyLengths: h, nByteLength: p, wrapPrivateKey: w, n: y } = e;
      if (h && typeof g != "bigint") {
        if ((g instanceof Uint8Array && (g = Qe(g)), typeof g != "string" || !h.includes(g.length)))
          throw new Error("Invalid key");
        g = g.padStart(p * 2, "0");
      }
      let A;
      try {
        A = typeof g == "bigint" ? g : ae(oe("private key", g, p));
      } catch {
        throw new Error(`private key must be ${p} bytes, hex or bigint, not ${typeof g}`);
      }
      return (w && (A = re(A, y)), c(A), A);
    }
    const l = new Map();
    function f(g) {
      if (!(g instanceof u)) throw new Error("ProjectivePoint expected");
    }
    class u {
      constructor(h, p, w) {
        if (((this.px = h), (this.py = p), (this.pz = w), h == null || !n.isValid(h)))
          throw new Error("x required");
        if (p == null || !n.isValid(p)) throw new Error("y required");
        if (w == null || !n.isValid(w)) throw new Error("z required");
      }
      static fromAffine(h) {
        const { x: p, y: w } = h || {};
        if (!h || !n.isValid(p) || !n.isValid(w)) throw new Error("invalid affine point");
        if (h instanceof u) throw new Error("projective point not allowed");
        const y = (A) => n.eql(A, n.ZERO);
        return y(p) && y(w) ? u.ZERO : new u(p, w, n.ONE);
      }
      get x() {
        return this.toAffine().x;
      }
      get y() {
        return this.toAffine().y;
      }
      static normalizeZ(h) {
        const p = n.invertBatch(h.map((w) => w.pz));
        return h.map((w, y) => w.toAffine(p[y])).map(u.fromAffine);
      }
      static fromHex(h) {
        const p = u.fromAffine(o(oe("pointHex", h)));
        return (p.assertValidity(), p);
      }
      static fromPrivateKey(h) {
        return u.BASE.multiply(a(h));
      }
      _setWindowSize(h) {
        ((this._WINDOW_SIZE = h), l.delete(this));
      }
      assertValidity() {
        if (this.is0()) {
          if (e.allowInfinityPoint && !n.is0(this.py)) return;
          throw new Error("bad point: ZERO");
        }
        const { x: h, y: p } = this.toAffine();
        if (!n.isValid(h) || !n.isValid(p)) throw new Error("bad point: x or y not FE");
        const w = n.sqr(p),
          y = i(h);
        if (!n.eql(w, y)) throw new Error("bad point: equation left != right");
        if (!this.isTorsionFree()) throw new Error("bad point: not in prime-order subgroup");
      }
      hasEvenY() {
        const { y: h } = this.toAffine();
        if (n.isOdd) return !n.isOdd(h);
        throw new Error("Field doesn't support isOdd");
      }
      equals(h) {
        f(h);
        const { px: p, py: w, pz: y } = this,
          { px: A, py: O, pz: L } = h,
          k = n.eql(n.mul(p, L), n.mul(A, y)),
          I = n.eql(n.mul(w, L), n.mul(O, y));
        return k && I;
      }
      negate() {
        return new u(this.px, n.neg(this.py), this.pz);
      }
      double() {
        const { a: h, b: p } = e,
          w = n.mul(p, fr),
          { px: y, py: A, pz: O } = this;
        let L = n.ZERO,
          k = n.ZERO,
          I = n.ZERO,
          m = n.mul(y, y),
          T = n.mul(A, A),
          S = n.mul(O, O),
          P = n.mul(y, A);
        return (
          (P = n.add(P, P)),
          (I = n.mul(y, O)),
          (I = n.add(I, I)),
          (L = n.mul(h, I)),
          (k = n.mul(w, S)),
          (k = n.add(L, k)),
          (L = n.sub(T, k)),
          (k = n.add(T, k)),
          (k = n.mul(L, k)),
          (L = n.mul(P, L)),
          (I = n.mul(w, I)),
          (S = n.mul(h, S)),
          (P = n.sub(m, S)),
          (P = n.mul(h, P)),
          (P = n.add(P, I)),
          (I = n.add(m, m)),
          (m = n.add(I, m)),
          (m = n.add(m, S)),
          (m = n.mul(m, P)),
          (k = n.add(k, m)),
          (S = n.mul(A, O)),
          (S = n.add(S, S)),
          (m = n.mul(S, P)),
          (L = n.sub(L, m)),
          (I = n.mul(S, T)),
          (I = n.add(I, I)),
          (I = n.add(I, I)),
          new u(L, k, I)
        );
      }
      add(h) {
        f(h);
        const { px: p, py: w, pz: y } = this,
          { px: A, py: O, pz: L } = h;
        let k = n.ZERO,
          I = n.ZERO,
          m = n.ZERO;
        const T = e.a,
          S = n.mul(e.b, fr);
        let P = n.mul(p, A),
          V = n.mul(w, O),
          z = n.mul(y, L),
          Z = n.add(p, w),
          E = n.add(A, O);
        ((Z = n.mul(Z, E)), (E = n.add(P, V)), (Z = n.sub(Z, E)), (E = n.add(p, y)));
        let B = n.add(A, L);
        return (
          (E = n.mul(E, B)),
          (B = n.add(P, z)),
          (E = n.sub(E, B)),
          (B = n.add(w, y)),
          (k = n.add(O, L)),
          (B = n.mul(B, k)),
          (k = n.add(V, z)),
          (B = n.sub(B, k)),
          (m = n.mul(T, E)),
          (k = n.mul(S, z)),
          (m = n.add(k, m)),
          (k = n.sub(V, m)),
          (m = n.add(V, m)),
          (I = n.mul(k, m)),
          (V = n.add(P, P)),
          (V = n.add(V, P)),
          (z = n.mul(T, z)),
          (E = n.mul(S, E)),
          (V = n.add(V, z)),
          (z = n.sub(P, z)),
          (z = n.mul(T, z)),
          (E = n.add(E, z)),
          (P = n.mul(V, E)),
          (I = n.add(I, P)),
          (P = n.mul(B, E)),
          (k = n.mul(Z, k)),
          (k = n.sub(k, P)),
          (P = n.mul(Z, V)),
          (m = n.mul(B, m)),
          (m = n.add(m, P)),
          new u(k, I, m)
        );
      }
      subtract(h) {
        return this.add(h.negate());
      }
      is0() {
        return this.equals(u.ZERO);
      }
      wNAF(h) {
        return d.wNAFCached(this, l, h, (p) => {
          const w = n.invertBatch(p.map((y) => y.pz));
          return p.map((y, A) => y.toAffine(w[A])).map(u.fromAffine);
        });
      }
      multiplyUnsafe(h) {
        const p = u.ZERO;
        if (h === xe) return p;
        if ((c(h), h === de)) return this;
        const { endo: w } = e;
        if (!w) return d.unsafeLadder(this, h);
        let { k1neg: y, k1: A, k2neg: O, k2: L } = w.splitScalar(h),
          k = p,
          I = p,
          m = this;
        for (; A > xe || L > xe; )
          (A & de && (k = k.add(m)),
            L & de && (I = I.add(m)),
            (m = m.double()),
            (A >>= de),
            (L >>= de));
        return (
          y && (k = k.negate()),
          O && (I = I.negate()),
          (I = new u(n.mul(I.px, w.beta), I.py, I.pz)),
          k.add(I)
        );
      }
      multiply(h) {
        c(h);
        let p = h,
          w,
          y;
        const { endo: A } = e;
        if (A) {
          const { k1neg: O, k1: L, k2neg: k, k2: I } = A.splitScalar(p);
          let { p: m, f: T } = this.wNAF(L),
            { p: S, f: P } = this.wNAF(I);
          ((m = d.constTimeNegate(O, m)),
            (S = d.constTimeNegate(k, S)),
            (S = new u(n.mul(S.px, A.beta), S.py, S.pz)),
            (w = m.add(S)),
            (y = T.add(P)));
        } else {
          const { p: O, f: L } = this.wNAF(p);
          ((w = O), (y = L));
        }
        return u.normalizeZ([w, y])[0];
      }
      multiplyAndAddUnsafe(h, p, w) {
        const y = u.BASE,
          A = (L, k) =>
            k === xe || k === de || !L.equals(y) ? L.multiplyUnsafe(k) : L.multiply(k),
          O = A(this, p).add(A(h, w));
        return O.is0() ? void 0 : O;
      }
      toAffine(h) {
        const { px: p, py: w, pz: y } = this,
          A = this.is0();
        h == null && (h = A ? n.ONE : n.inv(y));
        const O = n.mul(p, h),
          L = n.mul(w, h),
          k = n.mul(y, h);
        if (A) return { x: n.ZERO, y: n.ZERO };
        if (!n.eql(k, n.ONE)) throw new Error("invZ was invalid");
        return { x: O, y: L };
      }
      isTorsionFree() {
        const { h, isTorsionFree: p } = e;
        if (h === de) return !0;
        if (p) return p(u, this);
        throw new Error("isTorsionFree() has not been declared for the elliptic curve");
      }
      clearCofactor() {
        const { h, clearCofactor: p } = e;
        return h === de ? this : p ? p(u, this) : this.multiplyUnsafe(e.h);
      }
      toRawBytes(h = !0) {
        return (this.assertValidity(), r(u, this, h));
      }
      toHex(h = !0) {
        return Qe(this.toRawBytes(h));
      }
    }
    ((u.BASE = new u(e.Gx, e.Gy, n.ONE)), (u.ZERO = new u(n.ZERO, n.ONE, n.ZERO)));
    const b = e.nBitLength,
      d = Ei(u, e.endo ? Math.ceil(b / 2) : b);
    return {
      CURVE: e,
      ProjectivePoint: u,
      normPrivateKeyToScalar: a,
      weierstrassEquation: i,
      isWithinCurveOrder: s,
    };
  }
  function Ai(t) {
    const e = ur(t);
    return (
      ft(
        e,
        { hash: "hash", hmac: "function", randomBytes: "function" },
        { bits2int: "function", bits2int_modN: "function", lowS: "boolean" },
      ),
      Object.freeze({ lowS: !0, ...e })
    );
  }
  function Ii(t) {
    const e = Ai(t),
      { Fp: n, n: r } = e,
      o = n.BYTES + 1,
      i = 2 * n.BYTES + 1;
    function s(E) {
      return xe < E && E < n.ORDER;
    }
    function c(E) {
      return re(E, r);
    }
    function a(E) {
      return fn(E, r);
    }
    const {
        ProjectivePoint: l,
        normPrivateKeyToScalar: f,
        weierstrassEquation: u,
        isWithinCurveOrder: b,
      } = Si({
        ...e,
        toBytes(E, B, R) {
          const $ = B.toAffine(),
            M = n.toBytes($.x),
            W = ze;
          return R
            ? W(Uint8Array.from([B.hasEvenY() ? 2 : 3]), M)
            : W(Uint8Array.from([4]), M, n.toBytes($.y));
        },
        fromBytes(E) {
          const B = E.length,
            R = E[0],
            $ = E.subarray(1);
          if (B === o && (R === 2 || R === 3)) {
            const M = ae($);
            if (!s(M)) throw new Error("Point is not on curve");
            const W = u(M);
            let Y = n.sqrt(W);
            const F = (Y & de) === de;
            return (((R & 1) === 1) !== F && (Y = n.neg(Y)), { x: M, y: Y });
          } else if (B === i && R === 4) {
            const M = n.fromBytes($.subarray(0, n.BYTES)),
              W = n.fromBytes($.subarray(n.BYTES, 2 * n.BYTES));
            return { x: M, y: W };
          } else
            throw new Error(
              `Point of length ${B} was invalid. Expected ${o} compressed bytes or ${i} uncompressed bytes`,
            );
        },
      }),
      d = (E) => Qe(Oe(E, e.nByteLength));
    function g(E) {
      const B = r >> de;
      return E > B;
    }
    function h(E) {
      return g(E) ? c(-E) : E;
    }
    const p = (E, B, R) => ae(E.slice(B, R));
    class w {
      constructor(B, R, $) {
        ((this.r = B), (this.s = R), (this.recovery = $), this.assertValidity());
      }
      static fromCompact(B) {
        const R = e.nByteLength;
        return ((B = oe("compactSignature", B, R * 2)), new w(p(B, 0, R), p(B, R, 2 * R)));
      }
      static fromDER(B) {
        const { r: R, s: $ } = Ke.toSig(oe("DER", B));
        return new w(R, $);
      }
      assertValidity() {
        if (!b(this.r)) throw new Error("r must be 0 < r < CURVE.n");
        if (!b(this.s)) throw new Error("s must be 0 < s < CURVE.n");
      }
      addRecoveryBit(B) {
        return new w(this.r, this.s, B);
      }
      recoverPublicKey(B) {
        const { r: R, s: $, recovery: M } = this,
          W = I(oe("msgHash", B));
        if (M == null || ![0, 1, 2, 3].includes(M)) throw new Error("recovery id invalid");
        const Y = M === 2 || M === 3 ? R + e.n : R;
        if (Y >= n.ORDER) throw new Error("recovery id 2 or 3 invalid");
        const F = M & 1 ? "03" : "02",
          te = l.fromHex(F + d(Y)),
          le = a(Y),
          Ee = c(-W * le),
          ge = c($ * le),
          ie = l.BASE.multiplyAndAddUnsafe(te, Ee, ge);
        if (!ie) throw new Error("point at infinify");
        return (ie.assertValidity(), ie);
      }
      hasHighS() {
        return g(this.s);
      }
      normalizeS() {
        return this.hasHighS() ? new w(this.r, c(-this.s), this.recovery) : this;
      }
      toDERRawBytes() {
        return Xe(this.toDERHex());
      }
      toDERHex() {
        return Ke.hexFromSig({ r: this.r, s: this.s });
      }
      toCompactRawBytes() {
        return Xe(this.toCompactHex());
      }
      toCompactHex() {
        return d(this.r) + d(this.s);
      }
    }
    const y = {
      isValidPrivateKey(E) {
        try {
          return (f(E), !0);
        } catch {
          return !1;
        }
      },
      normPrivateKeyToScalar: f,
      randomPrivateKey: () => {
        const E = lr(e.n);
        return mi(e.randomBytes(E), e.n);
      },
      precompute(E = 8, B = l.BASE) {
        return (B._setWindowSize(E), B.multiply(BigInt(3)), B);
      },
    };
    function A(E, B = !0) {
      return l.fromPrivateKey(E).toRawBytes(B);
    }
    function O(E) {
      const B = E instanceof Uint8Array,
        R = typeof E == "string",
        $ = (B || R) && E.length;
      return B ? $ === o || $ === i : R ? $ === 2 * o || $ === 2 * i : E instanceof l;
    }
    function L(E, B, R = !0) {
      if (O(E)) throw new Error("first arg must be private key");
      if (!O(B)) throw new Error("second arg must be public key");
      return l.fromHex(B).multiply(f(E)).toRawBytes(R);
    }
    const k =
        e.bits2int ||
        function (E) {
          const B = ae(E),
            R = E.length * 8 - e.nBitLength;
          return R > 0 ? B >> BigInt(R) : B;
        },
      I =
        e.bits2int_modN ||
        function (E) {
          return c(k(E));
        },
      m = an(e.nBitLength);
    function T(E) {
      if (typeof E != "bigint") throw new Error("bigint expected");
      if (!(xe <= E && E < m)) throw new Error(`bigint expected < 2^${e.nBitLength}`);
      return Oe(E, e.nByteLength);
    }
    function S(E, B, R = P) {
      if (["recovered", "canonical"].some((X) => X in R))
        throw new Error("sign() legacy options not supported");
      const { hash: $, randomBytes: M } = e;
      let { lowS: W, prehash: Y, extraEntropy: F } = R;
      (W == null && (W = !0), (E = oe("msgHash", E)), Y && (E = oe("prehashed msgHash", $(E))));
      const te = I(E),
        le = f(B),
        Ee = [T(le), T(te)];
      if (F != null) {
        const X = F === !0 ? M(n.BYTES) : F;
        Ee.push(oe("extraEntropy", X));
      }
      const ge = ze(...Ee),
        ie = te;
      function Fe(X) {
        const pe = k(X);
        if (!b(pe)) return;
        const Me = a(pe),
          Ae = l.BASE.multiply(pe).toAffine(),
          ce = c(Ae.x);
        if (ce === xe) return;
        const he = c(Me * c(ie + ce * le));
        if (he === xe) return;
        let bt = (Ae.x === ce ? 0 : 2) | Number(Ae.y & de),
          gt = he;
        return (W && g(he) && ((gt = h(he)), (bt ^= 1)), new w(ce, gt, bt));
      }
      return { seed: ge, k2sig: Fe };
    }
    const P = { lowS: e.lowS, prehash: !1 },
      V = { lowS: e.lowS, prehash: !1 };
    function z(E, B, R = P) {
      const { seed: $, k2sig: M } = S(E, B, R),
        W = e;
      return or(W.hash.outputLen, W.nByteLength, W.hmac)($, M);
    }
    l.BASE._setWindowSize(8);
    function Z(E, B, R, $ = V) {
      var Ae;
      const M = E;
      if (((B = oe("msgHash", B)), (R = oe("publicKey", R)), "strict" in $))
        throw new Error("options.strict was renamed to lowS");
      const { lowS: W, prehash: Y } = $;
      let F, te;
      try {
        if (typeof M == "string" || M instanceof Uint8Array)
          try {
            F = w.fromDER(M);
          } catch (ce) {
            if (!(ce instanceof Ke.Err)) throw ce;
            F = w.fromCompact(M);
          }
        else if (typeof M == "object" && typeof M.r == "bigint" && typeof M.s == "bigint") {
          const { r: ce, s: he } = M;
          F = new w(ce, he);
        } else throw new Error("PARSE");
        te = l.fromHex(R);
      } catch (ce) {
        if (ce.message === "PARSE")
          throw new Error("signature must be Signature instance, Uint8Array or hex string");
        return !1;
      }
      if (W && F.hasHighS()) return !1;
      Y && (B = e.hash(B));
      const { r: le, s: Ee } = F,
        ge = I(B),
        ie = a(Ee),
        Fe = c(ge * ie),
        X = c(le * ie),
        pe = (Ae = l.BASE.multiplyAndAddUnsafe(te, Fe, X)) == null ? void 0 : Ae.toAffine();
      return pe ? c(pe.x) === le : !1;
    }
    return {
      CURVE: e,
      getPublicKey: A,
      getSharedSecret: L,
      sign: z,
      verify: Z,
      ProjectivePoint: l,
      Signature: w,
      utils: y,
    };
  }
  let dr = class extends Xn {
    constructor(e, n) {
      (super(), (this.finished = !1), (this.destroyed = !1), Wo(e));
      const r = nn(n);
      if (((this.iHash = e.create()), typeof this.iHash.update != "function"))
        throw new Error("Expected instance of class which extends utils.Hash");
      ((this.blockLen = this.iHash.blockLen), (this.outputLen = this.iHash.outputLen));
      const o = this.blockLen,
        i = new Uint8Array(o);
      i.set(r.length > o ? e.create().update(r).digest() : r);
      for (let s = 0; s < i.length; s++) i[s] ^= 54;
      (this.iHash.update(i), (this.oHash = e.create()));
      for (let s = 0; s < i.length; s++) i[s] ^= 106;
      (this.oHash.update(i), i.fill(0));
    }
    update(e) {
      return (_t(this), this.iHash.update(e), this);
    }
    digestInto(e) {
      (_t(this),
        Jn(e, this.outputLen),
        (this.finished = !0),
        this.iHash.digestInto(e),
        this.oHash.update(e),
        this.oHash.digestInto(e),
        this.destroy());
    }
    digest() {
      const e = new Uint8Array(this.oHash.outputLen);
      return (this.digestInto(e), e);
    }
    _cloneInto(e) {
      e || (e = Object.create(Object.getPrototypeOf(this), {}));
      const { oHash: n, iHash: r, finished: o, destroyed: i, blockLen: s, outputLen: c } = this;
      return (
        (e = e),
        (e.finished = o),
        (e.destroyed = i),
        (e.blockLen = s),
        (e.outputLen = c),
        (e.oHash = n._cloneInto(e.oHash)),
        (e.iHash = r._cloneInto(e.iHash)),
        e
      );
    }
    destroy() {
      ((this.destroyed = !0), this.oHash.destroy(), this.iHash.destroy());
    }
  };
  const hr = (t, e, n) => new dr(t, e).update(n).digest();
  hr.create = (t, e) => new dr(t, e);
  /*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */ function Ni(t) {
    return { hash: t, hmac: (e, ...n) => hr(t, e, Vo(...n)), randomBytes: er };
  }
  function Ti(t, e) {
    const n = (r) => Ii({ ...t, ...Ni(r) });
    return Object.freeze({ ...n(e), create: n });
  }
  /*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */ const At = BigInt(
      "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f",
    ),
    It = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141"),
    br = BigInt(1),
    Nt = BigInt(2),
    gr = (t, e) => (t + e / Nt) / e;
  function pr(t) {
    const e = At,
      n = BigInt(3),
      r = BigInt(6),
      o = BigInt(11),
      i = BigInt(22),
      s = BigInt(23),
      c = BigInt(44),
      a = BigInt(88),
      l = (t * t * t) % e,
      f = (l * l * t) % e,
      u = (fe(f, n, e) * f) % e,
      b = (fe(u, n, e) * f) % e,
      d = (fe(b, Nt, e) * l) % e,
      g = (fe(d, o, e) * d) % e,
      h = (fe(g, i, e) * g) % e,
      p = (fe(h, c, e) * h) % e,
      w = (fe(p, a, e) * p) % e,
      y = (fe(w, c, e) * h) % e,
      A = (fe(y, n, e) * f) % e,
      O = (fe(A, s, e) * g) % e,
      L = (fe(O, r, e) * l) % e,
      k = fe(L, Nt, e);
    if (!hn.eql(hn.sqr(k), t)) throw new Error("Cannot find square root");
    return k;
  }
  const hn = yi(At, void 0, void 0, { sqrt: pr }),
    Tt = Ti(
      {
        a: BigInt(0),
        b: BigInt(7),
        Fp: hn,
        n: It,
        Gx: BigInt("55066263022277343669578718895168534326250603453777594175500187360389116729240"),
        Gy: BigInt("32670510020758816978083085130507043184471273380659243275938904335757337482424"),
        h: BigInt(1),
        lowS: !0,
        endo: {
          beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
          splitScalar: (t) => {
            const e = It,
              n = BigInt("0x3086d221a7d46bcde86c90e49284eb15"),
              r = -br * BigInt("0xe4437ed6010e88286f547fa90abfe4c3"),
              o = BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8"),
              i = n,
              s = BigInt("0x100000000000000000000000000000000"),
              c = gr(i * t, e),
              a = gr(-r * t, e);
            let l = re(t - c * n - a * o, e),
              f = re(-c * r - a * i, e);
            const u = l > s,
              b = f > s;
            if ((u && (l = e - l), b && (f = e - f), l > s || f > s))
              throw new Error("splitScalar: Endomorphism failed, k=" + t);
            return { k1neg: u, k1: l, k2neg: b, k2: f };
          },
        },
      },
      rn,
    ),
    Bt = BigInt(0),
    wr = (t) => typeof t == "bigint" && Bt < t && t < At,
    Bi = (t) => typeof t == "bigint" && Bt < t && t < It,
    yr = {};
  function Ot(t, ...e) {
    let n = yr[t];
    if (n === void 0) {
      const r = rn(Uint8Array.from(t, (o) => o.charCodeAt(0)));
      ((n = ze(r, r)), (yr[t] = n));
    }
    return rn(ze(n, ...e));
  }
  const bn = (t) => t.toRawBytes(!0).slice(1),
    gn = (t) => Oe(t, 32),
    pn = (t) => re(t, At),
    dt = (t) => re(t, It),
    wn = Tt.ProjectivePoint,
    Oi = (t, e, n) => wn.BASE.multiplyAndAddUnsafe(t, e, n);
  function yn(t) {
    let e = Tt.utils.normPrivateKeyToScalar(t),
      n = wn.fromPrivateKey(e);
    return { scalar: n.hasEvenY() ? e : dt(-e), bytes: bn(n) };
  }
  function mr(t) {
    if (!wr(t)) throw new Error("bad x: need 0 < x < p");
    const e = pn(t * t),
      n = pn(e * t + BigInt(7));
    let r = pr(n);
    r % Nt !== Bt && (r = pn(-r));
    const o = new wn(t, r, br);
    return (o.assertValidity(), o);
  }
  function vr(...t) {
    return dt(ae(Ot("BIP0340/challenge", ...t)));
  }
  function Pi(t) {
    return yn(t).bytes;
  }
  function Ci(t, e, n = er(32)) {
    const r = oe("message", t),
      { bytes: o, scalar: i } = yn(e),
      s = oe("auxRand", n, 32),
      c = gn(i ^ ae(Ot("BIP0340/aux", s))),
      a = Ot("BIP0340/nonce", c, o, r),
      l = dt(ae(a));
    if (l === Bt) throw new Error("sign failed: k is zero");
    const { bytes: f, scalar: u } = yn(l),
      b = vr(f, o, r),
      d = new Uint8Array(64);
    if ((d.set(f, 0), d.set(gn(dt(u + b * i)), 32), !Er(d, r, o)))
      throw new Error("sign: Invalid signature produced");
    return d;
  }
  function Er(t, e, n) {
    const r = oe("signature", t, 64),
      o = oe("message", e),
      i = oe("publicKey", n, 32);
    try {
      const s = mr(ae(i)),
        c = ae(r.subarray(0, 32));
      if (!wr(c)) return !1;
      const a = ae(r.subarray(32, 64));
      if (!Bi(a)) return !1;
      const l = vr(gn(c), bn(s), o),
        f = Oi(s, a, dt(-l));
      return !(!f || !f.hasEvenY() || f.toAffine().x !== c);
    } catch {
      return !1;
    }
  }
  const se = {
    getPublicKey: Pi,
    sign: Ci,
    verify: Er,
    utils: {
      randomPrivateKey: Tt.utils.randomPrivateKey,
      lift_x: mr,
      pointToBytes: bn,
      numberToBytesBE: Oe,
      bytesToNumberBE: ae,
      taggedHash: Ot,
      mod: re,
    },
  };
  function mn(t) {
    if (!Number.isSafeInteger(t) || t < 0) throw new Error(`Wrong positive integer: ${t}`);
  }
  function Li(t) {
    if (typeof t != "boolean") throw new Error(`Expected boolean, not ${t}`);
  }
  function xr(t, ...e) {
    if (!(t instanceof Uint8Array)) throw new Error("Expected Uint8Array");
    if (e.length > 0 && !e.includes(t.length))
      throw new Error(`Expected Uint8Array of length ${e}, not of length=${t.length}`);
  }
  function Ri(t) {
    if (typeof t != "function" || typeof t.create != "function")
      throw new Error("Hash should be wrapped by utils.wrapConstructor");
    (mn(t.outputLen), mn(t.blockLen));
  }
  function Hi(t, e = !0) {
    if (t.destroyed) throw new Error("Hash instance has been destroyed");
    if (e && t.finished) throw new Error("Hash#digest() has already been called");
  }
  function Ui(t, e) {
    xr(t);
    const n = e.outputLen;
    if (t.length < n) throw new Error(`digestInto() expects output buffer of length at least ${n}`);
  }
  const ve = {
    number: mn,
    bool: Li,
    bytes: xr,
    hash: Ri,
    exists: Hi,
    output: Ui,
  };
  function Mi(t, e, n, r) {
    if (typeof t.setBigUint64 == "function") return t.setBigUint64(e, n, r);
    const o = BigInt(32),
      i = BigInt(4294967295),
      s = Number((n >> o) & i),
      c = Number(n & i),
      a = r ? 4 : 0,
      l = r ? 0 : 4;
    (t.setUint32(e + a, s, r), t.setUint32(e + l, c, r));
  }
  class qi extends Yn {
    constructor(e, n, r, o) {
      (super(),
        (this.blockLen = e),
        (this.outputLen = n),
        (this.padOffset = r),
        (this.isLE = o),
        (this.finished = !1),
        (this.length = 0),
        (this.pos = 0),
        (this.destroyed = !1),
        (this.buffer = new Uint8Array(e)),
        (this.view = Qt(this.buffer)));
    }
    update(e) {
      ve.exists(this);
      const { view: n, buffer: r, blockLen: o } = this;
      e = ut(e);
      const i = e.length;
      for (let s = 0; s < i; ) {
        const c = Math.min(o - this.pos, i - s);
        if (c === o) {
          const a = Qt(e);
          for (; o <= i - s; s += o) this.process(a, s);
          continue;
        }
        (r.set(e.subarray(s, s + c), this.pos),
          (this.pos += c),
          (s += c),
          this.pos === o && (this.process(n, 0), (this.pos = 0)));
      }
      return ((this.length += e.length), this.roundClean(), this);
    }
    digestInto(e) {
      (ve.exists(this), ve.output(e, this), (this.finished = !0));
      const { buffer: n, view: r, blockLen: o, isLE: i } = this;
      let { pos: s } = this;
      ((n[s++] = 128),
        this.buffer.subarray(s).fill(0),
        this.padOffset > o - s && (this.process(r, 0), (s = 0)));
      for (let u = s; u < o; u++) n[u] = 0;
      (Mi(r, o - 8, BigInt(this.length * 8), i), this.process(r, 0));
      const c = Qt(e),
        a = this.outputLen;
      if (a % 4) throw new Error("_sha2: outputLen should be aligned to 32bit");
      const l = a / 4,
        f = this.get();
      if (l > f.length) throw new Error("_sha2: outputLen bigger than state");
      for (let u = 0; u < l; u++) c.setUint32(4 * u, f[u], i);
    }
    digest() {
      const { buffer: e, outputLen: n } = this;
      this.digestInto(e);
      const r = e.slice(0, n);
      return (this.destroy(), r);
    }
    _cloneInto(e) {
      (e || (e = new this.constructor()), e.set(...this.get()));
      const { blockLen: n, buffer: r, length: o, finished: i, destroyed: s, pos: c } = this;
      return (
        (e.length = o),
        (e.pos = c),
        (e.finished = i),
        (e.destroyed = s),
        o % n && e.buffer.set(r),
        e
      );
    }
  }
  const ji = (t, e, n) => (t & e) ^ (~t & n),
    $i = (t, e, n) => (t & e) ^ (t & n) ^ (e & n),
    zi = new Uint32Array([
      1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221,
      3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580,
      3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986,
      2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895,
      666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037,
      2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344,
      430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779,
      1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479,
      3329325298,
    ]),
    Pe = new Uint32Array([
      1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225,
    ]),
    Ce = new Uint32Array(64);
  class _r extends qi {
    constructor() {
      (super(64, 32, 8, !1),
        (this.A = Pe[0] | 0),
        (this.B = Pe[1] | 0),
        (this.C = Pe[2] | 0),
        (this.D = Pe[3] | 0),
        (this.E = Pe[4] | 0),
        (this.F = Pe[5] | 0),
        (this.G = Pe[6] | 0),
        (this.H = Pe[7] | 0));
    }
    get() {
      const { A: e, B: n, C: r, D: o, E: i, F: s, G: c, H: a } = this;
      return [e, n, r, o, i, s, c, a];
    }
    set(e, n, r, o, i, s, c, a) {
      ((this.A = e | 0),
        (this.B = n | 0),
        (this.C = r | 0),
        (this.D = o | 0),
        (this.E = i | 0),
        (this.F = s | 0),
        (this.G = c | 0),
        (this.H = a | 0));
    }
    process(e, n) {
      for (let u = 0; u < 16; u++, n += 4) Ce[u] = e.getUint32(n, !1);
      for (let u = 16; u < 64; u++) {
        const b = Ce[u - 15],
          d = Ce[u - 2],
          g = ye(b, 7) ^ ye(b, 18) ^ (b >>> 3),
          h = ye(d, 17) ^ ye(d, 19) ^ (d >>> 10);
        Ce[u] = (h + Ce[u - 7] + g + Ce[u - 16]) | 0;
      }
      let { A: r, B: o, C: i, D: s, E: c, F: a, G: l, H: f } = this;
      for (let u = 0; u < 64; u++) {
        const b = ye(c, 6) ^ ye(c, 11) ^ ye(c, 25),
          d = (f + b + ji(c, a, l) + zi[u] + Ce[u]) | 0,
          h = ((ye(r, 2) ^ ye(r, 13) ^ ye(r, 22)) + $i(r, o, i)) | 0;
        ((f = l),
          (l = a),
          (a = c),
          (c = (s + d) | 0),
          (s = i),
          (i = o),
          (o = r),
          (r = (d + h) | 0));
      }
      ((r = (r + this.A) | 0),
        (o = (o + this.B) | 0),
        (i = (i + this.C) | 0),
        (s = (s + this.D) | 0),
        (c = (c + this.E) | 0),
        (a = (a + this.F) | 0),
        (l = (l + this.G) | 0),
        (f = (f + this.H) | 0),
        this.set(r, o, i, s, c, a, l, f));
    }
    roundClean() {
      Ce.fill(0);
    }
    destroy() {
      (this.set(0, 0, 0, 0, 0, 0, 0, 0), this.buffer.fill(0));
    }
  }
  class Wi extends _r {
    constructor() {
      (super(),
        (this.A = -1056596264),
        (this.B = 914150663),
        (this.C = 812702999),
        (this.D = -150054599),
        (this.E = -4191439),
        (this.F = 1750603025),
        (this.G = 1694076839),
        (this.H = -1090891868),
        (this.outputLen = 28));
    }
  }
  const et = Gn(() => new _r());
  Gn(() => new Wi());
  var tt = Symbol("verified"),
    Ki = (t) => t instanceof Object;
  function Di(t) {
    if (
      !Ki(t) ||
      typeof t.kind != "number" ||
      typeof t.content != "string" ||
      typeof t.created_at != "number" ||
      typeof t.pubkey != "string" ||
      !t.pubkey.match(/^[a-f0-9]{64}$/) ||
      !Array.isArray(t.tags)
    )
      return !1;
    for (let e = 0; e < t.tags.length; e++) {
      let n = t.tags[e];
      if (!Array.isArray(n)) return !1;
      for (let r = 0; r < n.length; r++) if (typeof n[r] == "object") return !1;
    }
    return !0;
  }
  new TextDecoder("utf-8");
  var Vi = new TextEncoder(),
    Fi = class {
      generateSecretKey() {
        return se.utils.randomPrivateKey();
      }
      getPublicKey(e) {
        return ue(se.getPublicKey(e));
      }
      finalizeEvent(e, n) {
        const r = e;
        return (
          (r.pubkey = ue(se.getPublicKey(n))),
          (r.id = vn(r)),
          (r.sig = ue(se.sign(vn(r), n))),
          (r[tt] = !0),
          r
        );
      }
      verifyEvent(e) {
        if (typeof e[tt] == "boolean") return e[tt];
        const n = vn(e);
        if (n !== e.id) return ((e[tt] = !1), !1);
        try {
          const r = se.verify(e.sig, n, e.pubkey);
          return ((e[tt] = r), r);
        } catch {
          return ((e[tt] = !1), !1);
        }
      }
    };
  function Yi(t) {
    if (!Di(t)) throw new Error("can't serialize event with wrong or missing properties");
    return JSON.stringify([0, t.pubkey, t.created_at, t.kind, t.tags, t.content]);
  }
  function vn(t) {
    let e = et(Vi.encode(Yi(t)));
    return ue(e);
  }
  var Pt = new Fi(),
    Gi = Pt.generateSecretKey,
    kr = Pt.getPublicKey;
  (Pt.finalizeEvent, Pt.verifyEvent);
  var De = Symbol("verified"),
    Zi = (t) => t instanceof Object;
  function Ji(t) {
    if (
      !Zi(t) ||
      typeof t.kind != "number" ||
      typeof t.content != "string" ||
      typeof t.created_at != "number" ||
      typeof t.pubkey != "string" ||
      !t.pubkey.match(/^[a-f0-9]{64}$/) ||
      !Array.isArray(t.tags)
    )
      return !1;
    for (let e = 0; e < t.tags.length; e++) {
      let n = t.tags[e];
      if (!Array.isArray(n)) return !1;
      for (let r = 0; r < n.length; r++) if (typeof n[r] == "object") return !1;
    }
    return !0;
  }
  new TextDecoder("utf-8");
  var Qi = new TextEncoder();
  function nt(t) {
    t.indexOf("://") === -1 && (t = "wss://" + t);
    let e = new URL(t);
    return (
      (e.pathname = e.pathname.replace(/\/+/g, "/")),
      e.pathname.endsWith("/") && (e.pathname = e.pathname.slice(0, -1)),
      ((e.port === "80" && e.protocol === "ws:") || (e.port === "443" && e.protocol === "wss:")) &&
        (e.port = ""),
      e.searchParams.sort(),
      (e.hash = ""),
      e.toString()
    );
  }
  var Xi = class {
      constructor(e) {
        x(this, "value");
        x(this, "next", null);
        x(this, "prev", null);
        this.value = e;
      }
    },
    es = class {
      constructor() {
        x(this, "first");
        x(this, "last");
        ((this.first = null), (this.last = null));
      }
      enqueue(e) {
        const n = new Xi(e);
        return (
          this.last
            ? this.last === this.first
              ? ((this.last = n), (this.last.prev = this.first), (this.first.next = n))
              : ((n.prev = this.last), (this.last.next = n), (this.last = n))
            : ((this.first = n), (this.last = n)),
          !0
        );
      }
      dequeue() {
        if (!this.first) return null;
        if (this.first === this.last) {
          const n = this.first;
          return ((this.first = null), (this.last = null), n.value);
        }
        const e = this.first;
        return ((this.first = e.next), e.value);
      }
    },
    ts = class {
      generateSecretKey() {
        return se.utils.randomPrivateKey();
      }
      getPublicKey(e) {
        return ue(se.getPublicKey(e));
      }
      finalizeEvent(e, n) {
        const r = e;
        return (
          (r.pubkey = ue(se.getPublicKey(n))),
          (r.id = En(r)),
          (r.sig = ue(se.sign(En(r), n))),
          (r[De] = !0),
          r
        );
      }
      verifyEvent(e) {
        if (typeof e[De] == "boolean") return e[De];
        const n = En(e);
        if (n !== e.id) return ((e[De] = !1), !1);
        try {
          const r = se.verify(e.sig, n, e.pubkey);
          return ((e[De] = r), r);
        } catch {
          return ((e[De] = !1), !1);
        }
      }
    };
  function ns(t) {
    if (!Ji(t)) throw new Error("can't serialize event with wrong or missing properties");
    return JSON.stringify([0, t.pubkey, t.created_at, t.kind, t.tags, t.content]);
  }
  function En(t) {
    let e = et(Qi.encode(ns(t)));
    return ue(e);
  }
  var Ct = new ts();
  (Ct.generateSecretKey, Ct.getPublicKey, Ct.finalizeEvent);
  var rs = Ct.verifyEvent,
    os = 22242;
  function is(t, e) {
    if (
      (t.ids && t.ids.indexOf(e.id) === -1) ||
      (t.kinds && t.kinds.indexOf(e.kind) === -1) ||
      (t.authors && t.authors.indexOf(e.pubkey) === -1)
    )
      return !1;
    for (let n in t)
      if (n[0] === "#") {
        let r = n.slice(1),
          o = t[`#${r}`];
        if (o && !e.tags.find(([i, s]) => i === n.slice(1) && o.indexOf(s) !== -1)) return !1;
      }
    return !((t.since && e.created_at < t.since) || (t.until && e.created_at > t.until));
  }
  function ss(t, e) {
    for (let n = 0; n < t.length; n++) if (is(t[n], e)) return !0;
    return !1;
  }
  function cs(t, e) {
    let n = e.length + 3,
      r = t.indexOf(`"${e}":`) + n,
      o = t.slice(r).indexOf('"') + r + 1;
    return t.slice(o, o + 64);
  }
  function as(t) {
    let e = t.slice(0, 22).indexOf('"EVENT"');
    if (e === -1) return null;
    let n = t.slice(e + 7 + 1).indexOf('"');
    if (n === -1) return null;
    let r = e + 7 + 1 + n,
      o = t.slice(r + 1, 80).indexOf('"');
    if (o === -1) return null;
    let i = r + 1 + o;
    return t.slice(r + 1, i);
  }
  function ls(t, e) {
    return {
      kind: os,
      created_at: Math.floor(Date.now() / 1e3),
      tags: [
        ["relay", t],
        ["challenge", e],
      ],
      content: "",
    };
  }
  async function us() {
    return new Promise((t) => {
      const e = new MessageChannel(),
        n = () => {
          (e.port1.removeEventListener("message", n), t());
        };
      (e.port1.addEventListener("message", n), e.port2.postMessage(0), e.port1.start());
    });
  }
  var fs = (t) => ((t[De] = !0), !0),
    Sr = class {
      constructor(e, n) {
        x(this, "url");
        x(this, "_connected", !1);
        x(this, "onclose", null);
        x(this, "onnotice", (e) => console.debug(`NOTICE from ${this.url}: ${e}`));
        x(this, "_onauth", null);
        x(this, "baseEoseTimeout", 4400);
        x(this, "connectionTimeout", 4400);
        x(this, "publishTimeout", 4400);
        x(this, "openSubs", new Map());
        x(this, "connectionTimeoutHandle");
        x(this, "connectionPromise");
        x(this, "openCountRequests", new Map());
        x(this, "openEventPublishes", new Map());
        x(this, "ws");
        x(this, "incomingMessageQueue", new es());
        x(this, "queueRunning", !1);
        x(this, "challenge");
        x(this, "authPromise");
        x(this, "serial", 0);
        x(this, "verifyEvent");
        x(this, "_WebSocket");
        ((this.url = nt(e)),
          (this.verifyEvent = n.verifyEvent),
          (this._WebSocket = n.websocketImplementation || WebSocket));
      }
      static async connect(e, n) {
        const r = new Sr(e, n);
        return (await r.connect(), r);
      }
      closeAllSubscriptions(e) {
        for (let [n, r] of this.openSubs) r.close(e);
        this.openSubs.clear();
        for (let [n, r] of this.openEventPublishes) r.reject(new Error(e));
        this.openEventPublishes.clear();
        for (let [n, r] of this.openCountRequests) r.reject(new Error(e));
        this.openCountRequests.clear();
      }
      get connected() {
        return this._connected;
      }
      async connect() {
        return this.connectionPromise
          ? this.connectionPromise
          : ((this.challenge = void 0),
            (this.authPromise = void 0),
            (this.connectionPromise = new Promise((e, n) => {
              this.connectionTimeoutHandle = setTimeout(() => {
                var r;
                (n("connection timed out"),
                  (this.connectionPromise = void 0),
                  (r = this.onclose) == null || r.call(this),
                  this.closeAllSubscriptions("relay connection timed out"));
              }, this.connectionTimeout);
              try {
                this.ws = new this._WebSocket(this.url);
              } catch (r) {
                n(r);
                return;
              }
              ((this.ws.onopen = () => {
                (clearTimeout(this.connectionTimeoutHandle), (this._connected = !0), e());
              }),
                (this.ws.onerror = (r) => {
                  var o;
                  (n(r.message || "websocket error"),
                    this._connected &&
                      ((this._connected = !1),
                      (this.connectionPromise = void 0),
                      (o = this.onclose) == null || o.call(this),
                      this.closeAllSubscriptions("relay connection errored")));
                }),
                (this.ws.onclose = async () => {
                  var r;
                  this._connected &&
                    ((this._connected = !1),
                    (this.connectionPromise = void 0),
                    (r = this.onclose) == null || r.call(this),
                    this.closeAllSubscriptions("relay connection closed"));
                }),
                (this.ws.onmessage = this._onmessage.bind(this)));
            })),
            this.connectionPromise);
      }
      async runQueue() {
        for (this.queueRunning = !0; this.handleNext() !== !1; ) await us();
        this.queueRunning = !1;
      }
      handleNext() {
        var r, o, i;
        const e = this.incomingMessageQueue.dequeue();
        if (!e) return !1;
        const n = as(e);
        if (n) {
          const s = this.openSubs.get(n);
          if (!s) return;
          const c = cs(e, "id"),
            a = (r = s.alreadyHaveEvent) == null ? void 0 : r.call(s, c);
          if (((o = s.receivedEvent) == null || o.call(s, this, c), a)) return;
        }
        try {
          let s = JSON.parse(e);
          switch (s[0]) {
            case "EVENT": {
              const c = this.openSubs.get(s[1]),
                a = s[2];
              this.verifyEvent(a) && ss(c.filters, a) && c.onevent(a);
              return;
            }
            case "COUNT": {
              const c = s[1],
                a = s[2],
                l = this.openCountRequests.get(c);
              l && (l.resolve(a.count), this.openCountRequests.delete(c));
              return;
            }
            case "EOSE": {
              const c = this.openSubs.get(s[1]);
              if (!c) return;
              c.receivedEose();
              return;
            }
            case "OK": {
              const c = s[1],
                a = s[2],
                l = s[3],
                f = this.openEventPublishes.get(c);
              f &&
                (clearTimeout(f.timeout),
                a ? f.resolve(l) : f.reject(new Error(l)),
                this.openEventPublishes.delete(c));
              return;
            }
            case "CLOSED": {
              const c = s[1],
                a = this.openSubs.get(c);
              if (!a) return;
              ((a.closed = !0), a.close(s[2]));
              return;
            }
            case "NOTICE":
              this.onnotice(s[1]);
              return;
            case "AUTH": {
              ((this.challenge = s[1]),
                (this.authPromise = void 0),
                (i = this._onauth) == null || i.call(this, s[1]));
              return;
            }
          }
        } catch {
          return;
        }
      }
      async send(e) {
        if (!this.connectionPromise) throw new Error("sending on closed connection");
        this.connectionPromise.then(() => {
          var n;
          (n = this.ws) == null || n.send(e);
        });
      }
      async auth(e) {
        if (!this.challenge) throw new Error("can't perform auth, no challenge was received");
        if (this.authPromise) return this.authPromise;
        const n = await e(ls(this.url, this.challenge));
        return (
          (this.authPromise = new Promise((r, o) => {
            const i = setTimeout(() => {
              const s = this.openEventPublishes.get(n.id);
              s && (s.reject(new Error("auth timed out")), this.openEventPublishes.delete(n.id));
            }, this.publishTimeout);
            this.openEventPublishes.set(n.id, {
              resolve: r,
              reject: o,
              timeout: i,
            });
          })),
          this.send('["AUTH",' + JSON.stringify(n) + "]"),
          this.authPromise
        );
      }
      async publish(e) {
        const n = new Promise((r, o) => {
          const i = setTimeout(() => {
            const s = this.openEventPublishes.get(e.id);
            s && (s.reject(new Error("publish timed out")), this.openEventPublishes.delete(e.id));
          }, this.publishTimeout);
          this.openEventPublishes.set(e.id, {
            resolve: r,
            reject: o,
            timeout: i,
          });
        });
        return (this.send('["EVENT",' + JSON.stringify(e) + "]"), n);
      }
      async count(e, n) {
        this.serial++;
        const r = (n == null ? void 0 : n.id) || "count:" + this.serial,
          o = new Promise((i, s) => {
            this.openCountRequests.set(r, { resolve: i, reject: s });
          });
        return (this.send('["COUNT","' + r + '",' + JSON.stringify(e).substring(1)), o);
      }
      subscribe(e, n) {
        const r = this.prepareSubscription(e, n);
        return (r.fire(), r);
      }
      prepareSubscription(e, n) {
        this.serial++;
        const r = n.id || (n.label ? n.label + ":" : "sub:") + this.serial,
          o = new ds(this, r, e, n);
        return (this.openSubs.set(r, o), o);
      }
      close() {
        var e;
        (this.closeAllSubscriptions("relay connection closed by us"),
          (this._connected = !1),
          (e = this.ws) == null || e.close());
      }
      _onmessage(e) {
        (this.incomingMessageQueue.enqueue(e.data), this.queueRunning || this.runQueue());
      }
    },
    ds = class {
      constructor(e, n, r, o) {
        x(this, "relay");
        x(this, "id");
        x(this, "closed", !1);
        x(this, "eosed", !1);
        x(this, "filters");
        x(this, "alreadyHaveEvent");
        x(this, "receivedEvent");
        x(this, "onevent");
        x(this, "oneose");
        x(this, "onclose");
        x(this, "eoseTimeout");
        x(this, "eoseTimeoutHandle");
        ((this.relay = e),
          (this.filters = r),
          (this.id = n),
          (this.alreadyHaveEvent = o.alreadyHaveEvent),
          (this.receivedEvent = o.receivedEvent),
          (this.eoseTimeout = o.eoseTimeout || e.baseEoseTimeout),
          (this.oneose = o.oneose),
          (this.onclose = o.onclose),
          (this.onevent =
            o.onevent ||
            ((i) => {
              console.warn(
                `onevent() callback not defined for subscription '${this.id}' in relay ${this.relay.url}. event received:`,
                i,
              );
            })));
      }
      fire() {
        (this.relay.send('["REQ","' + this.id + '",' + JSON.stringify(this.filters).substring(1)),
          (this.eoseTimeoutHandle = setTimeout(this.receivedEose.bind(this), this.eoseTimeout)));
      }
      receivedEose() {
        var e;
        this.eosed ||
          (clearTimeout(this.eoseTimeoutHandle),
          (this.eosed = !0),
          (e = this.oneose) == null || e.call(this));
      }
      close(e = "closed by caller") {
        var n;
        (!this.closed &&
          this.relay.connected &&
          (this.relay.send('["CLOSE",' + JSON.stringify(this.id) + "]"), (this.closed = !0)),
          this.relay.openSubs.delete(this.id),
          (n = this.onclose) == null || n.call(this, e));
      }
    },
    hs = class {
      constructor(e) {
        x(this, "relays", new Map());
        x(this, "seenOn", new Map());
        x(this, "trackRelays", !1);
        x(this, "verifyEvent");
        x(this, "trustedRelayURLs", new Set());
        x(this, "_WebSocket");
        ((this.verifyEvent = e.verifyEvent), (this._WebSocket = e.websocketImplementation));
      }
      async ensureRelay(e, n) {
        e = nt(e);
        let r = this.relays.get(e);
        return (
          r ||
            ((r = new Sr(e, {
              verifyEvent: this.trustedRelayURLs.has(e) ? fs : this.verifyEvent,
              websocketImplementation: this._WebSocket,
            })),
            n != null && n.connectionTimeout && (r.connectionTimeout = n.connectionTimeout),
            this.relays.set(e, r)),
          await r.connect(),
          r
        );
      }
      close(e) {
        e.map(nt).forEach((n) => {
          var r;
          (r = this.relays.get(n)) == null || r.close();
        });
      }
      subscribe(e, n, r) {
        return this.subscribeMap(
          e.map((o) => ({ url: o, filter: n })),
          r,
        );
      }
      subscribeMany(e, n, r) {
        return this.subscribeMap(
          e.flatMap((o) => n.map((i) => ({ url: o, filter: i }))),
          r,
        );
      }
      subscribeMap(e, n) {
        this.trackRelays &&
          (n.receivedEvent = (u, b) => {
            let d = this.seenOn.get(b);
            (d || ((d = new Set()), this.seenOn.set(b, d)), d.add(u));
          });
        const r = new Set(),
          o = [],
          i = [];
        let s = (u) => {
          var b;
          i[u] ||
            ((i[u] = !0),
            i.filter((d) => d).length === e.length &&
              ((b = n.oneose) == null || b.call(n), (s = () => {})));
        };
        const c = [];
        let a = (u, b) => {
          var d;
          c[u] ||
            (s(u),
            (c[u] = b),
            c.filter((g) => g).length === e.length &&
              ((d = n.onclose) == null || d.call(n, c), (a = () => {})));
        };
        const l = (u) => {
            var d;
            if ((d = n.alreadyHaveEvent) != null && d.call(n, u)) return !0;
            const b = r.has(u);
            return (r.add(u), b);
          },
          f = Promise.all(
            e.map(async ({ url: u, filter: b }, d) => {
              u = nt(u);
              let g;
              try {
                g = await this.ensureRelay(u, {
                  connectionTimeout: n.maxWait
                    ? Math.max(n.maxWait * 0.8, n.maxWait - 1e3)
                    : void 0,
                });
              } catch (p) {
                a(d, (p == null ? void 0 : p.message) || String(p));
                return;
              }
              let h = g.subscribe([b], {
                ...n,
                oneose: () => s(d),
                onclose: (p) => {
                  p.startsWith("auth-required:") && n.doauth
                    ? g
                        .auth(n.doauth)
                        .then(() => {
                          g.subscribe([b], {
                            ...n,
                            oneose: () => s(d),
                            onclose: (w) => {
                              a(d, w);
                            },
                            alreadyHaveEvent: l,
                            eoseTimeout: n.maxWait,
                          });
                        })
                        .catch((w) => {
                          a(d, `auth was required and attempted, but failed with: ${w}`);
                        })
                    : a(d, p);
                },
                alreadyHaveEvent: l,
                eoseTimeout: n.maxWait,
              });
              o.push(h);
            }),
          );
        return {
          async close() {
            (await f,
              o.forEach((u) => {
                u.close();
              }));
          },
        };
      }
      subscribeManyMap(e, n) {
        this.trackRelays &&
          (n.receivedEvent = (b, d) => {
            let g = this.seenOn.get(d);
            (g || ((g = new Set()), this.seenOn.set(d, g)), g.add(b));
          });
        const r = new Set(),
          o = [],
          i = Object.keys(e).length,
          s = [];
        let c = (b) => {
          var d;
          s[b] ||
            ((s[b] = !0),
            s.filter((g) => g).length === i &&
              ((d = n.oneose) == null || d.call(n), (c = () => {})));
        };
        const a = [];
        let l = (b, d) => {
          var g;
          a[b] ||
            (c(b),
            (a[b] = d),
            a.filter((h) => h).length === i &&
              ((g = n.onclose) == null || g.call(n, a), (l = () => {})));
        };
        const f = (b) => {
            var g;
            if ((g = n.alreadyHaveEvent) != null && g.call(n, b)) return !0;
            const d = r.has(b);
            return (r.add(b), d);
          },
          u = Promise.all(
            Object.entries(e).map(async (b, d, g) => {
              if (g.indexOf(b) !== d) {
                l(d, "duplicate url");
                return;
              }
              let [h, p] = b;
              h = nt(h);
              let w;
              try {
                w = await this.ensureRelay(h, {
                  connectionTimeout: n.maxWait
                    ? Math.max(n.maxWait * 0.8, n.maxWait - 1e3)
                    : void 0,
                });
              } catch (A) {
                l(d, (A == null ? void 0 : A.message) || String(A));
                return;
              }
              let y = w.subscribe(p, {
                ...n,
                oneose: () => c(d),
                onclose: (A) => {
                  A.startsWith("auth-required:") && n.doauth
                    ? w
                        .auth(n.doauth)
                        .then(() => {
                          w.subscribe(p, {
                            ...n,
                            oneose: () => c(d),
                            onclose: (O) => {
                              l(d, O);
                            },
                            alreadyHaveEvent: f,
                            eoseTimeout: n.maxWait,
                          });
                        })
                        .catch((O) => {
                          l(d, `auth was required and attempted, but failed with: ${O}`);
                        })
                    : l(d, A);
                },
                alreadyHaveEvent: f,
                eoseTimeout: n.maxWait,
              });
              o.push(y);
            }),
          );
        return {
          async close() {
            (await u,
              o.forEach((b) => {
                b.close();
              }));
          },
        };
      }
      subscribeEose(e, n, r) {
        const o = this.subscribe(e, n, {
          ...r,
          oneose() {
            o.close();
          },
        });
        return o;
      }
      subscribeManyEose(e, n, r) {
        const o = this.subscribeMany(e, n, {
          ...r,
          oneose() {
            o.close();
          },
        });
        return o;
      }
      async querySync(e, n, r) {
        return new Promise(async (o) => {
          const i = [];
          this.subscribeEose(e, n, {
            ...r,
            onevent(s) {
              i.push(s);
            },
            onclose(s) {
              o(i);
            },
          });
        });
      }
      async get(e, n, r) {
        n.limit = 1;
        const o = await this.querySync(e, n, r);
        return (o.sort((i, s) => s.created_at - i.created_at), o[0] || null);
      }
      publish(e, n) {
        return e.map(nt).map(async (r, o, i) => {
          if (i.indexOf(r) !== o) return Promise.reject("duplicate url");
          let s = await this.ensureRelay(r);
          return s.publish(n).then((c) => {
            if (this.trackRelays) {
              let a = this.seenOn.get(n.id);
              (a || ((a = new Set()), this.seenOn.set(n.id, a)), a.add(s));
            }
            return c;
          });
        });
      }
      listConnectionStatus() {
        const e = new Map();
        return (this.relays.forEach((n, r) => e.set(r, n.connected)), e);
      }
      destroy() {
        (this.relays.forEach((e) => e.close()), (this.relays = new Map()));
      }
    },
    Ar;
  try {
    Ar = WebSocket;
  } catch {}
  var bs = class extends hs {
    constructor() {
      super({ verifyEvent: rs, websocketImplementation: Ar });
    }
  };
  function xn(t) {
    if (!Number.isSafeInteger(t) || t < 0) throw new Error(`positive integer expected, not ${t}`);
  }
  function Ir(t) {
    if (typeof t != "boolean") throw new Error(`boolean expected, not ${t}`);
  }
  function gs(t) {
    return (
      t instanceof Uint8Array ||
      (t != null && typeof t == "object" && t.constructor.name === "Uint8Array")
    );
  }
  function Lt(t, ...e) {
    if (!gs(t)) throw new Error("Uint8Array expected");
    if (e.length > 0 && !e.includes(t.length))
      throw new Error(`Uint8Array expected of length ${e}, not of length=${t.length}`);
  }
  /*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) */ const Le = (t) =>
    new Uint32Array(t.buffer, t.byteOffset, Math.floor(t.byteLength / 4));
  if (!(new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68))
    throw new Error("Non little-endian hardware is not supported");
  function ps(t, e) {
    if (e == null || typeof e != "object") throw new Error("options must be defined");
    return Object.assign(t, e);
  }
  function ws(t, e) {
    if (t.length !== e.length) return !1;
    let n = 0;
    for (let r = 0; r < t.length; r++) n |= t[r] ^ e[r];
    return n === 0;
  }
  const Nr = (t) => Uint8Array.from(t.split("").map((e) => e.charCodeAt(0))),
    ys = Nr("expand 16-byte k"),
    ms = Nr("expand 32-byte k"),
    vs = Le(ys),
    Tr = Le(ms);
  Tr.slice();
  function G(t, e) {
    return (t << e) | (t >>> (32 - e));
  }
  function _n(t) {
    return t.byteOffset % 4 === 0;
  }
  const Rt = 64,
    Es = 16,
    Br = 2 ** 32 - 1,
    Or = new Uint32Array();
  function xs(t, e, n, r, o, i, s, c) {
    const a = o.length,
      l = new Uint8Array(Rt),
      f = Le(l),
      u = _n(o) && _n(i),
      b = u ? Le(o) : Or,
      d = u ? Le(i) : Or;
    for (let g = 0; g < a; s++) {
      if ((t(e, n, r, f, s, c), s >= Br)) throw new Error("arx: counter overflow");
      const h = Math.min(Rt, a - g);
      if (u && h === Rt) {
        const p = g / 4;
        if (g % 4 !== 0) throw new Error("arx: invalid block position");
        for (let w = 0, y; w < Es; w++) ((y = p + w), (d[y] = b[y] ^ f[w]));
        g += Rt;
        continue;
      }
      for (let p = 0, w; p < h; p++) ((w = g + p), (i[w] = o[w] ^ l[p]));
      g += h;
    }
  }
  function _s(t, e) {
    const {
      allowShortKeys: n,
      extendNonceFn: r,
      counterLength: o,
      counterRight: i,
      rounds: s,
    } = ps({ allowShortKeys: !1, counterLength: 8, counterRight: !1, rounds: 20 }, e);
    if (typeof t != "function") throw new Error("core must be a function");
    return (
      xn(o),
      xn(s),
      Ir(i),
      Ir(n),
      (c, a, l, f, u = 0) => {
        (Lt(c), Lt(a), Lt(l));
        const b = l.length;
        if ((f || (f = new Uint8Array(b)), Lt(f), xn(u), u < 0 || u >= Br))
          throw new Error("arx: counter overflow");
        if (f.length < b) throw new Error(`arx: output (${f.length}) is shorter than data (${b})`);
        const d = [];
        let g = c.length,
          h,
          p;
        if (g === 32) ((h = c.slice()), d.push(h), (p = Tr));
        else if (g === 16 && n)
          ((h = new Uint8Array(32)), h.set(c), h.set(c, 16), (p = vs), d.push(h));
        else throw new Error(`arx: invalid 32-byte key, got length=${g}`);
        _n(a) || ((a = a.slice()), d.push(a));
        const w = Le(h);
        if (r) {
          if (a.length !== 24) throw new Error("arx: extended nonce must be 24 bytes");
          (r(p, w, Le(a.subarray(0, 16)), w), (a = a.subarray(16)));
        }
        const y = 16 - o;
        if (y !== a.length) throw new Error(`arx: nonce must be ${y} or 16 bytes`);
        if (y !== 12) {
          const O = new Uint8Array(12);
          (O.set(a, i ? 0 : 12 - a.length), (a = O), d.push(a));
        }
        const A = Le(a);
        for (xs(t, p, w, A, l, f, u, s); d.length > 0; ) d.pop().fill(0);
        return f;
      }
    );
  }
  function ks(t, e, n, r, o, i = 20) {
    let s = t[0],
      c = t[1],
      a = t[2],
      l = t[3],
      f = e[0],
      u = e[1],
      b = e[2],
      d = e[3],
      g = e[4],
      h = e[5],
      p = e[6],
      w = e[7],
      y = o,
      A = n[0],
      O = n[1],
      L = n[2],
      k = s,
      I = c,
      m = a,
      T = l,
      S = f,
      P = u,
      V = b,
      z = d,
      Z = g,
      E = h,
      B = p,
      R = w,
      $ = y,
      M = A,
      W = O,
      Y = L;
    for (let te = 0; te < i; te += 2)
      ((k = (k + S) | 0),
        ($ = G($ ^ k, 16)),
        (Z = (Z + $) | 0),
        (S = G(S ^ Z, 12)),
        (k = (k + S) | 0),
        ($ = G($ ^ k, 8)),
        (Z = (Z + $) | 0),
        (S = G(S ^ Z, 7)),
        (I = (I + P) | 0),
        (M = G(M ^ I, 16)),
        (E = (E + M) | 0),
        (P = G(P ^ E, 12)),
        (I = (I + P) | 0),
        (M = G(M ^ I, 8)),
        (E = (E + M) | 0),
        (P = G(P ^ E, 7)),
        (m = (m + V) | 0),
        (W = G(W ^ m, 16)),
        (B = (B + W) | 0),
        (V = G(V ^ B, 12)),
        (m = (m + V) | 0),
        (W = G(W ^ m, 8)),
        (B = (B + W) | 0),
        (V = G(V ^ B, 7)),
        (T = (T + z) | 0),
        (Y = G(Y ^ T, 16)),
        (R = (R + Y) | 0),
        (z = G(z ^ R, 12)),
        (T = (T + z) | 0),
        (Y = G(Y ^ T, 8)),
        (R = (R + Y) | 0),
        (z = G(z ^ R, 7)),
        (k = (k + P) | 0),
        (Y = G(Y ^ k, 16)),
        (B = (B + Y) | 0),
        (P = G(P ^ B, 12)),
        (k = (k + P) | 0),
        (Y = G(Y ^ k, 8)),
        (B = (B + Y) | 0),
        (P = G(P ^ B, 7)),
        (I = (I + V) | 0),
        ($ = G($ ^ I, 16)),
        (R = (R + $) | 0),
        (V = G(V ^ R, 12)),
        (I = (I + V) | 0),
        ($ = G($ ^ I, 8)),
        (R = (R + $) | 0),
        (V = G(V ^ R, 7)),
        (m = (m + z) | 0),
        (M = G(M ^ m, 16)),
        (Z = (Z + M) | 0),
        (z = G(z ^ Z, 12)),
        (m = (m + z) | 0),
        (M = G(M ^ m, 8)),
        (Z = (Z + M) | 0),
        (z = G(z ^ Z, 7)),
        (T = (T + S) | 0),
        (W = G(W ^ T, 16)),
        (E = (E + W) | 0),
        (S = G(S ^ E, 12)),
        (T = (T + S) | 0),
        (W = G(W ^ T, 8)),
        (E = (E + W) | 0),
        (S = G(S ^ E, 7)));
    let F = 0;
    ((r[F++] = (s + k) | 0),
      (r[F++] = (c + I) | 0),
      (r[F++] = (a + m) | 0),
      (r[F++] = (l + T) | 0),
      (r[F++] = (f + S) | 0),
      (r[F++] = (u + P) | 0),
      (r[F++] = (b + V) | 0),
      (r[F++] = (d + z) | 0),
      (r[F++] = (g + Z) | 0),
      (r[F++] = (h + E) | 0),
      (r[F++] = (p + B) | 0),
      (r[F++] = (w + R) | 0),
      (r[F++] = (y + $) | 0),
      (r[F++] = (A + M) | 0),
      (r[F++] = (O + W) | 0),
      (r[F++] = (L + Y) | 0));
  }
  const Pr = _s(ks, { counterRight: !1, counterLength: 4, allowShortKeys: !1 });
  class Cr extends Yn {
    constructor(e, n) {
      (super(), (this.finished = !1), (this.destroyed = !1), ve.hash(e));
      const r = ut(n);
      if (((this.iHash = e.create()), typeof this.iHash.update != "function"))
        throw new Error("Expected instance of class which extends utils.Hash");
      ((this.blockLen = this.iHash.blockLen), (this.outputLen = this.iHash.outputLen));
      const o = this.blockLen,
        i = new Uint8Array(o);
      i.set(r.length > o ? e.create().update(r).digest() : r);
      for (let s = 0; s < i.length; s++) i[s] ^= 54;
      (this.iHash.update(i), (this.oHash = e.create()));
      for (let s = 0; s < i.length; s++) i[s] ^= 106;
      (this.oHash.update(i), i.fill(0));
    }
    update(e) {
      return (ve.exists(this), this.iHash.update(e), this);
    }
    digestInto(e) {
      (ve.exists(this),
        ve.bytes(e, this.outputLen),
        (this.finished = !0),
        this.iHash.digestInto(e),
        this.oHash.update(e),
        this.oHash.digestInto(e),
        this.destroy());
    }
    digest() {
      const e = new Uint8Array(this.oHash.outputLen);
      return (this.digestInto(e), e);
    }
    _cloneInto(e) {
      e || (e = Object.create(Object.getPrototypeOf(this), {}));
      const { oHash: n, iHash: r, finished: o, destroyed: i, blockLen: s, outputLen: c } = this;
      return (
        (e = e),
        (e.finished = o),
        (e.destroyed = i),
        (e.blockLen = s),
        (e.outputLen = c),
        (e.oHash = n._cloneInto(e.oHash)),
        (e.iHash = r._cloneInto(e.iHash)),
        e
      );
    }
    destroy() {
      ((this.destroyed = !0), this.oHash.destroy(), this.iHash.destroy());
    }
  }
  const Ht = (t, e, n) => new Cr(t, e).update(n).digest();
  Ht.create = (t, e) => new Cr(t, e);
  function Ss(t, e, n) {
    return (ve.hash(t), Ht(t, ut(n), ut(e)));
  }
  const kn = new Uint8Array([0]),
    Lr = new Uint8Array();
  function As(t, e, n, r = 32) {
    if ((ve.hash(t), ve.number(r), r > 255 * t.outputLen))
      throw new Error("Length should be <= 255*HashLen");
    const o = Math.ceil(r / t.outputLen);
    n === void 0 && (n = Lr);
    const i = new Uint8Array(o * t.outputLen),
      s = Ht.create(t, e),
      c = s._cloneInto(),
      a = new Uint8Array(s.outputLen);
    for (let l = 0; l < o; l++)
      ((kn[0] = l + 1),
        c
          .update(l === 0 ? Lr : a)
          .update(n)
          .update(kn)
          .digestInto(a),
        i.set(a, t.outputLen * l),
        s._cloneInto(c));
    return (s.destroy(), c.destroy(), a.fill(0), kn.fill(0), i.slice(0, r));
  }
  /*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) */ function rt(t) {
    if (!Number.isSafeInteger(t)) throw new Error(`Wrong integer: ${t}`);
  }
  function _e(...t) {
    const e = (o, i) => (s) => o(i(s)),
      n = Array.from(t)
        .reverse()
        .reduce((o, i) => (o ? e(o, i.encode) : i.encode), void 0),
      r = t.reduce((o, i) => (o ? e(o, i.decode) : i.decode), void 0);
    return { encode: n, decode: r };
  }
  function ke(t) {
    return {
      encode: (e) => {
        if (!Array.isArray(e) || (e.length && typeof e[0] != "number"))
          throw new Error("alphabet.encode input should be an array of numbers");
        return e.map((n) => {
          if ((rt(n), n < 0 || n >= t.length))
            throw new Error(`Digit index outside alphabet: ${n} (alphabet: ${t.length})`);
          return t[n];
        });
      },
      decode: (e) => {
        if (!Array.isArray(e) || (e.length && typeof e[0] != "string"))
          throw new Error("alphabet.decode input should be array of strings");
        return e.map((n) => {
          if (typeof n != "string") throw new Error(`alphabet.decode: not string element=${n}`);
          const r = t.indexOf(n);
          if (r === -1) throw new Error(`Unknown letter: "${n}". Allowed: ${t}`);
          return r;
        });
      },
    };
  }
  function Se(t = "") {
    if (typeof t != "string") throw new Error("join separator should be string");
    return {
      encode: (e) => {
        if (!Array.isArray(e) || (e.length && typeof e[0] != "string"))
          throw new Error("join.encode input should be array of strings");
        for (let n of e)
          if (typeof n != "string") throw new Error(`join.encode: non-string input=${n}`);
        return e.join(t);
      },
      decode: (e) => {
        if (typeof e != "string") throw new Error("join.decode input should be string");
        return e.split(t);
      },
    };
  }
  function Ut(t, e = "=") {
    if ((rt(t), typeof e != "string")) throw new Error("padding chr should be string");
    return {
      encode(n) {
        if (!Array.isArray(n) || (n.length && typeof n[0] != "string"))
          throw new Error("padding.encode input should be array of strings");
        for (let r of n)
          if (typeof r != "string") throw new Error(`padding.encode: non-string input=${r}`);
        for (; (n.length * t) % 8; ) n.push(e);
        return n;
      },
      decode(n) {
        if (!Array.isArray(n) || (n.length && typeof n[0] != "string"))
          throw new Error("padding.encode input should be array of strings");
        for (let o of n)
          if (typeof o != "string") throw new Error(`padding.decode: non-string input=${o}`);
        let r = n.length;
        if ((r * t) % 8)
          throw new Error("Invalid padding: string should have whole number of bytes");
        for (; r > 0 && n[r - 1] === e; r--)
          if (!(((r - 1) * t) % 8)) throw new Error("Invalid padding: string has too much padding");
        return n.slice(0, r);
      },
    };
  }
  function Rr(t) {
    if (typeof t != "function") throw new Error("normalize fn should be function");
    return { encode: (e) => e, decode: (e) => t(e) };
  }
  function Hr(t, e, n) {
    if (e < 2) throw new Error(`convertRadix: wrong from=${e}, base cannot be less than 2`);
    if (n < 2) throw new Error(`convertRadix: wrong to=${n}, base cannot be less than 2`);
    if (!Array.isArray(t)) throw new Error("convertRadix: data should be array");
    if (!t.length) return [];
    let r = 0;
    const o = [],
      i = Array.from(t);
    for (
      i.forEach((s) => {
        if ((rt(s), s < 0 || s >= e)) throw new Error(`Wrong integer: ${s}`);
      });
      ;

    ) {
      let s = 0,
        c = !0;
      for (let a = r; a < i.length; a++) {
        const l = i[a],
          f = e * s + l;
        if (!Number.isSafeInteger(f) || (e * s) / e !== s || f - l !== e * s)
          throw new Error("convertRadix: carry overflow");
        if (
          ((s = f % n),
          (i[a] = Math.floor(f / n)),
          !Number.isSafeInteger(i[a]) || i[a] * n + s !== f)
        )
          throw new Error("convertRadix: carry overflow");
        if (c) i[a] ? (c = !1) : (r = a);
        else continue;
      }
      if ((o.push(s), c)) break;
    }
    for (let s = 0; s < t.length - 1 && t[s] === 0; s++) o.push(0);
    return o.reverse();
  }
  const Ur = (t, e) => (e ? Ur(e, t % e) : t),
    Mt = (t, e) => t + (e - Ur(t, e));
  function Sn(t, e, n, r) {
    if (!Array.isArray(t)) throw new Error("convertRadix2: data should be array");
    if (e <= 0 || e > 32) throw new Error(`convertRadix2: wrong from=${e}`);
    if (n <= 0 || n > 32) throw new Error(`convertRadix2: wrong to=${n}`);
    if (Mt(e, n) > 32)
      throw new Error(`convertRadix2: carry overflow from=${e} to=${n} carryBits=${Mt(e, n)}`);
    let o = 0,
      i = 0;
    const s = 2 ** n - 1,
      c = [];
    for (const a of t) {
      if ((rt(a), a >= 2 ** e)) throw new Error(`convertRadix2: invalid data word=${a} from=${e}`);
      if (((o = (o << e) | a), i + e > 32))
        throw new Error(`convertRadix2: carry overflow pos=${i} from=${e}`);
      for (i += e; i >= n; i -= n) c.push(((o >> (i - n)) & s) >>> 0);
      o &= 2 ** i - 1;
    }
    if (((o = (o << (n - i)) & s), !r && i >= e)) throw new Error("Excess padding");
    if (!r && o) throw new Error(`Non-zero padding: ${o}`);
    return (r && i > 0 && c.push(o >>> 0), c);
  }
  function Is(t) {
    return (
      rt(t),
      {
        encode: (e) => {
          if (!(e instanceof Uint8Array))
            throw new Error("radix.encode input should be Uint8Array");
          return Hr(Array.from(e), 2 ** 8, t);
        },
        decode: (e) => {
          if (!Array.isArray(e) || (e.length && typeof e[0] != "number"))
            throw new Error("radix.decode input should be array of strings");
          return Uint8Array.from(Hr(e, t, 2 ** 8));
        },
      }
    );
  }
  function Re(t, e = !1) {
    if ((rt(t), t <= 0 || t > 32)) throw new Error("radix2: bits should be in (0..32]");
    if (Mt(8, t) > 32 || Mt(t, 8) > 32) throw new Error("radix2: carry overflow");
    return {
      encode: (n) => {
        if (!(n instanceof Uint8Array)) throw new Error("radix2.encode input should be Uint8Array");
        return Sn(Array.from(n), 8, t, !e);
      },
      decode: (n) => {
        if (!Array.isArray(n) || (n.length && typeof n[0] != "number"))
          throw new Error("radix2.decode input should be array of strings");
        return Uint8Array.from(Sn(n, t, 8, e));
      },
    };
  }
  function Mr(t) {
    if (typeof t != "function") throw new Error("unsafeWrapper fn should be function");
    return function (...e) {
      try {
        return t.apply(null, e);
      } catch {}
    };
  }
  const Ns = _e(Re(4), ke("0123456789ABCDEF"), Se("")),
    Ts = _e(Re(5), ke("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"), Ut(5), Se(""));
  (_e(Re(5), ke("0123456789ABCDEFGHIJKLMNOPQRSTUV"), Ut(5), Se("")),
    _e(
      Re(5),
      ke("0123456789ABCDEFGHJKMNPQRSTVWXYZ"),
      Se(""),
      Rr((t) => t.toUpperCase().replace(/O/g, "0").replace(/[IL]/g, "1")),
    ));
  const An = _e(
      Re(6),
      ke("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"),
      Ut(6),
      Se(""),
    ),
    Bs = _e(
      Re(6),
      ke("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"),
      Ut(6),
      Se(""),
    ),
    In = (t) => _e(Is(58), ke(t), Se("")),
    Nn = In("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");
  (In("123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ"),
    In("rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz"));
  const qr = [0, 2, 3, 5, 6, 7, 9, 10, 11],
    Os = {
      encode(t) {
        let e = "";
        for (let n = 0; n < t.length; n += 8) {
          const r = t.subarray(n, n + 8);
          e += Nn.encode(r).padStart(qr[r.length], "1");
        }
        return e;
      },
      decode(t) {
        let e = [];
        for (let n = 0; n < t.length; n += 11) {
          const r = t.slice(n, n + 11),
            o = qr.indexOf(r.length),
            i = Nn.decode(r);
          for (let s = 0; s < i.length - o; s++)
            if (i[s] !== 0) throw new Error("base58xmr: wrong padding");
          e = e.concat(Array.from(i.slice(i.length - o)));
        }
        return Uint8Array.from(e);
      },
    },
    Tn = _e(ke("qpzry9x8gf2tvdw0s3jn54khce6mua7l"), Se("")),
    jr = [996825010, 642813549, 513874426, 1027748829, 705979059];
  function ht(t) {
    const e = t >> 25;
    let n = (t & 33554431) << 5;
    for (let r = 0; r < jr.length; r++) ((e >> r) & 1) === 1 && (n ^= jr[r]);
    return n;
  }
  function $r(t, e, n = 1) {
    const r = t.length;
    let o = 1;
    for (let i = 0; i < r; i++) {
      const s = t.charCodeAt(i);
      if (s < 33 || s > 126) throw new Error(`Invalid prefix (${t})`);
      o = ht(o) ^ (s >> 5);
    }
    o = ht(o);
    for (let i = 0; i < r; i++) o = ht(o) ^ (t.charCodeAt(i) & 31);
    for (let i of e) o = ht(o) ^ i;
    for (let i = 0; i < 6; i++) o = ht(o);
    return ((o ^= n), Tn.encode(Sn([o % 2 ** 30], 30, 5, !1)));
  }
  function zr(t) {
    const e = t === "bech32" ? 1 : 734539939,
      n = Re(5),
      r = n.decode,
      o = n.encode,
      i = Mr(r);
    function s(f, u, b = 90) {
      if (typeof f != "string")
        throw new Error(`bech32.encode prefix should be string, not ${typeof f}`);
      if (!Array.isArray(u) || (u.length && typeof u[0] != "number"))
        throw new Error(`bech32.encode words should be array of numbers, not ${typeof u}`);
      const d = f.length + 7 + u.length;
      if (b !== !1 && d > b) throw new TypeError(`Length ${d} exceeds limit ${b}`);
      return ((f = f.toLowerCase()), `${f}1${Tn.encode(u)}${$r(f, u, e)}`);
    }
    function c(f, u = 90) {
      if (typeof f != "string")
        throw new Error(`bech32.decode input should be string, not ${typeof f}`);
      if (f.length < 8 || (u !== !1 && f.length > u))
        throw new TypeError(`Wrong string length: ${f.length} (${f}). Expected (8..${u})`);
      const b = f.toLowerCase();
      if (f !== b && f !== f.toUpperCase())
        throw new Error("String must be lowercase or uppercase");
      f = b;
      const d = f.lastIndexOf("1");
      if (d === 0 || d === -1)
        throw new Error('Letter "1" must be present between prefix and data only');
      const g = f.slice(0, d),
        h = f.slice(d + 1);
      if (h.length < 6) throw new Error("Data must be at least 6 characters long");
      const p = Tn.decode(h).slice(0, -6),
        w = $r(g, p, e);
      if (!h.endsWith(w)) throw new Error(`Invalid checksum in ${f}: expected "${w}"`);
      return { prefix: g, words: p };
    }
    const a = Mr(c);
    function l(f) {
      const { prefix: u, words: b } = c(f, !1);
      return { prefix: u, words: b, bytes: r(b) };
    }
    return {
      encode: s,
      decode: c,
      decodeToBytes: l,
      decodeUnsafe: a,
      fromWords: r,
      fromWordsUnsafe: i,
      toWords: o,
    };
  }
  const Wr = zr("bech32");
  zr("bech32m");
  const Ps = {
      encode: (t) => new TextDecoder().decode(t),
      decode: (t) => new TextEncoder().encode(t),
    },
    Cs = _e(
      Re(4),
      ke("0123456789abcdef"),
      Se(""),
      Rr((t) => {
        if (typeof t != "string" || t.length % 2)
          throw new TypeError(
            `hex.decode: expected string, got ${typeof t} with length ${t.length}`,
          );
        return t.toLowerCase();
      }),
    );
  `${Object.keys({ utf8: Ps, hex: Cs, base16: Ns, base32: Ts, base64: An, base64url: Bs, base58: Nn, base58xmr: Os }).join(", ")}`;
  var Ve = Symbol("verified"),
    Ls = (t) => t instanceof Object;
  function Rs(t) {
    if (
      !Ls(t) ||
      typeof t.kind != "number" ||
      typeof t.content != "string" ||
      typeof t.created_at != "number" ||
      typeof t.pubkey != "string" ||
      !t.pubkey.match(/^[a-f0-9]{64}$/) ||
      !Array.isArray(t.tags)
    )
      return !1;
    for (let e = 0; e < t.tags.length; e++) {
      let n = t.tags[e];
      if (!Array.isArray(n)) return !1;
      for (let r = 0; r < n.length; r++) if (typeof n[r] == "object") return !1;
    }
    return !0;
  }
  var Hs = new TextDecoder("utf-8"),
    Kr = new TextEncoder();
  function ot(t) {
    t.indexOf("://") === -1 && (t = "wss://" + t);
    let e = new URL(t);
    return (
      (e.pathname = e.pathname.replace(/\/+/g, "/")),
      e.pathname.endsWith("/") && (e.pathname = e.pathname.slice(0, -1)),
      ((e.port === "80" && e.protocol === "ws:") || (e.port === "443" && e.protocol === "wss:")) &&
        (e.port = ""),
      e.searchParams.sort(),
      (e.hash = ""),
      e.toString()
    );
  }
  var Us = class {
      constructor(t) {
        x(this, "value");
        x(this, "next", null);
        x(this, "prev", null);
        this.value = t;
      }
    },
    Ms = class {
      constructor() {
        x(this, "first");
        x(this, "last");
        ((this.first = null), (this.last = null));
      }
      enqueue(t) {
        const e = new Us(t);
        return (
          this.last
            ? this.last === this.first
              ? ((this.last = e), (this.last.prev = this.first), (this.first.next = e))
              : ((e.prev = this.last), (this.last.next = e), (this.last = e))
            : ((this.first = e), (this.last = e)),
          !0
        );
      }
      dequeue() {
        if (!this.first) return null;
        if (this.first === this.last) {
          const e = this.first;
          return ((this.first = null), (this.last = null), e.value);
        }
        const t = this.first;
        return ((this.first = t.next), t.value);
      }
    },
    qs = class {
      generateSecretKey() {
        return se.utils.randomPrivateKey();
      }
      getPublicKey(t) {
        return ue(se.getPublicKey(t));
      }
      finalizeEvent(t, e) {
        const n = t;
        return (
          (n.pubkey = ue(se.getPublicKey(e))),
          (n.id = Bn(n)),
          (n.sig = ue(se.sign(Bn(n), e))),
          (n[Ve] = !0),
          n
        );
      }
      verifyEvent(t) {
        if (typeof t[Ve] == "boolean") return t[Ve];
        const e = Bn(t);
        if (e !== t.id) return ((t[Ve] = !1), !1);
        try {
          const n = se.verify(t.sig, e, t.pubkey);
          return ((t[Ve] = n), n);
        } catch {
          return ((t[Ve] = !1), !1);
        }
      }
    };
  function js(t) {
    if (!Rs(t)) throw new Error("can't serialize event with wrong or missing properties");
    return JSON.stringify([0, t.pubkey, t.created_at, t.kind, t.tags, t.content]);
  }
  function Bn(t) {
    let e = et(Kr.encode(js(t)));
    return ue(e);
  }
  var qt = new qs();
  qt.generateSecretKey;
  var $s = qt.getPublicKey,
    zs = qt.finalizeEvent,
    Dr = qt.verifyEvent,
    Vr = 1,
    Fr = 65535;
  function Ws(t, e) {
    const n = Tt.getSharedSecret(t, "02" + e).subarray(1, 33);
    return Ss(et, n, "nip44-v2");
  }
  function Yr(t, e) {
    const n = As(et, t, e, 76);
    return {
      chacha_key: n.subarray(0, 32),
      chacha_nonce: n.subarray(32, 44),
      hmac_key: n.subarray(44, 76),
    };
  }
  function Gr(t) {
    if (!Number.isSafeInteger(t) || t < 1) throw new Error("expected positive integer");
    if (t <= 32) return 32;
    const e = 1 << (Math.floor(Math.log2(t - 1)) + 1),
      n = e <= 256 ? 32 : e / 8;
    return n * (Math.floor((t - 1) / n) + 1);
  }
  function Ks(t) {
    if (!Number.isSafeInteger(t) || t < Vr || t > Fr)
      throw new Error("invalid plaintext size: must be between 1 and 65535 bytes");
    const e = new Uint8Array(2);
    return (new DataView(e.buffer).setUint16(0, t, !1), e);
  }
  function Ds(t) {
    const e = Kr.encode(t),
      n = e.length,
      r = Ks(n),
      o = new Uint8Array(Gr(n) - n);
    return Xt(r, e, o);
  }
  function Vs(t) {
    const e = new DataView(t.buffer).getUint16(0),
      n = t.subarray(2, 2 + e);
    if (e < Vr || e > Fr || n.length !== e || t.length !== 2 + Gr(e))
      throw new Error("invalid padding");
    return Hs.decode(n);
  }
  function Zr(t, e, n) {
    if (n.length !== 32) throw new Error("AAD associated data must be 32 bytes");
    const r = Xt(n, e);
    return Ht(et, t, r);
  }
  function Fs(t) {
    if (typeof t != "string") throw new Error("payload must be a valid string");
    const e = t.length;
    if (e < 132 || e > 87472) throw new Error("invalid payload length: " + e);
    if (t[0] === "#") throw new Error("unknown encryption version");
    let n;
    try {
      n = An.decode(t);
    } catch (i) {
      throw new Error("invalid base64: " + i.message);
    }
    const r = n.length;
    if (r < 99 || r > 65603) throw new Error("invalid data length: " + r);
    const o = n[0];
    if (o !== 2) throw new Error("unknown encryption version " + o);
    return {
      nonce: n.subarray(1, 33),
      ciphertext: n.subarray(33, -32),
      mac: n.subarray(-32),
    };
  }
  function Ys(t, e, n = zo(32)) {
    const { chacha_key: r, chacha_nonce: o, hmac_key: i } = Yr(e, n),
      s = Ds(t),
      c = Pr(r, o, s),
      a = Zr(i, c, n);
    return An.encode(Xt(new Uint8Array([2]), n, c, a));
  }
  function Gs(t, e) {
    const { nonce: n, ciphertext: r, mac: o } = Fs(t),
      { chacha_key: i, chacha_nonce: s, hmac_key: c } = Yr(e, n),
      a = Zr(c, r, n);
    if (!ws(a, o)) throw new Error("invalid MAC");
    const l = Pr(i, s, r);
    return Vs(l);
  }
  var Zs = /^(?:([\w.+-]+)@)?([\w_-]+(\.[\w_-]+)+)$/,
    Js;
  try {
    Js = fetch;
  } catch {}
  var Qs = 22242,
    Jr = 24133;
  function Xs(t, e) {
    if (
      (t.ids && t.ids.indexOf(e.id) === -1) ||
      (t.kinds && t.kinds.indexOf(e.kind) === -1) ||
      (t.authors && t.authors.indexOf(e.pubkey) === -1)
    )
      return !1;
    for (let n in t)
      if (n[0] === "#") {
        let r = n.slice(1),
          o = t[`#${r}`];
        if (o && !e.tags.find(([i, s]) => i === n.slice(1) && o.indexOf(s) !== -1)) return !1;
      }
    return !((t.since && e.created_at < t.since) || (t.until && e.created_at > t.until));
  }
  function ec(t, e) {
    for (let n = 0; n < t.length; n++) if (Xs(t[n], e)) return !0;
    return !1;
  }
  function tc(t, e) {
    let n = e.length + 3,
      r = t.indexOf(`"${e}":`) + n,
      o = t.slice(r).indexOf('"') + r + 1;
    return t.slice(o, o + 64);
  }
  function nc(t) {
    let e = t.slice(0, 22).indexOf('"EVENT"');
    if (e === -1) return null;
    let n = t.slice(e + 7 + 1).indexOf('"');
    if (n === -1) return null;
    let r = e + 7 + 1 + n,
      o = t.slice(r + 1, 80).indexOf('"');
    if (o === -1) return null;
    let i = r + 1 + o;
    return t.slice(r + 1, i);
  }
  function rc(t, e) {
    return {
      kind: Qs,
      created_at: Math.floor(Date.now() / 1e3),
      tags: [
        ["relay", t],
        ["challenge", e],
      ],
      content: "",
    };
  }
  async function oc() {
    return new Promise((t) => {
      const e = new MessageChannel(),
        n = () => {
          (e.port1.removeEventListener("message", n), t());
        };
      (e.port1.addEventListener("message", n), e.port2.postMessage(0), e.port1.start());
    });
  }
  var ic = (t) => ((t[Ve] = !0), !0),
    Qr = class {
      constructor(t, e) {
        x(this, "url");
        x(this, "_connected", !1);
        x(this, "onclose", null);
        x(this, "onnotice", (t) => console.debug(`NOTICE from ${this.url}: ${t}`));
        x(this, "_onauth", null);
        x(this, "baseEoseTimeout", 4400);
        x(this, "connectionTimeout", 4400);
        x(this, "publishTimeout", 4400);
        x(this, "openSubs", new Map());
        x(this, "connectionTimeoutHandle");
        x(this, "connectionPromise");
        x(this, "openCountRequests", new Map());
        x(this, "openEventPublishes", new Map());
        x(this, "ws");
        x(this, "incomingMessageQueue", new Ms());
        x(this, "queueRunning", !1);
        x(this, "challenge");
        x(this, "authPromise");
        x(this, "serial", 0);
        x(this, "verifyEvent");
        x(this, "_WebSocket");
        ((this.url = ot(t)),
          (this.verifyEvent = e.verifyEvent),
          (this._WebSocket = e.websocketImplementation || WebSocket));
      }
      static async connect(t, e) {
        const n = new Qr(t, e);
        return (await n.connect(), n);
      }
      closeAllSubscriptions(t) {
        for (let [e, n] of this.openSubs) n.close(t);
        this.openSubs.clear();
        for (let [e, n] of this.openEventPublishes) n.reject(new Error(t));
        this.openEventPublishes.clear();
        for (let [e, n] of this.openCountRequests) n.reject(new Error(t));
        this.openCountRequests.clear();
      }
      get connected() {
        return this._connected;
      }
      async connect() {
        return this.connectionPromise
          ? this.connectionPromise
          : ((this.challenge = void 0),
            (this.authPromise = void 0),
            (this.connectionPromise = new Promise((t, e) => {
              this.connectionTimeoutHandle = setTimeout(() => {
                var n;
                (e("connection timed out"),
                  (this.connectionPromise = void 0),
                  (n = this.onclose) == null || n.call(this),
                  this.closeAllSubscriptions("relay connection timed out"));
              }, this.connectionTimeout);
              try {
                this.ws = new this._WebSocket(this.url);
              } catch (n) {
                e(n);
                return;
              }
              ((this.ws.onopen = () => {
                (clearTimeout(this.connectionTimeoutHandle), (this._connected = !0), t());
              }),
                (this.ws.onerror = (n) => {
                  var r;
                  (e(n.message || "websocket error"),
                    this._connected &&
                      ((this._connected = !1),
                      (this.connectionPromise = void 0),
                      (r = this.onclose) == null || r.call(this),
                      this.closeAllSubscriptions("relay connection errored")));
                }),
                (this.ws.onclose = async () => {
                  var n;
                  this._connected &&
                    ((this._connected = !1),
                    (this.connectionPromise = void 0),
                    (n = this.onclose) == null || n.call(this),
                    this.closeAllSubscriptions("relay connection closed"));
                }),
                (this.ws.onmessage = this._onmessage.bind(this)));
            })),
            this.connectionPromise);
      }
      async runQueue() {
        for (this.queueRunning = !0; this.handleNext() !== !1; ) await oc();
        this.queueRunning = !1;
      }
      handleNext() {
        var n, r, o;
        const t = this.incomingMessageQueue.dequeue();
        if (!t) return !1;
        const e = nc(t);
        if (e) {
          const i = this.openSubs.get(e);
          if (!i) return;
          const s = tc(t, "id"),
            c = (n = i.alreadyHaveEvent) == null ? void 0 : n.call(i, s);
          if (((r = i.receivedEvent) == null || r.call(i, this, s), c)) return;
        }
        try {
          let i = JSON.parse(t);
          switch (i[0]) {
            case "EVENT": {
              const s = this.openSubs.get(i[1]),
                c = i[2];
              this.verifyEvent(c) && ec(s.filters, c) && s.onevent(c);
              return;
            }
            case "COUNT": {
              const s = i[1],
                c = i[2],
                a = this.openCountRequests.get(s);
              a && (a.resolve(c.count), this.openCountRequests.delete(s));
              return;
            }
            case "EOSE": {
              const s = this.openSubs.get(i[1]);
              if (!s) return;
              s.receivedEose();
              return;
            }
            case "OK": {
              const s = i[1],
                c = i[2],
                a = i[3],
                l = this.openEventPublishes.get(s);
              l &&
                (clearTimeout(l.timeout),
                c ? l.resolve(a) : l.reject(new Error(a)),
                this.openEventPublishes.delete(s));
              return;
            }
            case "CLOSED": {
              const s = i[1],
                c = this.openSubs.get(s);
              if (!c) return;
              ((c.closed = !0), c.close(i[2]));
              return;
            }
            case "NOTICE":
              this.onnotice(i[1]);
              return;
            case "AUTH": {
              ((this.challenge = i[1]),
                (this.authPromise = void 0),
                (o = this._onauth) == null || o.call(this, i[1]));
              return;
            }
          }
        } catch {
          return;
        }
      }
      async send(t) {
        if (!this.connectionPromise) throw new Error("sending on closed connection");
        this.connectionPromise.then(() => {
          var e;
          (e = this.ws) == null || e.send(t);
        });
      }
      async auth(t) {
        if (!this.challenge) throw new Error("can't perform auth, no challenge was received");
        if (this.authPromise) return this.authPromise;
        const e = await t(rc(this.url, this.challenge));
        return (
          (this.authPromise = new Promise((n, r) => {
            const o = setTimeout(() => {
              const i = this.openEventPublishes.get(e.id);
              i && (i.reject(new Error("auth timed out")), this.openEventPublishes.delete(e.id));
            }, this.publishTimeout);
            this.openEventPublishes.set(e.id, {
              resolve: n,
              reject: r,
              timeout: o,
            });
          })),
          this.send('["AUTH",' + JSON.stringify(e) + "]"),
          this.authPromise
        );
      }
      async publish(t) {
        const e = new Promise((n, r) => {
          const o = setTimeout(() => {
            const i = this.openEventPublishes.get(t.id);
            i && (i.reject(new Error("publish timed out")), this.openEventPublishes.delete(t.id));
          }, this.publishTimeout);
          this.openEventPublishes.set(t.id, {
            resolve: n,
            reject: r,
            timeout: o,
          });
        });
        return (this.send('["EVENT",' + JSON.stringify(t) + "]"), e);
      }
      async count(t, e) {
        this.serial++;
        const n = (e == null ? void 0 : e.id) || "count:" + this.serial,
          r = new Promise((o, i) => {
            this.openCountRequests.set(n, { resolve: o, reject: i });
          });
        return (this.send('["COUNT","' + n + '",' + JSON.stringify(t).substring(1)), r);
      }
      subscribe(t, e) {
        const n = this.prepareSubscription(t, e);
        return (n.fire(), n);
      }
      prepareSubscription(t, e) {
        this.serial++;
        const n = e.id || (e.label ? e.label + ":" : "sub:") + this.serial,
          r = new sc(this, n, t, e);
        return (this.openSubs.set(n, r), r);
      }
      close() {
        var t;
        (this.closeAllSubscriptions("relay connection closed by us"),
          (this._connected = !1),
          (t = this.ws) == null || t.close());
      }
      _onmessage(t) {
        (this.incomingMessageQueue.enqueue(t.data), this.queueRunning || this.runQueue());
      }
    },
    sc = class {
      constructor(t, e, n, r) {
        x(this, "relay");
        x(this, "id");
        x(this, "closed", !1);
        x(this, "eosed", !1);
        x(this, "filters");
        x(this, "alreadyHaveEvent");
        x(this, "receivedEvent");
        x(this, "onevent");
        x(this, "oneose");
        x(this, "onclose");
        x(this, "eoseTimeout");
        x(this, "eoseTimeoutHandle");
        ((this.relay = t),
          (this.filters = n),
          (this.id = e),
          (this.alreadyHaveEvent = r.alreadyHaveEvent),
          (this.receivedEvent = r.receivedEvent),
          (this.eoseTimeout = r.eoseTimeout || t.baseEoseTimeout),
          (this.oneose = r.oneose),
          (this.onclose = r.onclose),
          (this.onevent =
            r.onevent ||
            ((o) => {
              console.warn(
                `onevent() callback not defined for subscription '${this.id}' in relay ${this.relay.url}. event received:`,
                o,
              );
            })));
      }
      fire() {
        (this.relay.send('["REQ","' + this.id + '",' + JSON.stringify(this.filters).substring(1)),
          (this.eoseTimeoutHandle = setTimeout(this.receivedEose.bind(this), this.eoseTimeout)));
      }
      receivedEose() {
        var t;
        this.eosed ||
          (clearTimeout(this.eoseTimeoutHandle),
          (this.eosed = !0),
          (t = this.oneose) == null || t.call(this));
      }
      close(t = "closed by caller") {
        var e;
        (!this.closed &&
          this.relay.connected &&
          (this.relay.send('["CLOSE",' + JSON.stringify(this.id) + "]"), (this.closed = !0)),
          this.relay.openSubs.delete(this.id),
          (e = this.onclose) == null || e.call(this, t));
      }
    },
    cc = class {
      constructor(t) {
        x(this, "relays", new Map());
        x(this, "seenOn", new Map());
        x(this, "trackRelays", !1);
        x(this, "verifyEvent");
        x(this, "trustedRelayURLs", new Set());
        x(this, "_WebSocket");
        ((this.verifyEvent = t.verifyEvent), (this._WebSocket = t.websocketImplementation));
      }
      async ensureRelay(t, e) {
        t = ot(t);
        let n = this.relays.get(t);
        return (
          n ||
            ((n = new Qr(t, {
              verifyEvent: this.trustedRelayURLs.has(t) ? ic : this.verifyEvent,
              websocketImplementation: this._WebSocket,
            })),
            e != null && e.connectionTimeout && (n.connectionTimeout = e.connectionTimeout),
            this.relays.set(t, n)),
          await n.connect(),
          n
        );
      }
      close(t) {
        t.map(ot).forEach((e) => {
          var n;
          (n = this.relays.get(e)) == null || n.close();
        });
      }
      subscribe(t, e, n) {
        return this.subscribeMap(
          t.map((r) => ({ url: r, filter: e })),
          n,
        );
      }
      subscribeMany(t, e, n) {
        return this.subscribeMap(
          t.flatMap((r) => e.map((o) => ({ url: r, filter: o }))),
          n,
        );
      }
      subscribeMap(t, e) {
        this.trackRelays &&
          (e.receivedEvent = (f, u) => {
            let b = this.seenOn.get(u);
            (b || ((b = new Set()), this.seenOn.set(u, b)), b.add(f));
          });
        const n = new Set(),
          r = [],
          o = [];
        let i = (f) => {
          var u;
          o[f] ||
            ((o[f] = !0),
            o.filter((b) => b).length === t.length &&
              ((u = e.oneose) == null || u.call(e), (i = () => {})));
        };
        const s = [];
        let c = (f, u) => {
          var b;
          s[f] ||
            (i(f),
            (s[f] = u),
            s.filter((d) => d).length === t.length &&
              ((b = e.onclose) == null || b.call(e, s), (c = () => {})));
        };
        const a = (f) => {
            var b;
            if ((b = e.alreadyHaveEvent) != null && b.call(e, f)) return !0;
            const u = n.has(f);
            return (n.add(f), u);
          },
          l = Promise.all(
            t.map(async ({ url: f, filter: u }, b) => {
              f = ot(f);
              let d;
              try {
                d = await this.ensureRelay(f, {
                  connectionTimeout: e.maxWait
                    ? Math.max(e.maxWait * 0.8, e.maxWait - 1e3)
                    : void 0,
                });
              } catch (h) {
                c(b, (h == null ? void 0 : h.message) || String(h));
                return;
              }
              let g = d.subscribe([u], {
                ...e,
                oneose: () => i(b),
                onclose: (h) => {
                  h.startsWith("auth-required:") && e.doauth
                    ? d
                        .auth(e.doauth)
                        .then(() => {
                          d.subscribe([u], {
                            ...e,
                            oneose: () => i(b),
                            onclose: (p) => {
                              c(b, p);
                            },
                            alreadyHaveEvent: a,
                            eoseTimeout: e.maxWait,
                          });
                        })
                        .catch((p) => {
                          c(b, `auth was required and attempted, but failed with: ${p}`);
                        })
                    : c(b, h);
                },
                alreadyHaveEvent: a,
                eoseTimeout: e.maxWait,
              });
              r.push(g);
            }),
          );
        return {
          async close() {
            (await l,
              r.forEach((f) => {
                f.close();
              }));
          },
        };
      }
      subscribeManyMap(t, e) {
        this.trackRelays &&
          (e.receivedEvent = (u, b) => {
            let d = this.seenOn.get(b);
            (d || ((d = new Set()), this.seenOn.set(b, d)), d.add(u));
          });
        const n = new Set(),
          r = [],
          o = Object.keys(t).length,
          i = [];
        let s = (u) => {
          var b;
          i[u] ||
            ((i[u] = !0),
            i.filter((d) => d).length === o &&
              ((b = e.oneose) == null || b.call(e), (s = () => {})));
        };
        const c = [];
        let a = (u, b) => {
          var d;
          c[u] ||
            (s(u),
            (c[u] = b),
            c.filter((g) => g).length === o &&
              ((d = e.onclose) == null || d.call(e, c), (a = () => {})));
        };
        const l = (u) => {
            var d;
            if ((d = e.alreadyHaveEvent) != null && d.call(e, u)) return !0;
            const b = n.has(u);
            return (n.add(u), b);
          },
          f = Promise.all(
            Object.entries(t).map(async (u, b, d) => {
              if (d.indexOf(u) !== b) {
                a(b, "duplicate url");
                return;
              }
              let [g, h] = u;
              g = ot(g);
              let p;
              try {
                p = await this.ensureRelay(g, {
                  connectionTimeout: e.maxWait
                    ? Math.max(e.maxWait * 0.8, e.maxWait - 1e3)
                    : void 0,
                });
              } catch (y) {
                a(b, (y == null ? void 0 : y.message) || String(y));
                return;
              }
              let w = p.subscribe(h, {
                ...e,
                oneose: () => s(b),
                onclose: (y) => {
                  y.startsWith("auth-required:") && e.doauth
                    ? p
                        .auth(e.doauth)
                        .then(() => {
                          p.subscribe(h, {
                            ...e,
                            oneose: () => s(b),
                            onclose: (A) => {
                              a(b, A);
                            },
                            alreadyHaveEvent: l,
                            eoseTimeout: e.maxWait,
                          });
                        })
                        .catch((A) => {
                          a(b, `auth was required and attempted, but failed with: ${A}`);
                        })
                    : a(b, y);
                },
                alreadyHaveEvent: l,
                eoseTimeout: e.maxWait,
              });
              r.push(w);
            }),
          );
        return {
          async close() {
            (await f,
              r.forEach((u) => {
                u.close();
              }));
          },
        };
      }
      subscribeEose(t, e, n) {
        const r = this.subscribe(t, e, {
          ...n,
          oneose() {
            r.close();
          },
        });
        return r;
      }
      subscribeManyEose(t, e, n) {
        const r = this.subscribeMany(t, e, {
          ...n,
          oneose() {
            r.close();
          },
        });
        return r;
      }
      async querySync(t, e, n) {
        return new Promise(async (r) => {
          const o = [];
          this.subscribeEose(t, e, {
            ...n,
            onevent(i) {
              o.push(i);
            },
            onclose(i) {
              r(o);
            },
          });
        });
      }
      async get(t, e, n) {
        e.limit = 1;
        const r = await this.querySync(t, e, n);
        return (r.sort((o, i) => i.created_at - o.created_at), r[0] || null);
      }
      publish(t, e) {
        return t.map(ot).map(async (n, r, o) => {
          if (o.indexOf(n) !== r) return Promise.reject("duplicate url");
          let i = await this.ensureRelay(n);
          return i.publish(e).then((s) => {
            if (this.trackRelays) {
              let c = this.seenOn.get(e.id);
              (c || ((c = new Set()), this.seenOn.set(e.id, c)), c.add(i));
            }
            return s;
          });
        });
      }
      listConnectionStatus() {
        const t = new Map();
        return (this.relays.forEach((e, n) => t.set(n, e.connected)), t);
      }
      destroy() {
        (this.relays.forEach((t) => t.close()), (this.relays = new Map()));
      }
    },
    Xr;
  try {
    Xr = WebSocket;
  } catch {}
  var ac = class extends cc {
      constructor() {
        super({ verifyEvent: Dr, websocketImplementation: Xr });
      }
    },
    eo;
  try {
    eo = fetch;
  } catch {}
  var jt = /^bunker:\/\/([0-9a-f]{64})\??([?\/\w:.=&%-]*)$/;
  async function lc(t) {
    let e = t.match(jt);
    if (e)
      try {
        const n = e[1],
          r = new URLSearchParams(e[2]);
        return {
          pubkey: n,
          relays: r.getAll("relay"),
          secret: r.get("secret"),
        };
      } catch {}
    return uc(t);
  }
  async function uc(t) {
    const e = t.match(Zs);
    if (!e) return null;
    const [n, r = "_", o] = e;
    try {
      const i = `https://${o}/.well-known/nostr.json?name=${r}`,
        s = await (await eo(i, { redirect: "error" })).json();
      let c = s.names[r],
        a = s.nip46[c] || [];
      return { pubkey: c, relays: a, secret: null };
    } catch {
      return null;
    }
  }
  var fc = class {
      constructor(t, e, n = {}) {
        x(this, "pool");
        x(this, "subCloser");
        x(this, "isOpen");
        x(this, "serial");
        x(this, "idPrefix");
        x(this, "listeners");
        x(this, "waitingForAuth");
        x(this, "secretKey");
        x(this, "conversationKey");
        x(this, "bp");
        x(this, "cachedPubKey");
        if (e.relays.length === 0) throw new Error("no relays are specified for this bunker");
        ((this.pool = n.pool || new ac()),
          (this.secretKey = t),
          (this.conversationKey = Ws(t, e.pubkey)),
          (this.bp = e),
          (this.isOpen = !1),
          (this.idPrefix = Math.random().toString(36).substring(7)),
          (this.serial = 0),
          (this.listeners = {}),
          (this.waitingForAuth = {}),
          this.setupSubscription(n));
      }
      setupSubscription(t) {
        const e = this.listeners,
          n = this.waitingForAuth,
          r = this.conversationKey;
        ((this.subCloser = this.pool.subscribe(
          this.bp.relays,
          {
            kinds: [Jr],
            authors: [this.bp.pubkey],
            "#p": [$s(this.secretKey)],
          },
          {
            onevent: async (o) => {
              const i = JSON.parse(Gs(o.content, r)),
                { id: s, result: c, error: a } = i;
              if (c === "auth_url" && n[s]) {
                (delete n[s],
                  t.onauth
                    ? t.onauth(a)
                    : console.warn(
                        `nostr-tools/nip46: remote signer ${this.bp.pubkey} tried to send an "auth_url"='${a}' but there was no onauth() callback configured.`,
                      ));
                return;
              }
              let l = e[s];
              l && (a ? l.reject(a) : c && l.resolve(c), delete e[s]);
            },
            onclose: () => {
              this.isOpen && (this.subCloser.close(), this.setupSubscription(t));
            },
          },
        )),
          (this.isOpen = !0));
      }
      async close() {
        ((this.isOpen = !1), this.subCloser.close());
      }
      async sendRequest(t, e) {
        return new Promise(async (n, r) => {
          try {
            if (!this.isOpen) throw new Error("this signer is not open anymore, create a new one");
            this.serial++;
            const o = `${this.idPrefix}-${this.serial}`,
              i = Ys(JSON.stringify({ id: o, method: t, params: e }), this.conversationKey),
              s = zs(
                {
                  kind: Jr,
                  tags: [["p", this.bp.pubkey]],
                  content: i,
                  created_at: Math.floor(Date.now() / 1e3),
                },
                this.secretKey,
              );
            ((this.listeners[o] = { resolve: n, reject: r }),
              (this.waitingForAuth[o] = !0),
              await Promise.any(this.pool.publish(this.bp.relays, s)));
          } catch (o) {
            r(o);
          }
        });
      }
      async ping() {
        let t = await this.sendRequest("ping", []);
        if (t !== "pong") throw new Error(`result is not pong: ${t}`);
      }
      async connect() {
        await this.sendRequest("connect", [this.bp.pubkey, this.bp.secret || ""]);
      }
      async getPublicKey() {
        return (
          this.cachedPubKey || (this.cachedPubKey = await this.sendRequest("get_public_key", [])),
          this.cachedPubKey
        );
      }
      async getRelays() {
        return JSON.parse(await this.sendRequest("get_relays", []));
      }
      async signEvent(t) {
        let e = await this.sendRequest("sign_event", [JSON.stringify(t)]),
          n = JSON.parse(e);
        if (Dr(n)) return n;
        throw new Error(`event returned from bunker is improperly signed: ${JSON.stringify(n)}`);
      }
      async nip04Encrypt(t, e) {
        return await this.sendRequest("nip04_encrypt", [t, e]);
      }
      async nip04Decrypt(t, e) {
        return await this.sendRequest("nip04_decrypt", [t, e]);
      }
      async nip44Encrypt(t, e) {
        return await this.sendRequest("nip44_encrypt", [t, e]);
      }
      async nip44Decrypt(t, e) {
        return await this.sendRequest("nip44_decrypt", [t, e]);
      }
    },
    dc = /^(?:([\w.+-]+)@)?([\w_-]+(\.[\w_-]+)+)$/,
    hc;
  try {
    hc = fetch;
  } catch {}
  (new TextDecoder("utf-8"), new TextEncoder());
  var bc = 5e3;
  function gc(t) {
    return wc("npub", Fn(t));
  }
  function pc(t, e) {
    let n = Wr.toWords(e);
    return Wr.encode(t, n, bc);
  }
  function wc(t, e) {
    return pc(t, e);
  }
  const it = [];
  function yc(t, e = H) {
    let n;
    const r = new Set();
    function o(c) {
      if (zt(t, c) && ((t = c), n)) {
        const a = !it.length;
        for (const l of r) (l[1](), it.push(l, t));
        if (a) {
          for (let l = 0; l < it.length; l += 2) it[l][0](it[l + 1]);
          it.length = 0;
        }
      }
    }
    function i(c) {
      o(c(t));
    }
    function s(c, a = H) {
      const l = [c, a];
      return (
        r.add(l),
        r.size === 1 && (n = e(o, i) || H),
        c(t),
        () => {
          (r.delete(l), r.size === 0 && n && (n(), (n = null)));
        }
      );
    }
    return { set: o, update: i, subscribe: s };
  }
  const mc = (t) => {
    const { subscribe: e, set: n } = yc(void 0, () => {
      const r = window.matchMedia(t);
      n(r.matches);
      const o = () => n(r.matches);
      return (
        r.addEventListener("change", o),
        () => {
          r.removeEventListener("change", o);
        }
      );
    });
    return { subscribe: e };
  };
  function vc(t) {
    let e, n, r;
    return {
      c() {
        ((e = Wt("svg")),
          (n = Wt("circle")),
          (r = Wt("path")),
          _(n, "class", "opacity-25"),
          _(n, "cx", "12"),
          _(n, "cy", "12"),
          _(n, "r", "10"),
          _(n, "stroke", "currentColor"),
          _(n, "stroke-width", "4"),
          _(r, "class", "opacity-75"),
          _(r, "fill", "currentColor"),
          _(
            r,
            "d",
            "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z",
          ),
          _(e, "class", "ml-2 h-5 w-5 animate-spin text-white"),
          _(e, "xmlns", "http://www.w3.org/2000/svg"),
          _(e, "fill", "none"),
          _(e, "viewBox", "0 0 24 24"));
      },
      m(o, i) {
        (q(o, e, i), v(e, n), v(e, r));
      },
      p: H,
      i: H,
      o: H,
      d(o) {
        o && U(e);
      },
    };
  }
  class to extends Dn {
    constructor(e) {
      (super(), Kn(this, e, null, vc, zt, {}));
    }
  }
  const { window: On } = Io;
  function Ec(t) {
    let e,
      n,
      r,
      o,
      i,
      s,
      c,
      a,
      l,
      f,
      u,
      b,
      d = !t[17] && !t[10] && !t[11] && !t[12] && no(t);
    const g = [Bc, Tc, Nc, Ic, Ac, Sc, kc],
      h = [];
    function p(w, y) {
      return w[10] ? 0 : w[11] ? 1 : w[12] ? 2 : w[17] ? 3 : w[15] ? 4 : w[18] ? 6 : 5;
    }
    return (
      (c = p(t)),
      (a = h[c] = g[c](t)),
      {
        c() {
          ((e = C("div")),
            (n = C("button")),
            (r = K("⤫")),
            (i = j()),
            d && d.c(),
            (s = j()),
            a.c(),
            _(
              n,
              "class",
              (o =
                "absolute right-2 top-0 cursor-pointer bg-transparent text-3xl text-" +
                t[0] +
                "-600"),
            ),
            _(
              e,
              "class",
              (l =
                "animate-show rounded-md bg-gradient-to-b px-8 py-8 shadow-[0_0px_30px_0px_rgba(0,0,0,0.6)] transition-all sm:w-96 bg-" +
                t[0] +
                "-800 from-" +
                t[0] +
                "-900 to-" +
                t[0] +
                "-700 " +
                t[23]),
            ));
        },
        m(w, y) {
          (q(w, e, y),
            v(e, n),
            v(n, r),
            v(e, i),
            d && d.m(e, null),
            v(e, s),
            h[c].m(e, null),
            (f = !0),
            u ||
              ((b = ne(n, "click", function () {
                $t(t[17] ? t[29] : t[27]) && (t[17] ? t[29] : t[27]).apply(this, arguments);
              })),
              (u = !0)));
        },
        p(w, y) {
          ((t = w),
            (!f ||
              (y[0] & 1 &&
                o !==
                  (o =
                    "absolute right-2 top-0 cursor-pointer bg-transparent text-3xl text-" +
                    t[0] +
                    "-600"))) &&
              _(n, "class", o),
            !t[17] && !t[10] && !t[11] && !t[12]
              ? d
                ? d.p(t, y)
                : ((d = no(t)), d.c(), d.m(e, s))
              : d && (d.d(1), (d = null)));
          let A = c;
          ((c = p(t)),
            c === A
              ? h[c].p(t, y)
              : (Et(),
                we(h[A], 1, 1, () => {
                  h[A] = null;
                }),
                xt(),
                (a = h[c]),
                a ? a.p(t, y) : ((a = h[c] = g[c](t)), a.c()),
                be(a, 1),
                a.m(e, null)),
            (!f ||
              (y[0] & 8388609 &&
                l !==
                  (l =
                    "animate-show rounded-md bg-gradient-to-b px-8 py-8 shadow-[0_0px_30px_0px_rgba(0,0,0,0.6)] transition-all sm:w-96 bg-" +
                    t[0] +
                    "-800 from-" +
                    t[0] +
                    "-900 to-" +
                    t[0] +
                    "-700 " +
                    t[23]))) &&
              _(e, "class", l));
        },
        i(w) {
          f || (be(a), (f = !0));
        },
        o(w) {
          (we(a), (f = !1));
        },
        d(w) {
          (w && U(e), d && d.d(), h[c].d(), (u = !1), b());
        },
      }
    );
  }
  function xc(t) {
    let e, n, r, o, i;
    const s = [Mc, Uc, Hc, Rc],
      c = [];
    function a(l, f) {
      return l[9] ? 0 : l[18] ? (l[2] ? 3 : 2) : 1;
    }
    return (
      (n = a(t)),
      (r = c[n] = s[n](t)),
      {
        c() {
          ((e = C("div")),
            r.c(),
            _(
              e,
              "class",
              (o =
                "rounded px-2 py-2 shadow-[0_0px_10px_0px_rgba(0,0,0,0.3)] transition-all duration-200 bg-" +
                t[0] +
                "-700 hover:bg-" +
                t[0] +
                "-800 " +
                t[23]),
            ));
        },
        m(l, f) {
          (q(l, e, f), c[n].m(e, null), (i = !0));
        },
        p(l, f) {
          let u = n;
          ((n = a(l)),
            n === u
              ? c[n].p(l, f)
              : (Et(),
                we(c[u], 1, 1, () => {
                  c[u] = null;
                }),
                xt(),
                (r = c[n]),
                r ? r.p(l, f) : ((r = c[n] = s[n](l)), r.c()),
                be(r, 1),
                r.m(e, null)),
            (!i ||
              (f[0] & 8388609 &&
                o !==
                  (o =
                    "rounded px-2 py-2 shadow-[0_0px_10px_0px_rgba(0,0,0,0.3)] transition-all duration-200 bg-" +
                    l[0] +
                    "-700 hover:bg-" +
                    l[0] +
                    "-800 " +
                    l[23]))) &&
              _(e, "class", o));
        },
        i(l) {
          i || (be(r), (i = !0));
        },
        o(l) {
          (we(r), (i = !1));
        },
        d(l) {
          (l && U(e), c[n].d());
        },
      }
    );
  }
  function _c(t) {
    return { c: H, m: H, p: H, i: H, o: H, d: H };
  }
  function no(t) {
    let e, n, r, o, i;
    return {
      c() {
        ((e = C("button")),
          (n = K("?")),
          _(
            e,
            "class",
            (r =
              "absolute bottom-1 right-3 cursor-pointer bg-transparent text-xl text-" +
              t[0] +
              "-600"),
          ));
      },
      m(s, c) {
        (q(s, e, c), v(e, n), o || ((i = ne(e, "click", t[28])), (o = !0)));
      },
      p(s, c) {
        c[0] & 1 &&
          r !==
            (r =
              "absolute bottom-1 right-3 cursor-pointer bg-transparent text-xl text-" +
              s[0] +
              "-600") &&
          _(e, "class", r);
      },
      d(s) {
        (s && U(e), (o = !1), i());
      },
    };
  }
  function kc(t) {
    let e,
      n,
      r,
      o,
      i,
      s,
      c = t[18].npub + "",
      a,
      l,
      f,
      u,
      b = t[25]("Disconnect") + "",
      d,
      g,
      h,
      p,
      w = t[25]("This webpage is using the public key:") + "",
      y,
      A,
      O,
      L = kr(t[8]) + "",
      k,
      I,
      m,
      T = (t[18].picture || t[18].name) && ro(t);
    return {
      c() {
        ((e = C("div")),
          (n = C("div")),
          (n.textContent = `${t[25]("You are connected to Nostr as")}`),
          (r = j()),
          (o = C("a")),
          T && T.c(),
          (i = j()),
          (s = C("div")),
          (a = K(c)),
          (f = j()),
          (u = C("button")),
          (d = K(b)),
          (h = j()),
          (p = C("div")),
          (y = K(w)),
          (A = C("br")),
          (O = j()),
          (k = K(L)),
          _(n, "class", "mb-4 text-sm"),
          _(s, "class", "block break-all"),
          _(o, "target", "_blank"),
          _(o, "href", (l = "https://nosta.me/" + t[18].npub)),
          _(o, "class", "group text-white no-underline"),
          _(e, "class", "text-center"),
          _(
            u,
            "class",
            (g =
              "my-2 mt-6 block w-full cursor-pointer rounded border-0 px-2 py-1 text-lg text-white bg-" +
              t[0] +
              "-900 hover:bg-" +
              t[0] +
              "-950"),
          ),
          _(p, "class", "mt-6 block break-all text-center text-sm"));
      },
      m(S, P) {
        (q(S, e, P),
          v(e, n),
          v(e, r),
          v(e, o),
          T && T.m(o, null),
          v(o, i),
          v(o, s),
          v(s, a),
          q(S, f, P),
          q(S, u, P),
          v(u, d),
          q(S, h, P),
          q(S, p, P),
          v(p, y),
          v(p, A),
          v(p, O),
          v(p, k),
          I || ((m = ne(u, "click", t[31])), (I = !0)));
      },
      p(S, P) {
        (S[18].picture || S[18].name
          ? T
            ? T.p(S, P)
            : ((T = ro(S)), T.c(), T.m(o, i))
          : T && (T.d(1), (T = null)),
          P[0] & 262144 && c !== (c = S[18].npub + "") && Ne(a, c),
          P[0] & 262144 && l !== (l = "https://nosta.me/" + S[18].npub) && _(o, "href", l),
          P[0] & 1 &&
            g !==
              (g =
                "my-2 mt-6 block w-full cursor-pointer rounded border-0 px-2 py-1 text-lg text-white bg-" +
                S[0] +
                "-900 hover:bg-" +
                S[0] +
                "-950") &&
            _(u, "class", g),
          P[0] & 256 && L !== (L = kr(S[8]) + "") && Ne(k, L));
      },
      i: H,
      o: H,
      d(S) {
        (S && (U(e), U(f), U(u), U(h), U(p)), T && T.d(), (I = !1), m());
      },
    };
  }
  function Sc(t) {
    let e,
      n,
      r,
      o,
      i,
      s,
      c,
      a,
      l,
      f,
      u,
      b,
      d,
      g,
      h,
      p,
      w,
      y = t[16] && so(t);
    const A = [Pc, Oc],
      O = [];
    function L(m, T) {
      return m[9] ? 0 : 1;
    }
    ((a = L(t)), (l = O[a] = A[a](t)));
    let k = t[9] && t[13] && co(t),
      I = !t[9] && ao(t);
    return {
      c() {
        ((e = C("div")),
          (e.textContent = `${t[25]("How do you want to connect to Nostr?")}`),
          (n = j()),
          (r = C("form")),
          (o = C("input")),
          (i = j()),
          y && y.c(),
          (s = j()),
          (c = C("button")),
          l.c(),
          (b = j()),
          k && k.c(),
          (d = j()),
          I && I.c(),
          (g = Mn()),
          _(e, "class", "text-center text-lg"),
          _(
            o,
            "class",
            "box-border w-full rounded px-2 py-1 text-lg text-neutral-800 outline-none",
          ),
          _(o, "placeholder", t[25]("user@provider or bunker://...")),
          (o.autofocus = !0),
          (o.disabled = t[9]),
          _(o, "autocapitalize", "none"),
          _(
            c,
            "class",
            (f =
              "mt-4 flex w-full cursor-pointer items-center justify-center rounded border-0 px-2 py-1 text-lg text-white disabled:cursor-default disabled:bg-neutral-400 disabled:text-neutral-200 bg-" +
              t[0] +
              "-900 hover:bg-" +
              t[0] +
              "-950"),
          ),
          (c.disabled = u = !t[22] || t[9]),
          _(r, "class", "mb-1 mt-4 flex flex-col"));
      },
      m(m, T) {
        (q(m, e, T),
          q(m, n, T),
          q(m, r, T),
          v(r, o),
          t[47](o),
          qn(o, t[4]),
          v(r, i),
          y && y.m(r, null),
          v(r, s),
          v(r, c),
          O[a].m(c, null),
          v(r, b),
          k && k.m(r, null),
          q(m, d, T),
          I && I.m(m, T),
          q(m, g, T),
          (h = !0),
          o.focus(),
          p || ((w = [ne(o, "input", t[48]), ne(r, "submit", t[30])]), (p = !0)));
      },
      p(m, T) {
        ((!h || T[0] & 512) && (o.disabled = m[9]),
          T[0] & 16 && o.value !== m[4] && qn(o, m[4]),
          m[16] ? (y ? y.p(m, T) : ((y = so(m)), y.c(), y.m(r, s))) : y && (y.d(1), (y = null)));
        let S = a;
        ((a = L(m)),
          a === S
            ? O[a].p(m, T)
            : (Et(),
              we(O[S], 1, 1, () => {
                O[S] = null;
              }),
              xt(),
              (l = O[a]),
              l ? l.p(m, T) : ((l = O[a] = A[a](m)), l.c()),
              be(l, 1),
              l.m(c, null)),
          (!h ||
            (T[0] & 1 &&
              f !==
                (f =
                  "mt-4 flex w-full cursor-pointer items-center justify-center rounded border-0 px-2 py-1 text-lg text-white disabled:cursor-default disabled:bg-neutral-400 disabled:text-neutral-200 bg-" +
                  m[0] +
                  "-900 hover:bg-" +
                  m[0] +
                  "-950"))) &&
            _(c, "class", f),
          (!h || (T[0] & 4194816 && u !== (u = !m[22] || m[9]))) && (c.disabled = u),
          m[9] && m[13]
            ? k
              ? k.p(m, T)
              : ((k = co(m)), k.c(), k.m(r, null))
            : k && (k.d(1), (k = null)),
          m[9]
            ? I && (I.d(1), (I = null))
            : I
              ? I.p(m, T)
              : ((I = ao(m)), I.c(), I.m(g.parentNode, g)));
      },
      i(m) {
        h || (be(l), (h = !0));
      },
      o(m) {
        (we(l), (h = !1));
      },
      d(m) {
        (m && (U(e), U(n), U(r), U(d), U(g)),
          t[47](null),
          y && y.d(),
          O[a].d(),
          k && k.d(),
          I && I.d(m),
          (p = !1),
          Ie(w));
      },
    };
  }
  function Ac(t) {
    let e,
      n,
      r,
      o,
      i,
      s = t[25]("Create an account »") + "",
      c,
      a,
      l,
      f,
      u = t[25]("Do you already have a Nostr address?") + "",
      b,
      d,
      g,
      h,
      p,
      w;
    return {
      c() {
        ((e = C("div")),
          (e.textContent = `${t[25]("Create a Nostr account")}`),
          (n = j()),
          (r = C("div")),
          (r.textContent = `${t[25]("To use this Nostr app you need a profile. The following button opens a wizard that help you to create your keypair and safely manage it in a few steps. Are you ready?")}`),
          (o = j()),
          (i = C("button")),
          (c = K(s)),
          (l = j()),
          (f = C("div")),
          (b = K(u)),
          (d = C("br")),
          (g = j()),
          (h = C("button")),
          (h.textContent = `${t[25]("Login now")}`),
          _(e, "class", "text-center text-lg"),
          _(r, "class", "mt-4 text-base leading-5"),
          _(
            i,
            "class",
            (a =
              "mt-4 block w-full cursor-pointer rounded border-0 px-2 py-1 text-lg text-white disabled:cursor-default disabled:bg-neutral-400 disabled:text-neutral-200 bg-" +
              t[0] +
              "-900 hover:bg-" +
              t[0] +
              "-950"),
          ),
          (i.disabled = Kc),
          _(h, "class", "cursor-pointer border-0 bg-transparent text-sm text-white underline"),
          _(f, "class", "mt-6 text-center text-sm leading-3"));
      },
      m(y, A) {
        (q(y, e, A),
          q(y, n, A),
          q(y, r, A),
          q(y, o, A),
          q(y, i, A),
          v(i, c),
          q(y, l, A),
          q(y, f, A),
          v(f, b),
          v(f, d),
          v(f, g),
          v(f, h),
          p || ((w = [ne(i, "click", t[38]), ne(h, "click", t[33])]), (p = !0)));
      },
      p(y, A) {
        A[0] & 1 &&
          a !==
            (a =
              "mt-4 block w-full cursor-pointer rounded border-0 px-2 py-1 text-lg text-white disabled:cursor-default disabled:bg-neutral-400 disabled:text-neutral-200 bg-" +
              y[0] +
              "-900 hover:bg-" +
              y[0] +
              "-950") &&
          _(i, "class", a);
      },
      i: H,
      o: H,
      d(y) {
        (y && (U(e), U(n), U(r), U(o), U(i), U(l), U(f)), (p = !1), Ie(w));
      },
    };
  }
  function Ic(t) {
    let e,
      n,
      r,
      o,
      i = t[25]("This widget is created with") + "",
      s,
      c,
      a,
      l =
        t[25](
          ", a small script you can drop in any page that already uses NIP-07 and make it also work with NIP-46 automatically when the user doesn't have an extension installed.",
        ) + "",
      f,
      u,
      b,
      d,
      g =
        t[25](
          "It adds a small floating button on the side of the window that users can use to create Nostr accuonts or connect to their NIP-46 bunkers.",
        ) + "",
      h,
      p,
      w,
      y = t[25]("This tool is opensource, get the code from the") + "",
      A,
      O,
      L,
      k,
      I,
      m,
      T = t[25]("You don't know what Nostr is?") + "",
      S,
      P,
      V,
      z;
    return {
      c() {
        ((e = C("div")),
          (e.textContent = `${t[25]("What is that?")}`),
          (n = j()),
          (r = C("div")),
          (o = C("p")),
          (s = K(i)),
          (c = j()),
          (a = C("i")),
          (a.textContent = "window.nostr.js"),
          (f = K(l)),
          (u = j()),
          (b = C("br")),
          (d = j()),
          (h = K(g)),
          (p = j()),
          (w = C("p")),
          (A = K(y)),
          (O = j()),
          (L = C("a")),
          (L.textContent = `${t[25]("project's page")}`),
          (k = K(".")),
          (I = j()),
          (m = C("p")),
          (S = K(T)),
          (P = j()),
          (V = C("a")),
          (V.textContent = `${t[25]("Learn more")}`),
          (z = K(".")),
          _(e, "class", "text-center text-lg"),
          _(o, "class", "mb mt-4"),
          _(L, "target", "_blank"),
          _(L, "class", "underline"),
          _(L, "href", "https://github.com/fiatjaf/window.nostr.js"),
          _(w, "class", "mt-4"),
          _(V, "target", "_blank"),
          _(V, "class", "underline"),
          _(V, "href", "https://www.nostr.com"),
          _(m, "class", "mt-4"),
          _(r, "class", "text-base leading-5"));
      },
      m(Z, E) {
        (q(Z, e, E),
          q(Z, n, E),
          q(Z, r, E),
          v(r, o),
          v(o, s),
          v(o, c),
          v(o, a),
          v(o, f),
          v(o, u),
          v(o, b),
          v(o, d),
          v(o, h),
          v(r, p),
          v(r, w),
          v(w, A),
          v(w, O),
          v(w, L),
          v(w, k),
          v(r, I),
          v(r, m),
          v(m, S),
          v(m, P),
          v(m, V),
          v(m, z));
      },
      p: H,
      i: H,
      o: H,
      d(Z) {
        Z && (U(e), U(n), U(r));
      },
    };
  }
  function Nc(t) {
    let e,
      n,
      r,
      o,
      i = t[25]("A new window will now open, taking you to") + "",
      s,
      c,
      a,
      l = new URL(t[12]).host + "",
      f,
      u,
      b =
        t[25](
          "where you can approve the current action. If nothing happens, ensure your browser is not blocking popups.",
        ) + "",
      d,
      g,
      h,
      p = t[25]("Afterward, you'll be redirected back to this page.") + "",
      w,
      y,
      A,
      O = t[25]("Confirm action »") + "",
      L,
      k,
      I,
      m;
    return {
      c() {
        ((e = C("div")),
          (n = C("div")),
          (n.textContent = `${t[25]("An action requires your confirmation")}`),
          (r = j()),
          (o = C("div")),
          (s = K(i)),
          (c = j()),
          (a = C("strong")),
          (f = K(l)),
          (u = j()),
          (d = K(b)),
          (g = C("br")),
          (h = j()),
          (w = K(p)),
          (y = j()),
          (A = C("button")),
          (L = K(O)),
          _(n, "class", "text-center text-lg"),
          _(o, "class", "mt-4 text-center text-sm leading-4"),
          _(
            A,
            "class",
            (k =
              "mt-4 block w-full cursor-pointer rounded border-0 px-2 py-1 text-lg text-white disabled:cursor-default disabled:bg-neutral-400 disabled:text-neutral-200 bg-" +
              t[0] +
              "-900 hover:bg-" +
              t[0] +
              "-950"),
          ),
          _(e, "class", "m-auto w-full"));
      },
      m(T, S) {
        (q(T, e, S),
          v(e, n),
          v(e, r),
          v(e, o),
          v(o, s),
          v(o, c),
          v(o, a),
          v(a, f),
          v(o, u),
          v(o, d),
          v(o, g),
          v(o, h),
          v(o, w),
          v(e, y),
          v(e, A),
          v(A, L),
          I || ((m = ne(A, "click", t[46])), (I = !0)));
      },
      p(T, S) {
        (S[0] & 4096 && l !== (l = new URL(T[12]).host + "") && Ne(f, l),
          S[0] & 1 &&
            k !==
              (k =
                "mt-4 block w-full cursor-pointer rounded border-0 px-2 py-1 text-lg text-white disabled:cursor-default disabled:bg-neutral-400 disabled:text-neutral-200 bg-" +
                T[0] +
                "-900 hover:bg-" +
                T[0] +
                "-950") &&
            _(A, "class", k));
      },
      i: H,
      o: H,
      d(T) {
        (T && U(e), (I = !1), m());
      },
    };
  }
  function Tc(t) {
    let e,
      n,
      r,
      o,
      i = t[25]("A new window will now open, taking you to") + "",
      s,
      c,
      a,
      l = new URL(t[11]).host + "",
      f,
      u,
      b =
        t[25](
          "where you can login and approve the permissions. If nothing happens, ensure your browser is not blocking popups.",
        ) + "",
      d,
      g,
      h,
      p,
      w = t[25]("Afterward, you'll be redirected back to this page.") + "",
      y,
      A,
      O,
      L = t[25]("Login now »") + "",
      k,
      I,
      m,
      T;
    return {
      c() {
        ((e = C("div")),
          (n = C("div")),
          (n.textContent = `${t[25]("Login into a Nostr account")}`),
          (r = j()),
          (o = C("div")),
          (s = K(i)),
          (c = j()),
          (a = C("strong")),
          (f = K(l)),
          (u = j()),
          (d = K(b)),
          (g = j()),
          (h = C("br")),
          (p = j()),
          (y = K(w)),
          (A = j()),
          (O = C("button")),
          (k = K(L)),
          _(n, "class", "text-center text-lg"),
          _(o, "class", "mt-4 text-center text-sm leading-4"),
          _(
            O,
            "class",
            (I =
              "mt-4 block w-full cursor-pointer rounded border-0 px-2 py-1 text-lg text-white disabled:cursor-default disabled:bg-neutral-400 disabled:text-neutral-200 bg-" +
              t[0] +
              "-900 hover:bg-" +
              t[0] +
              "-950"),
          ),
          _(e, "class", "m-auto w-full"));
      },
      m(S, P) {
        (q(S, e, P),
          v(e, n),
          v(e, r),
          v(e, o),
          v(o, s),
          v(o, c),
          v(o, a),
          v(a, f),
          v(o, u),
          v(o, d),
          v(o, g),
          v(o, h),
          v(o, p),
          v(o, y),
          v(e, A),
          v(e, O),
          v(O, k),
          m || ((T = ne(O, "click", t[45])), (m = !0)));
      },
      p(S, P) {
        (P[0] & 2048 && l !== (l = new URL(S[11]).host + "") && Ne(f, l),
          P[0] & 1 &&
            I !==
              (I =
                "mt-4 block w-full cursor-pointer rounded border-0 px-2 py-1 text-lg text-white disabled:cursor-default disabled:bg-neutral-400 disabled:text-neutral-200 bg-" +
                S[0] +
                "-900 hover:bg-" +
                S[0] +
                "-950") &&
            _(O, "class", I));
      },
      i: H,
      o: H,
      d(S) {
        (S && U(e), (m = !1), T());
      },
    };
  }
  function Bc(t) {
    let e,
      n,
      r,
      o,
      i = t[25]("A new window will now open, taking you to") + "",
      s,
      c,
      a,
      l = new URL(t[10]).host + "",
      f,
      u,
      b =
        t[25](
          "where the account creation will occur. If nothing happens, ensure your browser is not blocking popups.",
        ) + "",
      d,
      g,
      h,
      p,
      w = t[25]("Afterward, you'll be redirected back to this page.") + "",
      y,
      A,
      O,
      L = t[25]("Start account creation »") + "",
      k,
      I,
      m,
      T;
    return {
      c() {
        ((e = C("div")),
          (n = C("div")),
          (n.textContent = `${t[25]("Create a Nostr account")}`),
          (r = j()),
          (o = C("div")),
          (s = K(i)),
          (c = j()),
          (a = C("strong")),
          (f = K(l)),
          (u = j()),
          (d = K(b)),
          (g = j()),
          (h = C("br")),
          (p = j()),
          (y = K(w)),
          (A = j()),
          (O = C("button")),
          (k = K(L)),
          _(n, "class", "text-center text-lg"),
          _(o, "class", "mt-4 text-center text-sm leading-4"),
          _(
            O,
            "class",
            (I =
              "mt-4 block w-full cursor-pointer rounded border-0 px-2 py-1 text-lg text-white disabled:cursor-default disabled:bg-neutral-400 disabled:text-neutral-200 bg-" +
              t[0] +
              "-900 hover:bg-" +
              t[0] +
              "-950"),
          ),
          _(e, "class", "m-auto w-full"));
      },
      m(S, P) {
        (q(S, e, P),
          v(e, n),
          v(e, r),
          v(e, o),
          v(o, s),
          v(o, c),
          v(o, a),
          v(a, f),
          v(o, u),
          v(o, d),
          v(o, g),
          v(o, h),
          v(o, p),
          v(o, y),
          v(e, A),
          v(e, O),
          v(O, k),
          m || ((T = ne(O, "click", t[44])), (m = !0)));
      },
      p(S, P) {
        (P[0] & 1024 && l !== (l = new URL(S[10]).host + "") && Ne(f, l),
          P[0] & 1 &&
            I !==
              (I =
                "mt-4 block w-full cursor-pointer rounded border-0 px-2 py-1 text-lg text-white disabled:cursor-default disabled:bg-neutral-400 disabled:text-neutral-200 bg-" +
                S[0] +
                "-900 hover:bg-" +
                S[0] +
                "-950") &&
            _(O, "class", I));
      },
      i: H,
      o: H,
      d(S) {
        (S && U(e), (m = !1), T());
      },
    };
  }
  function ro(t) {
    let e,
      n,
      r = t[18].picture && oo(t),
      o = t[18].name && io(t);
    return {
      c() {
        ((e = C("div")),
          r && r.c(),
          (n = j()),
          o && o.c(),
          _(e, "class", "mb-2 flex items-center justify-center gap-2"));
      },
      m(i, s) {
        (q(i, e, s), r && r.m(e, null), v(e, n), o && o.m(e, null));
      },
      p(i, s) {
        (i[18].picture
          ? r
            ? r.p(i, s)
            : ((r = oo(i)), r.c(), r.m(e, n))
          : r && (r.d(1), (r = null)),
          i[18].name
            ? o
              ? o.p(i, s)
              : ((o = io(i)), o.c(), o.m(e, null))
            : o && (o.d(1), (o = null)));
      },
      d(i) {
        (i && U(e), r && r.d(), o && o.d());
      },
    };
  }
  function oo(t) {
    let e, n, r;
    return {
      c() {
        ((e = C("img")),
          Ye(e.src, (n = t[18].picture)) || _(e, "src", n),
          _(e, "alt", ""),
          _(
            e,
            "class",
            (r =
              "h-10 w-10 rounded-full border-2 border-solid border-transparent group-hover:border-" +
              t[0] +
              "-100"),
          ));
      },
      m(o, i) {
        q(o, e, i);
      },
      p(o, i) {
        (i[0] & 262144 && !Ye(e.src, (n = o[18].picture)) && _(e, "src", n),
          i[0] & 1 &&
            r !==
              (r =
                "h-10 w-10 rounded-full border-2 border-solid border-transparent group-hover:border-" +
                o[0] +
                "-100") &&
            _(e, "class", r));
      },
      d(o) {
        o && U(e);
      },
    };
  }
  function io(t) {
    let e,
      n = t[18].name + "",
      r;
    return {
      c() {
        ((e = C("div")),
          (r = K(n)),
          _(e, "class", "text-3xl decoration-2 underline-offset-4 group-hover:underline"));
      },
      m(o, i) {
        (q(o, e, i), v(e, r));
      },
      p(o, i) {
        i[0] & 262144 && n !== (n = o[18].name + "") && Ne(r, n);
      },
      d(o) {
        o && U(e);
      },
    };
  }
  function so(t) {
    let e, n;
    return {
      c() {
        ((e = C("div")),
          (n = K(t[16])),
          _(
            e,
            "class",
            "my-2 rounded bg-yellow-100 p-2 text-center text-sm leading-4 text-red-400",
          ));
      },
      m(r, o) {
        (q(r, e, o), v(e, n));
      },
      p(r, o) {
        o[0] & 65536 && Ne(n, r[16]);
      },
      d(r) {
        r && U(e);
      },
    };
  }
  function Oc(t) {
    let e = t[25]("Connect »") + "",
      n;
    return {
      c() {
        n = K(e);
      },
      m(r, o) {
        q(r, n, o);
      },
      p: H,
      i: H,
      o: H,
      d(r) {
        r && U(n);
      },
    };
  }
  function Pc(t) {
    let e = t[25]("Connecting to bunker") + "",
      n,
      r,
      o,
      i;
    return (
      (o = new to({})),
      {
        c() {
          ((n = K(e)), (r = j()), Wn(o.$$.fragment));
        },
        m(s, c) {
          (q(s, n, c), q(s, r, c), Ft(o, s, c), (i = !0));
        },
        p: H,
        i(s) {
          i || (be(o.$$.fragment, s), (i = !0));
        },
        o(s) {
          (we(o.$$.fragment, s), (i = !1));
        },
        d(s) {
          (s && (U(n), U(r)), Yt(o, s));
        },
      }
    );
  }
  function co(t) {
    let e,
      n = t[25]("Waiting too much?") + "",
      r,
      o,
      i,
      s,
      c;
    return {
      c() {
        ((e = C("div")),
          (r = K(n)),
          (o = j()),
          (i = C("button")),
          (i.textContent = `${t[25]("Cancel the connection")}`),
          _(i, "class", "cursor-pointer border-0 bg-transparent text-sm text-white underline"),
          _(e, "class", "mt-6 text-center text-sm leading-3"));
      },
      m(a, l) {
        (q(a, e, l), v(e, r), v(e, o), v(e, i), s || ((c = ne(i, "click", t[34])), (s = !0)));
      },
      p: H,
      d(a) {
        (a && U(e), (s = !1), c());
      },
    };
  }
  function ao(t) {
    let e;
    function n(i, s) {
      return i[14] ? Lc : Cc;
    }
    let r = n(t),
      o = r(t);
    return {
      c() {
        ((e = C("div")), o.c(), _(e, "class", "mt-6 text-center text-sm leading-3"));
      },
      m(i, s) {
        (q(i, e, s), o.m(e, null));
      },
      p(i, s) {
        r === (r = n(i)) && o ? o.p(i, s) : (o.d(1), (o = r(i)), o && (o.c(), o.m(e, null)));
      },
      d(i) {
        (i && U(e), o.d());
      },
    };
  }
  function Cc(t) {
    let e = t[25]("Do you need a Nostr account?") + "",
      n,
      r,
      o,
      i,
      s,
      c;
    return {
      c() {
        ((n = K(e)),
          (r = C("br")),
          (o = j()),
          (i = C("button")),
          (i.textContent = `${t[25]("Sign up now")}`),
          _(i, "class", "cursor-pointer border-0 bg-transparent text-sm text-white underline"));
      },
      m(a, l) {
        (q(a, n, l),
          q(a, r, l),
          q(a, o, l),
          q(a, i, l),
          s || ((c = ne(i, "click", t[38])), (s = !0)));
      },
      p: H,
      d(a) {
        (a && (U(n), U(r), U(o), U(i)), (s = !1), c());
      },
    };
  }
  function Lc(t) {
    let e = t[25]("Is this bunker provider broken?") + "",
      n,
      r,
      o,
      i,
      s,
      c;
    return {
      c() {
        ((n = K(e)),
          (r = C("br")),
          (o = j()),
          (i = C("button")),
          (i.textContent = `${t[25]("Clear it")}`),
          _(i, "class", "cursor-pointer border-0 bg-transparent text-sm text-white underline"));
      },
      m(a, l) {
        (q(a, n, l),
          q(a, r, l),
          q(a, o, l),
          q(a, i, l),
          s || ((c = ne(i, "click", t[32])), (s = !0)));
      },
      p: H,
      d(a) {
        (a && (U(n), U(r), U(o), U(i)), (s = !1), c());
      },
    };
  }
  function Rc(t) {
    let e, n;
    return {
      c() {
        ((e = C("img")),
          Ye(e.src, (n = t[18].picture)) || _(e, "src", n),
          _(e, "alt", ""),
          _(e, "class", "h-6 w-6 rounded-full"));
      },
      m(r, o) {
        q(r, e, o);
      },
      p(r, o) {
        o[0] & 262144 && !Ye(e.src, (n = r[18].picture)) && _(e, "src", n);
      },
      i: H,
      o: H,
      d(r) {
        r && U(e);
      },
    };
  }
  function Hc(t) {
    let e,
      n,
      r,
      o = (t[18].name || t[18].npub.slice(0, 7) + "…" + t[18].npub.slice(-4)) + "",
      i;
    function s(l, f) {
      return l[18].picture ? jc : qc;
    }
    let c = s(t),
      a = c(t);
    return {
      c() {
        ((e = C("div")),
          a.c(),
          (n = j()),
          (r = C("div")),
          (i = K(o)),
          _(
            r,
            "class",
            "inline-block max-w-56 overflow-hidden overflow-ellipsis whitespace-nowrap",
          ),
          _(e, "class", "flex items-center px-2"));
      },
      m(l, f) {
        (q(l, e, f), a.m(e, null), v(e, n), v(e, r), v(r, i));
      },
      p(l, f) {
        (c === (c = s(l)) && a ? a.p(l, f) : (a.d(1), (a = c(l)), a && (a.c(), a.m(e, n))),
          f[0] & 262144 &&
            o !== (o = (l[18].name || l[18].npub.slice(0, 7) + "…" + l[18].npub.slice(-4)) + "") &&
            Ne(i, o));
      },
      i: H,
      o: H,
      d(l) {
        (l && U(e), a.d());
      },
    };
  }
  function Uc(t) {
    let e;
    function n(i, s) {
      return i[2] ? zc : $c;
    }
    let r = n(t),
      o = r(t);
    return {
      c() {
        (o.c(), (e = Mn()));
      },
      m(i, s) {
        (o.m(i, s), q(i, e, s));
      },
      p(i, s) {
        r === (r = n(i)) && o
          ? o.p(i, s)
          : (o.d(1), (o = r(i)), o && (o.c(), o.m(e.parentNode, e)));
      },
      i: H,
      o: H,
      d(i) {
        (i && U(e), o.d(i));
      },
    };
  }
  function Mc(t) {
    let e,
      n = t[25]("Connecting to bunker") + "",
      r,
      o,
      i,
      s;
    return (
      (i = new to({})),
      {
        c() {
          ((e = C("div")),
            (r = K(n)),
            (o = j()),
            Wn(i.$$.fragment),
            _(e, "class", "flex items-center px-2"));
        },
        m(c, a) {
          (q(c, e, a), v(e, r), v(e, o), Ft(i, e, null), (s = !0));
        },
        p: H,
        i(c) {
          s || (be(i.$$.fragment, c), (s = !0));
        },
        o(c) {
          (we(i.$$.fragment, c), (s = !1));
        },
        d(c) {
          (c && U(e), Yt(i));
        },
      }
    );
  }
  function qc(t) {
    let e;
    return {
      c() {
        ((e = C("span")), (e.textContent = "☉"), _(e, "class", "mr-2"));
      },
      m(n, r) {
        q(n, e, r);
      },
      p: H,
      d(n) {
        n && U(e);
      },
    };
  }
  function jc(t) {
    let e, n;
    return {
      c() {
        ((e = C("img")),
          Ye(e.src, (n = t[18].picture)) || _(e, "src", n),
          _(e, "alt", ""),
          _(e, "class", "mr-2 h-5 w-5 rounded-full"));
      },
      m(r, o) {
        q(r, e, o);
      },
      p(r, o) {
        o[0] & 262144 && !Ye(e.src, (n = r[18].picture)) && _(e, "src", n);
      },
      d(r) {
        r && U(e);
      },
    };
  }
  function $c(t) {
    let e;
    return {
      c() {
        ((e = C("div")),
          (e.textContent = `${t[25]("Connect with Nostr")}`),
          _(e, "class", "flex items-center px-2"));
      },
      m(n, r) {
        q(n, e, r);
      },
      p: H,
      d(n) {
        n && U(e);
      },
    };
  }
  function zc(t) {
    let e;
    return {
      c() {
        ((e = C("div")), (e.textContent = "N"), _(e, "class", "w-6 text-center"));
      },
      m(n, r) {
        q(n, e, r);
      },
      p: H,
      d(n) {
        n && U(e);
      },
    };
  }
  function Wc(t) {
    let e, n, r, o, i, s, c;
    const a = [_c, xc, Ec],
      l = [];
    function f(u, b) {
      return !u[21] && !u[18] && u[1] ? 0 : u[21] ? 2 : 1;
    }
    return (
      (n = f(t)),
      (r = l[n] = a[n](t)),
      {
        c() {
          ((e = C("div")),
            r.c(),
            _(e, "class", "draggable z-[9000] animate-fadein font-sans text-white"),
            _(
              e,
              "style",
              (o =
                "position: fixed; " +
                (t[21] && t[5] ? "width: 100vw;" : "") +
                "; right: " +
                (t[21] && t[5] ? "0" : t[3]) +
                "px; user-select: none; " +
                (t[21] && t[5] ? "bottom: 0px" : t[20] + ":" + t[19] + "px")),
            ),
            jn(e, "cursor-pointer", !t[18] && !t[21]));
        },
        m(u, b) {
          (q(u, e, b),
            l[n].m(e, null),
            t[49](e),
            (i = !0),
            s ||
              ((c = [
                ne(On, "click", t[26]),
                ne(On, "mouseup", t[37]),
                ne(On, "mousemove", t[36]),
                ne(e, "mousedown", t[35]),
              ]),
              (s = !0)));
        },
        p(u, b) {
          let d = n;
          ((n = f(u)),
            n === d
              ? l[n].p(u, b)
              : (Et(),
                we(l[d], 1, 1, () => {
                  l[d] = null;
                }),
                xt(),
                (r = l[n]),
                r ? r.p(u, b) : ((r = l[n] = a[n](u)), r.c()),
                be(r, 1),
                r.m(e, null)),
            (!i ||
              (b[0] & 3670056 &&
                o !==
                  (o =
                    "position: fixed; " +
                    (u[21] && u[5] ? "width: 100vw;" : "") +
                    "; right: " +
                    (u[21] && u[5] ? "0" : u[3]) +
                    "px; user-select: none; " +
                    (u[21] && u[5] ? "bottom: 0px" : u[20] + ":" + u[19] + "px")))) &&
              _(e, "style", o),
            (!i || b[0] & 2359296) && jn(e, "cursor-pointer", !u[18] && !u[21]));
        },
        i(u) {
          i || (be(r), (i = !0));
        },
        o(u) {
          (we(r), (i = !1));
        },
        d(u) {
          (u && U(e), l[n].d(), t[49](null), (s = !1), Ie(c));
        },
      }
    );
  }
  let Kc = !1;
  const He = 20;
  function Pn(t) {
    return window.open(t, "window.nostr", "width=600,height=800,popup=yes");
  }
  function Dc(t, e, n) {
    let r, o, i, s, c, a, l, f;
    const u = window.location.hostname,
      b = window.location.protocol,
      d = mc("only screen and (max-width: 640px)");
    Ao(t, d, (N) => n(5, (f = N)));
    const g = {
      ORIGIN: "wnj:origin",
      CLIENT_SECRET: "wnj:clientSecret",
      Y_POS: "wnj:ypos",
      CALLBACK_TOKEN: "wnj:callbackToken",
      BUNKER_POINTER: "wnj:bunkerPointer",
    };
    let h,
      { accent: p } = e,
      { position: w = "top" } = e,
      { startHidden: y } = e,
      { compactMode: A } = e,
      { texts: O } = e,
      { nstartMeLanguage: L } = e;
    function k(N) {
      const D = O[N];
      return D || (console.warn(`Text not found: ${N}`), N);
    }
    const I = window,
      m = new bs();
    let T, S, P;
    const V = localStorage.getItem(g.CLIENT_SECRET);
    V ? (P = Fn(V)) : ((P = Gi()), localStorage.setItem(g.CLIENT_SECRET, ue(P)));
    let z = "closed",
      Z = !1,
      E,
      B,
      R,
      $,
      M,
      W,
      Y = null,
      F = null,
      te = null,
      le = !1,
      Ee = !1,
      ge,
      ie,
      Fe = !1,
      X,
      pe,
      Me = [],
      { right: Ae = 20 } = e,
      ce = !1,
      he = !1,
      bt,
      gt,
      mo;
    const Gc = {
        pool: m,
        onauth(N) {
          ge ? n(10, (Y = N)) : X ? (n(12, (te = N)), n(42, (z = "opened"))) : n(11, (F = N));
        },
      },
      vo = qo(() => {
        switch (z) {
          case "justopened":
            n(42, (z = "opened"));
            break;
          case "justclosed":
            n(42, (z = "closed"));
            break;
        }
      }, 500);
    function pt() {
      (n(42, (z = "justopened")), vo());
    }
    function wt() {
      (n(42, (z = "justclosed")), vo());
    }
    function st() {
      if (E && !W) {
        Hn();
        return;
      }
      pt();
    }
    Rn();
    let Eo = {
      isWnj: !0,
      async getPublicKey() {
        return new Promise(async (N, D) => {
          Me.push(D);
          try {
            !M && !W && st();
            const J = await (await $).getPublicKey();
            N(J);
          } catch (J) {
            D(J);
          } finally {
            const J = Me.indexOf(D);
            J !== -1 && Me.splice(J, 1);
          }
        });
      },
      async signEvent(N) {
        try {
          return (!M && !W && st(), await (await $).signEvent(N));
        } finally {
          (n(12, (te = null)), wt());
        }
      },
      async getRelays() {
        return {};
      },
      nip04: {
        async encrypt(N, D) {
          return (!M && !W && st(), (await $).nip04Encrypt(N, D));
        },
        async decrypt(N, D) {
          return (!M && !W && st(), (await $).nip04Decrypt(N, D));
        },
      },
      nip44: {
        async encrypt(N, D) {
          return (!M && !W && st(), (await $).nip44Encrypt(N, D));
        },
        async decrypt(N, D) {
          return (!M && !W && st(), (await $).nip44Decrypt(N, D));
        },
      },
    };
    function Rn() {
      (wt(),
        (E = null),
        ($ = new Promise((N, D) => {
          ((B = N), (R = D));
        })),
        n(18, (X = null)),
        n(9, (M = !1)),
        n(13, (le = !1)),
        n(15, (ge = !1)),
        (W = !1),
        (pe = null),
        n(16, (ie = "")));
    }
    Bo(() => {
      const N = window.location.hash;
      if (N.startsWith("#nostr-login=")) {
        const D = N.substring(N.indexOf("=") + 1),
          J = window.location.href.split("#")[0];
        if ((history.replaceState(null, "", J), D.startsWith("bunker://"))) {
          n(4, (S = D));
          const ct = new SubmitEvent("submit", { bubbles: !0, cancelable: !0 });
          ((Z = !0), pt(), xo(ct));
        }
      }
      if (!E) {
        let D = localStorage.getItem(g.BUNKER_POINTER);
        if (D) {
          E = JSON.parse(D);
          let J = new URL(`bunker://${E.pubkey}`);
          (E.relays.forEach((ct) => {
            J.searchParams.append("relay", ct);
          }),
            E.secret && J.searchParams.set("secret", E.secret),
            n(4, (S = J.toString())),
            _o(),
            Hn());
        }
      }
      if (I.nostr && !I.nostr.isWnj) {
        I.destroyWnj();
        return;
      } else
        Object.defineProperty(window, "nostr", {
          get() {
            return Eo;
          },
          set(D) {
            ((Eo = D),
              D.isWnj || I.destroyWnj(),
              Me.forEach((J) => {
                J(new Error("Nostr extension took over, please retry the operation"));
              }),
              (Me = []));
          },
          configurable: !0,
        });
      return () => {
        pe && pe.close();
      };
    });
    function Zc(N) {
      Math.abs(s - gt) > 6 ||
        Date.now() - mo > 600 ||
        z === "justopened" ||
        z === "justclosed" ||
        (N.composedPath().find((D) => D.id === "wnj") ? pt() : wt());
    }
    function Jc(N) {
      (wt(),
        n(15, (ge = !1)),
        n(10, (Y = null)),
        n(11, (F = null)),
        n(12, (te = null)),
        N.stopPropagation());
    }
    function Qc(N) {
      (n(17, (Fe = !0)), N.stopPropagation());
    }
    function Xc(N) {
      (n(17, (Fe = !1)), N.stopPropagation());
    }
    async function xo(N) {
      N.preventDefault();
      try {
        if (((E = await lc(S)), !E)) {
          S.match(jt) ? n(16, (ie = o)) : n(16, (ie = i));
          return;
        }
        (T.setCustomValidity(""), n(16, (ie = "")), await Hn(), _o());
      } catch {
        (S.match(jt) ? n(16, (ie = o)) : n(16, (ie = i)), n(9, (M = !1)));
      }
    }
    async function ea(N) {
      (N.preventDefault(), localStorage.removeItem(g.BUNKER_POINTER), Rn());
    }
    async function ta(N) {
      (N.preventDefault(),
        n(4, (S = "")),
        localStorage.removeItem(g.BUNKER_POINTER),
        n(14, (Ee = !1)));
    }
    function na(N) {
      n(15, (ge = !1));
    }
    function ra() {
      (n(13, (le = !1)), n(9, (M = !1)), R("connection aborted"), Rn(), pt());
    }
    async function Hn(N = void 0) {
      ((N = N || new fc(P, E, Gc)), n(9, (M = !0)));
      let D = setTimeout(() => {
        (n(13, (le = !0)), n(42, (z = "opened")));
      }, 5e3);
      try {
        (await N.connect(),
          (W = !0),
          localStorage.setItem(g.BUNKER_POINTER, JSON.stringify(E)),
          wt(),
          B(N));
      } catch (J) {
        R((J == null ? void 0 : J.message) || String(J));
      } finally {
        (clearTimeout(D),
          n(9, (M = !1)),
          n(13, (le = !1)),
          n(10, (Y = null)),
          n(11, (F = null)),
          n(12, (te = null)),
          Z && pt());
      }
    }
    async function _o() {
      let N;
      try {
        N = await (await $).getPublicKey();
      } catch {
        n(14, (Ee = !0));
        return;
      }
      (n(18, (X = { pubkey: N, npub: gc(N), event: null })),
        (pe = m.subscribeMany(
          ["wss://purplepag.es", "wss://relay.snort.social", "wss://relay.nos.social"],
          [{ kinds: [0], authors: [N] }],
          {
            onevent(D) {
              var J;
              if (!((((J = X.event) == null ? void 0 : J.created_at) || 0) >= D.created_at))
                try {
                  let { name: ct, picture: ba } = JSON.parse(D.content);
                  (n(18, (X.event = D), X), n(18, (X.name = ct), X), n(18, (X.picture = ba), X));
                } catch {}
            },
          },
        )));
    }
    function oa(N) {
      if (c) return;
      ce = !0;
      const D = h.getBoundingClientRect();
      ((bt = N.clientY - D.top), (gt = s), (mo = Date.now()));
    }
    function ia(N) {
      ce &&
        (r === "top" ? n(19, (s = N.clientY)) : n(19, (s = window.innerHeight - N.clientY)),
        n(19, (s -= bt)),
        n(43, (he = !0)),
        s < He && n(19, (s = He)),
        s > window.innerHeight - He && n(19, (s = window.innerHeight - He)));
    }
    function sa() {
      if (
        ((ce = !1),
        setTimeout(() => {
          n(43, (he = !1));
        }, 10),
        he)
      ) {
        const N = h.getBoundingClientRect(),
          D = window.innerHeight,
          J = D / 2;
        (N.top < J
          ? (n(20, (r = "top")), n(19, (s = N.top)))
          : (n(20, (r = "bottom")), n(19, (s = D - N.bottom))),
          s < He && n(19, (s = He)),
          localStorage.setItem(g.ORIGIN, r),
          localStorage.setItem(g.Y_POS, s.toString()));
      }
    }
    function ca() {
      window.location.href = `https://nstart.me/${L}/?an=${u}&at=web&ac=${b}//${u}&sfb=yes`;
    }
    const aa = () => Pn(Y),
      la = () => Pn(F),
      ua = () => {
        Pn(te);
      };
    function fa(N) {
      mt[N ? "unshift" : "push"](() => {
        ((T = N), n(7, T));
      });
    }
    function da() {
      ((S = this.value), n(4, S));
    }
    function ha(N) {
      mt[N ? "unshift" : "push"](() => {
        ((h = N), n(6, h));
      });
    }
    return (
      (t.$$set = (N) => {
        ("accent" in N && n(0, (p = N.accent)),
          "position" in N && n(39, (w = N.position)),
          "startHidden" in N && n(1, (y = N.startHidden)),
          "compactMode" in N && n(2, (A = N.compactMode)),
          "texts" in N && n(40, (O = N.texts)),
          "nstartMeLanguage" in N && n(41, (L = N.nstartMeLanguage)),
          "right" in N && n(3, (Ae = N.right)));
      }),
      (t.$$.update = () => {
        ((t.$$.dirty[0] & 32) | (t.$$.dirty[1] & 256) &&
          n(20, (r = f ? "bottom" : localStorage.getItem(g.ORIGIN) || w)),
          t.$$.dirty[0] & 32 &&
            n(19, (s = f ? He : parseInt(localStorage.getItem(g.Y_POS) || "0") || He)),
          t.$$.dirty[1] & 2048 && n(21, (c = z === "justopened" || z === "opened")),
          (t.$$.dirty[0] & 1) | (t.$$.dirty[1] & 4096) &&
            n(
              23,
              (a = he
                ? "cursor-grabbing outline-dashed outline-" + p + "-500 outline-1 outline-offset-4"
                : "outline-none"),
            ),
          t.$$.dirty[0] & 16 && n(22, (l = S && (S.match(jt) || S.match(dc)))));
      }),
      (o = k(
        "We could not connect to a NIP-46 bunker with that url, are you sure it is set up correctly?",
      )),
      (i = k(
        "We were not able to connect using this address. For it to work it has to come from a NIP-46 provider.",
      )),
      [
        p,
        y,
        A,
        Ae,
        S,
        f,
        h,
        T,
        P,
        M,
        Y,
        F,
        te,
        le,
        Ee,
        ge,
        ie,
        Fe,
        X,
        s,
        r,
        c,
        l,
        a,
        d,
        k,
        Zc,
        Jc,
        Qc,
        Xc,
        xo,
        ea,
        ta,
        na,
        ra,
        oa,
        ia,
        sa,
        ca,
        w,
        O,
        L,
        z,
        he,
        aa,
        la,
        ua,
        fa,
        da,
        ha,
      ]
    );
  }
  class Vc extends Dn {
    constructor(e) {
      (super(),
        Kn(
          this,
          e,
          Dc,
          Wc,
          zt,
          {
            accent: 0,
            position: 39,
            startHidden: 1,
            compactMode: 2,
            texts: 40,
            nstartMeLanguage: 41,
            right: 3,
          },
          null,
          [-1, -1, -1],
        ));
    }
  }
  const Fc = {
      "Connect with Nostr": "Connect with Nostr",
      "Connecting to bunker": "Connecting to bunker",
      "Create a Nostr account": "Create a Nostr account",
      "A new window will now open, taking you to": "A new window will now open, taking you to",
      "where the account creation will occur. If nothing happens, ensure your browser is not blocking popups.":
        "where the account creation will occur. If nothing happens, ensure your browser is not blocking popups.",
      "Afterward, you'll be redirected back to this page.":
        "Afterward, you'll be redirected back to this page.",
      "Start account creation »": "Start account creation »",
      "To use this Nostr app you need a profile. The following button opens a wizard that help you to create your keypair and safely manage it in a few steps. Are you ready?":
        "To use this Nostr app you need a profile. The following button opens a wizard that help you to create your keypair and safely manage it in a few steps. Are you ready?",
      "Create an account »": "Create an account »",
      "Do you already have a Nostr address?": "Do you already have a Nostr address?",
      "Login now": "Login now",
      "Login into a Nostr account": "Login into a Nostr account",
      "where you can login and approve the permissions. If nothing happens, ensure your browser is not blocking popups.":
        "where you can login and approve the permissions. If nothing happens, ensure your browser is not blocking popups.",
      "Login now »": "Login now »",
      "How do you want to connect to Nostr?": "How do you want to connect to Nostr?",
      "user@provider or bunker://...": "user@provider or bunker://...",
      "Connect »": "Connect »",
      "An action requires your confirmation": "An action requires your confirmation",
      "where you can approve the current action. If nothing happens, ensure your browser is not blocking popups.":
        "where you can approve the current action. If nothing happens, ensure your browser is not blocking popups.",
      "Confirm action »": "Confirm action »",
      "What is that?": "What is that?",
      "This widget is created with": "This widget is created with",
      ", a small script you can drop in any page that already uses NIP-07 and make it also work with NIP-46 automatically when the user doesn't have an extension installed.":
        ", a small script you can drop in any page that already uses NIP-07 and make it also work with NIP-46 automatically when the user doesn't have an extension installed.",
      "It adds a small floating button on the side of the window that users can use to create Nostr accuonts or connect to their NIP-46 bunkers.":
        "It adds a small floating button on the side of the window that users can use to create Nostr accuonts or connect to their NIP-46 bunkers.",
      "This tool is opensource, get the code from the":
        "This tool is opensource, get the code from the",
      "project's page": "project's page",
      "You don't know what Nostr is?": "You don't know what Nostr is?",
      "Learn more": "Learn more",
      "You are connected to Nostr as": "You are connected to Nostr as",
      Disconnect: "Disconnect",
      "This webpage is using the public key:": "This webpage is using the public key:",
      "Waiting too much?": "Waiting too much?",
      "Cancel the connection": "Cancel the connection",
      "Is this bunker provider broken?": "Is this bunker provider broken?",
      "Clear it": "Clear it",
      "Do you need a Nostr account?": "Do you need a Nostr account?",
      "Sign up now": "Sign up now",
      "We could not connect to a NIP-46 bunker with that url, are you sure it is set up correctly?":
        "We could not connect to a NIP-46 bunker with that url, are you sure it is set up correctly?",
      "We were not able to connect using this address. For it to work it has to come from a NIP-46 provider.":
        "We were not able to connect using this address. For it to work it has to come from a NIP-46 provider.",
    },
    Ue = window;
  Ue.destroyWnj = () => {
    setTimeout(() => {
      Yc.$destroy();
    }, 1);
  };
  const Cn = document.createElement("div");
  ((Cn.style.zIndex = "90000"), document.body.appendChild(Cn));
  const Ln = document.createElement("div");
  Ln.id = "wnj";
  const lo = document.createElement("style");
  lo.innerHTML = qe;
  const uo = Cn.attachShadow({ mode: "open" });
  (uo.appendChild(Ln), uo.appendChild(lo));
  const Yc = new Vc({
    target: Ln,
    props: {
      accent: ((fo = Ue.wnjParams) == null ? void 0 : fo.accent) || "cyan",
      position:
        ((ho = Ue.wnjParams) == null ? void 0 : ho.position) === "bottom" ? "bottom" : "top",
      startHidden: (bo = Ue.wnjParams) == null ? void 0 : bo.startHidden,
      compactMode: (go = Ue.wnjParams) == null ? void 0 : go.compactMode,
      texts: ((po = Ue.wnjParams) == null ? void 0 : po.texts) || Fc,
      nstartMeLanguage: ((wo = Ue.wnjParams) == null ? void 0 : wo.nstartMeLanguage) || "en",
    },
  });
  if (!((yo = Ue.wnjParams) != null && yo.disableOverflowFix)) {
    const t = document.createElement("style"),
      e = `
    html, body {
      overflow: auto;
      height: 100%;
    }
  `;
    ((t.innerHTML = e), document.head.appendChild(t));
  }
})();
