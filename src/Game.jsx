import Cookies from 'universal-cookie'
import './Game.css'
import {useStateContext} from './StateContext.jsx'
import { Parser } from 'expr-eval';
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Leaderboard from './Leaderboard.jsx';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Game logic
let correctButton = -1; // no button is correct
let hiScore = 0;

let trigTable = { // functions can be reversed therefore storing that way is more efficient
    sincos: {
        "30": "1/2",
        "45": "√2/2",
        "60": "√3/2",
    },
    tgctg: {
        "30": "√3/3",
        "45": "1",
        "60": "√3",
    }
}

var isGameRunning, setIsGameRunning, settings, setSettings, gameValues, setGameValues, buttons, setButtons, question, setQuestion, statusText, setStatusText, 
        hardness, setHardness, useTextField, setUseTextField, fieldText, setFieldText, timeElapsed, setTimeElapsed, timeText, setTimeText;

var trigQuesion, setTrigQuestion;

let result = 0;

function RegenerateQuestion() {
    setFieldText(""); // clear field
    setTrigQuestion(false);
    const settingsArray = Object.values(settings)
    let index = getRandomInt(0,2);
    while(!settingsArray[index]) {
        index = getRandomInt(0,2);
    }
    switch(index) {
        case 0: {
            // make problem
            const rangeMin = -20 + (hardness > 3 ? hardness * 120 : hardness * 50);
            const rangeMax = 20 + (hardness > 3 ? hardness * 120 : hardness * 50);
            let good = false;
            let eq = "";
            while(!good) {
                let a = getRandomInt(rangeMin,rangeMax);
                let b = getRandomInt(rangeMin,rangeMax);
                let i = getRandomInt(0,hardness >= 3 ? 2 : 1); // multiply only on level 3+
                const op = ["+","-","*"][i];
                if(b < 0) {
                    b = "(" + b.toString() + ")"
                }
                eq = a.toString() + op + b.toString();
                const parser = new Parser()
                result = parser.parse(eq).evaluate();
                if(result != 0) {
                    good = true;
                }
            }
            // solve and render
            setQuestion(eq);
        }
        break;
        case 1: {
            const max = 10 + 10*hardness;
            const min = hardness <= 2 ? 3 : 11;
            result = getRandomInt(min, max); // range from 11 to 20
            const x_sqr = result * result;
            setQuestion("√"+x_sqr.toString());
        }
        break;
        case 2: {
            const opI = getRandomInt(0,3); // sin,cos,tan,cot
            const op = ["sin","cos","tan","cot"][opI];
            const arr = opI < 2 ? trigTable.sincos : trigTable.tgctg;
            let keys = Object.keys(arr);
            let values = Object.values(arr);
            if(opI === 1 || opI === 3) {
                // flip because trig funcs are reverse
                values = values.reverse();
            }
            const valI = getRandomInt(0,2);
            result = values[valI];
            const eq = op + "(" + keys[valI] + "°)"
            setQuestion(eq);
            setTrigQuestion(true);
        }
        break;
    }
    if(!useTextField) {
        // select button
        const btnIndex = getRandomInt(0,2);
        let newBtns = ["0","0","0"];
        for(let i = 0; i < 3; i++) {
            if(i === btnIndex) {
                newBtns[i] = result.toString();
                continue;
            }
            let r = result;
            if(r < 10 && r > -10) {
                r *= 3; // increase pool
            }
            let value = getRandomInt(0,r*2);
            let j = 0;
            while(value === r || newBtns.includes(value.toString())) { // avoid duplicate
                value = getRandomInt(0,r*2);
                j++;
                if(j > 10) break; // softlock prevention
            }
            newBtns[i] = value.toString();
        }
        setButtons(newBtns);
        correctButton = btnIndex; 
    }
}

function ParseAnswer() {
    if(trigQuesion) {
        return fieldText; // return raw string if trig because answer contains special symbols
    }
    return Number(fieldText);
}

