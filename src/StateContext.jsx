import { createContext, useContext, useState } from 'react';

const StateContext = createContext();

export function StateProvider({ children }) {
    const [isGameRunning, setIsGameRunning] = useState(false);
    const [settings, setSettings] = useState({
        arith: true,
        roots: false,
        trig: false
    });
    const [gameValues, setGameValues] = useState({
        score: 0,
        tries: 3,
    });
    const [question, setQuestion] = useState("Problem here")
    const [buttons, setButtons] = useState(["0","0","0"])
    const [statusText, setStatusText] = useState("");
    const [hardness, setHardness] = useState(2);
    const [useTextField, setUseTextField] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);
    return (
        <StateContext.Provider value={{
            isGameRunning, setIsGameRunning, settings, setSettings, gameValues, setGameValues, buttons, setButtons, question, setQuestion, statusText, setStatusText, hardness, setHardness,
            useTextField, setUseTextField, timeElapsed, setTimeElapsed
        }}>
            {children}
        </StateContext.Provider>
    )
}

export function useStateContext() {
    return useContext(StateContext);
}