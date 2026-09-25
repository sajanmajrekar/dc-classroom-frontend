import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlayCircle, FileText, Link as LinkIcon, Paperclip, CheckCircle, Circle } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';

export default function ClassDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savingResourceId, setSavingResourceId] = useState(null);

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
                if (data.status === 'success') {
                    setLectures(data.data);
                } else {
                    setError(data.message || 'Unable to load this classroom.');
                }
            } catch (e) {
                console.error(e);
                setError('Unable to load this classroom. Please try again later.');
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

    const toggleResourceCompletion = async (lectureId, resource) => {
        if (!resource.id) return;

        const completed = Number(resource.is_completed) !== 1;
        const token = localStorage.getItem('token');
        setSavingResourceId(resource.id);

        try {
            const res = await fetch(`${API_BASE_URL}/user/lecture_progress.php`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ resource_id: resource.id, completed })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setLectures((current) => current.map((lecture) => (
                    lecture.id === lectureId
                        ? {
                            ...lecture,
                            resources: lecture.resources.map((item) => (
                                item.id === resource.id ? { ...item, is_completed: completed ? 1 : 0 } : item
                            ))
                        }
                        : lecture
                )));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSavingResourceId(null);
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
            ) : error ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ color: 'var(--danger-color)' }}>{error}</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {lectures.length === 0 ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
                            <p style={{ color: 'var(--text-muted)' }}>No lectures available yet.</p>
                        </div>
                    ) : (
                        lectures.map((lec, idx) => {
                            const resources = lec.resources?.length
                                ? lec.resources
                                : lec.resource_url ? [{ label: 'Lecture material', resource_url: lec.resource_url }] : [];

                            return (
                            <div key={lec.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {getIconForType(lec.type)}
                                        <h3 style={{ margin: 0, fontSize: '24px', color: '#fff' }}>
                                            Lecture {String(idx + 1).padStart(2, '0')} &ndash; {lec.title}
                                        </h3>
                                    </div>
                                </div>
                                {lec.subtitle && (
                                    <p style={{ color: 'var(--accent-color)', margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>{lec.subtitle}</p>
                                )}
                                {lec.content && (
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px' }}>
                                        {lec.content}
                                    </div>
                                )}
                                {resources.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {resources.map((resource, resourceIndex) => {
                                            const isCompleted = Number(resource.is_completed) === 1;
                                            const isSaving = savingResourceId === resource.id;
                                            return (
                                                <div key={resource.id || `${lec.id}-${resourceIndex}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '10px', flexWrap: 'wrap' }}>
                                                    <a href={resource.resource_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                                                        {resource.label || `Open Material ${resourceIndex + 1}`}
                                                    </a>
                                                    <button
                                                        type="button"
                                                        className={isCompleted ? 'btn-secondary' : 'btn-primary'}
                                                        onClick={() => toggleResourceCompletion(lec.id, resource)}
                                                        disabled={!resource.id || isSaving}
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 12px', opacity: !resource.id || isSaving ? 0.65 : 1 }}
                                                    >
                                                        {isCompleted ? <CheckCircle size={16} /> : <Circle size={16} />}
                                                        {isSaving ? 'Saving...' : isCompleted ? 'Done' : 'Mark Done'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
