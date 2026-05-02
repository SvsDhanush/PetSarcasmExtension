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
    const config = vscode.workspace.getConfiguration('petJudge');
    const autoOpen = config.get<boolean>('autoOpenSidebar', true);

    if (this._view) {
      if (autoOpen) {
        this._view.show(true);
      }
      this._view.webview.postMessage({ type: 'POOP_TIME' });
    } else if (autoOpen) {
      // Force the sidebar to open if the user hasn't clicked it yet and setting is enabled
      vscode.commands.executeCommand('petJudge.sidebarView.focus').then(() => {
        setTimeout(() => {
          if (this._view) {
            this._view.webview.postMessage({ type: 'POOP_TIME' });
          }
        }, 500); // 500ms delay to ensure the webview's JavaScript is loaded and listening
      });
    }
  }
  private _getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();
    const config = vscode.workspace.getConfiguration('petJudge');
    const defaultSetting = config.get<string>('defaultCharacter', 'dog');
    const isRandom = defaultSetting === 'random';
    const initialCharacter = isRandom ? (Math.random() > 0.5 ? 'dog' : 'cat') : defaultSetting;

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

    /* ── SCENE ── */
    #scene {
      position: relative;
      width: 100%;
      height: 100%;
    }

    /* ── GROUND ── */
    #ground {
      display: none;
    }

    /* ── SPEECH BUBBLE ── */
    #bubble {
      position: absolute;
      bottom: 90px;
      left: calc(50% + 10px);
      transform: translateX(-50%) scale(0.85);
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
    }
    #bubble.show {
      opacity: 1;
      transform: translateX(-50%) scale(1);
    }
    #bubble::after {
      content: '';
      position: absolute;
      bottom: -6px;
      right: 20px;
      border: 6px solid transparent;
      border-top-color: #ffffff;
      border-bottom: none;
    }

    /* ── POOP ── */
    #poop {
      position: absolute;
      bottom: 0px; /* Sit perfectly on the ground */
      left: 50%;
      transform: translateX(-50%) translateY(10px) scale(0.5);
      font-size: 30px;
      opacity: 0;
      transition: opacity 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      pointer-events: none;
    }
    #poop.show {
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
      bottom: -12px; /* Lowered so the feet touch the ground instead of floating */
      left: -140px;
      width: 100px;
      height: 90px;
    }

    /* ── PET SVG ── */
    #pet {
      width: 100px;
      height: 90px;
      overflow: visible;
    }

    /* ── WALK KEYFRAMES ── */
    @keyframes walkLegF {
      0%,100% { transform: rotate(-30deg); }
      50%      { transform: rotate( 30deg); }
    }
    @keyframes walkLegB {
      0%,100% { transform: rotate( 30deg); }
      50%      { transform: rotate(-30deg); }
    }
    @keyframes bob {
      0%,100% { transform: translateY(0); }
      50%      { transform: translateY(-3px); }
    }
    @keyframes headBob {
      0%,100% { transform: translateY(0) rotate(0deg); }
      50%      { transform: translateY(-2px) rotate(3deg); }
    }
    @keyframes tailWag {
      0%,100% { transform: rotate(-15deg); }
      50%      { transform: rotate( 15deg); }
    }

    /* ── SQUAT KEYFRAMES ── */
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
    @keyframes sitLegs {
      0%   { transform: rotate(0deg); }
      20%  { transform: rotate(10deg); }
      40%  { transform: rotate(-60deg); }
      80%  { transform: rotate(-60deg); }
      100% { transform: rotate(0deg); }
    }

    /* ── WALKING STATE ── */
    #pet-wrap.walking #leg-fl { animation: walkLegF 0.5s linear infinite; transform-origin: 0 0; }
    #pet-wrap.walking #leg-fr { animation: walkLegB 0.5s linear infinite; transform-origin: 0 0; }
    #pet-wrap.walking #leg-bl { animation: walkLegB 0.5s linear infinite; transform-origin: 0 0; }
    #pet-wrap.walking #leg-br { animation: walkLegF 0.5s linear infinite; transform-origin: 0 0; }
    #pet-wrap.walking #dog-body-g { animation: bob 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite; }
    #pet-wrap.walking #head { animation: headBob 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite; transform-origin: 0 0; }
    #pet-wrap.walking #tail { animation: tailWag 0.35s linear infinite; transform-origin: 0 0; }

    /* ── SQUATTING STATE ── */
    #pet-wrap.squatting #dog-body-g { animation: squatDown 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; transform-origin: 65px 45px; }
    #pet-wrap.squatting #head { animation: headSquat 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; transform-origin: 0 0; }
    #pet-wrap.squatting #tail { transform: rotate(15deg); transform-origin: 0 0; transition: transform 0.4s; }
    #pet-wrap.squatting #leg-bl, #pet-wrap.squatting #leg-br { animation: sitLegs 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; transform-origin: 0 0; }

    /* ── IDLE BREATHING ── */
    #pet-wrap.idle #dog-body-g { animation: bob 2s ease-in-out infinite; }
    #pet-wrap.idle #head { animation: headBob 2s ease-in-out infinite; transform-origin: 0 0; }
    #pet-wrap.idle #tail { animation: tailWag 0.8s ease-in-out infinite; transform-origin: 0 0; }

    /* ── ERROR FLASH ── */
    @keyframes errFlash {
      0%,100% { background:#1e1e1e; }
      25%      { background:#3b1414; }
      50%      { background:#1e1e1e; }
    }
    body.flash { animation: errFlash 0.5s ease; }

    /* ── CONTROLS ── */
    #controls {
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 100;
      display: flex;
      gap: 8px;
    }
    #switch-pet, #toggle-random {
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
      user-select: none;
    }
    #switch-pet:hover, #toggle-random:hover {
      background: rgba(255,255,255,0.2);
      color: #fff;
    }
    #switch-pet:active, #toggle-random:active { transform: scale(0.9); }
    #switch-pet.disabled {
      opacity: 0.3;
      pointer-events: none;
      filter: grayscale(1);
    }
    #toggle-random.active {
      background: rgba(255,255,255,0.3);
      color: #fff;
      border-color: rgba(255,255,255,0.5);
    }

    /* ── PET SWITCHING ── */
    .pet-layer { display: none; }
    #pet-wrap.cat .cat-layer { display: block; }
    #pet-wrap.dog .dog-layer { display: block; }

    @keyframes pop {
      0%   { transform: scale(1); }
      50%  { transform: scale(1.15); }
      100% { transform: scale(1); }
    }
    #pet-wrap.pop-trigger #pet {
      animation: pop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
  </style>
