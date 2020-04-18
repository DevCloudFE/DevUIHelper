import { CompletionItemKind,CompletionItem, InsertTextFormat, TextEdit,Range } from "vscode-languageserver";
import{HTML_SCHEMA as SCHEMA} from './html_source';
import{logger} from '../server';
import{MarkUpBuilder,copyCompletionItem,converValueSetToValueString, changeDueToCompletionRangeKind,changeInsertDueToCompletionRangeKind} from'../util';
import { CompletionRangeKind } from '../type';

const EVENT = "event";
const BOOLEAN = "boolean";
const NUMBER = "number";
const STRING = "string";
const OBJECT = "object";
const FUNCTION= "function";
const TEMPLATE="templateref"

export interface HTMLInfoNode {
    
    /**
     * 获得当前节点的父节点
     */
    getParent():HTMLInfoNode|undefined;

    /**
     * 获取资源树下方节点
     * @param name 下方节点的string类型的名称
     */
    getsubNode(name:string):HTMLInfoNode|undefined;

    /**
     * 获得它的全部子节点
     */
    getSubNodes():HTMLInfoNode[]|undefined;

    /**
     * 生成本元素的CompletionItem.这样可以响应父节点的调用。
     */
    buildCompletionItem():void;

    /**
     * 预处理对CompletionItem进行生成。
     */
    buildCompletionItems():void;

    /**
     * 获取补全代码
     * @param name 
     */
    getCompltionItems():CompletionItem[];

    /**
     * 获取add类型的补全代码
     * @param name 
     */
    getAddCompltionItems(range?:Range,kind?:CompletionRangeKind):CompletionItem[];

}
export class RootNode implements HTMLInfoNode{
    schema = <{[elementName:string]:Element}>{};
    private completionItems:CompletionItem[] = [];
    private addCompletionItems:CompletionItem[] = [];
    constructor(){} 
    buildCompletionItem(){}
    buildCompletionItems(){
        this.completionItems = Object.values(this.schema).map(element=>{
           return element.buildCompletionItem();
        });
    }

    getCompltionItems():CompletionItem[]{
        this.buildCompletionItems();
        return this.completionItems;
    }
    getAddCompltionItems(){
        return this.completionItems.map(_completionItem=>{
            let _completionAddItem = _completionItem;
            copyCompletionItem(_completionItem,_completionAddItem);
            _completionAddItem.label = "+"+_completionItem.label;
            return _completionAddItem;
        });
    }
    getsubNode(name:string):HTMLInfoNode|undefined{
        return this.schema[name];
    }
    getSubNodes(){
        return Object.values(this.schema);
    }
    getParent():undefined{
        return;
    }
}

export class Element implements HTMLInfoNode {
    private attributeMap = <{[attrName:string]:Attribute}>{}
    private addCompletionItems:CompletionItem[] = [];
    private completionItems:CompletionItem[] = [];
    
    constructor(private name:string,
        private description:string = "",
        private attritubes:Attribute[]=[],
        ){};
    getElement(s:string):Element|undefined{
        if(s=== this.name){
            return this;
        }
    }
    addAttritube(attribute:Attribute){
        this.attritubes.push(attribute);
        this.attributeMap[attribute.getName()]=attribute;
    }
    setDescription(description:string){
        this.description = description;
    }
    getName(){return this.name;}
    getAttributes(){return this.attritubes;}
    getDescription(){return this.description;}
    getAttribute(attrname:string):Attribute{  return this.attributeMap[attrname];}
    getcompletionKind(){ return CompletionItemKind.Class;}

