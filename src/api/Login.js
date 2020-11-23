require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const pg = require('pg');
const bcrypt = require('bcrypt');
const randomstring = require("randomstring");


const PluginConfig = {
};

/* Plugin info */
const PluginName = 'STT-Login';
const PluginRequirements = [];
const PluginVersion = '0.1.2';
const PluginAuthor = 'BolverBlitz';
const PluginDocs = '';

//Global Vars
const saltRounds = parseInt(process.env.saltRounds);
const TempTokenValidFor = Number(process.env.TempTokenValidForHours) * 60 * 60 * 1000 //Convert Hours in MS
const PermTokenValidFor = Number(process.env.PermTokenValidForHours) * 24 * 60 * 60 * 1000 //Convert Days in MS

const pool = new pg.Pool({
  user: process.env.DBUser,
  host: process.env.DBHost,
  database: process.env.DB,
  password: process.env.DBPw,
  port: process.env.DBPort,
})

/*
pool.query('UPDATE web_members SET passwordhash = $1 WHERE loginname = $2', ["$2b$08$RbV/rB24liQV1jWuulSfee2XMZsYZDMKP7qxOsG/SGTk8e02sKdPC", "marc"], (err, result) => {
  console.log(err)
  console.log(result)
});
*/
/*
pool.query('SELECT loginname, validtime, rights FROM web_members WHERE token = $1', ["Token"], (err, result) => {
  console.log(err)
  console.log(result)
});
*/

pool.connect((err, client, release) => {
})


const POST2limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 250
});

const POSTlimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});

const router = express.Router();

const LoginPost = Joi.object({
  Nutzername: Joi.string().required().regex(/^[a-z\d\s\-\.\,\ä\ü\ö\ß\&\(\)\"\!\?\+\*\/\<\>\|]*$/i),
  Passwort: Joi.string().required().regex(/^[a-z\d\s\-\.\,\ä\ü\ö\ß\&\(\)\"\!\?\+\*\/\<\>\|]*$/i),
  Rememberme: Joi.boolean(),
});

const CheckSchema = Joi.object({
  Token: Joi.string().required().max(32),
});

router.post('/login', POSTlimiter, async (reg, res, next) => {
  try {
    const value = await LoginPost.validateAsync(reg.body);
    pool.query('SELECT passwordhash FROM web_members WHERE loginname = $1', [value.Nutzername], (err, result) => { //GET Passworthash from DB to cpompare it
      if (err) {
        res.status(503);
        res.json({
          message: "executing query",
          error: err.stack
        });
      }
      //Check if ser is in DB
      if(typeof result.rows[0] === "undefined"){
        res.status(401);
        res.json({
          message: "Falscher Benutzername oder Passwort",
        });
      }else{
        bcrypt.compare(value.Passwort, result.rows[0].passwordhash).then(function(result) {
          if(result){
            var Token = randomstring.generate({
              length: 32, //DO NOT CHANCE!!!
              charset: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZäöüÄÖÜ?!+-1234567890!'
            });
            if(value.Rememberme){
              var ValidTime = new Date().getTime() + PermTokenValidFor; 
            }else{
              var ValidTime = new Date().getTime() + TempTokenValidFor;
            }
            pool.query('UPDATE web_members SET token = $1, validtime = $2 WHERE loginname = $3', [Token, ValidTime, value.Nutzername], (err, Update) => { //Write WED Token into DB for later logins
              pool.query('SELECT loginname, validtime, rights FROM web_members WHERE token = $1', [Token], (err, result) => {
                res.status(200);
                res.json({
                  message: "Success",
                  Token: Token,
                  loginname: result.rows[0].loginname,
                  rights: result.rows[0].rights
                });
              });
            });
          }else if(!result){
            res.status(401);
            res.json({
              message: "Falscher Benutzername oder Passwort",
            });
          }else{
            res.status(500);
            res.json({
              message: "Kritischer Fehler!",
            });
          }
        });
      }
    })
  } catch (error) {
    next(error);
  }
});

router.post('/check', POST2limiter, async (reg, res, next) => {
  try {
    const value = await CheckSchema.validateAsync(reg.body);

    pool.query('SELECT loginname, validtime, rights FROM web_members WHERE token = $1', [value.Token], (err, result) => {
      if(Object.entries(result.rows).length === 0){
        res.status(403);
        res.json({
          message: "Token invalid",
        });
      }else{
        if(new Date().getTime() <= result.rows[0].validtime){
          res.status(200);
          res.json({
            message: "ok",
            loginname: result.rows[0].loginname,
            rights: result.rows[0].rights
          });
        }else{
          res.status(403);
          res.json({
            message: "Token invalid",
          });
        }
      }

    });

  } catch (error) {
    next(error);
  }
});

router.post('/logout', POST2limiter, async (reg, res, next) => {
  try {
    const value = await CheckSchema.validateAsync(reg.body);

    pool.query('UPDATE web_members SET validtime = $1 WHERE token = $2', [new Date().getTime()-1000, value.Token], (err, result) => {
      res.status(200);
      res.json({
        message: "Success",
      });
    });

  } catch (error) {
    next(error);
  }
});

module.exports = {
  router,
  PluginName,
  PluginRequirements,
  PluginVersion,
  PluginAuthor,
  PluginDocs
};