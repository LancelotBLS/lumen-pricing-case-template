import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
const allowed=new Set(['price_test_results.csv','channel_economics.csv','cost_breakdown.csv','competitor_prices_by_channel.csv','market_context.csv']);
http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file;if(pathname.startsWith('/data/')&&allowed.has(pathname.slice(6)))file=path.join(root,pathname);else if(['/','/index.html','/app.js','/model.js','/style.css'].includes(pathname))file=path.join(root,'dist',pathname==='/'?'index.html':pathname);else{res.writeHead(404);res.end('Not found');return;}const body=await readFile(file);res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.csv':'text/csv; charset=utf-8'})[path.extname(file)],'Cache-Control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end('Not found');}}).listen(4173,'127.0.0.1',()=>console.log('LUMEN ready at http://127.0.0.1:4173'));
