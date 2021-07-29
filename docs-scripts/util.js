/*
 * @Author: your name
 * @Date: 2020-06-04 14:44:36
 * @LastEditTime: 2020-06-04 23:16:56
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \Extension_Universe\WCH-Creater\util.js
 */ 
getComponentName=(s)=>{
    return s.match(/[a-z][-]?([a-zA-Z]|\-)*/)[0].replace(/\s/,"")
}
washContent=(s)=>{
    s.shift();
    s.pop();
    s=s.map(element => {
        return element.replace(/\`|\s|\'|\"/g,"")
    });
    return s;
}
typeFactory=(s)=>{
    if(s.indexOf('!!!')===-1){
        return [s];
    }else{
        return ['string',s.split('!!!')];
    }
}
module.exports.getComponentName = getComponentName;
module.exports.washContent = washContent;
module.exports.typeFactory = typeFactory;