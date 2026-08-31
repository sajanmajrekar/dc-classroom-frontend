import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlayCircle, FileText, Link as LinkIcon, Paperclip, CheckCircle, Circle } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';

export default function ClassDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingLectureId, setSavingLectureId] = useState(null);

    useEffect(() => {
        const fetchLectures = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_BASE_URL}/user/lectures.php?class_id=${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.status === 401 || res.status === 403) {
                    navigate('/classrooms');
                    return;
                }
                const data = await res.json();
                if (data.status === 'success') setLectures(data.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchLectures();
    }, [id, navigate]);

    const getIconForType = (type) => {
        switch (type) {
            case 'youtube': return <PlayCircle size={20} color="#EF4444" />;
            case 'pdf': return <FileText size={20} color="#3B82F6" />;
            case 'drive': return <Paperclip size={20} color="#10B981" />;
            default: return <LinkIcon size={20} color="#8B5CF6" />;
        }
    };

    const toggleLectureCompletion = async (lecture) => {
        const completed = Number(lecture.is_completed) !== 1;
        const token = localStorage.getItem('token');
        setSavingLectureId(lecture.id);

        try {
            const res = await fetch(`${API_BASE_URL}/user/lecture_progress.php`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ lecture_id: lecture.id, completed })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setLectures((current) => current.map((item) => (
                    item.id === lecture.id ? { ...item, is_completed: completed ? 1 : 0 } : item
                )));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSavingLectureId(null);
        }
    };

    return (
        <div>
            <button onClick={() => navigate('/classrooms')} style={{ background: 'transparent', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <ArrowLeft size={16} /> Back to Classes
            </button>

            <h1 className="title">Lectures & Materials</h1>
            <p className="subtitle">Course content available for this module</p>

            {loading ? (
                <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {lectures.length === 0 ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
                            <p style={{ color: 'var(--text-muted)' }}>No lectures available yet.</p>
                        </div>
                    ) : (
                        lectures.map((lec, idx) => (
                            <div key={lec.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {getIconForType(lec.type)}
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>
                                            Lecture {String(idx + 1).padStart(2, '0')} &ndash; {lec.title}
                                        </h3>
                                    </div>
                                    <button
                                        type="button"
                                        className={Number(lec.is_completed) === 1 ? 'btn-secondary' : 'btn-primary'}
                                        onClick={() => toggleLectureCompletion(lec)}
                                        disabled={savingLectureId === lec.id}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', opacity: savingLectureId === lec.id ? 0.7 : 1 }}
                                    >
                                        {Number(lec.is_completed) === 1 ? <CheckCircle size={17} /> : <Circle size={17} />}
                                        {savingLectureId === lec.id ? 'Saving...' : Number(lec.is_completed) === 1 ? 'Done' : 'Mark as Done'}
                                    </button>
                                </div>
                                {lec.content && (
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px' }}>
                                        {lec.content}
                                    </div>
                                )}
                                {lec.resource_url && (
                                    <div>
                                        <a href={lec.resource_url} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ display: 'inline-flex', padding: '8px 16px', fontSize: '0.9rem' }}>
                                            Open Link / View Material
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
