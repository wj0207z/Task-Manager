import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function Tasks() {

    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));

    const [tasks, setTasks] = useState([]);

    const [form, setForm] = useState({
        title: "",
        description: "",
        priority: "normal",
        due_date: "",
    });

    const [editingTaskId, setEditingTaskId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");

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

        const payload = {
        title: form.title,
        description: form.description,
        priority: form.priority,
        due_date: form.due_date || null,
        };

        try {
        if (editingTaskId) {
            const response = await api.put(`/tasks/${editingTaskId}`, payload);

            setTasks(
            tasks.map((task) =>
                task.id === editingTaskId ? response.data : task
            )
            );

            setEditingTaskId(null);
        } else {
            const response = await api.post("/tasks", payload);

            setTasks([response.data, ...tasks]);
        }

        setForm({
            title: "",
            description: "",
            priority: "normal",
            due_date: "",
        });
        } catch (error) {
        setError(editingTaskId ? "Failed to update task." : "Failed to create task.");
        } finally {
        setSaving(false);
        }
    }

    async function handleStatusChange(taskId, newStatus) {
        setError("");

        try {
        const response = await api.put(`/tasks/${taskId}`, {
            status: newStatus,
        });

        setTasks(
            tasks.map((task) =>
            task.id === taskId ? response.data : task
            )
        );
        } catch (error) {
        setError("Failed to update task status.");
        }
    }

    async function handleDeleteTask(taskId) {
        const confirmed = window.confirm("Are you sure you want to delete this task?");

        if (!confirmed) {
        return;
        }

        setError("");

        try {
        await api.delete(`/tasks/${taskId}`);

        setTasks(tasks.filter((task) => task.id !== taskId));
        } catch (error) {
        setError("Failed to delete task.");
        }
    }

    function handleStartEdit(task) {
        setEditingTaskId(task.id);

        setForm({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "normal",
        due_date: task.due_date || "",
        });
    }

    function handleCancelEdit() {
        setEditingTaskId(null);

        setForm({
        title: "",
        description: "",
        priority: "normal",
        due_date: "",
        });
    }

    const today = new Date().toISOString().slice(0, 10);

    const totalTasks = tasks.length;

    const pendingTasks = tasks.filter((task) => task.status === "pending").length;

    const inProgressTasks = tasks.filter(
        (task) => task.status === "in_progress"
    ).length;

    const completedTasks = tasks.filter(
        (task) => task.status === "completed"
    ).length;

    const highPriorityTasks = tasks.filter(
        (task) => task.priority === "high"
    ).length;

    const overdueTasks = tasks.filter(
        (task) =>
            task.due_date &&
            task.due_date < today &&
            task.status !== "completed"
    ).length;

    const filteredTasks = tasks.filter((task) => {
        const searchText = search.toLowerCase();

        const matchesSearch =
        task.title.toLowerCase().includes(searchText) ||
        (task.description || "").toLowerCase().includes(searchText);

        const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;

        const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    async function handleLogout() {
        try {
            await api.post("/logout");
        } catch (error) {
            console.log("Logout request failed, clearing local data anyway.");
        }
    
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    
        navigate("/login");
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
                <p>
                {user
                    ? `Logged in as ${user.name}`
                    : "Create and manage your personal tasks."}
                </p>
            </div>

            <button
                className="logout-button"
                type="button"
                onClick={handleLogout}
            >
                Logout
            </button>
        </div>

        <div className="dashboard-grid">
            <div className="stat-card">
                <span>Total</span>
                <strong>{totalTasks}</strong>
            </div>

            <div className="stat-card">
                <span>Pending</span>
                <strong>{pendingTasks}</strong>
            </div>

            <div className="stat-card">
                <span>In Progress</span>
                <strong>{inProgressTasks}</strong>
            </div>

            <div className="stat-card">
                <span>Completed</span>
                <strong>{completedTasks}</strong>
            </div>

            <div className="stat-card">
                <span>High Priority</span>
                <strong>{highPriorityTasks}</strong>
            </div>

            <div className="stat-card warning">
                <span>Overdue</span>
                <strong>{overdueTasks}</strong>
            </div>
        </div>

        <div className="task-filters">
            <input
            placeholder="Search tasks"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            />

            <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            </select>

            <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            >
            <option value="all">All priorities</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            </select>
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

            <div className="form-actions">
            <button type="submit" disabled={saving}>
                {editingTaskId
                ? saving
                    ? "Saving..."
                    : "Save Changes"
                : saving
                    ? "Adding..."
                    : "Add Task"}
            </button>

            {editingTaskId && (
                <button
                className="secondary-button"
                type="button"
                onClick={handleCancelEdit}
                >
                Cancel
                </button>
            )}
            </div>
        </form>

        {error && <p className="error">{error}</p>}

        {!error && filteredTasks.length === 0 && (
            <div className="status-box">
            <p>No matching tasks found.</p>
            </div>
        )}

        {!error && filteredTasks.length > 0 && (
            <div className="task-list">
            {filteredTasks.map((task) => (
                <div className="task-card" key={task.id}>
                <div>
                    <h2>{task.title}</h2>
                    <p>{task.description || "No description."}</p>
                </div>

                <div className="task-meta">
                    <select
                    className="status-select"
                    value={task.status}
                    onChange={(event) =>
                        handleStatusChange(task.id, event.target.value)
                    }
                    >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    </select>

                    <span>{task.priority}</span>
                    <span>{task.due_date || "No due date"}</span>

                    <button
                    className="edit-button"
                    type="button"
                    onClick={() => handleStartEdit(task)}
                    >
                    Edit
                    </button>

                    <button
                    className="delete-button"
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                    >
                    Delete
                    </button>
                </div>
                </div>
            ))}
            </div>
        )}
        </main>
    );
}

export default Tasks;