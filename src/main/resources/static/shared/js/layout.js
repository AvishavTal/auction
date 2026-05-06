export async function injectNavbar() {
    try {
        const response = await fetch('../../shared/components/navbar.html');
        if (!response.ok) throw new Error('Navbar component missing');
        
        const html = await response.text();
        const container = document.getElementById('navbar-placeholder');
        
        if (container) {
            container.innerHTML = html;
        }
    } catch (err) {
        console.error('Layout Error:', err);
    }
}