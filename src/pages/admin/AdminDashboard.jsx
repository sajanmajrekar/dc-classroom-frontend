import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../lib/api';
import RichTextEditor, { RichTextContent } from '../../components/RichTextEditor';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('users');
    const [data, setData] = useState({ users: [], classes: [], lectures: [], assignments: [] });
    const [userForm, setUserForm] = useState({
        id: null,
        name: '',
        email: '',
        password: '',
        role: 'user',
        is_active: '1',
        class_ids: []
    });
    const [lectureForm, setLectureForm] = useState({
        id: null,
        class_id: '',
        title: '',
        subtitle: '',
        type: 'text',
        content: '',
        resources: [{ label: '', resource_url: '' }]
    });
    const [modal, setModal] = useState(null);
    const [confirmation, setConfirmation] = useState(null);
    const [notice, setNotice] = useState(null);
    const [showUserPassword, setShowUserPassword] = useState(false);
    const [assignmentForm, setAssignmentForm] = useState({ user_id: '', class_ids: [] });

    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    useEffect(() => {
        fetchUsers();
        fetchClasses();
        fetchLectures();
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

    const fetchAssignments = async () => {
        const res = await fetch(`${API_BASE_URL}/admin/assign_class.php`, { headers });
        const json = await res.json();
        if (json.data) setData(d => ({ ...d, assignments: json.data }));
    };

    const isUserActive = (user) => Number(user.is_active) === 1;

    const resetLectureForm = () => {
        setLectureForm({
            id: null,
            class_id: '',
            title: '',
            subtitle: '',
            type: 'text',
            content: '',
            resources: [{ label: '', resource_url: '' }]
        });
    };

    const openLectureForClass = (classId) => {
        resetLectureForm();
        setLectureForm((current) => ({ ...current, class_id: String(classId) }));
        setModal('lecture');
    };

    const updateLectureResource = (index, field, value) => {
        setLectureForm((current) => ({
            ...current,
            resources: current.resources.map((resource, resourceIndex) => (
                resourceIndex === index ? { ...resource, [field]: value } : resource
            ))
        }));
    };

    const addLectureResource = () => {
        setLectureForm((current) => ({
            ...current,
            resources: [...current.resources, { label: '', resource_url: '' }]
        }));
    };

    const removeLectureResource = (index) => {
        setLectureForm((current) => ({
            ...current,
            resources: current.resources.filter((_, resourceIndex) => resourceIndex !== index)
        }));
    };

    const resetUserForm = () => {
        setUserForm({ id: null, name: '', email: '', password: '', role: 'user', is_active: '1', class_ids: [] });
        setShowUserPassword(false);
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        const isEditing = Boolean(userForm.id);
        const { class_ids: classIds, ...userPayload } = userForm;
        const response = await fetch(`${API_BASE_URL}/admin/users.php`, {
            method: isEditing ? 'PUT' : 'POST',
            headers,
            body: JSON.stringify({ ...userPayload, is_active: Number(userForm.is_active) })
        });
        const result = await response.json();

        let assignmentResults = [];
        if (!isEditing && classIds.length && result.user_id) {
            assignmentResults = await Promise.all(classIds.map((classId) => fetch(`${API_BASE_URL}/admin/assign_class.php`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ user_id: result.user_id, class_id: classId })
            }).then((assignmentResponse) => assignmentResponse.json())));
        }
        resetUserForm();
        fetchUsers();
        fetchAssignments();
        setModal(null);
        setNotice({
            title: isEditing ? 'User updated' : 'User created',
            message: !isEditing && !result.mail_sent
                ? 'The user was created, but the login email could not be sent. Please check the server mail configuration.'
                : !isEditing && classIds.length && assignmentResults.some((assignment) => assignment.new_assignment !== false && !assignment.mail_sent)
                    ? 'The user was created and assigned to the selected classes, but one or more assignment emails could not be sent.'
                    : !isEditing && classIds.length
                        ? 'The user was created, assigned to the selected classes, and notified by email.'
                        : 'The user details have been saved.'
        });
    };

    const handleEditUser = (user) => {
        setUserForm({
            id: user.id,
            name: user.name || '',
            email: user.email || '',
            password: '',
            role: user.role || 'user',
            is_active: String(user.is_active),
            class_ids: []
        });
        setShowUserPassword(false);
        setModal('user');
    };

    const handleUserStatus = async (user) => {
        const nextStatus = isUserActive(user) ? 0 : 1;
        const response = await fetch(`${API_BASE_URL}/admin/users.php`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ id: user.id, is_active: nextStatus })
        });
        const result = await response.json();
        if (result.status !== 'success') return;
        fetchUsers();
        setNotice({
            title: nextStatus ? 'User activated' : 'User deactivated',
            message: nextStatus ? `${user.name} can now access the classroom.` : `${user.name}'s classroom access has been blocked.`
        });
    };

    const deleteUser = async (user) => {
        const response = await fetch(`${API_BASE_URL}/admin/users.php`, {
            method: 'DELETE',
            headers,
            body: JSON.stringify({ id: user.id })
        });
        const result = await response.json();
        if (result.status !== 'success') return;
        fetchUsers();
        fetchAssignments();
        setNotice({ title: 'User deleted', message: `${user.name} and their class assignments have been removed.` });
    };

    const handleDeleteUser = (user) => {
        setConfirmation({
            title: 'Delete user?',
            message: `${user.name} will be permanently deleted, including their class assignments and completion records.`,
            confirmLabel: 'Delete User',
            onConfirm: () => deleteUser(user)
        });
    };

    const assignedClassesForUser = (userId) => (
        data.assignments.filter((assignment) => String(assignment.user_id) === String(userId))
    );

    const toggleUserClassSelection = (classId) => {
        setUserForm((current) => ({
            ...current,
            class_ids: current.class_ids.includes(String(classId))
                ? current.class_ids.filter((id) => id !== String(classId))
                : [...current.class_ids, String(classId)]
        }));
    };

    const handleAssignClassToUser = async () => {
        if (!userForm.id || !userForm.class_ids.length) return;

        const results = await Promise.all(userForm.class_ids.map((classId) => fetch(`${API_BASE_URL}/admin/assign_class.php`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ user_id: userForm.id, class_id: classId })
        }).then((response) => response.json())));
        setUserForm((current) => ({ ...current, class_ids: [] }));
        fetchAssignments();
        setNotice({
            title: 'Classes assigned',
            message: results.some((result) => result.new_assignment !== false && !result.mail_sent)
                ? 'The user can access the selected classes, but one or more notification emails could not be sent.'
                : 'The user can now access the selected classes and has been notified by email.'
        });
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

    const deleteClass = async (classroom) => {
        const response = await fetch(`${API_BASE_URL}/admin/classes.php`, {
            method: 'DELETE',
            headers,
            body: JSON.stringify({ id: classroom.id })
        });
        const result = await response.json();
        if (result.status !== 'success') return;
        fetchClasses();
        fetchLectures();
        fetchAssignments();
        setNotice({ title: 'Class deleted', message: `${classroom.title} and its lectures have been removed.` });
    };

    const handleDeleteClass = (classroom) => {
        setConfirmation({
            title: 'Delete class?',
            message: `${classroom.title}, all of its lectures, resources, assignments, and completion records will be permanently deleted.`,
            confirmLabel: 'Delete Class',
            onConfirm: () => deleteClass(classroom)
        });
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
        setModal(null);
        setNotice({
            title: lectureForm.id ? 'Lecture updated' : 'Lecture added',
            message: lectureForm.id ? 'The lecture changes have been saved.' : 'The lecture has been added to this class.'
        });
    };

    const handleEditLecture = (lecture) => {
        setLectureForm({
            id: lecture.id,
            class_id: String(lecture.class_id),
            title: lecture.title || '',
            subtitle: lecture.subtitle || '',
            type: lecture.type || 'text',
            content: lecture.content || '',
            resources: lecture.resources?.length
                ? lecture.resources.map((resource) => ({ label: resource.label || '', resource_url: resource.resource_url || '' }))
                : [{ label: '', resource_url: lecture.resource_url || '' }]
        });
        setModal('lecture');
    };

    const deleteLecture = async (lectureId) => {
        await fetch(`${API_BASE_URL}/admin/lectures.php`, {
            method: 'DELETE',
            headers,
            body: JSON.stringify({ id: lectureId })
        });

        if (lectureForm.id === lectureId) {
            resetLectureForm();
        }
        fetchLectures();
        setNotice({ title: 'Lecture deleted', message: 'The lecture has been removed from the class.' });
    };

    const handleDeleteLecture = (lecture) => {
        setConfirmation({
            title: 'Delete lecture?',
            message: `"${lecture.title}" will be permanently removed from this class.`,
            confirmLabel: 'Delete Lecture',
            onConfirm: () => deleteLecture(lecture.id)
        });
    };

    const handleAssignClass = async (e) => {
        e.preventDefault();
        if (!assignmentForm.user_id || !assignmentForm.class_ids.length) return;
        const results = await Promise.all(assignmentForm.class_ids.map((classId) => fetch(`${API_BASE_URL}/admin/assign_class.php`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ user_id: assignmentForm.user_id, class_id: classId })
        }).then((response) => response.json())));
        setAssignmentForm({ user_id: '', class_ids: [] });
        setModal(null);
        fetchAssignments();
        setNotice({
            title: 'Classes assigned',
            message: results.some((result) => result.new_assignment !== false && !result.mail_sent)
                ? 'The user can access the selected classes, but one or more notification emails could not be sent.'
                : 'The user can now access the selected classes and has been notified by email.'
        });
    };

    const openAssignModal = () => {
        setAssignmentForm({ user_id: '', class_ids: [] });
        setModal('assign');
    };

    const toggleAssignmentClass = (classId) => {
        setAssignmentForm((current) => ({
            ...current,
            class_ids: current.class_ids.includes(String(classId))
                ? current.class_ids.filter((id) => id !== String(classId))
                : [...current.class_ids, String(classId)]
        }));
    };

    const removeAssignment = async (assignment) => {
        await fetch(`${API_BASE_URL}/admin/assign_class.php`, {
            method: 'DELETE',
            headers,
            body: JSON.stringify({ user_id: assignment.user_id, class_id: assignment.class_id })
        });
        fetchAssignments();
        setNotice({ title: 'Access removed', message: `${assignment.user_name} can no longer access ${assignment.class_title}.` });
    };

    const handleRemoveAssignment = (assignment) => {
        setConfirmation({
            title: 'Remove class access?',
            message: `${assignment.user_name} will no longer be able to open ${assignment.class_title}.`,
            confirmLabel: 'Remove Access',
            onConfirm: () => removeAssignment(assignment)
        });
    };

    const lectureClass = data.classes.find((classroom) => String(classroom.id) === String(lectureForm.class_id));

    return (
        <div>
            <h1 className="title">Admin Panel</h1>
            <p className="subtitle">Manage users, classes, and lectures</p>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                {['users', 'classes', 'assign'].map(tab => (
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
                                        <span style={{ padding: '5px 9px', borderRadius: '999px', fontSize: '0.8rem', color: isUserActive(user) ? '#86efac' : '#fca5a5', background: isUserActive(user) ? 'rgba(34, 197, 94, 0.14)' : 'rgba(239, 68, 68, 0.14)' }}>
                                            {isUserActive(user) ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', margin: '14px 0', textTransform: 'capitalize' }}>Role: {user.role}</p>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        <button type="button" onClick={() => handleEditUser(user)} className="btn-secondary">Manage</button>
                                        <button type="button" onClick={() => handleUserStatus(user)} className="btn-secondary" style={{ color: isUserActive(user) ? 'var(--danger-color)' : '#86efac', borderColor: isUserActive(user) ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)' }}>
                                            {isUserActive(user) ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button type="button" onClick={() => handleDeleteUser(user)} className="btn-secondary" style={{ color: 'var(--danger-color)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                                            Delete User
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

                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
                                            <button type="button" onClick={() => openLectureForClass(classroom.id)} className="btn-primary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                                                Add Lecture
                                            </button>
                                            <button type="button" onClick={() => handleDeleteClass(classroom)} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem', color: 'var(--danger-color)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                                                Delete Class
                                            </button>
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
                                                                {lecture.subtitle && <p style={{ color: 'var(--text-muted)', margin: '5px 0 0', fontSize: '0.82rem' }}>{lecture.subtitle}</p>}
                                                                <span style={{ display: 'block', color: 'var(--text-muted)', textTransform: 'capitalize', fontSize: '0.8rem', marginTop: '5px' }}>{lecture.type}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <button type="button" onClick={() => handleEditLecture(lecture)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>Edit</button>
                                                                <button type="button" onClick={() => handleDeleteLecture(lecture)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem', color: 'var(--danger-color)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>Delete</button>
                                                            </div>
                                                        </div>
                                                        {lecture.content && <div style={{ marginTop: '10px' }}><RichTextContent content={lecture.content} /></div>}
                                                        {lecture.resources?.length > 0 && (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginTop: '12px' }}>
                                                                {lecture.resources.map((resource, resourceIndex) => (
                                                                    <div key={resource.id || resourceIndex} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.82rem' }}>
                                                                        <a href={resource.resource_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                                                                            {resource.label || `Open Material ${resourceIndex + 1}`}
                                                                        </a>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
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

                {activeTab === 'assign' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div>
                                <h3>Class Assignments</h3>
                                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Choose a user and class in the assignment popup.</p>
                            </div>
                            <button type="button" onClick={openAssignModal} className="btn-primary">Assign Classes to User</button>
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
                                        return (
                                            <article key={`${assignment.user_id}-${assignment.class_id}`} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <div>
                                                    <h4 style={{ margin: 0 }}>{assignment.user_name}</h4>
                                                    <p style={{ color: 'var(--text-muted)', margin: '5px 0 0' }}>{assignment.user_email}</p>
                                                    <p style={{ margin: '10px 0 0', color: 'var(--accent-color)' }}>{assignment.class_title}</p>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <span style={{ display: 'inline-block', color: '#86efac', fontSize: '0.9rem' }}>Assigned</span>
                                                        <p style={{ color: 'var(--text-muted)', margin: '5px 0 0', fontSize: '0.85rem' }}>{assignment.total_lectures} learning material{Number(assignment.total_lectures) === 1 ? '' : 's'} available</p>
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
                                {modal === 'assign' && 'Assign Classes to User'}
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
                                {!userForm.id && (
                                    <div className="class-assignment-list">
                                        <h4>Assign Classes (optional)</h4>
                                        <p>Select all classes this user should access.</p>
                                        {data.classes.map((classroom) => (
                                            <label key={classroom.id}>
                                                <input type="checkbox" checked={userForm.class_ids.includes(String(classroom.id))} onChange={() => toggleUserClassSelection(classroom.id)} />
                                                <span>{classroom.title}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                                {userForm.id && (
                                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '18px', marginTop: '4px' }}>
                                        <h4 style={{ margin: 0 }}>Assigned Classes</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                            {assignedClassesForUser(userForm.id).length === 0 ? (
                                                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>No classes assigned yet.</p>
                                            ) : (
                                                assignedClassesForUser(userForm.id).map((assignment) => (
                                                    <div key={assignment.class_id} style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                                                        {assignment.class_title}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <div className="class-assignment-list" style={{ marginTop: '14px' }}>
                                            <p>Select additional classes to assign.</p>
                                            {data.classes
                                                .filter((classroom) => !assignedClassesForUser(userForm.id).some((assignment) => String(assignment.class_id) === String(classroom.id)))
                                                .map((classroom) => (
                                                    <label key={classroom.id}>
                                                        <input type="checkbox" checked={userForm.class_ids.includes(String(classroom.id))} onChange={() => toggleUserClassSelection(classroom.id)} />
                                                        <span>{classroom.title}</span>
                                                    </label>
                                                ))}
                                            <button type="button" onClick={handleAssignClassToUser} disabled={!userForm.class_ids.length} className="btn-secondary" style={{ marginTop: '12px', opacity: userForm.class_ids.length ? 1 : 0.55 }}>
                                                Assign {userForm.class_ids.length || ''} Class{userForm.class_ids.length === 1 ? '' : 'es'}
                                            </button>
                                        </div>
                                    </div>
                                )}
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
                                <p style={{ color: 'var(--accent-color)', margin: 0, fontWeight: 600 }}>
                                    Classroom: {lectureClass?.title || 'Selected classroom'}
                                </p>
                                <input name="title" placeholder="Lecture Title" value={lectureForm.title} onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })} required />
                                <input name="subtitle" placeholder="Lecture Subtitle (optional)" value={lectureForm.subtitle} onChange={(e) => setLectureForm({ ...lectureForm, subtitle: e.target.value })} />
                                <select name="type" value={lectureForm.type} onChange={(e) => setLectureForm({ ...lectureForm, type: e.target.value })} required>
                                    <option value="text">Text Content / Notes</option>
                                    <option value="youtube">YouTube Link</option>
                                    <option value="drive">Google Drive Link</option>
                                    <option value="pdf">PDF Link</option>
                                    <option value="link">Other External Link</option>
                                </select>
                                <RichTextEditor
                                    value={lectureForm.content}
                                    onChange={(content) => setLectureForm((current) => ({ ...current, content }))}
                                    placeholder="Write lecture notes, use bullets, or create numbered steps..."
                                />
                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '18px', marginTop: '4px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                                        <div>
                                            <h4 style={{ margin: 0 }}>Lecture Links</h4>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '5px 0 0' }}>Add one or more materials for this lecture.</p>
                                        </div>
                                        <button type="button" onClick={addLectureResource} className="btn-secondary" style={{ padding: '7px 10px', fontSize: '0.8rem' }}>Add Link</button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {lectureForm.resources.map((resource, index) => (
                                            <div key={index} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 0.7fr) minmax(180px, 1.3fr) auto', gap: '8px', alignItems: 'center' }}>
                                                <input placeholder="Label (optional)" value={resource.label} onChange={(e) => updateLectureResource(index, 'label', e.target.value)} />
                                                <input type="url" placeholder="https://..." value={resource.resource_url} onChange={(e) => updateLectureResource(index, 'resource_url', e.target.value)} />
                                                <button type="button" onClick={() => removeLectureResource(index)} className="btn-secondary" aria-label="Remove link" style={{ padding: '10px 12px', color: 'var(--danger-color)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>x</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary">{lectureForm.id ? 'Update Lecture' : 'Add Lecture'}</button>
                            </form>
                        )}

                        {modal === 'assign' && (
                            <form onSubmit={handleAssignClass} className="admin-modal-form">
                                <select name="user_id" value={assignmentForm.user_id} onChange={(e) => setAssignmentForm((current) => ({ ...current, user_id: e.target.value }))} required>
                                    <option value="">Select User...</option>
                                    {data.users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                                </select>
                                <div className="class-assignment-list">
                                    <h4>Select Classes</h4>
                                    <p>Choose one or more classes for this user.</p>
                                    {data.classes.map((classroom) => (
                                        <label key={classroom.id}>
                                            <input type="checkbox" checked={assignmentForm.class_ids.includes(String(classroom.id))} onChange={() => toggleAssignmentClass(classroom.id)} />
                                            <span>{classroom.title}</span>
                                        </label>
                                    ))}
                                </div>
                                <button type="submit" disabled={!assignmentForm.user_id || !assignmentForm.class_ids.length} className="btn-primary" style={{ opacity: assignmentForm.user_id && assignmentForm.class_ids.length ? 1 : 0.55 }}>
                                    Assign {assignmentForm.class_ids.length || ''} Class{assignmentForm.class_ids.length === 1 ? '' : 'es'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {confirmation && (
                <div className="admin-modal-backdrop" role="presentation" onMouseDown={() => setConfirmation(null)}>
                    <div className="admin-modal admin-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirmation-title" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h3 id="confirmation-title">{confirmation.title}</h3>
                            <button type="button" className="admin-modal-close" onClick={() => setConfirmation(null)} aria-label="Close dialog">x</button>
                        </div>
                        <p className="admin-dialog-message">{confirmation.message}</p>
                        <div className="admin-dialog-actions">
                            <button type="button" className="btn-secondary" onClick={() => setConfirmation(null)}>Cancel</button>
                            <button type="button" className="btn-danger" onClick={async () => {
                                const action = confirmation.onConfirm;
                                setConfirmation(null);
                                await action();
                            }}>{confirmation.confirmLabel}</button>
                        </div>
                    </div>
                </div>
            )}

            {notice && (
                <div className="admin-modal-backdrop" role="presentation" onMouseDown={() => setNotice(null)}>
                    <div className="admin-modal admin-dialog" role="dialog" aria-modal="true" aria-labelledby="notice-title" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h3 id="notice-title">{notice.title}</h3>
                            <button type="button" className="admin-modal-close" onClick={() => setNotice(null)} aria-label="Close dialog">x</button>
                        </div>
                        <p className="admin-dialog-message">{notice.message}</p>
                        <div className="admin-dialog-actions">
                            <button type="button" className="btn-primary" onClick={() => setNotice(null)}>Okay</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
