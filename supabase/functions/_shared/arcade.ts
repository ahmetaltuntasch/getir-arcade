import{createClient}from'https://esm.sh/@supabase/supabase-js@2';
export const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
export const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}});
export const normalizeNickname=(value:unknown)=>String(value||'').trim().toLowerCase();
export const validNickname=(value:string)=>/^[a-z0-9._]{3,20}$/.test(value);
export async function internalEmail(nickname:string){const bytes=new TextEncoder().encode(`getir-arcade:${nickname}`),hash=await crypto.subtle.digest('SHA-256',bytes);return`u_${[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('').slice(0,40)}@arcade.invalid`;}
export const admin=()=>createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
export const anon=()=>createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{auth:{persistSession:false}});
export async function caller(req:Request){const token=req.headers.get('Authorization')?.replace('Bearer ','')||'',client=anon();return(await client.auth.getUser(token)).data.user;}
export const ipHash=async(req:Request)=>{const raw=req.headers.get('x-forwarded-for')?.split(',')[0]||'unknown',hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${raw}:${Deno.env.get('RATE_LIMIT_SALT')||'arcade'}`));return[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('')};
