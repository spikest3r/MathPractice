import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const res = await fetch("/.netlify/functions/getLeaderboard");
      const data = await res.json();
      setLeaderboardData(data);
    };
    fetchLeaderboard();
  }, []); // run only once on mount

  return (
    <div>
        <a href="https://forms.gle/T4A2aLhJEdyg4Me97">{t('reportoffensivename')}</a>
        <br/><br/>
        <button onClick={() => {
            const name = prompt("Enter your name. Leave it blank to clear the name.");
            cookie.set("name",name);
        }}>{t('changemyname')}</button>
        <br/><br/>
      <table>
        <thead>
          <tr>
            <th>{t('rank')}</th>
            <th>{t('name')}</th>
            <th>{t('score')}</th>
          </tr>
        </thead>
        <tbody>
          {leaderboardData.map((entry, index) => (
            <tr key={entry.id || index}>
              <td>{index + 1}</td>
              <td>{entry.name}</td>
              <td>{entry.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;
