const url=import.meta.env.VITE_SUPABASE_URL;
const anon=import.meta.env.VITE_SUPABASE_ANON_KEY;
const SESSION_KEY='getir-arcade-session-v1';
export const backendAvailable=Boolean(url&&anon);
const session=()=>{try{return JSON.parse(localStorage.getItem(SESSION_KEY))}catch{return null}};
async function invoke(name,body,authenticated=false){if(!backendAvailable)throw new Error('Ortak lig henüz yapılandırılmadı. Misafir olarak oynayabilirsin.');const token=authenticated?session()?.access_token:anon;const response=await fetch(`${url}/functions/v1/${name}`,{method:'POST',headers:{'Content-Type':'application/json',apikey:anon,Authorization:`Bearer ${token||anon}`},body:JSON.stringify(body)});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'İşlem tamamlanamadı');return data;}
export async function register(nickname,password){const data=await invoke('register-with-nickname',{nickname,password});localStorage.setItem(SESSION_KEY,JSON.stringify(data.session));return data;}
export async function login(nickname,password){const data=await invoke('login-with-nickname',{nickname,password});localStorage.setItem(SESSION_KEY,JSON.stringify(data.session));return data;}
export function logout(){localStorage.removeItem(SESSION_KEY)}
export async function changePassword(password){return invoke('change-password',{password},true)}
export async function syncRuns(runs){const synced=[];for(const run of runs){await invoke('submit-run',run,true);synced.push(run.clientRunId);}return synced;}
export async function getLeaderboard(type='season'){if(!backendAvailable)return[];const response=await fetch(`${url}/rest/v1/${type==='season'?'season_leaderboard':type==='getir-rush'?'rush_leaderboard':'depo_leaderboard'}?select=*&limit=20`,{headers:{apikey:anon,Authorization:`Bearer ${session()?.access_token||anon}`}});return response.ok?response.json():[];}
export async function getAccountData(){if(!backendAvailable||!session()?.access_token)return null;const headers={apikey:anon,Authorization:`Bearer ${session().access_token}`},fetchTable=async path=>{const response=await fetch(`${url}/rest/v1/${path}`,{headers});if(!response.ok)throw new Error('Hesap verileri alınamadı');return response.json()};const[profiles,runs,tasks,ledger]=await Promise.all([fetchTable('profiles?select=*'),fetchTable('runs?select=*&order=completed_at.desc'),fetchTable('task_progress?select=*'),fetchTable('xp_ledger?select=*')]);return{profile:profiles[0],runs,tasks,ledger};}
