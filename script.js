function switchTab(name){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab === name));
  document.getElementById('panel-calc').classList.toggle('active', name === 'calc');
  document.getElementById('panel-game').classList.toggle('active', name === 'game');
  if(name === 'game' && !gameStarted){ startGame(); }
}

/* ============================================================
   CALCULATOR LOGIC
   ============================================================ */
let calcCurrent = '0';
let calcPrevValue = null;
let calcOp = null;
let calcResetNext = false;
let angleMode = 'deg'; // 'deg' | 'rad'

function setAngleMode(mode){
  angleMode = mode;
  document.getElementById('degBtn').classList.toggle('active', mode === 'deg');
  document.getElementById('radBtn').classList.toggle('active', mode === 'rad');
}

function refreshCalcDisplay(){
  document.getElementById('calcCurr').textContent = calcCurrent;
  document.getElementById('calcPrev').textContent =
    (calcPrevValue !== null && calcOp) ? `${trimNum(calcPrevValue)} ${calcOp}` : '\u00A0';
}
function trimNum(n){
  if(typeof n !== 'number') return n;
  if(Object.is(n, -0)) n = 0;
  if(!isFinite(n)) return 'Erro';
  return parseFloat(n.toPrecision(12)).toString();
}
function digit(d){
  if(calcResetNext){ calcCurrent = '0'; calcResetNext = false; }
  if(d === '.' && calcCurrent.includes('.')) return;
  calcCurrent = (calcCurrent === '0' && d !== '.') ? d : calcCurrent + d;
  refreshCalcDisplay();
}
function backspace(){
  calcCurrent = calcCurrent.length > 1 ? calcCurrent.slice(0,-1) : '0';
  refreshCalcDisplay();
}
function clearAll(){
  calcCurrent = '0'; calcPrevValue = null; calcOp = null; calcResetNext = false;
  refreshCalcDisplay();
}
function toggleSign(){
  calcCurrent = trimNum(parseFloat(calcCurrent) * -1);
  refreshCalcDisplay();
}
function setOp(op){
  if(calcOp && !calcResetNext){ equals(); }
  calcPrevValue = parseFloat(calcCurrent);
  calcOp = op;
  calcResetNext = true;
  refreshCalcDisplay();
}
function equals(){
  if(calcOp === null || calcPrevValue === null) return;
  const a = calcPrevValue, b = parseFloat(calcCurrent);
  let result;
  switch(calcOp){
    case '+': result = a + b; break;
    case '-': result = a - b; break;
    case '×': result = a * b; break;
    case '÷': result = b === 0 ? NaN : a / b; break;
    case '^': result = Math.pow(a, b); break;
    default: result = b;
  }
  calcCurrent = trimNum(result);
  calcOp = null; calcPrevValue = null; calcResetNext = true;
  refreshCalcDisplay();
}
function factorial(n){
  if(n < 0 || !Number.isInteger(n)) return NaN;
  if(n > 170) return Infinity;
  let r = 1;
  for(let i=2;i<=n;i++) r *= i;
  return r;
}
function fibonacci(n){
  if(n < 0 || !Number.isInteger(n)) return NaN;
  let a=0,b=1;
  for(let i=0;i<n;i++){ [a,b]=[b,a+b]; }
  return a;
}
function toRadians(x){ return angleMode === 'deg' ? x * Math.PI / 180 : x; }

function insertConst(kind){
  if(kind === 'pi'){
    calcCurrent = trimNum(Math.PI);
  }
  calcResetNext = true;
  refreshCalcDisplay();
}

function unary(kind){
  const x = parseFloat(calcCurrent);
  let result;
  switch(kind){
    case 'sqrt': result = x < 0 ? NaN : Math.sqrt(x); break;
    case 'fact': result = factorial(x); break;
    case 'fib': result = fibonacci(x); break;
    case 'euler': result = Math.exp(x); break;
    case 'log': result = x <= 0 ? NaN : Math.log10(x); break;
    case 'percent': result = x / 100; break;
    case 'sin': result = Math.sin(toRadians(x)); break;
    case 'cos': result = Math.cos(toRadians(x)); break;
    case 'tan': result = Math.tan(toRadians(x)); break;
    default: result = x;
  }
  calcCurrent = trimNum(result);
  calcResetNext = true;
  refreshCalcDisplay();
}
refreshCalcDisplay();

/* ============================================================
   GAME LOGIC — "Amnesia" do Quagsire
   ============================================================ */
let lives = 3;
let score = 0;
let best = 0;
let gameStarted = false;
let currentQuestion = null; // {text, answer}
let questionsAnswered = 0;  // conta só perguntas normais (não-bônus), define o nível
let currentLevel = 1;
let isBonusRound = false;

const BONUS_CHANCE = 0.15;