    buildCompletionItems(){
        this.completionItems=this.attritubes.map(attr=>{
            return attr.buildCompletionItem();
        });
    }
    buildAddCompletionItems(){
        this.addCompletionItems = this.completionItems.map(completionItem=>{
            let addCompletionItem = CompletionItem.create(completionItem.label);
            copyCompletionItem(completionItem,addCompletionItem);
            completionItem.label=`+${completionItem.label}`;
            return completionItem;
        });
    }
    buildCompletionItem():CompletionItem{
        let completionItem = CompletionItem.create("d-"+this.name);
        completionItem.kind= CompletionItemKind.Class;
        let _insertText:string = "d-"+this.name;
        let _snippetNum = 1;
        for(let attr of Object.values(this.attributeMap)){
            if (attr.isNecessary){
                _insertText+= `\n\t${attr.getCompletionItem(_snippetNum)?.insertText}`.replace("$1","$"+_snippetNum+"");
                _snippetNum++;
            }
        }
        if(_snippetNum===1){
            _insertText+=">${1:}"+`</d-${this.name}>`
        }
        else{
            _insertText+=`\n>$${_snippetNum}</d-${this.name}>`
        }
        completionItem.insertText=_insertText;
        completionItem.detail=`这是一个${this.name}组件`;
        return completionItem;
    }
    getCompltionItems(){
            return this.completionItems;

    }
    getAddCompltionItems(currentRange:Range,kind:CompletionRangeKind){
    if(!currentRange){
        return this.completionItems;
        }
    return this.completionItems.filter(_completionItem=>{
        switch(kind){
            case CompletionRangeKind.INPUT:
                return _completionItem.kind!==CompletionItemKind.Event;
            case CompletionRangeKind.OUTPUT:
                return _completionItem.kind === CompletionItemKind.Event;
            case CompletionRangeKind.INOUTPUT:
                return _completionItem.kind!==CompletionItemKind.Event;
            default:
                return true;
        }
    }).map(_completionItem=>{

            let _addCompletionItem = CompletionItem.create(_completionItem.label);
            copyCompletionItem(_completionItem,_addCompletionItem);
            _addCompletionItem.label = changeDueToCompletionRangeKind(kind,_completionItem.label);
            let _newText = _addCompletionItem.insertText?_addCompletionItem.insertText:"" ;
            _addCompletionItem.textEdit = {
                range : currentRange,
                newText :changeInsertDueToCompletionRangeKind(kind,_newText),
            }
            _addCompletionItem.data="add"+_completionItem.label;
            return _addCompletionItem;
        });
    }
    getsubNode(attrname:string):HTMLInfoNode|undefined{
        return this.attributeMap[attrname];
    }
    getSubNodes(){
        return Object.values(this.attributeMap);
    }
    getParent():HTMLInfoNode{
        return new RootNode();
    }
    
}
export class Attribute implements HTMLInfoNode{
        private addCompletionItems:CompletionItem[] = [];
        private completionItems:CompletionItem[] = [];
        private completionItem:CompletionItem|undefined;
        constructor( 
        private readonly name:string,
        private readonly type:string,
        private readonly defaultValue:string,
        private readonly sortDescription:string,
        private readonly description:string,
        public readonly isNecessary:boolean,
        private readonly isEvent:boolean,
        private readonly valueSet: string[] = [],
        private readonly completionKind:CompletionItemKind,
        private readonly parent:HTMLInfoNode){}
    


    buildCompletionItems(){
        this.completionItems =  this.valueSet.map(value=>{
            let completionItem = CompletionItem.create("+"+value);
            completionItem.kind = CompletionItemKind.EnumMember;
            completionItem.insertText = value;
            completionItem.detail= `这是${value}类型`;
            completionItem.documentation = new MarkUpBuilder().addContent("![demo](https://s2.ax1x.com/2020/03/08/3z184H.gif)").getMarkUpContent();													
        completionItem.preselect = true;
        return completionItem;
        });
    }

    buildCompletionItem(){
        let completionItem = CompletionItem.create(this.name);
        completionItem.detail= this.sortDescription;
        completionItem.documentation = new MarkUpBuilder().addSpecialContent('typescript',[
                                                            "Type:"+this.getValueType(),
                                                            "DefaultValue:"+this.getDefaultValue(),
                                                            "Description:"+ this.getDescription()]).getMarkUpContent();
        completionItem.kind = this.getcompletionKind();                                                
        if(this.getcompletionKind()===CompletionItemKind.Event){
            completionItem.insertText ="("+this.getName()+")=\"$1\"";

        }else if(this.type === BOOLEAN){
            completionItem.insertText ="["+this.getName()+"]=\"${1|true,false|}\""; 
        }else if(this.valueSet.length>0){
            let valueString = converValueSetToValueString(this.valueSet);
            completionItem.insertText = `[${this.getName()}]=\"\${1|${valueString}|}\"`;
        }else{
        completionItem.insertText ="["+this.getName()+"]=\"$1\"";  
        }         
        completionItem.insertTextFormat = InsertTextFormat.Snippet;
        completionItem.preselect = true;
        this.completionItem = completionItem;
        return completionItem;
    }

