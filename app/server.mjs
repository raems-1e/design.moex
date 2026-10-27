import http from 'node:http';
import {readFile, realpath, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../src/',import.meta.url));
export const csp="default-src 'none'; script-src 'self'; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'";
const headers={
  'Content-Security-Policy':csp,
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer',
  'X-Frame-Options':'DENY',
  'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
  'Cache-Control':'no-cache'
};
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.ico':'image/x-icon','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8','.pdf':'application/pdf','.zip':'application/zip','.mp4':'video/mp4'};
const routes={'/':'index.html','/index':'index.html','/communication':'communication.html','/product':'product.html','/materials':'materials.html'};
export function createServer(){
  return http.createServer(async(req,res)=>{
    for(const [k,v] of Object.entries(headers))res.setHeader(k,v);
    const send=(status,text)=>{res.writeHead(status,{'Content-Type':'text/plain; charset=utf-8','Content-Length':Buffer.byteLength(text)});res.end(req.method==='HEAD'?undefined:text);};
    if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');return send(405,'Method not allowed\n');}
    let pathname;
    try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{return send(400,'Bad request\n');}
    if(pathname==='/health')return send(200,'ok\n');
    if(pathname.includes('\0')||pathname.includes('\\')||pathname.split('/').some(p=>p.startsWith('.')))return send(404,'Not found\n');
    const target=path.resolve(root,routes[pathname]||'.'+pathname);
    if(!target.startsWith(root)||!types[path.extname(target)])return send(404,'Not found\n');
    try{
      const actual=await realpath(target);
      if(!actual.startsWith(root)||(await stat(actual)).isDirectory())return send(404,'Not found\n');
      const data=await readFile(actual);
      res.writeHead(200,{'Content-Type':types[path.extname(actual)],'Content-Length':data.length});
      res.end(req.method==='HEAD'?undefined:data);
    }catch(error){
      if(['ENOENT','ENOTDIR','EACCES'].includes(error.code))return send(404,'Not found\n');
      console.error('Request failed:',error.code||'internal');send(500,'Internal error\n');
    }
  });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const port=Number(process.env.PORT||8080),host=process.env.HOST||'0.0.0.0';
  if(!Number.isInteger(port)||port<1||port>65535)throw new Error('PORT must be 1..65535');
  const server=createServer();
  server.requestTimeout=15000;server.headersTimeout=10000;
  server.listen(port,host,()=>console.log(`MOEX Design listening on ${host}:${port}`));
  for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{server.close(()=>process.exit(0));setTimeout(()=>process.exit(1),10000).unref();});
}
