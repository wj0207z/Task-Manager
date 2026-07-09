Yes, use this version. You can copy and paste it directly into a document.

---

# Task Management System Documentation

## Project Overview

This is a full-stack Task Management System built with React, Laravel, MySQL, Laravel Sanctum, Axios, and React Router.

The system allows users to register, login, logout, create tasks, edit tasks, delete tasks, update task status, search and filter tasks, view dashboard statistics, and access protected task pages.

The overall system flow is React frontend to Laravel backend to MySQL database. React handles the user interface. Axios sends API requests. Laravel controls the business logic. Eloquent communicates with MySQL. MySQL stores the real data. Sanctum token connects each request to the logged-in user.

## Project Structure

TaskManager
backend
app
Http
Controllers
AuthController.php
TaskController.php
Models
User.php
Task.php
database
migrations
create_tasks_table.php
routes
api.php

frontend
src
api
axios.js
components
ProtectedRoute.jsx
pages
Login.jsx
Register.jsx
Tasks.jsx
App.jsx
main.jsx
index.css

## Backend Role

The Laravel backend is responsible for authentication, validation, API routes, database operations, and security.

It handles user registration, user login, Sanctum token creation, logout, protected API routes, task creation, task reading, task updating, task deletion, task data validation, and checking that users can only access their own tasks.

The frontend does not directly access MySQL. It only sends requests to Laravel through API endpoints.

## Database Design

The system currently uses two main tables: users and tasks.

The users table stores account information. Its main columns are id, name, email, password, created_at, and updated_at.

Example users table:

id | name | email  
1 | Test User | test@example.com

The tasks table stores task information. Its main columns are id, user_id, title, description, status, priority, due_date, created_at, and updated_at.

Example tasks table:

id | user_id | title | status | priority  
1 | 1 | Study Laravel | pending | high

The important column is user_id. This connects each task to the user who owns it. For example, if a task has user_id = 1, it means that task belongs to the user whose id is 1.

## Model Relationships

Laravel models represent database tables.

The User model is connected to the Task model. In User.php, the relationship is:

public function tasks()
{
    return $this->hasMany(Task::class);
}

This means one user can have many tasks.

The Task model is also connected back to the User model. In Task.php, the relationship is:

public function user()
{
    return $this->belongsTo(User::class);
}

This means one task belongs to one user.

Because of these relationships, Laravel can use this:

$request->user()->tasks()

This means Laravel gets the currently logged-in user, then gets that user's tasks.

## Authentication Flow

Authentication uses Laravel Sanctum token authentication.

When a user registers, React sends a POST request to /api/register with the user's name, email, and password.

Example request:

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}

Laravel validates the data, creates the user, hashes the password, and creates a token.

Example backend logic:

$user = User::create([
    'name' => $validated['name'],
    'email' => $validated['email'],
    'password' => Hash::make($validated['password']),
]);

$token = $user->createToken('task-token')->plainTextToken;

Laravel returns the user and token to React.

Example response:

{
  "user": {
    "id": 1,
    "name": "Test User",
    "email": "test@example.com"
  },
  "token": "token_here"
}

React stores the token and user in localStorage:

localStorage.setItem("token", response.data.token);
localStorage.setItem("user", JSON.stringify(response.data.user));

Then React redirects the user to /tasks.

When a user logs in, React sends a POST request to /api/login. Laravel checks whether the email exists and whether the password is correct.

Example backend logic:

$user = User::where('email', $validated['email'])->first();

if (! $user || ! Hash::check($validated['password'], $user->password)) {
    return response()->json([
        'message' => 'Invalid email or password.',
    ], 401);
}

If the login is correct, Laravel creates a token and returns it to React. React stores the token and redirects the user to /tasks.

When the user logs out, React sends a POST request to /api/logout. Laravel deletes the current token:

$request->user()->currentAccessToken()->delete();

React then removes the token and user from localStorage:

localStorage.removeItem("token");
localStorage.removeItem("user");

Then React redirects the user to /login.

## API Routes

The API routes are stored in backend/routes/api.php.

The public routes are:

POST /api/register  
POST /api/login

These routes do not require a token.

The protected routes are:

GET /api/me  
POST /api/logout  
GET /api/tasks  
POST /api/tasks  
GET /api/tasks/{task}  
PUT /api/tasks/{task}  
PATCH /api/tasks/{task}  
DELETE /api/tasks/{task}