    getCompltionItems():CompletionItem[]{

            return this.completionItems;

    }

    getAddCompltionItems(comrange:Range):CompletionItem[]{
        return this.completionItems.map(_completionItem=>{
            let _completionAddItem = _completionItem;
            copyCompletionItem(_completionItem,_completionAddItem);
            _completionAddItem.textEdit = {
                range:comrange,
                newText : _completionItem.insertText?_completionItem.insertText:""
            }
            return _completionAddItem;
        });
    }

    getName(){return this.name;}   
    getSortDescription() : string {return this.sortDescription;} 
    getDescription(){return this.description;}
    getcompletionKind(){return this.completionKind;}
    getValueType(){return this.type;}
    getDefaultValue(){return this.defaultValue;}
    getValueSet(){return this.valueSet;}
    getsubNode(name:string):undefined{return;}
    getSubNodes():undefined{return;}
    getParent():HTMLInfoNode{return this.parent;}
    getCompletionItem(_snippetNum:number){return this.completionItem;}

}


export class DevUIParamsConstructor{
    private readonly rootNode = new RootNode();
    private schema = this.rootNode.schema;
    constructor(){}
    build():HTMLInfoNode{
        let _elementName:string;
        SCHEMA.forEach(elementInfo => {
            const parts = elementInfo.split("||");
            if(parts.length===2){
               _elementName = parts[0].toLocaleLowerCase(); 
                this.schema[_elementName.toLowerCase()] = new Element(_elementName,parts[1]);
                // console.log(_elementName);
            }else{
                // console.log(_elementName);
                const _element = this.schema[_elementName];
                if(_element.getAttribute(parts[0])){
                    // console.log(_element.getName()); 
                }
                if(_element){
                    _element.addAttritube(new Attribute(
                        parts[0],
                        parts[1],
                        parts[2],
                        parts[3],
                        parts[4],
                        parts[5]==="true"?true:false,
                        parts[6]==="true"?true:false,
                        parts[7]==="[]"?[]:parts[7].substring(1,parts[7].length-1).replace(" ","").split(","),
                        // JSON.parse(parts[7]),
                        this.changeToCompletionKind(parts[1],parts[6]),
                        _element
                    ));
                    // console.log(_element.getAttributes()); 
                }else{
                    throw Error(`Something wrong with ${_elementName}`);
                }
            }
        });
        this.buildCompletionItems();
        return this.rootNode;
    }
    buildCompletionItems(){
        this._buildCompletionItems(this.rootNode);
 
    }
    _buildCompletionItems(node:HTMLInfoNode){
        node.buildCompletionItems();
        node.buildCompletionItem();
        let subnodes = node.getSubNodes();
        if(subnodes){
            for (let subnode of subnodes){
                this._buildCompletionItems(subnode);
            }
        }
        return;

    }   

    changeToCompletionKind(type:string,isEvent:string):CompletionItemKind{
        type= type.toLowerCase();
        if(isEvent==="true"){
            return CompletionItemKind.Event;
        }
        if(type.includes("arrray")||type.includes("[]")) {
            return CompletionItemKind.Enum;
        }
        switch(type){
            case STRING:
                return CompletionItemKind.Text;
            case TEMPLATE:
                return CompletionItemKind.Module;
            case FUNCTION:
                return CompletionItemKind.Function;
            default: 
                return  CompletionItemKind.Variable;
        }
    }
    getRoot():HTMLInfoNode{
        return this.rootNode;
    }
}
export const htmlInfo = new DevUIParamsConstructor();