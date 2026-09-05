async function main() {
  console.log('Logging in as Admin...');
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '01571305964', password: 'AdminPassword123!' })
  });
  
  if (!loginRes.ok) {
    throw new Error('Admin login failed: ' + (await loginRes.text()));
  }

  const cookie = loginRes.headers.get('set-cookie')?.split(';')[0] || '';
  console.log('Admin login successful. Updating site settings...');

  const updateRes = await fetch('http://localhost:3000/api/admin/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie
    },
    body: JSON.stringify({
      whatsappNumber: '01640581442',
      contactPhone: '01640581442'
    })
  });

  const updateData = await updateRes.json();
  console.log('Update response:', updateData);

  const verifyRes = await fetch('http://localhost:3000/api/admin/settings');
  const verifyData = await verifyRes.json();
  console.log('VERIFIED SETTINGS IN DB:', {
    whatsappNumber: verifyData.settings.whatsappNumber,
    contactPhone: verifyData.settings.contactPhone
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
