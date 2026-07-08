import { useEffect, useState } from "react";
import api from "../api/axios";

function Tasks() {
    const [tasks, setTasks] = useState([]);

    const [form, setForm] = useState({
        title: "",
        description: "",
        priority: "normal",
        due_date: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function fetchTasks() {
        try {
        const response = await api.get("/tasks");
        setTasks(response.data);
        } catch (error) {
        setError("Failed to load tasks.");
        } finally {
        setLoading(false);
        }
    }

    function handleChange(event) {
        setForm({
        ...form,
        [event.target.name]: event.target.value,
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSaving(true);

        try {
        const response = await api.post("/tasks", {
            title: form.title,
            description: form.description,
            priority: form.priority,
            due_date: form.due_date || null,
        });

        setTasks([response.data, ...tasks]);

        setForm({
            title: "",
            description: "",
            priority: "normal",
            due_date: "",
        });
        } catch (error) {
        setError("Failed to create task.");
        } finally {
        setSaving(false);
        }
    }

    useEffect(() => {
        fetchTasks();
    }, []);

    if (loading) {
        return (
        <main className="page">
            <p>Loading tasks...</p>
        </main>
        );
    }

    return (
        <main className="page">
        <div className="page-header">
            <div>
            <h1>My Tasks</h1>
            <p>Create and manage your personal tasks.</p>
            </div>
        </div>

        <form className="task-form" onSubmit={handleSubmit}>
            <input
            name="title"
            placeholder="Task title"
            value={form.title}
            onChange={handleChange}
            />

            <textarea
            name="description"
            placeholder="Task description"
            value={form.description}
            onChange={handleChange}
            />

            <div className="form-row">
            <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
            >
                <option value="low">Low priority</option>
                <option value="normal">Normal priority</option>
                <option value="high">High priority</option>
            </select>

            <input
                name="due_date"
                type="date"
                value={form.due_date}
                onChange={handleChange}
            />
            </div>

            <button type="submit" disabled={saving}>
            {saving ? "Adding..." : "Add Task"}
            </button>
        </form>

        {error && <p className="error">{error}</p>}

        {!error && tasks.length === 0 && (
            <div className="status-box">
            <p>No tasks found.</p>
            </div>
        )}

        {!error && tasks.length > 0 && (
            <div className="task-list">
            {tasks.map((task) => (
                <div className="task-card" key={task.id}>
                <div>
                    <h2>{task.title}</h2>
                    <p>{task.description || "No description."}</p>
                </div>

                <div className="task-meta">
                    <span>{task.status}</span>
                    <span>{task.priority}</span>
                    <span>{task.due_date || "No due date"}</span>
                </div>
                </div>
            ))}
            </div>
        )}
        </main>
    );
}

export default Tasks;