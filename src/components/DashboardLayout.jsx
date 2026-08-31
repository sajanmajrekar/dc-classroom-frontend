import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, LogOut, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import digichefsLogo from '../assets/digichefs-logo.svg';

export default function DashboardLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const u = localStorage.getItem('user');
        if (!u) {
            navigate('/login');
        } else {
            setUser(JSON.parse(u));
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    const linkStyle = (path) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '8px',
        color: location.pathname.startsWith(path) ? '#fff' : 'var(--text-muted)',
        background: location.pathname.startsWith(path) ? 'var(--accent-glow)' : 'transparent',
        textDecoration: 'none',
        transition: 'all 0.3s ease',
        marginBottom: '8px',
        fontWeight: 500
    });

    if (!user) return null;

    return (
        <div className="app-container">
            {/* Sidebar */}
            <aside style={{
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                width: '250px',
                background: 'rgba(30, 41, 59, 0.4)',
                backdropFilter: 'blur(20px)',
                borderRight: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                padding: '24px 16px'
            }}>
                <div style={{ marginBottom: '40px', padding: '0 8px' }}>
                    <img
                        src={digichefsLogo}
                        alt="digichefs"
                        style={{ display: 'block', width: '160px', maxWidth: '100%', height: 'auto' }}
                    />
                </div>

                <nav style={{ flex: 1 }}>
                    <Link to="/classrooms" style={linkStyle('/classrooms')}>
                        <BookOpen size={20} /> My Classes
                    </Link>
                    {user?.role === 'admin' && (
                        <Link to="/admin" style={linkStyle('/admin')}>
                            <Settings size={20} /> Admin Panel
                        </Link>
                    )}
                </nav>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: 'auto' }}>
                    <div style={{ padding: '0 8px 16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Logged in as <br /><strong style={{ color: '#fff' }}>{user.name}</strong>
                    </div>
                    <button onClick={handleLogout} style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                        width: '100%', borderRadius: '8px', background: 'transparent',
                        color: 'var(--danger-color)', cursor: 'pointer', border: '1px solid transparent',
                        fontFamily: 'inherit', fontWeight: '500', transition: 'all 0.3s ease'
                    }} onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateY(0)' }}>
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