Protected routes require an Authorization header:

Authorization: Bearer token_here

This token tells Laravel which user is making the request.

## Axios Flow

The frontend uses Axios to communicate with Laravel.

The Axios setup is stored in frontend/src/api/axios.js.

The Axios file stores the backend base URL:

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: {
    Accept: "application/json",
  },
});

This allows React to write:

api.get("/tasks");

instead of writing the full URL every time.

Axios also automatically attaches the token to requests:

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

Because of this, protected requests automatically include the logged-in user's token.

## React Router Flow

React Router controls frontend page navigation.

The routes are defined in App.jsx.

The main routes are:

/ goes to Login page  
/login goes to Login page  
/register goes to Register page  
/tasks goes to Tasks page

The /tasks route is protected using ProtectedRoute.

This means users must be logged in before they can view the task page.

## Protected Route Flow

ProtectedRoute.jsx checks whether the user has a token in localStorage.

The logic is:

const token = localStorage.getItem("token");

if (!token) {
  return <Navigate to="/login" replace />;
}

return children;

If there is no token, the user is redirected to /login. If the token exists, the protected page is shown.

This prevents users from opening /tasks after logout.

## Load Tasks Flow

When the user opens /tasks, the Tasks.jsx page runs fetchTasks using useEffect.

The flow is:

1. User opens /tasks.
2. React calls fetchTasks.
3. fetchTasks sends GET /api/tasks.
4. Axios attaches the token.
5. Laravel receives the token.
6. Laravel identifies the logged-in user.
7. Laravel returns only that user's tasks.
8. React stores the tasks in state.
9. React displays the tasks.

The important backend logic is:

$tasks = $request->user()
    ->tasks()
    ->latest()
    ->get();

This means Laravel gets the logged-in user, then gets only that user's tasks.

React stores the response using:

setTasks(response.data);

Then React displays the tasks using filteredTasks.map.

## Create Task Flow

When the user fills in the task form and clicks Add Task, React sends a POST request to /api/tasks.

The payload contains title, description, priority, and due_date.

Example payload:

{
  title: form.title,
  description: form.description,
  priority: form.priority,
  due_date: form.due_date || null,
}

React does not send user_id.

This is important because users should not decide who owns a task. Laravel decides ownership using the token.

Laravel receives the request in TaskController@store. It validates the data and creates the task under the logged-in user.

Example backend logic:

$task = $request->user()->tasks()->create([
    'title' => $validated['title'],
    'description' => $validated['description'] ?? null,
    'status' => $validated['status'] ?? 'pending',
    'priority' => $validated['priority'] ?? 'normal',
    'due_date' => $validated['due_date'] ?? null,
]);

React then adds the new task to the top of the task list:

setTasks([response.data, ...tasks]);

## Edit Task Flow

When the user clicks Edit, React runs handleStartEdit.

This stores the selected task id:

setEditingTaskId(task.id);

Then it fills the form with the selected task's current data:

setForm({
  title: task.title || "",
  description: task.description || "",
  priority: task.priority || "normal",
  due_date: task.due_date || "",
});

The form changes from Add Task mode to Edit Task mode.

When the user clicks Save Changes, React sends a PUT request to:

/api/tasks/{taskId}

Laravel receives the request in TaskController@update.

Before updating, Laravel checks whether the task belongs to the logged-in user:

if ($task->user_id !== $request->user()->id) {
    return response()->json([
        'message' => 'You are not allowed to update this task.',
    ], 403);
}

If the user owns the task, Laravel updates it.

React then replaces the old task with the updated task:

setTasks(
  tasks.map((task) =>
    task.id === editingTaskId ? response.data : task
  )
);

This means if the task is the edited task, React replaces it with the new version. Otherwise, React keeps the old task.

## Delete Task Flow

When the user clicks Delete, React first asks for confirmation:

const confirmed = window.confirm("Are you sure you want to delete this task?");

If the user confirms, React sends a DELETE request to:

/api/tasks/{taskId}

Laravel receives the request in TaskController@destroy.

Laravel checks whether the task belongs to the logged-in user. If the user owns the task, Laravel deletes it:

$task->delete();

React removes the deleted task from the screen:

setTasks(tasks.filter((task) => task.id !== taskId));

This means React keeps every task except the deleted one.

## Status Update Flow

Each task has a status dropdown.

