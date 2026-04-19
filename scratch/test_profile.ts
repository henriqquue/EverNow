import { prisma } from '../lib/db';
import { resolvePublicProfile } from '../lib/profile-governance';

async function testProfileResolution() {
  const viewerId = 'cmo37k2pr0005zm441ero49ng'; // Henrique
  const targetId = 'cmo3ol3u8001j9pg0x701zjsg'; // Henrique2
  
  console.log('--- TESTANDO RESOLUÇÃO DE PERFIL ---');
  try {
    const profile = await resolvePublicProfile(targetId, viewerId);
    console.log('Sucesso! Perfil resolvido:', profile?.name);
  } catch (err: any) {
    console.error('ERRO DETECTADO:', err.message);
    console.error('Stack:', err.stack);
  }
}

testProfileResolution();
