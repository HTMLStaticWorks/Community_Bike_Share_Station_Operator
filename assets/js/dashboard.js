document.addEventListener('DOMContentLoaded', () => {
  // Ensure we are authenticated on dashboard
  localStorage.setItem('isAuthenticated', 'true');
  
  /* ==========================================================================
     TAB SWITCHING LOGIC
     ========================================================================== */
  const tabLinks = document.querySelectorAll('.dashboard-nav .nav-link');
  const tabContents = document.querySelectorAll('.dashboard-tab');
  
  function switchTab(tabId) {
    // Remove active class from all links and tabs
    tabLinks.forEach(link => link.classList.remove('active'));
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Add active class to target link and tab
    const targetLink = document.querySelector(`.dashboard-nav .nav-link[data-tab="${tabId}"]`);
    const targetTab = document.getElementById(`tab-${tabId}`);
    
    if (targetLink) targetLink.classList.add('active');
    if (targetTab) targetTab.classList.add('active');
    
    // Close sidebar on mobile after clicking
    if (window.innerWidth <= 1024) {
      document.querySelector('.dashboard-sidebar').classList.remove('active');
      document.querySelector('.dashboard-overlay').classList.remove('active');
    }
  }

  tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = link.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  /* ==========================================================================
     MOBILE SIDEBAR TOGGLE
     ========================================================================== */
  const sidebarToggle = document.querySelector('.dashboard-sidebar-toggle');
  const sidebar = document.querySelector('.dashboard-sidebar');
  const overlay = document.querySelector('.dashboard-overlay');
  
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.add('active');
      overlay.classList.add('active');
    });
  }
  
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
  }
  
  /* ==========================================================================
     UNLOCK BIKE FLOW
     ========================================================================== */
  const unlockForm = document.getElementById('unlockForm');
  if (unlockForm) {
    unlockForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const codeInput = document.getElementById('bikeCode');
      const code = codeInput.value.trim();
      const errorMsg = document.getElementById('unlockError');
      const btn = unlockForm.querySelector('button');
      
      // Basic validation: 5 digit numeric/alphanumeric
      const codeRegex = /^[A-Za-z0-9]{5}$/;
      
      if (!codeRegex.test(code)) {
        codeInput.classList.add('error');
        errorMsg.style.display = 'block';
      } else {
        codeInput.classList.remove('error');
        codeInput.classList.add('success');
        errorMsg.style.display = 'none';
        
        btn.innerHTML = '<i data-lucide="loader" class="spin"></i> Unlocking...';
        lucide.createIcons();
        
        // Simulate API call
        setTimeout(() => {
          document.getElementById('unlockStep1').style.display = 'none';
          document.getElementById('unlockStep2').style.display = 'block';
        }, 1500);
      }
    });
  }
  
  const finishRideBtn = document.getElementById('finishRideBtn');
  if (finishRideBtn) {
    finishRideBtn.addEventListener('click', () => {
      document.getElementById('unlockStep2').style.display = 'none';
      document.getElementById('unlockStep1').style.display = 'block';
      document.getElementById('bikeCode').value = '';
      document.getElementById('bikeCode').classList.remove('success');
      switchTab('history');
    });
  }
  
  // Also link quick unlock buttons from Overview
  const quickUnlockBtns = document.querySelectorAll('.quick-unlock-btn');
  quickUnlockBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab('unlock');
    });
  });

  /* ==========================================================================
     LOGOUT LOGIC
     ========================================================================== */
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.setItem('isAuthenticated', 'false');
      window.location.href = 'index.html';
    });
  }
});
