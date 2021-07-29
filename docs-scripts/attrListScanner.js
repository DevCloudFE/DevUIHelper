/*
 * @Author: your name
 * @Date: 2020-06-04 16:31:48
 * @LastEditTime: 2020-06-05 16:27:48
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \Extension_Universe\WCH-Creater\attrListCreater.js
 */ 
const util = require('./util');
const creater= require('./creater');
const fs = require('fs');
let componentInbuild;
let count = 0;

/**
 * api处理大师
 */
const _apireader = (arr,i,flag)=>{
    let result = creater.result;
    //初始化
    let componentName = util.getComponentName(arr[i]);
    const directiveFlag = componentName.charAt(1)!=="-";
    result[componentName] = result[componentName]?result[componentName]:{name:componentName,attrList:[],directiveFlag:directiveFlag};
    componentattrs=result[componentName]['attrList']?result[componentName]['attrList']:[];

    //过滤表格
    while(arr[++i]&&arr[i].indexOf(':-')===-1){
        if(!arr[i].startsWith('\|')&&arr[i].match(/(\S{5,})/)){
            result[componentName]['description'] = arr[i].replace(/(\s|\#|\(|\))/g,'')
        }
        if(arr[i].match(/(\#)*(\s)*d/)){
            break;
        }
    }
    i++;

    //装载
    while(arr[i]&&arr[i].startsWith('\|')){
        let temp = arr[i];
        temp = temp.replace(/\\\|/g,"!!!")
        let temparr = temp.split('\|');
        if(flag){
            if(temparr.length!==6){
                console.log("Error in"+temp)
                console.log(",this problem may raised by lack of | in the end of line or cotains \'\|\' rather than\'\\\|\' in discription " )
            }
            temparr = util.washContent(temparr);
            const typeResult = util.typeFactory(temparr[1])
            componentattrs.push({
                name:temparr[0],
                type:typeResult[0],
                default:temparr[2],
                description:temparr[3],
                attrType:'ATTR',
                isNecessary:temparr[2].startsWith('必选'),
                valueSet:typeResult[1]?typeResult[1]:[],
                isEvent:false
            })
            // console.log(temparr);
        }
        //对事件进行操作
        else{
            if(temparr.length!==5){
                console.log("Error in"+temp)
                console.log(",this problem may raised by lack of | in the end of line or cotains \'\|\' rather than\'\\\|\' in discription " )
            }
            temparr = util.washContent(temparr);
            const type = util.typeFactory(temparr[1])
            componentattrs.push({
                name:temparr[0].replace(/\(|\)/g,""),
                type:type,
                description:temparr[2],
                attrType:'Event',
                isNecessary:temparr[2].startsWith('必选'),
                hasvalueSet:type instanceof Array,
                isEvent:true
            })    
        }
        // result[componentName].attrlist=componentattrs;
        i++;
    }
    
}
let i=0;
const apireader = (content)=>{

    let arr = content.split('\n');
    for (let index = 0; index < arr.length; index++) {
        let temp = arr[index];
        if(blackListCheck(temp)){
            continue;
        }
        //处理括号的注释
        let tempStringArr = temp.split(" ")
        if(tempStringArr.length===3&&tempStringArr.pop().match(/\((\S*)\)/)){
            temp = tempStringArr[1];
        }
        else if(temp.match((/参数(\s*)(\r*)$/))){
            console.log(i+++temp)
            _apireader(arr,index,true);
        }else if(temp.match(/事件(\s*)(\r*)$/)){
            console.log(i+++temp)
            _apireader(arr,index,false);
        }else if(temp.match(/指令(\s*)(\r*)$/)){
            console.log(i+++temp)
            _apireader(arr,index,true);
        }
    }
}
attrListScanner = (rootPath)=>{
    return new Promise((resolve,reject)=>{
        fs.readdir(rootPath+'/devui',(err,files)=>{
            if(err)
            reject(err.message)
            else{
                files.forEach(file=>{
                    fs.readFile(rootPath+'/devui/'+file+'/doc/api.md',(err,data)=>{
                        if(err){
                            // console.log(`this file ${file} does not have api`)
                        }else{
                            apireader(data.toString());
                        }
                    });
                })
                resolve('Done');
            }
        })
    });
    await 
}
blackListCheck=(s)=>{
    const blackList = ["判断激活锚点的事件",
    "上传额外自定义参数","使用 `dDraggable` & `dDroppable` 指令",
    "Image容器元素上使用`dImagePreview`指令",
    "提供dDraggable和dDroppable(dSortable)指令",
    " 模板参数",
    "IDialogOptions 事件"];
    let res = false;
    blackList.forEach((e)=>{
        if(s.indexOf(e)!==-1){
            res = true;
        }
    })
    return res;
}
module.exports.attrListScanner =attrListScanner;