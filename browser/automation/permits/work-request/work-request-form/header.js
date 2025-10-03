function createFixedHeaderWithNav(titleText, navItems) {
  // Create header element
  const header = document.createElement('header');

  // Style the header
  Object.assign(header.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    backgroundColor: '#333',
    color: '#fff',
    padding: '10px 20px',
    fontSize: '20px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
    zIndex: '1000',
    boxSizing: 'border-box',
  });

  // Create title container
  const title = document.createElement('div');
  title.textContent = titleText;
  title.style.flex = '1';
  title.style.textAlign = 'left';

  // Create navigation container
  const nav = document.createElement('nav');
  nav.style.display = 'flex';
  nav.style.gap = '15px';

  // Create buttons for each nav item
  navItems.forEach(item => {
    const button = document.createElement('button');
    button.textContent = item.label;
    button.style.padding = '8px 14px';
    button.style.background = '#555';
    button.style.color = '#fff';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';

    // Add click handler for navigation
    button.addEventListener('click', () => {
      if (typeof item.onClick === 'function') {
        item.onClick();
      } else if (item.url) {
        window.location.href = item.url;
      }
    });

    nav.appendChild(button);
  });

  // Append title and nav to header
  header.appendChild(title);
  header.appendChild(nav);

  // Insert the header at the top of body
  document.body.insertBefore(header, document.body.firstChild);

  // Add padding to body to prevent content being hidden behind fixed header
  const headerHeight = header.offsetHeight;
  document.body.style.paddingTop = headerHeight + 'px';

  return header;
}    
    
  function openFile(file) {
        window.location.href = file;
    }

// Example usage:
createFixedHeaderWithNav('Jackson Generation', [
  // { label: 'Home', url: './index.html' },
  // { label: 'Login', url: './login.html' },
  // { label: 'Register', url: './register.html' },
  // { label: 'Signature', url: './signature.html' },
  // { label: 'Log Out', onClick: ()=>logOut()}
]);

