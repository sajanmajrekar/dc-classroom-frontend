import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../lib/api';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('users');
    const [data, setData] = useState({ users: [], classes: [], lectures: [], progress: [], assignments: [] });
    const [userForm, setUserForm] = useState({
        id: null,
        name: '',
        email: '',
        password: '',
        role: 'user',
        is_active: '1'
    });
    const [lectureForm, setLectureForm] = useState({
        id: null,
        class_id: '',
        title: '',
        type: 'text',
        content: '',
        resource_url: ''
    });
    const [lectureFilterClassId, setLectureFilterClassId] = useState('');
    const [modal, setModal] = useState(null);
    const [showUserPassword, setShowUserPassword] = useState(false);

    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    useEffect(() => {
        fetchUsers();
        fetchClasses();
        fetchLectures();
        fetchLectureProgress();
        fetchAssignments();
    }, []);

    const fetchUsers = async () => {
        const res = await fetch(`${API_BASE_URL}/admin/users.php`, { headers });
        const json = await res.json();
        if (json.data) setData(d => ({ ...d, users: json.data }));
    };

    const fetchClasses = async () => {
        const res = await fetch(`${API_BASE_URL}/admin/classes.php`, { headers });
        const json = await res.json();
        if (json.data) setData(d => ({ ...d, classes: json.data }));
    };

    const fetchLectures = async () => {
        const res = await fetch(`${API_BASE_URL}/admin/lectures.php`, { headers });
        const json = await res.json();
        if (json.data) setData(d => ({ ...d, lectures: json.data }));
    };

    const fetchLectureProgress = async () => {
        const res = await fetch(`${API_BASE_URL}/admin/lecture_progress.php`, { headers });
        const json = await res.json();
        if (json.data) setData(d => ({ ...d, progress: json.data }));
    };

    const fetchAssignments = async () => {
        const res = await fetch(`${API_BASE_URL}/admin/assign_class.php`, { headers });
        const json = await res.json();
        if (json.data) setData(d => ({ ...d, assignments: json.data }));
    };

    const completedUsersForLecture = (lectureId) => (
        data.progress.filter((progress) => String(progress.lecture_id) === String(lectureId))
    );

    const resetLectureForm = () => {
        setLectureForm({
            id: null,
            class_id: '',
            title: '',
            type: 'text',
            content: '',
            resource_url: ''
        });
    };

    const resetUserForm = () => {
        setUserForm({ id: null, name: '', email: '', password: '', role: 'user', is_active: '1' });
        setShowUserPassword(false);
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        const isEditing = Boolean(userForm.id);
        await fetch(`${API_BASE_URL}/admin/users.php`, {
            method: isEditing ? 'PUT' : 'POST',
            headers,
            body: JSON.stringify({ ...userForm, is_active: Number(userForm.is_active) })
        });
        resetUserForm();
        fetchUsers();
        setModal(null);
    };

    const handleEditUser = (user) => {
        setUserForm({
            id: user.id,
            name: user.name || '',
            email: user.email || '',
            password: '',
            role: user.role || 'user',
            is_active: String(user.is_active)
        });
        setShowUserPassword(false);
        setModal('user');
    };

    const handleUserStatus = async (user) => {
        await fetch(`${API_BASE_URL}/admin/users.php`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ id: user.id, is_active: user.is_active ? 0 : 1 })
        });
        fetchUsers();
    };

    const handleCreateClass = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        await fetch(`${API_BASE_URL}/admin/classes.php`, {
            method: 'POST', headers, body: JSON.stringify(Object.fromEntries(fd))
        });
        e.target.reset();
        fetchClasses();
        setModal(null);
    };

    const handleLectureSubmit = async (e) => {
        e.preventDefault();
        const method = lectureForm.id ? 'PUT' : 'POST';
        await fetch(`${API_BASE_URL}/admin/lectures.php`, {
            method,
            headers,
            body: JSON.stringify(lectureForm)
        });
        resetLectureForm();
        fetchLectures();
        fetchLectureProgress();
        setModal(null);
        alert(lectureForm.id ? 'Lecture updated' : 'Lecture added');
    };

    const handleEditLecture = (lecture) => {
        setLectureForm({
            id: lecture.id,
            class_id: String(lecture.class_id),
            title: lecture.title || '',
            type: lecture.type || 'text',
            content: lecture.content || '',
            resource_url: lecture.resource_url || ''
        });
        setModal('lecture');
    };

    const handleDeleteLecture = async (lectureId) => {
        const confirmed = window.confirm('Delete this lecture?');
        if (!confirmed) return;

        await fetch(`${API_BASE_URL}/admin/lectures.php`, {
            method: 'DELETE',
            headers,
            body: JSON.stringify({ id: lectureId })
        });

        if (lectureForm.id === lectureId) {
            resetLectureForm();
        }
        fetchLectures();
        fetchLectureProgress();
    };

    const handleAssignClass = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        await fetch(`${API_BASE_URL}/admin/assign_class.php`, {
            method: 'POST', headers, body: JSON.stringify(Object.fromEntries(fd))
        });
        e.target.reset();
        setModal(null);
        fetchAssignments();
        alert('Class assigned');
    };

    const handleRemoveAssignment = async (assignment) => {
        const confirmed = window.confirm(`Remove ${assignment.user_name}'s access to ${assignment.class_title}?`);
        if (!confirmed) return;

        await fetch(`${API_BASE_URL}/admin/assign_class.php`, {
            method: 'DELETE',
            headers,
            body: JSON.stringify({ user_id: assignment.user_id, class_id: assignment.class_id })
        });
        fetchAssignments();
    };

    const assignmentStatus = (assignment) => {
        const total = Number(assignment.total_lectures);
        const completed = Number(assignment.completed_lectures);
        if (total === 0) return 'No lectures';
        if (completed === 0) return 'Not started';
        if (completed === total) return 'Complete';
        return 'In progress';
    };

    return (
        <div>
            <h1 className="title">Admin Panel</h1>
            <p className="subtitle">Manage users, classes, and lectures</p>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                {['users', 'classes', 'lectures', 'assign'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? 'btn-primary' : 'btn-secondary'} style={{ textTransform: 'capitalize' }}>
                        {tab}
                    </button>
                ))}
            </div>

            <div className="glass-card">
                {activeTab === 'users' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <h3>Existing Users (Total: {data.users.length})</h3>
                            <button type="button" onClick={() => { resetUserForm(); setModal('user'); }} className="btn-primary">Add User</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
                            {data.users.map((user) => (
                                <article key={user.id} style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px', background: 'rgba(255, 255, 255, 0.02)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                                        <div>
                                            <h4 style={{ margin: 0 }}>{user.name}</h4>
                                            <p style={{ color: 'var(--text-muted)', margin: '6px 0 0' }}>{user.email}</p>
                                        </div>
                                        <span style={{ padding: '5px 9px', borderRadius: '999px', fontSize: '0.8rem', color: user.is_active ? '#86efac' : '#fca5a5', background: user.is_active ? 'rgba(34, 197, 94, 0.14)' : 'rgba(239, 68, 68, 0.14)' }}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', margin: '14px 0', textTransform: 'capitalize' }}>Role: {user.role}</p>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        <button type="button" onClick={() => handleEditUser(user)} className="btn-secondary">Manage</button>
                                        <button type="button" onClick={() => handleUserStatus(user)} className="btn-secondary" style={{ color: user.is_active ? 'var(--danger-color)' : '#86efac', borderColor: user.is_active ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)' }}>
                                            {user.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'classes' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <h3>Existing Classes (Total: {data.classes.length})</h3>
                            <button type="button" onClick={() => setModal('class')} className="btn-primary">Add Class</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
                            {data.classes.map((classroom) => {
                                const classLectures = data.lectures.filter(
                                    (lecture) => String(lecture.class_id) === String(classroom.id)
                                );

                                return (
                                    <section key={classroom.id} style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px', background: 'rgba(255, 255, 255, 0.02)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{classroom.title}</h4>
                                                {classroom.description && (
                                                    <p style={{ color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: '1.5' }}>{classroom.description}</p>
                                                )}
                                            </div>
                                            <span style={{ color: 'var(--accent-color)', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                                {classLectures.length} {classLectures.length === 1 ? 'lecture' : 'lectures'}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                                            {classLectures.length === 0 ? (
                                                <p style={{ color: 'var(--text-muted)', margin: 0 }}>No lectures have been added yet.</p>
                                            ) : (
                                                classLectures.map((lecture) => (
                                                    <article key={lecture.id} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
                                                            <div>
                                                                <h5 style={{ margin: 0, fontSize: '0.95rem' }}>{lecture.title}</h5>
                                                                <span style={{ display: 'block', color: 'var(--text-muted)', textTransform: 'capitalize', fontSize: '0.8rem', marginTop: '5px' }}>{lecture.type}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <button type="button" onClick={() => handleEditLecture(lecture)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>Edit</button>
                                                                <button type="button" onClick={() => handleDeleteLecture(lecture.id)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem', color: 'var(--danger-color)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>Delete</button>
                                                            </div>
                                                        </div>
                                                        {lecture.content && (
                                                            <p style={{ color: 'var(--text-muted)', margin: '10px 0 0', fontSize: '0.88rem', lineHeight: '1.45' }}>{lecture.content}</p>
                                                        )}
                                                        <p style={{ color: 'var(--text-muted)', margin: '10px 0 0', fontSize: '0.82rem', lineHeight: '1.45' }}>
                                                            Done by: {completedUsersForLecture(lecture.id).length ? completedUsersForLecture(lecture.id).map((progress) => progress.user_name).join(', ') : 'No users yet'}
                                                        </p>
                                                    </article>
                                                ))
                                            )}
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'lectures' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div>
                                <h3>Lecture Content</h3>
                                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                                    View and manage the lecture materials for every class.
                                </p>
                            </div>
                            <button type="button" onClick={() => { resetLectureForm(); setModal('lecture'); }} className="btn-primary">Add Lecture</button>
                        </div>

                        <div style={{ marginTop: '28px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                                <h3>Existing Lectures</h3>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <select
                                        value={lectureFilterClassId}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setLectureFilterClassId(value);
                                        }}
                                        style={{ minWidth: '220px' }}
                                    >
                                        <option value="">All Classes</option>
                                        {data.classes.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                    </select>
                                    <button type="button" onClick={fetchLectures} className="btn-secondary">
                                        Refresh
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                                {data.lectures.filter((lecture) => !lectureFilterClassId || String(lecture.class_id) === lectureFilterClassId).length === 0 ? (
                                    <div style={{ color: 'var(--text-muted)' }}>
                                        No lectures found for the selected class.
                                    </div>
                                ) : (
                                    data.lectures
                                        .filter((lecture) => !lectureFilterClassId || String(lecture.class_id) === lectureFilterClassId)
                                        .map((lecture) => (
                                        <div key={lecture.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                                <div>
                                                    <div style={{ color: 'var(--accent-color)', fontSize: '0.85rem', marginBottom: '6px' }}>
                                                        {lecture.class_title}
                                                    </div>
                                                    <h4 style={{ margin: 0 }}>{lecture.title}</h4>
                                                    <div style={{ color: 'var(--text-muted)', marginTop: '8px', textTransform: 'capitalize' }}>
                                                        Type: {lecture.type}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                                    <button type="button" onClick={() => handleEditLecture(lecture)} className="btn-secondary">
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteLecture(lecture.id)}
                                                        className="btn-secondary"
                                                        style={{ color: 'var(--danger-color)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                            {lecture.content && (
                                                <p style={{ color: 'var(--text-muted)', marginTop: '12px', lineHeight: '1.6' }}>
                                                    {lecture.content}
                                                </p>
                                            )}
                                            {lecture.resource_url && (
                                                <a
                                                    href={lecture.resource_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ display: 'inline-block', marginTop: '10px', color: 'var(--accent-color)' }}
                                                >
                                                    Open Material
                                                </a>
                                            )}
                                            <p style={{ color: 'var(--text-muted)', marginTop: '12px', fontSize: '0.88rem' }}>
                                                Done by: {completedUsersForLecture(lecture.id).length ? completedUsersForLecture(lecture.id).map((progress) => progress.user_name).join(', ') : 'No users yet'}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'assign' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div>
                                <h3>Class Assignments</h3>
                                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Choose a user and class in the assignment popup.</p>
                            </div>
                            <button type="button" onClick={() => setModal('assign')} className="btn-primary">Assign User to Class</button>
                        </div>
                        <div style={{ marginTop: '28px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <h3>Assigned Users ({data.assignments.length})</h3>
                                <button type="button" onClick={fetchAssignments} className="btn-secondary">Refresh</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                                {data.assignments.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)' }}>No users have been assigned to a class yet.</p>
                                ) : (
                                    data.assignments.map((assignment) => {
                                        const status = assignmentStatus(assignment);
                                        const complete = status === 'Complete';
                                        return (
                                            <article key={`${assignment.user_id}-${assignment.class_id}`} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <div>
                                                    <h4 style={{ margin: 0 }}>{assignment.user_name}</h4>
                                                    <p style={{ color: 'var(--text-muted)', margin: '5px 0 0' }}>{assignment.user_email}</p>
                                                    <p style={{ margin: '10px 0 0', color: 'var(--accent-color)' }}>{assignment.class_title}</p>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <span style={{ display: 'inline-block', color: complete ? '#86efac' : status === 'Not started' ? '#fca5a5' : 'var(--accent-color)', fontSize: '0.9rem' }}>{status}</span>
                                                        <p style={{ color: 'var(--text-muted)', margin: '5px 0 0', fontSize: '0.85rem' }}>{assignment.completed_lectures} of {assignment.total_lectures} lectures done</p>
                                                    </div>
                                                    <button type="button" onClick={() => handleRemoveAssignment(assignment)} className="btn-secondary" style={{ color: 'var(--danger-color)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>Remove Access</button>
                                                </div>
                                            </article>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {modal && (
                <div className="admin-modal-backdrop" role="presentation" onMouseDown={() => setModal(null)}>
                    <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h3 id="admin-modal-title">
                                {modal === 'user' && (userForm.id ? 'Manage User' : 'Add User')}
                                {modal === 'class' && 'Create Class'}
                                {modal === 'lecture' && (lectureForm.id ? 'Edit Lecture' : 'Add Lecture')}
                                {modal === 'assign' && 'Assign User to Class'}
                            </h3>
                            <button type="button" className="admin-modal-close" onClick={() => setModal(null)} aria-label="Close popup">x</button>
                        </div>

                        {modal === 'user' && (
                            <form onSubmit={handleUserSubmit} className="admin-modal-form" autoComplete="off">
                                <input name="name" placeholder="Name" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} autoComplete="off" required />
                                <input name="email" type="email" placeholder="Email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} autoComplete="off" required />
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input name="password" type={showUserPassword ? 'text' : 'password'} placeholder={userForm.id ? 'New password (leave blank to keep current)' : 'Password'} value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} autoComplete="new-password" required={!userForm.id} />
                                    <button type="button" className="btn-secondary" onClick={() => setShowUserPassword(!showUserPassword)} style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                                        {showUserPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                <select name="role" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <select name="is_active" value={userForm.is_active} onChange={(e) => setUserForm({ ...userForm, is_active: e.target.value })}>
                                    <option value="1">Active - can access classroom</option>
                                    <option value="0">Inactive - access blocked</option>
                                </select>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5' }}>Passwords are securely protected and cannot be viewed. Enter a new password here to reset it.</p>
                                <button type="submit" className="btn-primary">{userForm.id ? 'Save User Changes' : 'Add User'}</button>
                            </form>
                        )}

                        {modal === 'class' && (
                            <form onSubmit={handleCreateClass} className="admin-modal-form">
                                <input name="title" placeholder="Class Title" required />
                                <textarea name="description" placeholder="Class description" rows={4}></textarea>
                                <button type="submit" className="btn-primary">Create Class</button>
                            </form>
                        )}

                        {modal === 'lecture' && (
                            <form onSubmit={handleLectureSubmit} className="admin-modal-form">
                                <select name="class_id" value={lectureForm.class_id} onChange={(e) => setLectureForm({ ...lectureForm, class_id: e.target.value })} required>
                                    <option value="">Select a Class...</option>
                                    {data.classes.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                </select>
                                <input name="title" placeholder="Lecture Title" value={lectureForm.title} onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })} required />
                                <select name="type" value={lectureForm.type} onChange={(e) => setLectureForm({ ...lectureForm, type: e.target.value })} required>
                                    <option value="text">Text Content / Notes</option>
                                    <option value="youtube">YouTube Link</option>
                                    <option value="drive">Google Drive Link</option>
                                    <option value="pdf">PDF Link</option>
                                    <option value="link">Other External Link</option>
                                </select>
                                <textarea name="content" placeholder="Lecture notes or text content..." rows={5} value={lectureForm.content} onChange={(e) => setLectureForm({ ...lectureForm, content: e.target.value })}></textarea>
                                <input name="resource_url" placeholder="External URL (if any)" value={lectureForm.resource_url} onChange={(e) => setLectureForm({ ...lectureForm, resource_url: e.target.value })} />
                                <button type="submit" className="btn-primary">{lectureForm.id ? 'Update Lecture' : 'Add Lecture'}</button>
                            </form>
                        )}

                        {modal === 'assign' && (
                            <form onSubmit={handleAssignClass} className="admin-modal-form">
                                <select name="user_id" required>
                                    <option value="">Select User...</option>
                                    {data.users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                                </select>
                                <select name="class_id" required>
                                    <option value="">Select Class...</option>
                                    {data.classes.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                </select>
                                <button type="submit" className="btn-primary">Assign Class</button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