const IMG = {
  quagsireIdle: 'images/quagsire-idle.png',
  quagsireAmnesia: 'images/quagsire-amnesia.png',
  quagsireHappy: 'images/quagsire-happy.png',
  quagsireSad: 'images/quagsire-sad.png',
  quagsireCongrats: 'images/quagsire-congrats.png',
  lotadHappy: 'images/lotad-happy.png',
  lotadAngry: 'images/lotad-angry.png',
  magikarp: 'images/magikarp-jump.png',
  finizen: 'images/finizen-jump.png'
};

function computeLevel(count){
  if(count <= 10) return 1;
  if(count <= 30) return 2;
  return 3;
}

function updateLevelUI(){
  document.getElementById('levelLabel').textContent = `Nível ${currentLevel}`;
  document.getElementById('goomyWalker').classList.toggle('active', currentLevel >= 2);
  document.getElementById('bonusTag').style.display = isBonusRound ? 'inline-block' : 'none';
  document.getElementById('panel-game').classList.toggle('bonus-active', isBonusRound);
  // magikarp aparece no nível 1, finizen substitui a partir do nível 2
  const jumpImg = document.getElementById('jumpImg');
  if(currentLevel >= 2){
    jumpImg.src = IMG.finizen;
    jumpImg.dataset.species = 'Finizen';
    jumpImg.dataset.color = '#5CC7D8';
  } else {
    jumpImg.src = IMG.magikarp;
    jumpImg.dataset.species = 'Magikarp';
    jumpImg.dataset.color = '#F3877A';
  }
  jumpImg.onerror = function(){ handleImgError(jumpImg); };
}

function setQuagsireImage(src, species){
  const img = document.getElementById('quagsireImg');
  img.onerror = null;
  img.src = src;
  img.dataset.species = species || 'Quagsire';
  img.onerror = function(){ handleImgError(img); };
}

function setQuagsireMood(mood, message){
  const wrap = document.getElementById('quagsireWrap');
  wrap.classList.remove('amnesia','happy','sad');
  wrap.classList.add(mood);
  const sources = {
    amnesia: IMG.quagsireAmnesia,
    happy: IMG.quagsireHappy,
    sad: IMG.quagsireSad,
    congrats: IMG.quagsireCongrats,
    idle: IMG.quagsireIdle
  };
  setQuagsireImage(sources[mood] || IMG.quagsireIdle, 'Quagsire');
  if(message !== undefined){
    document.getElementById('quagsireSpeech').textContent = message;
  }
}

function renderLives(){
  const row = document.getElementById('livesRow');
  row.innerHTML = '';
  for(let i=0;i<3;i++){
    const wrap = document.createElement('span');
    wrap.className = 'lotad-life' + (i < (3-lives) ? ' lost' : '');
    const img = document.createElement('img');
    img.src = IMG.lotadHappy;
    img.alt = 'Lotad';
    img.dataset.species = 'Lotad';
    img.dataset.color = '#4CAF62';
    img.onerror = function(){ handleImgError(img); };
    wrap.appendChild(img);
    row.appendChild(wrap);
  }
}

function reactLotadsWrong(){
  const lotads = Array.from(document.querySelectorAll('.lotad-life:not(.lost)'));
  lotads.forEach(w=>{
    const img = w.querySelector('img');
    img.src = IMG.lotadAngry;
    img.onerror = function(){ handleImgError(img); };
    w.classList.add('angry');
  });
  const last = lotads[lotads.length-1];
  if(last){
    setTimeout(()=>{ last.classList.add('sinking'); }, 250);
  }
}
function reactLotadsHappy(){
  document.querySelectorAll('.lotad-life:not(.lost)').forEach(w=>{
    const img = w.querySelector('img');
    img.src = IMG.lotadHappy;
    img.onerror = function(){ handleImgError(img); };
    w.classList.remove('angry');
  });
}

function playJumpAnimation(){
  const jumpImg = document.getElementById('jumpImg');
  jumpImg.classList.remove('jumping');
  void jumpImg.offsetWidth;
  jumpImg.classList.add('jumping');
}

function updateScoreLabels(){
  document.getElementById('scoreLabel').textContent = `Pontos: ${score}`;
  document.getElementById('bestLabel').textContent = `Recorde: ${best}`;
}

function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

function buildEquation(level){
  const pools = {
    1: ['+','-'],
    2: ['+','-','×','÷'],
    3: ['+','-','×','÷','^']
  };
  const ops = pools[level] || pools[1];
  const op = ops[randInt(0, ops.length-1)];
  let a,b,c;
  if(op === '+'){
    const range = level === 1 ? 20 : level === 2 ? 60 : 120;
    a=randInt(1,range); b=randInt(1,range); c=a+b;
  } else if(op === '-'){
    const range = level === 1 ? 20 : level === 2 ? 80 : 150;
    a=randInt(5,range); b=randInt(1,a); c=a-b;
  } else if(op === '×'){
    const max = level === 2 ? 12 : 15;
    a=randInt(2,max); b=randInt(2,max); c=a*b;
  } else if(op === '÷'){
    const max = level === 2 ? 12 : 15;
    b=randInt(2,max); c=randInt(2,max); a=b*c;
  } else { // potência, só entra no nível 3 (ou em perguntas bônus)
    a=randInt(2,6); b=randInt(2,3); c=Math.pow(a,b);
  }
  return {a,b,c,op};
}