function HandleGameButton(btn) {
    const insertHighscore = async (name, score) => {
        try {
            const res = await fetch(`/.netlify/functions/submitScore?name=${encodeURIComponent(name)}&score=${score}`);
            const data = await res.json();
            return data;
        } catch (err) {
            console.error("Failed to insert highscore:", err);
            return null;
        }
    };

    const correct = useTextField ? ParseAnswer() === result : btn === correctButton;
    if(correct) {
        setGameValues(prev => {
            const newScore = prev.score+1;
            let tries = prev.tries;
            if(newScore % 10 === 0 && newScore > 0 && tries < 5) {
                tries++;
            }
            return {
                score: newScore,
                tries: tries
            };
        });
    } else {
        setGameValues(prev => {
            let tries = prev.tries - 1;
            if(tries < 0){
                setIsGameRunning(false);
                const lastScore = gameValues["score"];
                if(lastScore > hiScore) {
                    hiScore = lastScore;
                    const cookie = new Cookies();
                    cookie.set('hiScore',hiScore);
                    var name = cookie.get("name");
                    console.log("name")
                    if(name === undefined) {
                        name = prompt("You got high score! Enter your name to appear on the leaderboard.");
                        cookie.set("name",name);
                    }
                    if(name !== undefined && name !== null && name !== "") {
                        console.log("writing to the leaderboard");
                        insertHighscore(name,hiScore);
                    }
                }
                return {
                    tries: gameValues.tries,
                    score: gameValues.score
                };
            }
            return {
                ...prev,
                tries: tries,
            };
        });
    }
    RegenerateQuestion();
}

function TextFieldSubmit(e) {
    const condition = e.key === "Enter" || e.type === "click";
    if(condition && isGameRunning && useTextField) {
        if(!fieldText || (Number.isNaN(Number(fieldText)) && !trigQuesion)) {
            alert("Field cannot be empty or contain symbols other than digits!");
            return;
        }
        HandleGameButton(-1); // any value because we use text field instead
    }
}

// Component that displays average time elapsed per question given
function AvgTimePerQuestion(score) {
    const { t } = useTranslation();

    const time = timeElapsed;
    const s = score.score;

    console.log(s);

    if(!s) console.log("!score");
    if(!time) console.log("!time");
    if(time <= 0) console.log("time <= 0");
    if(s <= 0) console.log("score <= 0");

    if (!s || !time || s <= 0) {
        console.log("first time or division by zero");
        return null;
    }

    const result = time / s;
    console.log(time);
    console.log(s);
    console.log(result);

    if (!isFinite(result)) {
        console.log("invalid calculation");
        return null;
    }

    return <h3>{t('time_per_question')} {result.toFixed(2)} {t('seconds')}</h3>;
}


var timeString;

// Components
function StartButton() {
    const insertHighscore = async (name, score) => {
        try {
            const res = await fetch(`/.netlify/functions/submitScore?name=${encodeURIComponent(name)}&score=${score}`);
            const data = await res.json();
            return data;
        } catch (err) {
            console.error("Failed to insert highscore:", err);
            return null;
        }
    };
    const { t, i18n } = useTranslation();
    function gameStart() {
        const state = !isGameRunning; // here we save state of condition separately to compensate react setState delay
        setIsGameRunning(state);
        if(state) {
            if(Object.values(settings).every(value => !value)) {
                alert(t('no_param_error'));
                setIsGameRunning(false);
                return;
            }
            setStatusText(""); // clear
            setGameValues({
                score: 0,
                tries: 3
            });
            RegenerateQuestion(); // generate starting question
            setTimeElapsed(0); // reset timers
            useEffectTimeTextArmed = true;
        } else {
            const lastScore = gameValues["score"];
            if(lastScore > hiScore) {
                hiScore = lastScore;
                const cookie = new Cookies();
                cookie.set('hiScore',hiScore);
                var name = cookie.get("name");
                console.log("name")
                if(name === undefined) {
                    name = prompt("You got high score! Enter your name to appear on the leaderboard.");
                    cookie.set("name",name);
                }
                if(name !== undefined && name !== null && name !== "") {
                    console.log("writing to the leaderboard");
                    insertHighscore(name,hiScore);
                }
            }
            setStatusText(t('lastscore') + ": " + lastScore.toString() + " | "+t('bestscore')+": " + hiScore.toString());
        }
    }

    return (
        <>
        <button id="startBtn" onClick={gameStart}>{!isGameRunning ? t('start') : t('stop')}</button>
        </>
    )
}

