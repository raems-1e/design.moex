import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createServer} from '../app/server.mjs';
const root=fileURLToPath(new URL('../src/',import.meta.url));
async function files(dir){const out=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())out.push(...await files(p));else out.push(p);}return out;}
test('HTTP routes, security headers and isolation',async()=>{
  const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const origin=`http://127.0.0.1:${server.address().port}`;
  try{
    for(const route of ['/','/index.html','/communication.html','/product.html','/materials.html','/materials','/health','/assets/fonts/inter/InterVariable.woff2']){
      const r=await fetch(origin+route);assert.equal(r.status,200,route);
      assert.equal(r.headers.get('x-content-type-options'),'nosniff');
      assert.equal(r.headers.get('x-frame-options'),'DENY');
      assert.equal(r.headers.get('referrer-policy'),'no-referrer');
      assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'none'/);
      assert.doesNotMatch(r.headers.get('content-security-policy').split(';').find(x=>x.trim().startsWith('script-src ')),/unsafe-inline|unsafe-eval/);
      await r.arrayBuffer();
    }
    assert.equal(await (await fetch(origin+'/health')).text(),'ok\n');
    const head=await fetch(origin+'/product.html',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
    for(const route of ['/missing','/.env','/.git/config','/app/server.mjs','/assets/','/../README.md','/%2e%2e%2fREADME.md','/assets%5c..%5c.env']){
      const r=await fetch(origin+route);assert.equal(r.status,404,route);await r.text();
    }
    assert.equal((await fetch(origin+'/health',{method:'POST'})).status,405);
  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
test('HTML and CSS assets are local and exist; inline scripts are absent',async()=>{
  const all=await files(root);
  for(const file of all.filter(p=>/\.(html|css)$/.test(p))){
    const text=await readFile(file,'utf8');
    assert.doesNotMatch(text,/fonts\.(googleapis|gstatic)\.com/);
    const urls=file.endsWith('.html')?[...text.matchAll(/<(?:script|img|link)\b[^>]*?\b(?:src|href)=["']([^"']+)["']/gi)].map(m=>m[1]):[...text.matchAll(/url\(\s*["']?([^)'"\s]+)["']?\s*\)/g)].map(m=>m[1]);
    for(const url of urls){
      if(url.startsWith('data:')||decodeURIComponent(url).startsWith('#'))continue;
      assert.doesNotMatch(url,/^(?:https?:)?\/\//,`${file}: ${url}`);
      const clean=decodeURIComponent(url.split(/[?#]/)[0]);
      const local=clean.startsWith('/')?path.join(root,clean):path.resolve(path.dirname(file),clean);
      await readFile(local);
    }
    if(file.endsWith('.html')){
      assert.doesNotMatch(text,/<script(?![^>]*\bsrc=)[^>]*>\s*\S/i);
      assert.doesNotMatch(text,/\son(?:click|load|error)\s*=/i);
      assert.match(text,/assets\/fonts\/inter\/inter.css/);
    }
  }
});
test('No embedded C2PA/EXIF/text metadata remains in PNG/JPEG',async()=>{
  for(const file of await files(root)){
    const b=await readFile(file);
    if(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){
      for(let i=8;i<b.length;){const n=b.readUInt32BE(i),type=b.toString('ascii',i+4,i+8);assert.ok(!['caBX','eXIf','tEXt','iTXt','zTXt'].includes(type),file+': '+type);i+=n+12;}
    }else if(b[0]===255&&b[1]===216){
      for(let i=2;i<b.length;){assert.equal(b[i],255);while(b[i]===255)i++;const marker=b[i++];if(marker===0xDA||marker===0xD9)break;assert.ok(![0xE1,0xEB,0xED,0xFE].includes(marker),file);i+=b.readUInt16BE(i);}
    }
  }
});