</head>
<body>
  <div id="scene">
    <div id="controls">
      <div id="toggle-random" title="Toggle Random Pet" class="${isRandom ? 'active' : ''}">🎲</div>
      <div id="switch-pet" title="Change Pet" class="${isRandom ? 'disabled' : ''}">${initialCharacter === 'dog' ? '🐶' : '🐱'}</div>
    </div>
    <div id="bubble">not my problem 🐾</div>

    <div id="poop">
      💩
      <span class="stink">~</span>
      <span class="stink">~</span>
      <span class="stink">~</span>
    </div>

    <!-- PET -->
    <div id="pet-wrap" class="idle ${initialCharacter}">
      <svg id="pet" viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg">
        
        <!-- CAT LAYER -->
        <g class="pet-layer cat-layer">
          <!-- BODY GROUP -->
          <g id="dog-body-g">
            <!-- TAIL -->
            <g style="transform: translateX(18px) translateY(45px);">
              <g id="tail">
                <path d="M 0 0 C -18 -5, -18 -28, -2 -28 C 10 -28, 12 -18, 2 -15" fill="none" stroke="#E89F4A" stroke-width="8" stroke-linecap="round" />
                <path d="M 0 0 C -18 -5, -18 -28, -2 -28 C 10 -28, 12 -18, 2 -15" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-dasharray="0 6 12 24" />
              </g>
            </g>
            <!-- BACKGROUND LEGS -->
            <g style="transform: translateX(28px) translateY(50px);">
              <g id="leg-bl">
                <path d="M -5 0 L -3 20 C -3 24, 5 24, 5 20 L 5 0 Z" fill="#C87F3A" />
                <ellipse cx="1" cy="22" rx="5" ry="3.5" fill="#FFFFFF" />
              </g>
            </g>
            <g style="transform: translateX(58px) translateY(52px);">
              <g id="leg-fl">
                <path d="M -4 0 L -2 18 C -2 22, 6 22, 6 18 L 4 0 Z" fill="#C87F3A" />
                <ellipse cx="2" cy="20" rx="5" ry="3.5" fill="#FFFFFF" />
              </g>
            </g>
            <ellipse cx="68" cy="38" rx="12" ry="10" fill="#E89F4A" />
            <ellipse cx="50" cy="45" rx="30" ry="18" fill="#E89F4A" />
            <path d="M 25 50 C 35 62, 65 62, 75 50 C 70 65, 30 65, 25 50 Z" fill="#FFFFFF" />
            <!-- FOREGROUND LEGS -->
            <g style="transform: translateX(42px) translateY(50px);">
              <g id="leg-br">
                <path d="M -5 0 L -3 20 C -3 24, 5 24, 5 20 L 5 0 Z" fill="#E89F4A" />
                <ellipse cx="1" cy="22" rx="5" ry="3.5" fill="#FFFFFF" />
              </g>
            </g>
            <g style="transform: translateX(72px) translateY(52px);">
              <g id="leg-fr">
                <path d="M -4 0 L -2 18 C -2 22, 6 22, 6 18 L 4 0 Z" fill="#E89F4A" />
                <ellipse cx="2" cy="20" rx="5" ry="3.5" fill="#FFFFFF" />
              </g>
            </g>
          </g>

          <!-- HEAD -->
          <g style="transform: translateX(72px) translateY(28px);">
            <g id="head">
              <g style="transform: scale(0.45) translate(-50px, -55px);">
                <path d="M 22 40 L 30 10 Q 35 5, 45 30" fill="#E89F4A" />
                <path d="M 78 40 L 70 10 Q 65 5, 55 30" fill="#E89F4A" />
                <path d="M 26 35 L 32 18 Q 34 15, 40 30" fill="#FAD1A8" />
                <path d="M 74 35 L 68 18 Q 66 15, 60 30" fill="#FAD1A8" />
                <path d="M 25 35 Q 50 25, 75 35 C 90 40, 95 70, 80 85 Q 50 95, 20 85 C 5 70, 10 40, 25 35 Z" fill="#E89F4A" />
                <path d="M 20 65 C 20 48, 45 48, 50 58 C 55 48, 80 48, 80 65 C 80 85, 65 95, 50 95 C 35 95, 20 85, 20 65 Z" fill="#FFFFFF" />
                <ellipse cx="35" cy="50" rx="3.5" ry="4.5" fill="#333333" />
                <ellipse cx="65" cy="50" rx="3.5" ry="4.5" fill="#333333" />
                <path d="M 46 62 Q 50 58, 54 62 Q 54 66, 50 70 Q 46 66, 46 62 Z" fill="#333333" />
                <path d="M 40 75 C 40 90, 60 90, 60 75 Z" fill="#333333" />
                <path d="M 45 80 C 45 88, 55 88, 55 80 Q 55 78, 50 78 Q 45 78, 45 80 Z" fill="#FF8A8A" />
                <ellipse cx="25" cy="65" rx="5" ry="3" fill="#FFB6C1" opacity="0.6" />
                <ellipse cx="75" cy="65" rx="5" ry="3" fill="#FFB6C1" opacity="0.6" />
                <!-- Whiskers -->
                <g stroke="#333" stroke-width="1" stroke-linecap="round" opacity="0.6">
                  <line x1="22" y1="62" x2="5" y2="58" />
                  <line x1="20" y1="66" x2="2" y2="66" />
                  <line x1="22" y1="70" x2="5" y2="74" />
                  <line x1="78" y1="62" x2="95" y2="58" />
                  <line x1="80" y1="66" x2="98" y2="66" />
                  <line x1="78" y1="70" x2="95" y2="74" />
                </g>
              </g>
            </g>
          </g>
        </g>

        <!-- DOG LAYER -->
        <g class="pet-layer dog-layer">
          <!-- BODY GROUP -->
          <g id="dog-body-g">
            <!-- TAIL -->
            <g style="transform: translateX(25px) translateY(48px);">
              <g id="tail">
                <path d="M 0 0 Q -12 -5, -10 -18" fill="none" stroke="#D99058" stroke-width="7" stroke-linecap="round" />
              </g>
            </g>
            <!-- LEGS -->
            <g style="transform: translateX(32px) translateY(58px);">
              <g id="leg-bl">
                <rect x="-3" y="0" width="7" height="20" rx="3.5" fill="#B87340" />
                <rect x="-3" y="15" width="7" height="5" rx="2" fill="#FFFFFF" />
              </g>
            </g>
            <g style="transform: translateX(58px) translateY(58px);">
              <g id="leg-fl">
                <rect x="-3" y="0" width="7" height="20" rx="3.5" fill="#B87340" />
                <rect x="-3" y="15" width="7" height="5" rx="2" fill="#FFFFFF" />
              </g>
            </g>
            <!-- BODY -->
            <rect x="25" y="38" width="50" height="24" rx="12" fill="#D99058" />
            <!-- White Chest/Belly -->
            <path d="M 50 40 C 65 40, 75 45, 75 55 C 75 62, 50 62, 50 62 C 50 62, 35 62, 35 55 C 35 45, 45 40, 50 40 Z" fill="#FFFFFF" opacity="0.3" />

            <!-- FOREGROUND LEGS -->
            <g style="transform: translateX(42px) translateY(60px);">
              <g id="leg-br">
                <rect x="-3" y="0" width="7" height="20" rx="3.5" fill="#D99058" />
                <rect x="-3" y="15" width="7" height="5" rx="2" fill="#FFFFFF" />
              </g>
            </g>
            <g style="transform: translateX(68px) translateY(60px);">
              <g id="leg-fr">
                <rect x="-3" y="0" width="7" height="20" rx="3.5" fill="#D99058" />
                <rect x="-3" y="15" width="7" height="5" rx="2" fill="#FFFFFF" />
              </g>
            </g>
          </g>

          <!-- HEAD -->
          <g style="transform: translateX(81px) translateY(14px);">
            <g id="head">
              <g style="transform: scale(0.68) translate(-25px, -15px);">
                <!-- Ears -->
                <rect x="0" y="-10" width="8" height="25" rx="4" fill="#D99058" />
                <rect x="15" y="-5" width="8" height="25" rx="4" fill="#D99058" />
                <!-- Head Base -->
                <rect x="-5" y="15" width="30" height="40" rx="10" fill="#D99058" />
                <!-- Snout -->
                <rect x="15" y="32" width="28" height="22" rx="8" fill="#D99058" />
                <!-- Eyes -->
                <circle cx="8" cy="30" r="9" fill="white" />
                <circle cx="10" cy="30" r="2.5" fill="black" />
                <circle cx="11" cy="28" r="1" fill="white" /> <!-- Eye highlight -->
                <circle cx="24" cy="30" r="6" fill="white" />
                <circle cx="25" cy="30" r="1.8" fill="black" />
                <circle cx="25.5" cy="28.5" r="0.7" fill="white" /> <!-- Eye highlight -->
                <!-- Nose -->
                <rect x="35" y="38" width="12" height="14" rx="5" fill="#333333" />
                <!-- Collar moved here to follow head -->
                <rect x="-5" y="53" width="30" height="8" rx="2" fill="#3897F0" />
                <circle cx="20" cy="65" r="6" fill="#FFD700" />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div><!-- /pet-wrap -->

  </div><!-- /scene -->

  <script nonce="${nonce}">
    const vscode    = acquireVsCodeApi();
    const petWrap   = document.getElementById('pet-wrap');
    const poop      = document.getElementById('poop');
    const bubble    = document.getElementById('bubble');
    const stinks    = document.querySelectorAll('.stink');
    const sceneEl   = document.getElementById('scene');
    const switchBtn   = document.getElementById('switch-pet');
    const randomBtn   = document.getElementById('toggle-random');

    let currentPet = '${initialCharacter}';
    let isRandom   = ${isRandom};

    randomBtn.addEventListener('click', () => {
      isRandom = !isRandom;
      randomBtn.classList.toggle('active', isRandom);
      switchBtn.classList.toggle('disabled', isRandom);
    });

    switchBtn.addEventListener('click', () => {
      if (isRandom) return;
      petWrap.classList.remove(currentPet);
      currentPet = (currentPet === 'dog') ? 'cat' : 'dog';
      petWrap.classList.add(currentPet);
      switchBtn.textContent = (currentPet === 'dog') ? '🐶' : '🐱';
      
      // Trigger CSS pop animation
      petWrap.classList.remove('pop-trigger');
      void petWrap.offsetWidth; // force reflow
      petWrap.classList.add('pop-trigger');
    });

    const MESSAGES = [
      'You had one job 😑',
      'Clean this up 🧹',
      'I’m walking away 🐾',
      'This won’t end well ⚠️',
      'We need to talk 🫤',
      'Absolutely a waste 🗑️',
      'Not my problem 🐾',
      'Smells like bugs in here 🐛',
      'Leaving my review 📝',
      'Done here. Bye 👋',
      'Your code is sus 🤨',
      'Try printing "I am useless"',
      'I can do better 💅',
      'Maybe the error is: 404 brain not found 🤯',
      'Better become a goose farmer 🪿',
      'I’m embarrassed for this 😬',
      'Bold of you to think this works 🤡',
      'This is beyond debugging 🧨',
      'Goose farming is still an option 🪿',
      'I’ve seen spaghetti with better structure 🍝',
      'Not even close ❌',
      'I need a walk after this...',
      'Skill issue detected… in the code 🎯',
      'This code needs therapy 🛋️',
      'This code is struggling, dude!!',
      'Unacceptable. Fix it...',
      'Try again, human...',
      'This needs a reboot… of logic 🔄'
    ];

    let busy = false;

    function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function setState(cls) {
      petWrap.classList.remove('idle','walking','squatting');
      petWrap.classList.add(cls);
    }

    function runSequence() {
      if (busy) { return; }
      busy = true;

      if (isRandom) {
        petWrap.classList.remove(currentPet);
        currentPet = (Math.random() > 0.5 ? 'dog' : 'cat');
        petWrap.classList.add(currentPet);
        switchBtn.textContent = (currentPet === 'dog') ? '🐶' : '🐱';
      }

      // pick message
      bubble.textContent = rand(MESSAGES);

      // flash bg
      document.body.classList.add('flash');
      setTimeout(() => document.body.classList.remove('flash'), 500);

      // reset poop
      poop.classList.remove('show');
      stinks.forEach(s => { s.classList.remove('rise'); });

      // ── 1. WALK IN ──────────────────────────────────────────
      setState('walking');
      petWrap.style.transition = 'none';
      petWrap.style.left = '-140px';
      petWrap.style.transform = 'scaleX(1)'; // facing right

      // tiny delay so transition reset is applied
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const sceneW  = sceneEl.offsetWidth;
        const centerX = sceneW / 2 - 50;          // center dog

        // Calculate dynamic walk duration based on width!
        const distance = centerX + 140; // Total pixels to walk
        const speed = 120; // Pixels per second
        let walkSec = distance / speed;
        walkSec = Math.max(1.5, Math.min(walkSec, 4.5)); // Cap between 1.5s and 4.5s
        const walkMs = walkSec * 1000;

        petWrap.style.transition = 'left ' + walkSec + 's linear';
        petWrap.style.left = centerX + 'px';

        // ── 2. SQUAT ──────────────────────────────────────────
        setTimeout(() => {
          petWrap.style.transition = 'none';
          setState('squatting');

          // ── 3. DROP POOP ──────────────────────────────────
          setTimeout(() => {
            poop.show;
            poop.classList.add('show');

            // stink lines
            setTimeout(() => {
              stinks.forEach(s => s.classList.add('rise'));
            }, 250);

            // speech bubble
            setTimeout(() => {
              bubble.classList.add('show');
            }, 400);

            // ── 4. STAND + WALK OUT ───────────────────────
            setTimeout(() => {
              bubble.classList.remove('show');
              setState('walking');

              // flip dog to face LEFT for exit
              petWrap.style.transform = 'scaleX(-1)';
              petWrap.style.transition = 'left ' + (walkSec + 0.2) + 's linear';
              petWrap.style.left = '-140px'; // Walk back off screen to the left!

              // ── 5. RESET ──────────────────────────────────
              setTimeout(() => {
                setState('idle');
                petWrap.style.transition = 'none';
                petWrap.style.transform  = 'scaleX(1)';
                petWrap.style.left       = '-140px';
                busy = false;

                // fade poop out after 6s
                setTimeout(() => {
                  stinks.forEach(s => s.classList.remove('rise'));
                  poop.style.transition = 'opacity 1.2s, transform 1.2s';
                  poop.style.opacity    = '0';
                  poop.style.transform  = 'translateX(-50%) translateY(10px) scale(0.5)';
                  setTimeout(() => {
                    poop.classList.remove('show');
                    poop.style.transition = '';
                    poop.style.opacity    = '';
                    poop.style.transform  = '';
                  }, 1200);
                }, 6000);

              }, walkMs + 300); // Dynamic timeout for exit
            }, 2600); // how long it squats
          }, 1100);    // squat → poop delay
        }, walkMs + 50);     // Dynamic walk-in duration
      }));
    }

    window.addEventListener('message', e => {
      if (e.data && e.data.type === 'POOP_TIME') { runSequence(); }
    });
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