let useEffectTimeTextArmed = false;

function Game() {
    const { t, i18n } = useTranslation();
    ({isGameRunning, setIsGameRunning, settings, setSettings, gameValues, setGameValues, buttons, setButtons, question, setQuestion, statusText, setStatusText, 
        hardness, setHardness, useTextField, setUseTextField, timeElapsed, setTimeElapsed} = useStateContext());
    const cookie = new Cookies();
    const [trig, setTrig] = useState(false);
    const [sqrt, setSqrt] = useState(true);
    const [textFieldFlag, setTextFieldFlag] = useState(false);
    const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(false);
    const [f, sf] = useState("");
    const [tq,stq] = useState(false);
    const [tt, stt] = useState("");
    const [leaderboard, setLeaderboard] = useState(false);
    fieldText = f;
    setFieldText = sf;
    trigQuesion = tq;
    setTrigQuestion = stq;
    timeText = tt;
    setTimeText = stt;

    useEffect(() => {
        if(gameValues.tries <= 0 ) {
            setStatusText(t('gameover') + " "+t('lastscore')+": " + gameValues.score.toString() + " "+t('bestscore')+": " + hiScore.toString());
        }
    }, [isGameRunning])

    // high scores handler
    useEffect(() => {
        hiScore = cookie.get('hiScore');
        let hiScoreText = "";

        console.log(hiScore);

        if (hiScore == undefined) {
            hiScore = 0;
            cookie.set('hiScore', hiScore);
            console.log("undefined score");
        } else {
            if(hiScore > 0) hiScoreText = t('bestscore') + " : " + hiScore.toString();
        }

        setStatusText(hiScoreText);
    }, []);

    // update high score time once timer stopped
    useEffect(() => {
        if(isGameRunning) return;
        if(!useEffectTimeTextArmed) return;
        console.log("Updated timeText");
        setTimeText(t('lasttime') + ": " + timeElapsed.toString());
    },[timeElapsed, isGameRunning]);

    // hardness management
    useEffect(() => {
        // trig unlock
        setTrig(!(hardness >= 4)); // trig on level 3+
        setSqrt(!(hardness >= 2)); // sqrt on level 2+
        setSettings(prev => {
            return {
                arith: prev.arith,
                roots: prev.roots && hardness < 2 ? false : prev.roots,
                trig: prev.trig && hardness < 4 ? false : prev.trig,
            };
        });
        setUseTextField(hardness >= 4); // field on level 4+
        setTextFieldFlag(hardness == 5);
    },[hardness]);

    useEffect(() => {
        if(hardness < 4) return;
        if(!useTextField && hardness >= 4) {
            setTrig(true);
            setSettings(prev => ({...prev, trig:false}));
        } else {
            setTrig(false);
        }
    },[useTextField,hardness])

    // text field management
    useEffect(() => {
        setFieldText(fieldText.replace(/\s+/g, ''));
    },[fieldText]);

    // hardness progression
    useEffect(() => {
        if(gameValues.score % 15 == 0 && gameValues.score > 0 && adaptiveDifficulty) {
            let hard = hardness;
            if(hard === 5) return;
            if(hard < 4) {
                hard++;
                setHardness(hard);
            } else if(hard >= 4 && useTextField) {
                hard++;
                setHardness(hard);
            }
            if(hard >= 2 && !settings.roots) {
                setSettings(prev => ({...prev, roots: true}));
            }
            if(hard >= 4 && !settings.trig) {
                setSettings(prev => ({...prev, trig: true}));
            }
        }
    },[gameValues.score]);

    // timer
    const timerRef = useRef(null);
    useEffect(() => {
        if (isGameRunning) {
            timerRef.current = setInterval(() => {
                setTimeElapsed(prev => {
                    return prev + 1;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }

        // Clean up on unmount or when isGameRunning changes
        return () => clearInterval(timerRef.current);
    }, [isGameRunning]);

    if(leaderboard) {
        return <>
        <button onClick={() => {
                setLeaderboard(!leaderboard);
            }}>Return</button>
        <br/>
        <br/>
        <Leaderboard />
        </>
    } else {
        const updateSetting = (key) => setSettings(prev => ({...prev, [key]: !prev[key]}));
        return <>
            {!isGameRunning && <h3>{timeText}</h3>}
            {isGameRunning && <h3>{t('time') + ": " + timeElapsed.toString()}</h3>}
            <h3 id="status">{statusText}</h3>
            {!isGameRunning && <AvgTimePerQuestion score={gameValues["score"]} />}
            {!isGameRunning && <h2>{t('entry_text')}</h2>}
            {isGameRunning && <div>
                <h2 id="score">{t('score')}: {gameValues.score}</h2>
                <h2 id="question">{question}</h2>
                {!useTextField ? <div id="selection">
                <button onClick={() => HandleGameButton(0)}>{buttons[0]}</button>
                <button onClick={() => HandleGameButton(1)}>{buttons[1]}</button>
                <button onClick={() => HandleGameButton(2)}>{buttons[2]}</button>
                </div> : <div>
                    <div id="selection">
                    <input id="field" type="text" value={fieldText} onChange={(e) => setFieldText(e.target.value)} onKeyDown={TextFieldSubmit} />
                    {trigQuesion && <button onClick={() => {setFieldText(fieldText + "√")}}>√</button>}
                    </div>
                    <br/>
                    <button onClick={TextFieldSubmit}>Submit</button>
                    </div>}
                <p>{t('tries_left')}: {gameValues.tries}</p>
                <p>{t('hardness')}: {hardness}</p>
                </div>}
            <StartButton />
            {!isGameRunning && <fieldset id="gameSettings">
                <legend>Settings</legend>
                <a href="https://forms.gle/YZfdXVYR6ZxWx7Dj8">{t('reportaproblem')}</a>
                <br/><br/>
                <div className='langSelector'>
                    <button onClick={() => {
                        console.log("english");
                        i18n.changeLanguage("en");
                    }}>EN</button>
                    <button onClick={() => {
                        console.log("ukrainian")
                        i18n.changeLanguage("ua");
                    }}>UA</button>
                </div>
                <br/>
                <label><input type="checkbox" checked={settings.arith} onChange={() => updateSetting("arith")}/> {t('arithmetics')}</label> <br/>
                <label><input disabled={sqrt} type="checkbox" checked={settings.roots} onChange={() => updateSetting("roots")}/> {t('squareroots')} {hardness < 2 && "(Level 2+)"}</label> <br/>
                <label><input disabled={trig} type="checkbox" checked={settings.trig} onChange={() => updateSetting("trig")}/> {t('trigonometry')} {hardness < 4 && "(Level 4+)"}</label> <br/>
                <label>{t('hardness')} <input type="range" value={hardness} onChange={e => setHardness(Number(e.target.value))} min={1} max={5} step={1}/> {hardness}</label><br/>
                {hardness >= 4 && <><label><input disabled={textFieldFlag} type="checkbox" checked={useTextField} onChange={(e) => setUseTextField(e.target.checked)}/> {t('use_text_field')} {hardness < 4 && "(Level 4+)"}</label><br/></>}
                <label><input type="checkbox" checked={adaptiveDifficulty} onChange={(e) => setAdaptiveDifficulty(e.target.checked)}/>{t('adaptive_difficulty')} </label> <br/>
            </fieldset>}
            {!isGameRunning && <><br/><br/><button onClick={() => {
                setLeaderboard(!leaderboard);
            }}>{t('leaderboard')}</button></>}
        </>
    }
}

export default Game;