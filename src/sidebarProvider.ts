import * as vscode from 'vscode';

export class PetJudgeSidebarProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) { }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtml(webviewView.webview);
  }

  public triggerPoopAnimation() {
    if (this._view) {
      this._view.webview.postMessage({ type: 'POOP_TIME' });
    }
  }

  private _getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();
    const config = vscode.workspace.getConfiguration('petJudge');
    const initialCharacter = config.get<string>('defaultCharacter', 'dog');

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';">
  <title>Pet Judge</title>
  <style>
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

    body {
      background: #1e1e1e;
      width: 100%;
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    #scene {
      position: relative;
      width: 100%;
      height: 100%;
    }

    /* ── SPEECH BUBBLE ── */
    #bubble {
      position: absolute;
      bottom: 90px;
      left: 0;
      transform: scale(0.85);
      background: #ffffff;
      border-radius: 14px;
      padding: 8px 14px;
      font-size: 12px;
      font-weight: bold;
      color: #333;
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      pointer-events: none;
      box-shadow: 0 4px 10px rgba(0,0,0,0.2);
      z-index: 1000;
      visibility: hidden;
      --arrow-left: 20px;
    }
    #bubble.show {
      opacity: 1;
      transform: scale(1);
      visibility: visible;
    }
    #bubble::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: var(--arrow-left);
      border: 6px solid transparent;
      border-top-color: #ffffff;
      border-bottom: none;
      transition: left 0.2s ease;
    }

    /* ── POOP CONTAINER ── */
    #poop-container {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none;
    }

    .poop-item {
      position: absolute;
      bottom: 0px; /* Firmly on the ground */
      transform: translateX(-50%) translateY(10px) scale(0.5);
      font-size: 30px;
      opacity: 0;
      transition: opacity 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .poop-item.show {
      opacity: 1;
      transform: translateX(-50%) translateY(0) scale(1);
    }

    /* stink lines */
    .stink {
      position: absolute;
      font-size: 12px;
      color: #8fbc8f;
      opacity: 0;
      bottom: 30px;
      font-weight: bold;
    }
    .stink:nth-child(1) { left: -8px; }
    .stink:nth-child(2) { left:  4px; }
    .stink:nth-child(3) { left: 16px; }
    .stink.rise {
      animation: stinkUp 1.2s ease-out forwards;
    }
    .stink:nth-child(2).rise { animation-delay: 0.2s; }
    .stink:nth-child(3).rise { animation-delay: 0.4s; }
    @keyframes stinkUp {
      0%   { opacity:0; transform: translateY(0) scale(0.5); }
      30%  { opacity:1; transform: translateY(-5px) scale(1); }
      100% { opacity:0; transform: translateY(-25px) scale(1.5); }
    }

    /* ── PET WRAP ── */
    #pet-wrap {
      position: absolute;
      bottom: -12px;
      left: 20px;
      width: 100px;
      height: 90px;
      transition: left 0.2s linear; /* Default for roaming, will be overridden in JS */
    }

    #pet {
      width: 100px;
      height: 90px;
      overflow: visible;
    }

    /* ── ANIMATIONS ── */
    @keyframes walkLegF { 0%,100% { transform: rotate(-30deg); } 50% { transform: rotate( 30deg); } }
    @keyframes walkLegB { 0%,100% { transform: rotate( 30deg); } 50% { transform: rotate(-30deg); } }
    @keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
    @keyframes headBob { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-2px) rotate(3deg); } }
    @keyframes tailWag { 0%,100% { transform: rotate(-15deg); } 50% { transform: rotate( 15deg); } }
    @keyframes squatDown {
      0%   { transform: translateY(0) rotate(0deg); }
      20%  { transform: translateY(-2px) rotate(5deg); }
      40%  { transform: translateY(5px) rotate(-20deg); }
      80%  { transform: translateY(5px) rotate(-20deg); }
      100% { transform: translateY(0) rotate(0deg); }
    }
    @keyframes headSquat {
      0%   { transform: translateY(0) rotate(0deg); }
      20%  { transform: translateY(-3px) rotate(-5deg); }
      40%  { transform: translateY(2px) rotate(5deg); }
      80%  { transform: translateY(2px) rotate(5deg); }
      100% { transform: translateY(0) rotate(0deg); }
    }
    @keyframes sitLegs { 0% { transform: rotate(0deg); } 20% { transform: rotate(10deg); } 40% { transform: rotate(-60deg); } 80% { transform: rotate(-60deg); } 100% { transform: rotate(0deg); } }

    #pet-wrap.walking #leg-fl, #pet-wrap.walking #leg-br { animation: walkLegF 0.5s linear infinite; transform-origin: 0 0; }
    #pet-wrap.walking #leg-fr, #pet-wrap.walking #leg-bl { animation: walkLegB 0.5s linear infinite; transform-origin: 0 0; }
    #pet-wrap.walking #dog-body-g { animation: bob 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite; }
    #pet-wrap.walking #head { animation: headBob 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite; transform-origin: 0 0; }
    #pet-wrap.walking #tail { animation: tailWag 0.35s linear infinite; transform-origin: 0 0; }

    #pet-wrap.squatting #dog-body-g { animation: squatDown 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; transform-origin: 65px 45px; }
    #pet-wrap.squatting #head { animation: headSquat 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; transform-origin: 0 0; }
    #pet-wrap.squatting #tail { transform: rotate(15deg); transform-origin: 0 0; transition: transform 0.4s; }
    #pet-wrap.squatting #leg-bl, #pet-wrap.squatting #leg-br { animation: sitLegs 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; transform-origin: 0 0; }

    #pet-wrap.idle #dog-body-g { animation: bob 2s ease-in-out infinite; }
    #pet-wrap.idle #head { animation: headBob 2s ease-in-out infinite; transform-origin: 0 0; }
    #pet-wrap.idle #tail { animation: tailWag 0.8s ease-in-out infinite; transform-origin: 0 0; }

    @keyframes errFlash { 0%,100% { background:#1e1e1e; } 25% { background:#3b1414; } 50% { background:#1e1e1e; } }
    body.flash { animation: errFlash 0.5s ease; }

    /* ── CONTROLS ── */
    #controls {
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 100;
    }
    #switch-pet {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.15);
      color: #999;
      border-radius: 6px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s;
    }
    #switch-pet:hover { background: rgba(255,255,255,0.2); color: #fff; }

    .pet-layer { display: none; }
    #pet-wrap.cat .cat-layer { display: block; }
    #pet-wrap.dog .dog-layer { display: block; }

    /* ── HEART HOVER ── */
    #heart {
      position: absolute;
      top: -15px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 24px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      z-index: 100;
    }
    #pet-wrap:not(.squatting):hover #heart {
      opacity: 1;
      animation: heartBeat 0.8s ease-in-out infinite alternate;
    }
    @keyframes heartBeat {
      0%   { transform: translateX(-50%) translateY(0) scale(0.8); }
      100% { transform: translateX(-50%) translateY(-10px) scale(1.2); }
    }
  </style>
