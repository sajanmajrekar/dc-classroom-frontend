import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, FolderOpen } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';

export default function Classrooms() {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchClasses = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_BASE_URL}/user/classes.php`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.status === 401) {
                    navigate('/login');
                    return;
                }
                const data = await res.json();
                if (data.status === 'success') setClasses(data.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, [navigate]);

    return (
        <div>
            <h1 className="title">My Classes</h1>
            <p className="subtitle">Select a training module to begin learning</p>

            {loading ? (
                <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    {classes.length === 0 ? (
                        <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                            <FolderOpen size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
                            <h3>No classes assigned yet</h3>
                            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Please contact your administrator to get access.</p>
                        </div>
                    ) : (
                        classes.map(cls => (
                            <Link to={`/classrooms/${cls.id}`} key={cls.id} className="glass-card" style={{ display: 'block' }}>
                                <div style={{ background: 'var(--accent-glow)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                    <BookOpen size={24} color="#fff" />
                                </div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: '#fff' }}>{cls.title}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                    {cls.description || 'No description provided.'}
                                </p>
                                <div style={{ marginTop: '20px', color: 'var(--accent-color)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    View Material &rarr;
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