The available statuses are:

pending  
in_progress  
completed

When the user changes the status, React sends a PUT request to:

/api/tasks/{taskId}

with this data:

{
  status: newStatus
}

Laravel validates and updates the task status.

React then replaces the old task with the updated task:

setTasks(
  tasks.map((task) =>
    task.id === taskId ? response.data : task
  )
);

After refreshing the page, the status remains changed because it was saved in MySQL.

## Search and Filter Flow

React stores filter values in state.

The filter states are:

search  
statusFilter  
priorityFilter

React then creates a filtered list called filteredTasks.

The logic checks:

1. Does the task title or description match the search text?
2. Does the task status match the selected status?
3. Does the task priority match the selected priority?

The important difference is:

tasks means the full original task list.  
filteredTasks means the displayed list after filtering.

The page displays:

filteredTasks.map((task) => ...)

Filtering is currently frontend-only. It changes what is displayed, but it does not change the database.

## Dashboard Statistics Flow

Dashboard statistics are calculated from the tasks array.

The system calculates:

total tasks  
pending tasks  
in progress tasks  
completed tasks  
high priority tasks  
overdue tasks

Example:

const totalTasks = tasks.length;

const pendingTasks = tasks.filter(
  (task) => task.status === "pending"
).length;

const completedTasks = tasks.filter(
  (task) => task.status === "completed"
).length;

const overdueTasks = tasks.filter(
  (task) =>
    task.due_date &&
    task.due_date < today &&
    task.status !== "completed"
).length;

These values are displayed as dashboard cards.

This gives the user a quick summary of their task progress.

## Important Frontend Files

main.jsx is the React entry point. It renders the whole app and wraps App with BrowserRouter so routing can work.

App.jsx defines the frontend routes. It connects URLs like /login, /register, and /tasks to their page components.

axios.js centralizes API communication. It stores the backend base URL and automatically attaches the token to protected requests.

Login.jsx handles user login. It stores form input, sends login data to Laravel, stores the returned token, and redirects to /tasks.

Register.jsx handles user registration. It sends name, email, and password to Laravel, stores the returned token, and redirects to /tasks.

ProtectedRoute.jsx protects private pages. If there is no token, it redirects the user to /login.

Tasks.jsx is the main page of the system. It handles loading tasks, creating tasks, editing tasks, deleting tasks, updating status, searching, filtering, dashboard statistics, and logout.

## Important Backend Files

api.php defines the backend API endpoints.

AuthController.php handles register, login, me, and logout.

TaskController.php handles listing tasks, creating tasks, showing one task, updating tasks, and deleting tasks.

User.php represents users and contains the relationship that one user has many tasks. It also uses Sanctum token support.

Task.php represents tasks and contains the relationship that one task belongs to one user.

## Security Notes

The most important security rule is:

Users can only access their own tasks.

Laravel enforces this rule in the controller before showing, updating, or deleting tasks.

Example:

if ($task->user_id !== $request->user()->id) {
    return response()->json([
        'message' => 'You are not allowed to update this task.',
    ], 403);
}

Another important rule is:

React does not send user_id when creating tasks.

This is safer because users could fake a user_id. Instead, Laravel uses the token to identify the current user.

## Full System Flow Summary

The full system flow is:

1. User registers or logs in.
2. Laravel validates the credentials.
3. Laravel creates a Sanctum token.
4. React stores the token in localStorage.
5. User opens /tasks.
6. ProtectedRoute checks whether the token exists.
7. Tasks.jsx calls GET /api/tasks.
8. axios.js attaches the token.
9. Laravel identifies the current user.
10. TaskController returns only that user's tasks.
11. React displays the tasks.
12. User can add, edit, delete, update status, search, and filter tasks.
13. Laravel validates and saves changes in MySQL.
14. React updates the UI.

## Current Features

The current system includes user registration, user login, user logout, Sanctum token authentication, protected frontend routes, user-owned tasks, create task, edit task, delete task, update task status, priority levels, due dates, search tasks, filter by status, filter by priority, dashboard statistics, and overdue task detection.

## Suggested Next Features

The next recommended features are project workspace, comments on tasks, activity log, backend search and filtering, pagination, task attachments, team collaboration, deployment, README screenshots, and API documentation.

The recommended next feature is project workspace because it introduces a stronger database relationship:

User has many projects.  
Project has many tasks.