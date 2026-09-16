import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)?.trim();

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
export const supabaseReady = Boolean(supabase);

const splitValues = (value) => Array.isArray(value) ? value.filter(Boolean) : String(value || '').split(',').map((item) => item.trim()).filter(Boolean);

const compressImage = async (file) => {
  if (!file || !(file.type || '').startsWith('image/')) return file;
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = objectUrl;
    await image.decode();
    const maxSize = 1280;
    const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.78));
    return blob ? new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg', lastModified: Date.now() }) : file;
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(reader.error || new Error('Could not read profile photo.'));
  reader.readAsDataURL(file);
});

export const compressedImageDataUrl = async (file) => file ? fileToDataUrl(await compressImage(file)) : '';

export const profileToRow = (profile, userId, photoUrl = '') => ({
  id: userId,
  name: profile.name || 'New Member',
  full_name: profile.name || 'New Member',
  email: profile.email || '',
  phone: profile.phone || '',
  city: profile.city || '',
  state: profile.state || '',
  experience: profile.experience || '',
  skills: splitValues(profile.skills),
  looking_for: splitValues(profile.lookingFor || profile.looking_for),
  photo_url: photoUrl || profile.photoUrl || null,
  created_at: profile.createdAt || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const uploadProfilePhoto = async (userId, file) => {
  if (!supabase || !file) return '';
  const compressedFile = await compressImage(file);
  const extension = compressedFile.type === 'image/jpeg' ? 'jpg' : (compressedFile.name.split('.').pop()?.toLowerCase() || 'bin');
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from('profile-photos').upload(path, compressedFile, { upsert: true, contentType: compressedFile.type || 'application/octet-stream' });
  if (error) return fileToDataUrl(compressedFile);
  return supabase.storage.from('profile-photos').getPublicUrl(path).data.publicUrl;
};

export const saveProfile = async (userId, profile, photoFile) => {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured.') };
  const photoUrl = await uploadProfilePhoto(userId, photoFile);
  const { data, error } = await supabase.from('profiles').upsert(profileToRow(profile, userId, photoUrl), { onConflict: 'id' }).select().single();
  return { data, error };
};

export const rowToProfile = (row) => ({
  id: row.id,
  name: row.name || row.full_name || 'New Member',
  email: row.email || '',
  phone: row.phone || '',
  city: row.city || '',
  state: row.state || '',
  experience: row.experience || '',
  skills: Array.isArray(row.skills) ? row.skills.join(', ') : row.skills || '',
  lookingFor: Array.isArray(row.looking_for) ? row.looking_for.join(', ') : row.looking_for || '',
  photoUrl: row.photo_url || '',
  photoName: row.photo_url ? 'Profile photo' : '',
});
