require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const pg = require('pg');
const Joi = require('joi');

const PluginConfig = {
};

/* Plugin info */
const PluginName = 'TrustFactor';
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

const RequestList = rateLimit({
  windowMs: 60 * 1000,
  max: 250
});

const POSTlimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40
});

const GetTrustList = Joi.object({
  Token: Joi.string().required().max(32),
});

const ModTrust = Joi.object({
  DiscordID: Joi.string().required(),
  Value: Joi.string().required(),
  Token: Joi.string().required().max(32),
});

const router = express.Router();

router.get('/getList', RequestList, async (reg, res, next) => {
  try {
    const value = await GetTrustList.validateAsync(reg.query);
    const allow = await isAllowed(value.Token, "TrustRead");
    if(allow){
      pool.query('SELECT firstname, username, trustfactor, l."profileIconId", l.discord_id FROM members inner join leaguesummoner l on members.discord_id = l.discord_id WHERE l."PrimaryAcc"=True', (err, result) => { //GET all entrys member table
        if (err) {
          res.status(503);
          res.json({
            message: "executing query",
            error: err.stack
          });
        }else{
          res.status(200);
          res.json({
            memberlist: result.rows,
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

router.post('/modifyTrust', POSTlimiter, async (reg, res, next) => {
  try {
    const value = await ModTrust.validateAsync(reg.body);
    value.DiscordID = value.DiscordID.substring(1)
    const allow = await isAllowed(value.Token, "TrustWrite");
    if(allow){
      pool.query('UPDATE members SET trustfactor = trustfactor + $1 WHERE discord_id = $2', [value.Value, value.DiscordID], (err, result) => {
        if (err) {
          res.status(503);
          res.json({
            message: "executing query",
            error: err.stack
          });
        }else{
          res.status(200);
          res.json({
            message: "Success",
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