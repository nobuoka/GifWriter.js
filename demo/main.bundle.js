!function(e){var t={};function n(r){if(t[r])return t[r].exports;var a=t[r]={i:r,l:!1,exports:{}};return e[r].call(a.exports,a,a.exports,n),a.l=!0,a.exports}n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var a in e)n.d(r,a,function(t){return e[t]}.bind(null,a));return r},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=0)}([function(e,t,n){"use strict";t.__esModule=!0;var r,a,i=new Worker("./demo/web-worker.bundle.js");window.addEventListener("load",(function e(t){window.removeEventListener("load",e,!1),(r=document.createElement("div")).style.height="1px",r.style.overflow="hidden";var n=Array.prototype.slice.call(document.getElementsByTagName("img"));if(0!==(a=n.map((function(e){var t;try{t=function(e){var t=document.createElement("canvas");t.style.width="128px",t.style.height="128px",r.appendChild(t);var n=t.getContext("2d");n.drawImage(e,0,0,128,128);var a=n.getImageData(0,0,128,128);return r.removeChild(t),a}(e)}catch(e){}return t})).filter((function(e){return!!e}))).length){var i=document.getElementById("start-button");i.addEventListener("click",o,!1),i.textContent="Start creating animation GIF",i.disabled=!1}else alert("No image could be loaded...")}),!1);var o=function(e){var t,n=document.getElementById("palette-size-input"),r=document.getElementById("delay-time-input"),o=document.getElementById("result-container");o.insertBefore(((t=document.createElement("span")).style.display="inline-block",t.style.border="solid 1px #666666",t.style.verticalAlign="top",t.style.width="126px",t.style.height="126px",t.textContent="please wait...",t),o.firstChild);var l=parseInt(n.value);1<=l&&l<=255||(l=255);var d=parseInt(r.value);0<=d&&d<=1e4||(l=200),i.postMessage({imageDataList:a,imageSize:128,paletteSize:l,delayTimeInMS:d})};i.onmessage=function(e){var t=document.getElementById("result-container"),n=e.data,r=document.createElement("img"),a=btoa(n.gifDataStr);r.src="data:image/gif;base64,"+a;for(var i=t.firstChild;i&&"SPAN"===i.tagName;)i=i.nextSibling;t.insertBefore(r,i),"SPAN"===t.firstChild.tagName&&t.removeChild(t.firstChild)},i.onerror=function(e){alert(e)}}]);