function generateQuestion(){
  isBonusRound = Math.random() < BONUS_CHANCE;
  const levelForThisQuestion = isBonusRound ? 3 : currentLevel;
  const {a,b,c,op} = buildEquation(levelForThisQuestion);

  const hideChoice = ['a','b','c'][randInt(0,2)];
  const parts = { a: String(a), b: String(b), c: String(c) };
  let answer;
  if(hideChoice === 'a'){ answer = a; parts.a = '<span class="blank">?</span>'; }
  else if(hideChoice === 'b'){ answer = b; parts.b = '<span class="blank">?</span>'; }
  else { answer = c; parts.c = '<span class="blank">?</span>'; }

  const text = `${parts.a} ${op} ${parts.b} = ${parts.c}`;
  currentQuestion = { text, answer };
  document.getElementById('equationDisplay').innerHTML = text;
  updateLevelUI();
}

function askQuestion(){
  generateQuestion();
  document.getElementById('answerInput').value = '';
  document.getElementById('feedback').textContent = '\u00A0';
  document.getElementById('feedback').className = 'feedback';
  const msg = isBonusRound
    ? 'Pergunta bônus! Amnesia dobrada — mas essa não custa vidas.'
    : 'Amnesia! Ele esqueceu um número… ajuda ele a lembrar!';
  setQuagsireMood('amnesia', msg);
  document.getElementById('answerInput').focus();
}

function submitAnswer(){
  if(!currentQuestion) return;
  const input = document.getElementById('answerInput');
  const guess = parseFloat(input.value);
  const feedback = document.getElementById('feedback');
  if(isNaN(guess)){
    feedback.textContent = 'Digite um número primeiro!';
    feedback.className = 'feedback bad';
    return;
  }
  const correct = Math.abs(guess - currentQuestion.answer) < 0.001;

  if(!isBonusRound){ questionsAnswered += 1; currentLevel = computeLevel(questionsAnswered); }

  if(correct){
    // rodada bônus garante 1 ponto a mais (2 pontos no total ao acertar)
    const pointsEarned = isBonusRound ? 2 : 1;
    score += pointsEarned;
    best = Math.max(best, score);
    feedback.textContent = isBonusRound
      ? 'Isso aí! Bônus! +2 pontos!'
      : 'Isso aí! O Quagsire lembrou!';
    feedback.className = 'feedback ok';
    setQuagsireMood('happy', 'Quagsire comemora com você!');
    reactLotadsHappy();
    playJumpAnimation();
    updateScoreLabels();
    setTimeout(()=>{ if(gameStarted) askQuestion(); }, 900);
  } else {
    feedback.textContent = `Não foi dessa vez. Era ${trimNum(currentQuestion.answer)}.`;
    feedback.className = 'feedback bad';
    setQuagsireMood('sad', 'Quagsiiire... (ele ficou tristinho e meio bobo)');
    if(isBonusRound){
      // pergunta bônus NUNCA custa vidas, mesmo errando
      setTimeout(()=>{ if(gameStarted) askQuestion(); }, 1100);
    } else {
      lives -= 1;
      reactLotadsWrong();
      if(lives <= 0){
        setTimeout(endGame, 1000);
      } else {
        setTimeout(()=>{ if(gameStarted) renderLives(); if(gameStarted) askQuestion(); }, 1100);
      }
    }
  }
}
document.getElementById('answerInput').addEventListener('keydown', (e)=>{
  if(e.key === 'Enter') submitAnswer();
});

function endGame(){
  gameStarted = false;
  document.getElementById('gameActive').style.display = 'none';
  document.getElementById('gameOverBox').style.display = 'block';
  document.getElementById('finalScore').textContent = score;
  setQuagsireMood('congrats', 'Você jogou muito bem! Até a próxima aventura no rio.');
}

function startGame(){
  gameStarted = true;
  lives = 3;
  score = 0;
  questionsAnswered = 0;
  currentLevel = 1;
  renderLives();
  updateScoreLabels();
  document.getElementById('gameOverBox').style.display = 'none';
  document.getElementById('gameActive').style.display = 'block';
  askQuestion();
}
renderLives();
updateScoreLabels();

const bgMusic = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');
const volumeSlider = document.getElementById('volumeSlider');
 
let musicPlaying = false;
bgMusic.volume = volumeSlider.value / 100;
 
musicToggle.addEventListener('click', () => {
  if (musicPlaying) {
    bgMusic.pause();
    musicToggle.textContent = '🔇';
  } else {
    bgMusic.play().catch(err => console.log('Erro ao tocar áudio:', err));
    musicToggle.textContent = '🔊';
  }
  musicPlaying = !musicPlaying;
});
 
volumeSlider.addEventListener('input', () => {
  bgMusic.volume = volumeSlider.value / 100;
});