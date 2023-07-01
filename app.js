const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
let database = null;
const dbFilepath = path.join(__dirname, "./cricketMatchDetails.db");
const app = express();
app.use(express.json());
const port = 3000;

const dataBaseConnection = async () => {
  try {
    database = await open({
      filename: dbFilepath,
      driver: sqlite3.Database,
    });
    app.listen(port, () => {
      console.log(`Server Started...!`);
    });
  } catch (error) {
    console.log(`Connection Failed : ${error.message}`);
  }
};

dataBaseConnection();

const playersKeyChange = (obj) => {
  return {
    playerId: obj.player_id,
    playerName: obj.player_name,
  };
};

const matchKeyChange = (obj) => {
  return {
    matchId: obj.match_id,
    match: obj.match,
    year: obj.year,
  };
};
const matchesOnPlayers = (obj) => {
  return {
    playerId: obj.player_id,
    playerName: obj.player_name,
  };
};
const playerMatches = (obj) => {
  return {
    matchId: obj.match_id,
    match: obj.match,
    year: obj.year,
  };
};

app.get(`/players/`, async (req, res) => {
  let getPlayersQuery = `SELECT * FROM player_details`;
  let dbResponse = await database.all(getPlayersQuery);
  res.send(dbResponse.map((el) => playersKeyChange(el)));
});

app.get(`/players/:playerId/`, async (req, res) => {
  let { playerId } = req.params;
  let getPlayerQuery = `SELECT player_id, player_name FROM player_details WHERE player_id = '${playerId}'`;
  let dbResponse = await database.get(getPlayerQuery);
  res.send(playersKeyChange(dbResponse));
});

app.put(`/players/:playerId/`, async (req, res) => {
  let { playerId } = req.params;
  let { playerName } = req.body;
  let updatePlayer = `UPDATE player_details SET player_name = '${playerName}' WHERE player_id = '${playerId}'`;
  await database.run(updatePlayer);
  res.send(`Player Details Updated`);
});

app.get(`/matches/:matchId/`, async (req, res) => {
  let { matchId } = req.params;
  let getMatchQuery = `SELECT * FROM match_details WHERE match_id = '${matchId}'`;
  let dbResponse = await database.get(getMatchQuery);
  res.send(matchKeyChange(dbResponse));
});

app.get(`/players/:playerId/matches`, async (req, res) => {
  let { playerId } = req.params;
  let getPlayerDetailsOnMatch = `SELECT player_match_score.match_id, 
  match, year FROM player_match_score 
  INNER JOIN match_details ON player_match_score.match_id = match_details.match_id 
  WHERE player_id = '${playerId}'`;
  let dbResponse = await database.all(getPlayerDetailsOnMatch);
  res.send(dbResponse.map((el) => playerMatches(el)));
});
//player_details, match_details and player_match_score
app.get(`/matches/:matchId/players`, async (req, res) => {
  let { matchId } = req.params;
  let getMatchesOnPlayers = `
  SELECT DISTINCT player_match_score.player_id, player_details.player_name 
  FROM player_match_score 
  LEFT JOIN match_details AS T ON player_match_score.match_id = T.match_id
  JOIN player_details ON player_match_score.player_id = player_details.player_id
  WHERE player_match_score.match_id = '${matchId}'
`;

  let dbResponse = await database.all(getMatchesOnPlayers);
  res.send(dbResponse.map((el) => matchesOnPlayers(el)));
});

app.get("/players/:playerId/playerScores", async (req, res) => {
  let { playerId } = req.params;
  let playerStatsQuery = `
    SELECT 
      player_details.player_id AS playerId, 
      player_name AS playerName, 
      sum(score) AS totalScore, 
      sum(fours) AS totalFours,
      sum(sixes) AS totalSixes 
    FROM 
      player_details 
      LEFT JOIN 
      player_match_score 
      ON player_details.player_id = player_match_score.player_id
      WHERE player_details.player_id = '${playerId}'
  `;
  let dbResponse = await database.get(playerStatsQuery);
  res.send(dbResponse);
});

module.exports = app;
