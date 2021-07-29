/*
 * @Author: your name
 * @Date: 2020-06-04 16:56:19
 * @LastEditTime: 2020-06-04 19:18:12
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \Extension_Universe\WCH-Creater\ComponentScanner.js
 */ 
const fs = require('fs'); 
const creater = require('./creater');
const ComponentScanner = async (rootPath)=>{
    return new Promise((resolve,reject)=>{
        let result = creater.result;
        fs.readFile(rootPath+'/src/app/component/component.route.ts',(err,data)=>{
            if(err){
                reject(err.message);
            }else{
                let dataString = data.toString();
                dataString = dataString.substring(dataString.indexOf('=')+1);
                dataString = dataString.replace(/\r|\n/g," ");
                dataString = dataString.replace(/\'|\`/g,"\"");
                dataString= dataString.replace(/(?:\s*['"]*)?([a-zA-Z0-9]+)(?:['"]*\s*)?:/g, "\"$1\":");
                dataString= dataString.replace(/\"component\"\:(\s\S*)\,/g, "");
                dataString= dataString.replace(/\"loadChildren\"\:(\s|\S)*?\,/g, "");
                dataString= dataString.replace(/<(\/)*[a-zA-z]*>/g, "");
                dataString= dataString.replace(/\}\,(\s*)\]\;(\s*)$/,"}]")
     
                let info = JSON.parse(dataString);
                // console.log(info);
                info.forEach((e)=>{
                    for(let componentName in result ){
                        // console.log(componentName);
                        if(e['path']&&componentName.endsWith(e['path'])){
                            result[componentName]['description']=e.data.description;
                            result[componentName]['tmw'] = e.data.tmw;
                            result[componentName]['cnName'] = e.data.cnName;
                        }
                    }
                })
                resolve('Done');
            }
        })
    });
   
}
module.exports.ComponentScanner = ComponentScanner;
           