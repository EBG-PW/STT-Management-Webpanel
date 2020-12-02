require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const pg = require('pg');
const Joi = require('joi');

const PluginConfig = {
};

/* Plugin info */
const PluginName = 'STT-Teams';
const PluginRequirements = [];
const PluginVersion = '0.0.1';
const PluginAuthor = 'BolverBlitz';
const PluginDocs = '';

//Global Vars
const pool = new pg.Pool({
  user: process.env.DBUser,
  host: process.env.DBHost,
  database: process.env.DB,
  password: process.env.DBPw,
  port: process.env.DBPort,
})

const POSTlimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40
});

const router = express.Router();

const RequestList = rateLimit({
  windowMs: 60 * 1000,
  max: 250
});

const GetTrustList = Joi.object({
  Token: Joi.string().required().max(32),
});

const GetEventMembers = Joi.object({
  Token: Joi.string().required().max(32),
  EventTime: Joi.number().required(),
});

router.get('/currentEvents', RequestList, async (reg, res, next) => {
  try {
    const value = await GetTrustList.validateAsync(reg.query);
    const allow = await isAllowed(value.Token, "TeamRead");
    if(allow){
      pool.query('SELECT "registrationTime", event_times FROM clash_events WHERE announced = True AND ended = False ORDER BY "registrationTime" ASC LIMIT 4', (err, result) => { //GET all Events
        if (err) {
          res.status(503);
          res.json({
            message: "executing query",
            error: err.stack
          });
        }else{
          res.status(200);
          res.json({
            eventlist: result.rows,
          });
        }
      });
    }else{
      res.status(403);
      res.json({
        message: "Not enoth permissions",
      });
    }
  } catch (error) {
    next(error);
  }
});

router.get('/EventMembers', RequestList, async (reg, res, next) => {
  try {
    const value = await GetEventMembers.validateAsync(reg.query);
    const allow = await isAllowed(value.Token, "TeamRead");
    if(allow){
      pool.query('SELECT clash_id, clash_participation.discord_id, top, jgl, mid, adc, sup, main, ls."profileIconId", ls."summonerName", ls."rank", m.trustfactor FROM clash_participation inner join league_player lp on clash_participation.discord_id = lp.discord_id inner join leaguesummoner ls on clash_participation.discord_id = ls.discord_id inner join members m on clash_participation.discord_id = m.discord_id WHERE ls."PrimaryAcc" = True AND "participationTime" = $1', [value.EventTime], (err, result) => { //GET Members of Event
        if (err) {
          res.status(503);
          res.json({
            message: "executing query",
            error: err.stack
          });
        }else{
          res.status(200);
          res.json({
            Memberlist: result.rows,
          });
        }
      });
    }else{
      res.status(403);
      res.json({
        message: "Not enoth permissions",
      });
    }
  } catch (error) {
    next(error);
  }
});

function isAllowed(token, rights) {
  return new Promise(resolve => {
    pool.query('SELECT loginname, validtime, rights FROM web_members WHERE token = $1', [token], (err, result) => {
      if(Object.entries(result.rows).length === 0){
        resolve(false); //Token not found
      }else{
        if(new Date().getTime() <= result.rows[0].validtime){
          if(result.rows[0].rights.includes(rights)){
            resolve(true);
          }else{
            resolve(false); //Token not enoth rights for that
          }
        }else{
          resolve(false); //Token not valid anymore
        }
      }

    });
  });
}

module.exports = {
  router,
  PluginName,
  PluginRequirements,
  PluginVersion,
  PluginAuthor,
  PluginDocs
};