import Cookies from 'universal-cookie'
import './Game.css'
import {useStateContext} from './StateContext.jsx'
import { Parser } from 'expr-eval';
import { useEffect, useState } from 'react';

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

function RegenerateQuestion(gameSettings, setButtons, setQuestion, hardness) {
    const settingsArray = Object.values(gameSettings)
    let index = getRandomInt(0,2);
    while(!settingsArray[index]) {
        index = getRandomInt(0,2);
    }
    let result = 0;
    switch(index) {
        case 0: {
            // make problem
            const rangeMin = -20 + (hardness > 3 ? hardness * 100 : hardness * 20);
            const rangeMax = 20 + (hardness > 3 ? hardness * 100 : hardness * 20);
            const a = getRandomInt(rangeMin,rangeMax);
            let b = getRandomInt(rangeMin,rangeMax);
            let i = getRandomInt(0,hardness >= 3 ? 2 : 1); // multiply only on level 3+
            const op = ["+","-","*"][i];
            if(b < 0) {
                b = "(" + b.toString() + ")"
            }
            const eq = a.toString() + op + b.toString();
            // solve and render
            setQuestion(eq);
            const parser = new Parser()
            result = parser.parse(eq).evaluate();
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
                keys.reverse();
                values.reverse();
            }
            const valI = getRandomInt(0,3);
            result = values[valI];
            const eq = op + "(" + keys[valI] + "°)"
            setQuestion(eq);
        }
        break;
    }
    // select button
    const btnIndex = getRandomInt(0,2);
    let newBtns = ["0","0","0"];
    for(let i = 0; i < 3; i++) {
        if(i === btnIndex) {
            newBtns[i] = result.toString();
            continue;
        }
        let value = getRandomInt(0,result*2);
        let j = 0;
        while(value === result) {
            value = getRandomInt(0,result*2);
            j++;
            if(j > 10) break;
        }
        newBtns[i] = value.toString();
    }
    setButtons(newBtns);
    correctButton = btnIndex; 
}

function HandleGameButton(btn, gameValues, setGameValues, settings, setButtons, setQuestion, setIsGameRunning, setStatusText, hardness) {
    if(btn === correctButton) {
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
                }
                setStatusText("Game over! Last score: " + lastScore.toString() + "\nHigh score: " + hiScore.toString());
                return {
                    tries: 3,
                    score: 0
                };
            }
            return {
                ...prev,
                tries: tries,
            };
        });
    }
    RegenerateQuestion(settings, setButtons, setQuestion, hardness);
}

// Components
function StartButton() {
    const {isGameRunning, setIsGameRunning, settings, _, gameValues, __, ___, setButtons, ____, setQuestion, _____, setStatusText, hardness, ______} = useStateContext();
    function gameStart() {
        const state = !isGameRunning; // here we save state of condition separately to compensate react setState delay
        setIsGameRunning(state);
        if(state) {
            if(Object.values(settings).every(value => !value)) {
                alert("You have to select at least one parameter!");
                setIsGameRunning(false);
                return;
            }
            setStatusText(""); // clear
            RegenerateQuestion(settings, setButtons, setQuestion, hardness); // generate starting question
        } else {
            const lastScore = gameValues["score"];
            if(lastScore > hiScore) {
                hiScore = lastScore;
                const cookie = new Cookies();
                cookie.set('hiScore',hiScore);
            }
            setStatusText("Last score: " + lastScore.toString() + "\nHigh score: " + hiScore.toString());
        }
    }

    return (
        <>
        <button id="startBtn" onClick={gameStart}>{!isGameRunning ? "Start" : "Stop"}</button>
        </>
    )
}

function Game() {
    const {isGameRunning, setIsGameRunning, settings, setSettings, gameValues, setGameValues, buttons, setButtons, question, setQuestion, statusText, setStatusText, hardness, setHardness} = useStateContext();
    const cookie = new Cookies();
    const [trig, setTrig] = useState(false);
    const [sqrt, setSqrt] = useState(true);
    useEffect(() => {
        let hiScore = cookie.get('hiScore');
        let hiScoreText = "";

        if (hiScore == undefined) {
            hiScore = 0;
            cookie.set('hiScore', hiScore);
        } else {
            if(hiScore > 0) hiScoreText = "High score: " + hiScore.toString();
        }

        setStatusText(hiScoreText);
    }, []);
    useEffect(() => {
        if(isGameRunning) {
            setStatusText("Hardness: " + hardness.toString());
        }
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
    },[hardness, isGameRunning])
    const updateSetting = (key) => setSettings(prev => ({...prev, [key]: !prev[key]}));
    return <>
    <h2 id="status">{statusText}</h2>
    {!isGameRunning && <h2>Select parameters and press "Start"</h2>}
    {isGameRunning && <div>
        <h2>{question}</h2>
        <p>Score: {gameValues.score}</p>
        <p>Tried left: {gameValues.tries}</p>
        </div>}
    {isGameRunning && <div id="selection">
        <button onClick={() => HandleGameButton(0, gameValues, setGameValues, settings, setButtons, setQuestion, setIsGameRunning, setStatusText, hardness)}>{buttons[0]}</button>
        <button onClick={() => HandleGameButton(1, gameValues, setGameValues, settings, setButtons, setQuestion, setIsGameRunning, setStatusText, hardness)}>{buttons[1]}</button>
        <button onClick={() => HandleGameButton(2, gameValues, setGameValues, settings, setButtons, setQuestion, setIsGameRunning, setStatusText, hardness)}>{buttons[2]}</button>
    </div> }
    <StartButton />
    {!isGameRunning && <fieldset id="gameSettings">
        <legend>Settings</legend>
        <label><input type="checkbox" checked={settings.arith} onChange={() => updateSetting("arith")}/> Arithmetics</label> <br/>
        <label><input disabled={sqrt} type="checkbox" checked={settings.roots} onChange={() => updateSetting("roots")}/> Square roots {hardness < 2 && "(Level 2+)"}</label> <br/>
        <label><input disabled={true} type="checkbox" checked={settings.trig} onChange={() => updateSetting("trig")}/> Trigonometry {hardness < 4 && "(Level 4+)"}</label> <br/>
        <label>Hardness <input type="range" value={hardness} onChange={e => setHardness(Number(e.target.value))} min={1} max={5} step={1}/> {hardness}</label>
    </fieldset>}
    </>
}

export default Game;