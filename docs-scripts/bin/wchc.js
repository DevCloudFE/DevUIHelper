#!/usr/bin/env node
const util = require('util');
const creater = require('../creater');
console.log(__dirname);
console.log(process.execPath);
console.log(process.cwd());
// console.log('hi WCH-Helper Works!');
const cmd = process.argv[2];
if(cmd){
    switch (cmd) {
        case '-authore':
            console.log('yqLiu');break;
        case '-help':
            console.log('-author,-version,-c for package');break;
        case '-version':
            console.log('V1.0.9');break;
        case '-c': creater.creater(process.cwd());
        default:
            console.log('please use -help')
    }
}