</head>
<body>
  <div id="scene">
    <div id="controls">
      <div id="switch-pet" title="Change Pet">${initialCharacter === 'dog' ? '🐶' : '🐱'}</div>
    </div>
    <div id="bubble">not my problem 🐾</div>
    <div id="poop-container"></div>

    <!-- PET -->
    <div id="pet-wrap" class="idle ${initialCharacter}">
      <div id="heart">❤️</div>
      <svg id="pet" viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg">
        <!-- CAT LAYER -->
        <g class="pet-layer cat-layer" style="transform: translateY(6px);"> <!-- Lowered by 8px to fix floating -->
          <g id="dog-body-g">
            <g style="transform: translateX(18px) translateY(45px);"><g id="tail"><path d="M 0 0 C -18 -5, -18 -28, -2 -28 C 10 -28, 12 -18, 2 -15" fill="none" stroke="#E89F4A" stroke-width="8" stroke-linecap="round" /><path d="M 0 0 C -18 -5, -18 -28, -2 -28 C 10 -28, 12 -18, 2 -15" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-dasharray="0 6 12 24" /></g></g>
            <g style="transform: translateX(28px) translateY(50px);"><g id="leg-bl"><path d="M -5 0 L -3 20 C -3 24, 5 24, 5 20 L 5 0 Z" fill="#C87F3A" /><ellipse cx="1" cy="22" rx="5" ry="3.5" fill="#FFFFFF" /></g></g>
            <g style="transform: translateX(58px) translateY(52px);"><g id="leg-fl"><path d="M -4 0 L -2 18 C -2 22, 6 22, 6 18 L 4 0 Z" fill="#C87F3A" /><ellipse cx="2" cy="20" rx="5" ry="3.5" fill="#FFFFFF" /></g></g>
            <ellipse cx="68" cy="38" rx="12" ry="10" fill="#E89F4A" /><ellipse cx="50" cy="45" rx="30" ry="18" fill="#E89F4A" /><path d="M 25 50 C 35 62, 65 62, 75 50 C 70 65, 30 65, 25 50 Z" fill="#FFFFFF" />
            <g style="transform: translateX(42px) translateY(50px);"><g id="leg-br"><path d="M -5 0 L -3 20 C -3 24, 5 24, 5 20 L 5 0 Z" fill="#E89F4A" /><ellipse cx="1" cy="22" rx="5" ry="3.5" fill="#FFFFFF" /></g></g>
            <g style="transform: translateX(72px) translateY(52px);"><g id="leg-fr"><path d="M -4 0 L -2 18 C -2 22, 6 22, 6 18 L 4 0 Z" fill="#E89F4A" /><ellipse cx="2" cy="20" rx="5" ry="3.5" fill="#FFFFFF" /></g></g>
          </g>
          <g style="transform: translateX(72px) translateY(28px);"><g id="head"><g style="transform: scale(0.45) translate(-50px, -55px);"><path d="M 22 40 L 30 10 Q 35 5, 45 30" fill="#E89F4A" /><path d="M 78 40 L 70 10 Q 65 5, 55 30" fill="#E89F4A" /><path d="M 26 35 L 32 18 Q 34 15, 40 30" fill="#FAD1A8" /><path d="M 74 35 L 68 18 Q 66 15, 60 30" fill="#FAD1A8" /><path d="M 25 35 Q 50 25, 75 35 C 90 40, 95 70, 80 85 Q 50 95, 20 85 C 5 70, 10 40, 25 35 Z" fill="#E89F4A" /><path d="M 20 65 C 20 48, 45 48, 50 58 C 55 48, 80 48, 80 65 C 80 85, 65 95, 50 95 C 35 95, 20 85, 20 65 Z" fill="#FFFFFF" /><ellipse cx="35" cy="50" rx="3.5" ry="4.5" fill="#333333" /><ellipse cx="65" cy="50" rx="3.5" ry="4.5" fill="#333333" /><path d="M 46 62 Q 50 58, 54 62 Q 54 66, 50 70 Q 46 66, 46 62 Z" fill="#333333" /><path d="M 40 75 C 40 90, 60 90, 60 75 Z" fill="#333333" /><path d="M 45 80 C 45 88, 55 88, 55 80 Q 55 78, 50 78 Q 45 78, 45 80 Z" fill="#FF8A8A" /><ellipse cx="25" cy="65" rx="5" ry="3" fill="#FFB6C1" opacity="0.6" /><ellipse cx="75" cy="65" rx="5" ry="3" fill="#FFB6C1" opacity="0.6" /><g stroke="#333" stroke-width="1" stroke-linecap="round" opacity="0.6"><line x1="22" y1="62" x2="5" y2="58" /><line x1="20" y1="66" x2="2" y2="66" /><line x1="22" y1="70" x2="5" y2="74" /><line x1="78" y1="62" x2="95" y2="58" /><line x1="80" y1="66" x2="98" y2="66" /><line x1="78" y1="70" x2="95" y2="74" /></g></g></g></g>
        </g>
        <g class="pet-layer dog-layer">
          <g id="dog-body-g">
            <g style="transform: translateX(25px) translateY(48px);"><g id="tail"><path d="M 0 0 Q -12 -5, -10 -18" fill="none" stroke="#D99058" stroke-width="7" stroke-linecap="round" /></g></g>
            <g style="transform: translateX(32px) translateY(58px);"><g id="leg-bl"><rect x="-3" y="0" width="7" height="20" rx="3.5" fill="#B87340" /><rect x="-3" y="15" width="7" height="5" rx="2" fill="#FFFFFF" /></g></g>
            <g style="transform: translateX(58px) translateY(58px);"><g id="leg-fl"><rect x="-3" y="0" width="7" height="20" rx="3.5" fill="#B87340" /><rect x="-3" y="15" width="7" height="5" rx="2" fill="#FFFFFF" /></g></g>
            <rect x="25" y="38" width="50" height="24" rx="12" fill="#D99058" /><path d="M 50 40 C 65 40, 75 45, 75 55 C 75 62, 50 62, 50 62 C 50 62, 35 62, 35 55 C 35 45, 45 40, 50 40 Z" fill="#FFFFFF" opacity="0.3" />
            <g style="transform: translateX(42px) translateY(60px);"><g id="leg-br"><rect x="-3" y="0" width="7" height="20" rx="3.5" fill="#D99058" /><rect x="-3" y="15" width="7" height="5" rx="2" fill="#FFFFFF" /></g></g>
            <g style="transform: translateX(68px) translateY(60px);"><g id="leg-fr"><rect x="-3" y="0" width="7" height="20" rx="3.5" fill="#D99058" /><rect x="-3" y="15" width="7" height="5" rx="2" fill="#FFFFFF" /></g></g>
          </g>
          <g style="transform: translateX(81px) translateY(14px);"><g id="head"><g style="transform: scale(0.68) translate(-25px, -15px);"><rect x="0" y="-10" width="8" height="25" rx="4" fill="#D99058" /><rect x="15" y="-5" width="8" height="25" rx="4" fill="#D99058" /><rect x="-5" y="15" width="30" height="40" rx="10" fill="#D99058" /><rect x="15" y="32" width="28" height="22" rx="8" fill="#D99058" /><circle cx="8" cy="30" r="9" fill="white" /><circle cx="10" cy="30" r="2.5" fill="black" /><circle cx="11" cy="28" r="1" fill="white" /><circle cx="24" cy="30" r="6" fill="white" /><circle cx="25" cy="30" r="1.8" fill="black" /><circle cx="25.5" cy="28.5" r="0.7" fill="white" /><rect x="35" y="38" width="12" height="14" rx="5" fill="#333333" /><rect x="-5" y="53" width="30" height="8" rx="2" fill="#3897F0" /><circle cx="20" cy="65" r="6" fill="#FFD700" /></g></g></g>
        </g>
      </svg>
    </div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const petWrap = document.getElementById('pet-wrap');
    const bubble = document.getElementById('bubble');
    const sceneEl = document.getElementById('scene');
    const poopContainer = document.getElementById('poop-container');
    const switchBtn = document.getElementById('switch-pet');

    let currentPet = '${initialCharacter}';
    let currentLeft = 20;
    let isFlipped = false;
    let isBusy = false;

    const MESSAGES = [
      'You had one job 😑', 'Clean this up 🧹', 'This won’t end well ⚠️', 'We need to talk 🫤', 
      'Absolutely a waste 🗑️', 'Not my problem 🐾', 'Smells like bugs in here 🐛', 'Leaving my review 📝', 
      'Your code is sus 🤨', 'Try printing "I am useless"', 'I can do better 💅', 'Maybe the error is: 404 brain not found 🤯', 
      'Better become a goose farmer 🪿', 'I’m embarrassed for this 😬', 'Bold of you to think this works 🤡', 
      'This is beyond debugging 🧨', 'I’ve seen spaghetti with better structure 🍝', 'Not even close ❌', 
      'Skill issue detected… in the code 🎯', 'This code needs therapy 🛋️', 'This code is struggling, dude!!', 
      'Unacceptable. Fix it...', 'Try again, human...', 'This needs a reboot… of logic 🔄', 
      'Error 1000: Developer missing 🧠', 'Even bugs are confused 🐛❓', 'This code has trust issues 😤', 
      'I’m not mad, just disappointed 😔', 'My paws are cleaner than this code ✨', 'Error 404: Talent not found 🔍'
    ];

    switchBtn.addEventListener('click', () => {
      petWrap.classList.remove(currentPet);
      currentPet = (currentPet === 'dog') ? 'cat' : 'dog';
      petWrap.classList.add(currentPet);
      switchBtn.textContent = (currentPet === 'dog') ? '🐶' : '🐱';
    });

    function setState(cls) {
      petWrap.classList.remove('idle','walking','squatting');
      petWrap.classList.add(cls);
    }

    function createPoop(leftPos) {
      const p = document.createElement('div');
      p.className = 'poop-item';
      p.style.left = leftPos + 50 + 'px'; // Center on pet
      p.innerHTML = '💩<span class="stink">~</span><span class="stink">~</span><span class="stink">~</span>';
      poopContainer.appendChild(p);

      setTimeout(() => {
        p.classList.add('show');
        p.querySelectorAll('.stink').forEach(s => s.classList.add('rise'));
      }, 50);

      // Fade out after 8 seconds
      setTimeout(() => {
        p.style.transition = 'opacity 2s';
        p.style.opacity = '0';
        setTimeout(() => p.remove(), 2000);
      }, 8000);
    }

    async function walkTo(targetX) {
      if (isBusy) return;
      const startX = currentLeft;
      const distance = Math.abs(targetX - startX);
      if (distance < 5) return;

      const duration = distance / 50; // 50px per second
      isFlipped = targetX < startX;
      petWrap.style.transform = isFlipped ? 'scaleX(-1)' : 'scaleX(1)';
      petWrap.style.transition = 'left ' + duration + 's linear';
      
      setState('walking');
      petWrap.style.left = targetX + 'px';
      currentLeft = targetX;

      return new Promise(res => setTimeout(res, duration * 1000));
    }

    async function roam() {
      while (true) {
        if (!isBusy) {
          const sceneW = sceneEl.offsetWidth;
          const targetX = Math.random() * (sceneW - 100);
          await walkTo(targetX);
          setState('idle');
          await new Promise(res => setTimeout(res, 2000 + Math.random() * 3000));
        } else {
          await new Promise(res => setTimeout(res, 500));
        }
      }
    }

    function handlePoop() {
      if (isBusy) return;
      isBusy = true;

      // Flash background
      document.body.classList.add('flash');
      setTimeout(() => document.body.classList.remove('flash'), 500);

      // Current position
      const left = petWrap.offsetLeft;

      // Stop walking
      petWrap.style.transition = 'none';
      petWrap.style.left = left + 'px';
      currentLeft = left;

      setState('squatting');

      setTimeout(() => {
        createPoop(left);
        
        // --- SMART BUBBLE POSITIONING ---
        bubble.textContent = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
        
        // Show temporarily to measure
        bubble.style.visibility = 'hidden';
        bubble.classList.add('show');
        const bubbleW = bubble.offsetWidth;
        bubble.classList.remove('show');
        bubble.style.visibility = 'visible';

        const sceneW = sceneEl.offsetWidth;
        const petCenter = left + 50;
        
        // Ideal bLeft centers the bubble over petCenter
        let bLeft = petCenter - (bubbleW / 2);
        
        // Clamp bLeft to stay within scene bounds
        const padding = 10;
        bLeft = Math.max(padding, Math.min(bLeft, sceneW - bubbleW - padding));
        
        // Adjust the arrow (::after) to point at the pet center
        let arrowPos = petCenter - bLeft;
        arrowPos = Math.max(10, Math.min(arrowPos, bubbleW - 20)); // Keep arrow within bubble
        
        bubble.style.left = bLeft + 'px';
        bubble.style.setProperty('--arrow-left', arrowPos + 'px');
        bubble.classList.add('show');

        setTimeout(() => {
          bubble.classList.remove('show');
          setState('idle');
          isBusy = false;
        }, 3000);
      }, 1000);
    }

    window.addEventListener('message', e => {
      if (e.data && e.data.type === 'POOP_TIME') { handlePoop(); }
    });

    roam();
  </script>
</body>
</html>`;
  }
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
