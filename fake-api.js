const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    if (Object.keys(req.query).length > 0) {
        console.log(`Query params:`, req.query);
    }
    if (Object.keys(req.body).length > 0) {
        console.log(`Request body:`, JSON.stringify(req.body, null, 2));
    }
    next();
});

// ✅ Todo data
let todos = [
    { userId: 1, id: 1, title: "delectus aut autem", completed: false },
    { userId: 1, id: 2, title: "quis ut nam facilis", completed: true },
    { userId: 1, id: 3, title: "fugiat veniam minus", completed: false },
    { userId: 1, id: 4, title: "et porro tempora", completed: true },
    { userId: 2, id: 5, title: "laboriosam mollitia", completed: false }
];

// ✅ GET all todos
app.get('/todos', (req, res) => {
    const limit = parseInt(req.query.limit) || todos.length;
    const userId = req.query.userId ? parseInt(req.query.userId) : null;

    let filteredTodos = todos;
    if (userId) {
        filteredTodos = todos.filter(t => t.userId === userId);
    }

    res.json(filteredTodos.slice(0, limit));
});

// ✅ GET specific todo
app.get('/todos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const todo = todos.find(t => t.id === id);

    if (todo) {
        res.json(todo);
    } else {
        res.status(404).json({
            error: "Todo not found",
            id: id,
            available_ids: todos.map(t => t.id)
        });
    }
});

// ✅ CREATE new todo
app.post('/todos', (req, res) => {
    const { title, completed = false, userId = 1 } = req.body;

    if (!title) {
        return res.status(400).json({
            error: "Title is required",
            received_body: req.body
        });
    }

    const newId = Math.max(...todos.map(t => t.id), 0) + 1;
    const newTodo = {
        userId: parseInt(userId),
        id: newId,
        title: title.trim(),
        completed: Boolean(completed)
    };

    todos.push(newTodo);

    res.status(201).json({
        message: "Todo created successfully",
        todo: newTodo,
        timestamp: new Date().toISOString()
    });
});

// ✅ UPDATE todo - PUT
app.put('/todos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const todoIndex = todos.findIndex(t => t.id === id);

    if (todoIndex === -1) {
        return res.status(404).json({
            error: "Todo not found",
            id: id
        });
    }

    const { title, completed, userId } = req.body;

    if (title !== undefined) {
        todos[todoIndex].title = title.trim();
    }
    if (completed !== undefined) {
        todos[todoIndex].completed = Boolean(completed);
    }
    if (userId !== undefined) {
        todos[todoIndex].userId = parseInt(userId);
    }

    res.json({
        message: "Todo updated successfully",
        updated_todo: todos[todoIndex],
        updated_fields: {
            title: title !== undefined,
            completed: completed !== undefined,
            userId: userId !== undefined
        },
        timestamp: new Date().toISOString()
    });
});

// ✅ PATCH todo (partial update)
app.patch('/todos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const todo = todos.find(t => t.id === id);

    if (!todo) {
        return res.status(404).json({
            error: "Todo not found",
            id: id
        });
    }

    const { title, completed, userId } = req.body;
    const updatedFields = [];

    if (title !== undefined) {
        todo.title = title.trim();
        updatedFields.push('title');
    }
    if (completed !== undefined) {
        todo.completed = Boolean(completed);
        updatedFields.push('completed');
    }
    if (userId !== undefined) {
        todo.userId = parseInt(userId);
        updatedFields.push('userId');
    }

    res.json({
        message: "Todo partially updated",
        todo: todo,
        updated_fields: updatedFields,
        timestamp: new Date().toISOString()
    });
});

// ✅ DELETE todo
app.delete('/todos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const todoIndex = todos.findIndex(t => t.id === id);

    if (todoIndex !== -1) {
        const deletedTodo = todos.splice(todoIndex, 1)[0];
        res.json({
            message: "Todo deleted successfully",
            deleted_todo: deletedTodo,
            remaining_todos: todos.length,
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(404).json({
            error: "Todo not found",
            id: id
        });
    }
});

// ✅ Toggle todo completed status
app.post('/todos/:id/toggle', (req, res) => {
    const id = parseInt(req.params.id);
    const todo = todos.find(t => t.id === id);

    if (todo) {
        todo.completed = !todo.completed;
        res.json({
            message: `Todo ${todo.completed ? 'completed' : 'uncompleted'}`,
            todo: todo,
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(404).json({
            error: "Todo not found",
            id: id
        });
    }
});

// ✅ Set todo completed status
app.post('/todos/:id/complete', (req, res) => {
    const id = parseInt(req.params.id);
    const { completed = true } = req.body;
    const todo = todos.find(t => t.id === id);

    if (todo) {
        todo.completed = Boolean(completed);
        res.json({
            message: `Todo marked as ${todo.completed ? 'completed' : 'incomplete'}`,
            todo: todo,
            action: completed ? 'completed' : 'uncompleted',
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(404).json({
            error: "Todo not found",
            id: id
        });
    }
});

// ✅ Status endpoint
app.get('/status', (req, res) => {
    res.json({
        status: "online",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        current_todos_count: todos.length,
        endpoints: {
            "GET /todos": "List all todos (query: limit, userId)",
            "POST /todos": "Create new todo (body: title, completed, userId)",
            "GET /todos/:id": "Get specific todo",
            "PUT /todos/:id": "Full update todo (body: title, completed, userId)",
            "PATCH /todos/:id": "Partial update todo (body: any field)",
            "DELETE /todos/:id": "Delete todo",
            "POST /todos/:id/toggle": "Toggle todo completion",
            "POST /todos/:id/complete": "Set todo completed status (body: completed)",
            "GET /status": "This status endpoint"
        }
    });
});

// ✅ Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: "Todos API Server",
        timestamp: new Date().toISOString(),
        total_todos: todos.length,
        endpoints: [
            "GET /todos",
            "POST /todos",
            "GET /todos/:id",
            "PUT /todos/:id",
            "PATCH /todos/:id",
            "DELETE /todos/:id",
            "POST /todos/:id/toggle",
            "POST /todos/:id/complete",
            "GET /status"
        ]
    });
});

// ✅ 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: "Endpoint not found",
        requested_url: req.originalUrl,
        method: req.method,
        available_endpoints: [
            "GET /todos",
            "POST /todos",
            "GET /todos/:id",
            "PUT /todos/:id",
            "PATCH /todos/:id",
            "DELETE /todos/:id",
            "POST /todos/:id/toggle",
            "POST /todos/:id/complete",
            "GET /status"
        ]
    });
});

// ✅ Error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err.message);
    res.status(500).json({
        error: "Internal Server Error",
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Todos API Server running on http://localhost:${PORT}`);
    console.log(`📋 Available endpoints:`);
    console.log(`   GET    /todos`);
    console.log(`   POST   /todos`);
    console.log(`   GET    /todos/:id`);
    console.log(`   PUT    /todos/:id`);
    console.log(`   PATCH  /todos/:id`);
    console.log(`   DELETE /todos/:id`);
    console.log(`   POST   /todos/:id/toggle`);
    console.log(`   POST   /todos/:id/complete`);
    console.log(`   GET    /status`);
    console.log(`\n✨ Ready for todos operations!`);
});