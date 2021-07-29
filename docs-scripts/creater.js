/*
 * @Author: your name
 * @Date: 2020-06-03 18:29:27
 * @LastEditTime: 2020-06-05 17:59:06
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \Extension_Universe\WCH-Creater\creater.js
 */ 
const fs = require('fs');
// const rootFile = require('C:\\Users\\Administrator\\Documents\\GitHub\\angular\\ng-devui/src/app/component/component.route.ts');
// const schema = rootFile.routesConfig;
const util = require('./util');
const apic = require('./attrListScanner');
const ComponentScanner = require('./componentScanner');
let result = {};
let _result = [];
//true表示参数

const creater =  async function(rootPath){
    console.log('creater works!');

    await apic.attrListScanner(rootPath);
    await ComponentScanner.ComponentScanner(rootPath);
    for(let c in result){
        _result.push(result[c]);
    }
    fs.mkdir(rootPath+'/wch',(err)=>{
        console.log(err);
    });
    fs.writeFile(rootPath+'/wch/info.json',JSON.stringify(_result),err=>{
        if(err){
            console.log(err);
        }
        console.log('Done!')
    });

}
module.exports.result=result;
module.exports.creater=creater;

creater();