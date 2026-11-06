import fs from 'node:fs';
import path from 'node:path';
const dir=path.resolve('data');
fs.mkdirSync(dir,{recursive:true});
export function read(name,fallback){try{return JSON.parse(fs.readFileSync(path.join(dir,name+'.json'),'utf8'));}catch{return fallback;}}
export function write(name,value){const file=path.join(dir,name+'.json');const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(value,null,2));fs.renameSync(tmp,file);}
