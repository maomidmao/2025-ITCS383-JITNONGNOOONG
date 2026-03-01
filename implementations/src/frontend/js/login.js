    function switchTab(name) {
      ['login','register'].forEach(t => {
        const panel = document.getElementById('panel-' + t);
        const btn   = document.getElementById('tab-' + (t === 'login' ? 'login' : 'reg') + '-btn');
        const isActive = t === name;
        panel.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive);
      });
    }

    const urlTab = new URLSearchParams(location.search).get('tab');
    if (urlTab === 'register') switchTab('register');

    document.getElementById('loginForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      const email    = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPass').value;
      const btn      = document.getElementById('loginBtn');
      let valid      = true;

      if (!email || !email.includes('@')) {
        document.getElementById('loginEmailErr').classList.add('visible'); valid = false;
      } else { document.getElementById('loginEmailErr').classList.remove('visible'); }
      if (!password) {
        document.getElementById('loginPassErr').classList.add('visible'); valid = false;
      } else { document.getElementById('loginPassErr').classList.remove('visible'); }
      if (!valid) return;

      setLoading(btn, true);
      try {
        const data = await api.login(email, password);
        showAlert('loginAlert', 'เข้าสู่ระบบสำเร็จ! กำลังเปลี่ยนหน้า...', 'success');
        setTimeout(() => { location.href = data.redirect || '/pages/dogs.html'; }, 800);
      } catch (err) {
        showAlert('loginAlert', err.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', 'error');
        setLoading(btn, false);
      }
    });

    document.getElementById('regForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      const btn = document.getElementById('regBtn');
      let valid = true;

      const password   = document.getElementById('regPassword').value;
      const citizen_id = document.getElementById('regCitizenId').value.trim();

      if (password.length < 8) {
        document.getElementById('regPassErr').classList.add('visible');
        valid = false;
      } else {
        document.getElementById('regPassErr').classList.remove('visible');
      }

      if (!/^\d{13}$/.test(citizen_id)) {
        document.getElementById('regCitizenErr').classList.add('visible');
        valid = false;
      } else {
        document.getElementById('regCitizenErr').classList.remove('visible');
      }

      if (!valid) return;

      const payload = {
        firstName:  document.getElementById('regFirst').value.trim(),
        lastName:   document.getElementById('regLast').value.trim(),
        email:      document.getElementById('regEmail').value.trim(),
        citizen_id: citizen_id,
        phone:      document.getElementById('regPhone').value.trim(),
        password,
        role:       document.getElementById('regRole').value,
      };

      setLoading(btn, true);
      try {
        await api.register(payload);
        showAlert('regAlert', 'สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ', 'success');
        document.getElementById('regForm').reset();
        setTimeout(() => switchTab('login'), 2000);
      } catch (err) {
        showAlert('regAlert', err.message || 'เกิดข้อผิดพลาด', 'error');
      } finally {
        setLoading(btn, false);
      }
    });
