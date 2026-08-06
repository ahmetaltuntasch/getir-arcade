import { admin, anon, cors, internalEmail, json, normalizeNickname, validNickname } from '../_shared/arcade.ts';

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  const requestId=crypto.randomUUID();
  try{
    const{nickname:raw,password}=await req.json(),nickname=normalizeNickname(raw);
    if(!validNickname(nickname))return json({error:'Geçersiz nickname'},400);
    if(String(password||'').length<8)return json({error:'Şifre en az 8 karakter olmalı'},400);

    const db=admin(),email=await internalEmail(nickname);
    const existing=await db.from('profiles').select('id').eq('nickname',nickname).maybeSingle();
    if(existing.error){
      console.error('register profile lookup failed',{requestId,code:existing.error.code});
      return json({error:'Kayıt sistemi şu anda kullanılamıyor',requestId},503);
    }
    if(existing.data)return json({error:'Bu nickname kullanılıyor'},409);

    // The database trigger creates the profile in the same transaction as the Auth user.
    const created=await db.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{nickname}});
    if(created.error){
      console.error('register auth creation failed',{requestId,status:created.error.status,code:created.error.code});
      return json({error:'Hesap oluşturulamadı',requestId},400);
    }

    const profile=await db.from('profiles').select('id,nickname,career_xp,total_score,total_runs,must_change_password').eq('id',created.data.user.id).single();
    if(profile.error){
      console.error('register triggered profile missing',{requestId,code:profile.error.code});
      await db.auth.admin.deleteUser(created.data.user.id);
      return json({error:'Kayıt tamamlanamadı. Lütfen tekrar dene.',requestId},500);
    }

    const signed=await anon().auth.signInWithPassword({email,password});
    if(signed.error){
      console.error('register sign in failed',{requestId,status:signed.error.status,code:signed.error.code});
      return json({error:'Hesap oluşturuldu fakat oturum açılamadı. Giriş yapmayı dene.',requestId},500);
    }
    return json({session:signed.data.session,profile:profile.data});
  }catch(error){
    console.error('register unexpected failure',{requestId,name:error instanceof Error?error.name:'unknown'});
    return json({error:'Kayıt işlemi başarısız',requestId},500);
  }
});
